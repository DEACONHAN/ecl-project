package com.bank.ecl.engine.overlay;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bank.ecl.common.constant.EngineType;
import com.bank.ecl.data.entity.OverlayRuleEntity;
import com.bank.ecl.data.mapper.OverlayRuleMapper;
import com.bank.ecl.engine.core.*;
import com.bank.ecl.engine.stage.StageConditionEvaluator;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class OverlayEngine implements EclEngine {
    private static final Logger log = LoggerFactory.getLogger(OverlayEngine.class);
    private final OverlayRuleMapper overlayRuleMapper;

    @Override
    public EngineType getType() {
        return EngineType.OVERLAY;
    }

    @Override
    public void execute(JobContext ctx) {
        String schemeId = ctx.getSchemeId();
        log.info("[6.7 Overlay] start, schemeId={}", schemeId);
        if (schemeId == null || schemeId.isBlank()) {
            log.warn("[6.7 Overlay] skipping");
            return;
        }

        Map<String, List<OverlayRuleEntity>> rulesByGroup = loadRulesByGroup(schemeId);
        log.info("[6.7 Overlay] loaded {} rule groups", rulesByGroup.size());

        List<CustomerContext> customers = ctx.getCustomers();
        if (customers == null || customers.isEmpty()) {
            log.info("[6.7 Overlay] no customers");
            return;
        }

        for (CustomerContext c : customers) {
            if (c == null || c.getAssets() == null) continue;
            for (AssetInput a : c.getAssets()) {
                if (a == null) continue;
                processAsset(a, rulesByGroup);
            }
        }
        log.info("[6.7 Overlay] complete");
    }

    private void processAsset(AssetInput a, Map<String, List<OverlayRuleEntity>> rulesByGroup) {
        double ecl = a.getEclValue();
        String groupId = a.getGroupId();
        List<OverlayRuleEntity> rules = rulesByGroup.getOrDefault(groupId, Collections.emptyList());

        OverlayRuleEntity bestRule = null;
        double bestRatio = Double.NEGATIVE_INFINITY;

        for (OverlayRuleEntity rule : rules) {
            if (StageConditionEvaluator.evaluate(rule.getConditions(), a, null)) {
                double ratio = computeEquivalentRatio(rule, a.getTotalEad());
                if (ratio > bestRatio) {
                    bestRatio = ratio;
                    bestRule = rule;
                }
            }
        }

        double overlay = 0.0;
        if (bestRule != null) {
            overlay = computeOverlay(bestRule, a.getTotalEad());
        }
        a.setOverlayAmount(overlay);
        a.setEclFinal(ecl + overlay);
    }

    private double computeEquivalentRatio(OverlayRuleEntity rule, double ead) {
        double val = rule.getAdjustmentValue() != null ? rule.getAdjustmentValue().doubleValue() : 0.0;
        return switch (rule.getAdjustmentType()) {
            case "ADDBP" -> val / 10000.0;
            case "PERCENTAGE" -> val;
            case "FIXED" -> ead > 0 ? val / ead : Double.MAX_VALUE;
            default -> 0.0;
        };
    }

    private double computeOverlay(OverlayRuleEntity rule, double ead) {
        double val = rule.getAdjustmentValue() != null ? rule.getAdjustmentValue().doubleValue() : 0.0;
        return switch (rule.getAdjustmentType()) {
            case "ADDBP" -> ead * (val / 10000.0);
            case "PERCENTAGE" -> ead * val;
            case "FIXED" -> val;
            default -> 0.0;
        };
    }

    private Map<String, List<OverlayRuleEntity>> loadRulesByGroup(String schemeId) {
        List<OverlayRuleEntity> rules = overlayRuleMapper.selectList(
                new LambdaQueryWrapper<OverlayRuleEntity>()
                        .eq(OverlayRuleEntity::getSchemeId, schemeId)
                        .orderByAsc(OverlayRuleEntity::getPriority));
        if (rules == null) return Collections.emptyMap();
        return rules.stream().collect(Collectors.groupingBy(OverlayRuleEntity::getGroupId));
    }
}
