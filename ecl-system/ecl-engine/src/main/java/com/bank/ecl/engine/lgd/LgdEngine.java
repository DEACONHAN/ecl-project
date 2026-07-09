package com.bank.ecl.engine.lgd;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bank.ecl.common.constant.EngineType;
import com.bank.ecl.data.entity.LgdCollateralDiscountEntity;
import com.bank.ecl.data.entity.LgdCurveEntity;
import com.bank.ecl.data.entity.LgdDepreciationEntity;
import com.bank.ecl.data.mapper.LgdCollateralDiscountMapper;
import com.bank.ecl.data.mapper.LgdCurveMapper;
import com.bank.ecl.data.mapper.LgdDepreciationMapper;
import com.bank.ecl.engine.core.*;
import org.slf4j.Logger; import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class LgdEngine implements EclEngine {
    private static final Logger log = LoggerFactory.getLogger(LgdEngine.class);
    private final LgdCurveMapper lgdCurveMapper;
    private final LgdCollateralDiscountMapper discountMapper;
    private final LgdDepreciationMapper depreciationMapper;

    public LgdEngine(LgdCurveMapper lgdCurveMapper,
                     LgdCollateralDiscountMapper discountMapper,
                     LgdDepreciationMapper depreciationMapper) {
        this.lgdCurveMapper = lgdCurveMapper;
        this.discountMapper = discountMapper;
        this.depreciationMapper = depreciationMapper;
    }

    @Override public EngineType getType() { return EngineType.LGD; }

    @Override
    public void execute(JobContext ctx) {
        String schemeId = ctx.getSchemeId();
        log.info("[6.5 LGD] start, schemeId={}", schemeId);
        if (schemeId == null || schemeId.isBlank()) { log.warn("[6.5 LGD] schemeId null, skipping"); return; }

        Map<String, Double> curveCache = buildCurveCache(schemeId);
        double defaultLgd = ctx.getDefaultLgd();
        log.info("[6.5 LGD] loaded {} curve entries, defaultLgd={}", curveCache.size(), defaultLgd);

        // Load discount and depreciation data
        Map<String, Double> discountCache = buildDiscountCache(schemeId);
        Map<String, Double> depreciationCache = buildDepreciationCache(schemeId);
        log.info("[6.5 LGD] loaded {} discount entries, {} depreciation entries",
                discountCache.size(), depreciationCache.size());

        List<CustomerContext> customers = ctx.getCustomers();
        if (customers == null || customers.isEmpty()) { log.info("[6.5 LGD] no customers"); return; }

        // Collect all assets by pool for pool-level processing
        Map<String, List<AssetInput>> assetsByPool = new HashMap<>();
        List<AssetInput> nonPoolAssets = new ArrayList<>();

        for (CustomerContext c : customers) {
            if (c == null || c.getAssets() == null) continue;
            for (AssetInput a : c.getAssets()) {
                if (a == null) continue;
                if (a.getCollateralPoolId() != null && !a.getCollateralPoolId().isBlank()) {
                    assetsByPool.computeIfAbsent(a.getCollateralPoolId(), k -> new ArrayList<>()).add(a);
                } else {
                    nonPoolAssets.add(a);
                }
            }
        }

        // Process pool-level assets
        Map<String, List<CollateralInput>> collateralsByPool = ctx.getCollateralsByPool();
        if (collateralsByPool == null) collateralsByPool = Collections.emptyMap();

        for (Map.Entry<String, List<AssetInput>> entry : assetsByPool.entrySet()) {
            String poolId = entry.getKey();
            List<AssetInput> poolAssets = entry.getValue();
            processPool(poolId, poolAssets, collateralsByPool.get(poolId),
                    discountCache, depreciationCache, curveCache, defaultLgd, ctx.getLgdFloor());
        }

        // Process non-pool assets with original per-asset LGD lookup
        for (AssetInput a : nonPoolAssets) {
            processAsset(a, curveCache, defaultLgd);
        }

        log.info("[6.5 LGD] complete");
    }

    private void processPool(String poolId, List<AssetInput> poolAssets,
                             List<CollateralInput> collaterals,
                             Map<String, Double> discountCache,
                             Map<String, Double> depreciationCache,
                             Map<String, Double> curveCache,
                             double defaultLgd, double lgdFloor) {
        // Sum total EAD for the pool
        double eadTotal = poolAssets.stream()
                .mapToDouble(a -> a.getTotalEad())
                .sum();

        // Calculate collateral net value
        double collateralNetValue = 0.0;
        if (collaterals != null) {
            for (CollateralInput coll : collaterals) {
                if (coll == null || coll.getAppraisalValue() == null) continue;
                double appVal = coll.getAppraisalValue().doubleValue();

                // Find discount rate by (collateralCategory, collateralType)
                String discountKey = nullSafeKey(coll.getCollateralCategory(), coll.getCollateralType());
                double discountRate = discountCache.getOrDefault(discountKey, 0.0);

                // Find depreciation rate by (collateralType, yearOffset=0)
                String depKey = nullSafeKey(coll.getCollateralType(), 0);
                double depreciationRate = depreciationCache.getOrDefault(depKey, 0.0);

                double netValue = appVal * (1 + depreciationRate) * (1 - discountRate);
                collateralNetValue += netValue;
            }
        }

        double eadCovered = Math.min(collateralNetValue, eadTotal);
        double eadUncovered = eadTotal - eadCovered;

        // Look up LGD for the uncovered portion using the first asset's group as representative
        AssetInput firstAsset = poolAssets.get(0);
        double lgdUncovered = lookupLgdForGroup(firstAsset, curveCache, defaultLgd);

        double lgdPool;
        if (eadTotal > 0) {
            lgdPool = (eadUncovered * lgdUncovered + eadCovered * lgdFloor) / eadTotal;
        } else {
            lgdPool = lgdUncovered;
        }

        // Build JSON detail string
        String lgdDetails = String.format(
                "{\"poolId\":\"%s\",\"eadTotal\":%.2f,\"collateralNetValue\":%.2f,\"eadCovered\":%.2f,\"eadUncovered\":%.2f,\"lgdPool\":%.4f}",
                poolId, eadTotal, collateralNetValue, eadCovered, eadUncovered, lgdPool);

        // Set LGD for every asset in the pool
        for (AssetInput a : poolAssets) {
            a.setLgdValue(lgdPool);
            a.setLgdDetails(lgdDetails);
        }

        log.info("[6.5 LGD] pool={} eadTotal={} collNetValue={} eadCovered={} eadUncovered={} lgdPool={}",
                poolId, eadTotal, collateralNetValue, eadCovered, eadUncovered, lgdPool);
    }

    private void processAsset(AssetInput a, Map<String, Double> cache, double defaultLgd) {
        double lgd = lookupLgdForGroup(a, cache, defaultLgd);
        a.setLgdValue(lgd);
    }

    private double lookupLgdForGroup(AssetInput a, Map<String, Double> cache, double defaultLgd) {
        String groupId = a.getGroupId();
        String collType = a.getCollateralType();
        String prodType = a.getProductType();

        // 1. exact match
        String exactKey = groupId + "|" + collType + "|" + prodType;
        Double lgd = cache.get(exactKey);

        // 2. NONE path
        if (lgd == null) {
            String noneKey = groupId + "|NONE|" + prodType;
            lgd = cache.get(noneKey);
        }

        // 3. Fallback: 忽略 productType（兼容曲线中 productType 为空串的情况）
        if (lgd == null && collType != null) {
            String fallbackKey = groupId + "|" + collType + "|";
            lgd = cache.get(fallbackKey);
        }

        // 4. scheme default
        if (lgd == null) {
            lgd = defaultLgd;
            a.setLgdException("WARN");
        }

        return lgd;
    }

    private Map<String, Double> buildCurveCache(String schemeId) {
        List<LgdCurveEntity> curves = lgdCurveMapper.selectList(
                new LambdaQueryWrapper<LgdCurveEntity>()
                        .eq(LgdCurveEntity::getSchemeId, schemeId));
        if (curves == null) return Collections.emptyMap();
        return curves.stream().collect(Collectors.toMap(
                c -> c.getGroupId() + "|" + c.getCollateralType() + "|" + c.getProductType(),
                c -> c.getLgdBaseValue() != null ? c.getLgdBaseValue().doubleValue() : 0.0,
                (a, b) -> a));
    }

    private Map<String, Double> buildDiscountCache(String schemeId) {
        List<LgdCollateralDiscountEntity> list = discountMapper.selectList(
                new LambdaQueryWrapper<LgdCollateralDiscountEntity>()
                        .eq(LgdCollateralDiscountEntity::getSchemeId, schemeId));
        if (list == null) return Collections.emptyMap();
        return list.stream().collect(Collectors.toMap(
                d -> nullSafeKey(d.getCollateralCategory(), d.getCollateralType()),
                d -> d.getDiscountRate() != null ? d.getDiscountRate().doubleValue() : 0.0,
                (a, b) -> a));
    }

    private Map<String, Double> buildDepreciationCache(String schemeId) {
        List<LgdDepreciationEntity> list = depreciationMapper.selectList(
                new LambdaQueryWrapper<LgdDepreciationEntity>()
                        .eq(LgdDepreciationEntity::getSchemeId, schemeId));
        if (list == null) return Collections.emptyMap();
        return list.stream().collect(Collectors.toMap(
                d -> nullSafeKey(d.getCollateralType(), d.getYearOffset()),
                d -> d.getDepreciationRate() != null ? d.getDepreciationRate().doubleValue() : 0.0,
                (a, b) -> a));
    }

    private static String nullSafeKey(String a, String b) {
        return (a != null ? a : "") + "|" + (b != null ? b : "");
    }

    private static String nullSafeKey(String a, Integer b) {
        return (a != null ? a : "") + "|" + (b != null ? b : 0);
    }
}
