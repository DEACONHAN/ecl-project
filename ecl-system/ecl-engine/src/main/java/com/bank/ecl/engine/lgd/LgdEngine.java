package com.bank.ecl.engine.lgd;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bank.ecl.common.constant.EngineType;
import com.bank.ecl.data.entity.LgdCurveEntity;
import com.bank.ecl.data.mapper.LgdCurveMapper;
import com.bank.ecl.engine.core.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger; import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class LgdEngine implements EclEngine {
    private static final Logger log = LoggerFactory.getLogger(LgdEngine.class);
    private final LgdCurveMapper lgdCurveMapper;

    @Override public EngineType getType() { return EngineType.LGD; }

    @Override
    public void execute(JobContext ctx) {
        String schemeId = ctx.getSchemeId();
        log.info("[6.5 LGD] start, schemeId={}", schemeId);
        if (schemeId == null || schemeId.isBlank()) { log.warn("[6.5 LGD] schemeId null, skipping"); return; }

        Map<String, Double> curveCache = buildCurveCache(schemeId);
        double defaultLgd = ctx.getDefaultLgd();
        log.info("[6.5 LGD] loaded {} curve entries, defaultLgd={}", curveCache.size(), defaultLgd);

        List<CustomerContext> customers = ctx.getCustomers();
        if (customers == null || customers.isEmpty()) { log.info("[6.5 LGD] no customers"); return; }

        for (CustomerContext c : customers) {
            if (c == null || c.getAssets() == null) continue;
            for (AssetInput a : c.getAssets()) {
                if (a == null) continue;
                processAsset(a, curveCache, defaultLgd);
            }
        }
        log.info("[6.5 LGD] complete");
    }

    private void processAsset(AssetInput a, Map<String, Double> cache, double defaultLgd) {
        String groupId = a.getGroupId();
        String collType = a.getCollateralType();
        String prodType = a.getProductType();

        // 1. 精确匹配
        String exactKey = groupId + "|" + collType + "|" + prodType;
        Double lgd = cache.get(exactKey);

        // 2. NONE 路径
        if (lgd == null) {
            String noneKey = groupId + "|NONE|" + prodType;
            lgd = cache.get(noneKey);
        }

        // 3. 方案兜底
        if (lgd == null) {
            lgd = defaultLgd;
            a.setLgdException("WARN");
        }

        a.setLgdValue(lgd);
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
}
