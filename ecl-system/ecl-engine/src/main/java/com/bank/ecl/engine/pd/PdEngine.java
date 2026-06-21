package com.bank.ecl.engine.pd;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bank.ecl.common.constant.EngineType;
import com.bank.ecl.data.entity.PdCurveEntity;
import com.bank.ecl.data.entity.PdScenarioEntity;
import com.bank.ecl.data.mapper.PdCurveMapper;
import com.bank.ecl.data.mapper.PdScenarioMapper;
import com.bank.ecl.engine.core.*;
import com.bank.ecl.engine.stage.StageResult;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PdEngine implements EclEngine {

    private static final Logger log = LoggerFactory.getLogger(PdEngine.class);
    private final PdScenarioMapper scenarioMapper;
    private final PdCurveMapper curveMapper;

    @Override
    public EngineType getType() { return EngineType.PD; }

    @Override
    public void execute(JobContext ctx) {
        String schemeId = ctx.getSchemeId();
        log.info("[6.3 PD] start, schemeId={}", schemeId);
        if (schemeId == null || schemeId.isBlank()) {
            log.warn("[6.3 PD] schemeId is null or blank, skipping");
            return;
        }

        List<PdScenarioEntity> scenarios = loadScenarios(schemeId);
        if (scenarios.isEmpty()) {
            markAll(ctx, "ECL_001");
            return;
        }
        Map<String, Double> curveCache = buildCurveCache(schemeId);
        log.info("[6.3 PD] loaded {} scenarios, {} curve entries", scenarios.size(), curveCache.size());

        List<CustomerContext> customers = ctx.getCustomers();
        if (customers == null || customers.isEmpty()) { log.info("[6.3 PD] no customers"); return; }

        for (CustomerContext customer : customers) {
            if (customer == null || customer.getAssets() == null) continue;
            for (AssetInput asset : customer.getAssets()) {
                if (asset == null) continue;
                processAsset(asset, scenarios, curveCache);
            }
        }
        log.info("[6.3 PD] complete");
    }

    private void processAsset(AssetInput asset, List<PdScenarioEntity> scenarios,
                              Map<String, Double> cache) {
        String groupId = asset.getGroupId();
        String ratingCode = asset.getRatingCode();
        List<PdDetail> details = new ArrayList<>();
        double pd12m = 0.0;
        boolean hasMissing = false;

        for (PdScenarioEntity s : scenarios) {
            String key = groupId + "|" + ratingCode + "|" + s.getScenarioId();
            Double pdValue = cache.get(key);
            if (pdValue == null) {
                hasMissing = true;
                continue;
            }
            double weight = s.getWeight() != null ? s.getWeight().doubleValue() : 0.0;
            double weighted = pdValue * weight;
            pd12m += weighted;
            details.add(new PdDetail(s.getScenarioType(), s.getScenarioName(),
                    s.getWeight(), pdValue, weighted));
        }

        asset.setPdDetails(details);
        asset.setPd12m(pd12m);

        if (hasMissing || details.isEmpty()) {
            asset.setPdException("ECL_001");
        }

        // Stage 转换
        StageResult sr = asset.getStageResult();
        Stage stage = sr != null ? sr.getStage() : Stage.STAGE_1;
        asset.setPdLifetime(convertByStage(pd12m, stage, asset.getMaturityDate(), asset.getCalcDate()));
    }

    private double convertByStage(double pd12m, Stage stage, LocalDate maturity, LocalDate calcDate) {
        return switch (stage) {
            case STAGE_1 -> pd12m;
            case STAGE_2 -> {
                long months = ChronoUnit.MONTHS.between(calcDate, maturity);
                double t = Math.max(months / 12.0, 1.0);
                yield 1 - Math.pow(1 - pd12m, t);
            }
            case STAGE_3 -> 1.0;
        };
    }

    private List<PdScenarioEntity> loadScenarios(String schemeId) {
        List<PdScenarioEntity> list = scenarioMapper.selectList(
                new LambdaQueryWrapper<PdScenarioEntity>()
                        .eq(PdScenarioEntity::getSchemeId, schemeId));
        return list != null ? list : Collections.emptyList();
    }

    private Map<String, Double> buildCurveCache(String schemeId) {
        List<PdCurveEntity> curves = curveMapper.selectList(
                new LambdaQueryWrapper<PdCurveEntity>()
                        .eq(PdCurveEntity::getSchemeId, schemeId));
        if (curves == null) return Collections.emptyMap();
        return curves.stream().collect(Collectors.toMap(
                c -> c.getGroupId() + "|" + c.getRatingCode() + "|" + c.getScenarioId(),
                c -> c.getPdValue() != null ? c.getPdValue().doubleValue() : 0.0,
                (a, b) -> a));
    }

    private void markAll(JobContext ctx, String exceptionCode) {
        if (ctx.getCustomers() == null) return;
        for (CustomerContext c : ctx.getCustomers()) {
            if (c == null || c.getAssets() == null) continue;
            for (AssetInput a : c.getAssets()) {
                if (a != null) a.setPdException(exceptionCode);
            }
        }
    }
}
