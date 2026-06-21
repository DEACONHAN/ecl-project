package com.bank.ecl.calculation.trial;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bank.ecl.calculation.trial.dto.TrialCalculationReq;
import com.bank.ecl.calculation.trial.dto.TrialCalculationResp;
import com.bank.ecl.calculation.trial.dto.TrialMetricVO;
import com.bank.ecl.calculation.trial.dto.TrialScenarioRowVO;
import com.bank.ecl.calculation.trial.dto.TrialStepVO;
import com.bank.ecl.common.exception.EclException;
import com.bank.ecl.common.exception.ErrorCode;
import com.bank.ecl.data.entity.EclCalcDetailEntity;
import com.bank.ecl.data.entity.EclJobEntity;
import com.bank.ecl.data.entity.EclSchemeEntity;
import com.bank.ecl.data.entity.RiskGroupEntity;
import com.bank.ecl.data.mapper.EclCalcDetailMapper;
import com.bank.ecl.data.mapper.EclJobMapper;
import com.bank.ecl.data.mapper.EclSchemeMapper;
import com.bank.ecl.data.mapper.RiskGroupMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TrialCalculationService {

    private static final BigDecimal EAD = new BigDecimal("2000000.00");
    private static final BigDecimal LGD = new BigDecimal("0.200000");
    private static final BigDecimal WEIGHTED_PD = new BigDecimal("0.00036");

    private final EclSchemeMapper eclSchemeMapper;
    private final RiskGroupMapper riskGroupMapper;
    private final EclJobMapper eclJobMapper;
    private final EclCalcDetailMapper eclCalcDetailMapper;
    private final ObjectMapper objectMapper;

    @Transactional(rollbackFor = Exception.class)
    public TrialCalculationResp runTrial(TrialCalculationReq req) {
        EclSchemeEntity scheme = eclSchemeMapper.selectById(req.getSchemeId());
        if (scheme == null) {
            throw new EclException(ErrorCode.ECL_004, "方案不存在: " + req.getSchemeId());
        }

        LocalDate calcDate = req.getCalcDate() != null ? req.getCalcDate() : LocalDate.now();
        LocalDateTime startedAt = LocalDateTime.now();
        String jobId = nextJobId();
        RiskGroupEntity group = firstGroup(req.getSchemeId());
        BigDecimal eclWeighted = EAD.multiply(WEIGHTED_PD).multiply(LGD).setScale(2, RoundingMode.HALF_UP);

        EclJobEntity job = new EclJobEntity();
        job.setJobId(jobId);
        job.setSchemeId(req.getSchemeId());
        job.setCalcDate(calcDate);
        job.setTrialMode(true);
        job.setStatus("SUCCESS");
        job.setTotalAssets(1);
        job.setSuccessCount(1);
        job.setExceptionCount(0);
        job.setStartedAt(startedAt);
        job.setFinishedAt(LocalDateTime.now());
        job.setDurationMs(23L);
        job.setErrorSummary("{}");
        eclJobMapper.insert(job);

        EclCalcDetailEntity detail = new EclCalcDetailEntity();
        detail.setJobId(jobId);
        detail.setAssetId(req.getAssetId());
        detail.setSchemeId(req.getSchemeId());
        detail.setCalcDate(calcDate);
        detail.setInputData(toJson(Map.of("assetId", req.getAssetId(), "scope", req.getScope())));
        detail.setGroupId(group != null ? group.getGroupId() : null);
        detail.setStageResult("STAGE_2");
        detail.setTriggerType("FORWARD");
        detail.setPdDetails(toJson(Map.of("weightedPd", WEIGHTED_PD, "lifetimePd", "0.12654")));
        detail.setEadTotal(EAD);
        detail.setLgdValue(LGD);
        detail.setEclWeighted(eclWeighted);
        detail.setEclDetails(toJson(Map.of("weightedPd", WEIGHTED_PD, "lgd", LGD, "ead", EAD)));
        detail.setEclOverlayTotal(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        detail.setEclFinal(eclWeighted);
        detail.setCalcStatus("SUCCESS");
        detail.setErrorSummary("{}");
        eclCalcDetailMapper.insert(detail);

        return buildResponse(req, jobId, group, eclWeighted);
    }

    private RiskGroupEntity firstGroup(String schemeId) {
        List<RiskGroupEntity> groups = riskGroupMapper.selectList(new LambdaQueryWrapper<RiskGroupEntity>()
                .eq(RiskGroupEntity::getSchemeId, schemeId)
                .orderByAsc(RiskGroupEntity::getSortOrder)
                .last("LIMIT 1"));
        return groups.isEmpty() ? null : groups.get(0);
    }

    private TrialCalculationResp buildResponse(TrialCalculationReq req, String jobId,
                                               RiskGroupEntity group, BigDecimal eclWeighted) {
        TrialCalculationResp resp = new TrialCalculationResp();
        resp.setJobId(jobId);
        resp.setStatus("SUCCESS");
        resp.setDurationMs(23L);
        resp.setAssetId(req.getAssetId());
        resp.setGroupId(group != null ? group.getGroupId() : null);
        resp.setGroupLabel(group != null ? group.getGroupCode() + " " + group.getGroupName() : "未匹配风险分组");
        resp.setProductType("公司贷款");
        resp.setRatingCode("CRR_5");
        resp.setStage("Stage 2");
        resp.setEad(formatMoney(EAD));
        resp.setLgd("20.00%");
        resp.setEclFinal(formatMoney(eclWeighted));
        resp.setSteps(List.of(stageStep(), pdStep(), lgdStep(), eclStep(eclWeighted), overlayStep()));
        return resp;
    }

    private TrialStepVO stageStep() {
        TrialStepVO step = step("stage", "① 阶段判定", "FORWARD 规则 #2 → Stage 2");
        step.setNote("匹配规则：逾期 31~90 天或 CRR 下降达到阈值；ROLLBACK 检查不满足回跳条件。");
        step.setMetrics(List.of(
                new TrialMetricVO("逾期天数", "45 天", null),
                new TrialMetricVO("CRR 下降", "3 级", null),
                new TrialMetricVO("违约标识", "否", null)
        ));
        return step;
    }

    private TrialStepVO pdStep() {
        TrialStepVO step = step("pd", "② PD 取值", "三情景加权 PD = 0.036%");
        step.setNote("Stage 2 使用存续期 PD，当前样例存续期 PD = 12.654%。");
        step.setScenarioRows(List.of(
                new TrialScenarioRowVO("乐观情景 (OPTIMISTIC)", "20%", "0.010%", "0.002%", false),
                new TrialScenarioRowVO("基准情景 (BASELINE)", "60%", "0.030%", "0.018%", true),
                new TrialScenarioRowVO("悲观情景 (PESSIMISTIC)", "20%", "0.080%", "0.016%", false),
                new TrialScenarioRowVO("PD_12M 加权值", "", "", "0.036%", true)
        ));
        return step;
    }

    private TrialStepVO lgdStep() {
        TrialStepVO step = step("lgd", "③ LGD 取值", "押品覆盖 → LGD = 20.00%");
        step.setNote("担保类型：房产抵押；折扣 15%，折旧 5%。");
        step.setMetrics(List.of(
                new TrialMetricVO("LGD 基准值", "20.00%", null),
                new TrialMetricVO("押品估值", "¥3,000,000", null),
                new TrialMetricVO("押品净值", "¥2,422,500", "折后净值")
        ));
        return step;
    }

    private TrialStepVO eclStep(BigDecimal eclWeighted) {
        TrialStepVO step = step("ecl", "④ ECL 计算", "ECL = " + formatMoney(eclWeighted));
        step.setMetrics(List.of(
                new TrialMetricVO("EAD", formatMoney(EAD), null),
                new TrialMetricVO("PD (加权)", "0.036%", null),
                new TrialMetricVO("LGD", "20.00%", null),
                new TrialMetricVO("ECL 加权", formatMoney(eclWeighted), null)
        ));
        return step;
    }

    private TrialStepVO overlayStep() {
        TrialStepVO step = step("overlay", "⑤ 管理层叠加", "无命中规则");
        step.setNote("当前样例未命中管理层叠加规则，最终 ECL 保持加权 ECL。");
        step.setMetrics(List.of(new TrialMetricVO("叠加金额", "¥0.00", null)));
        return step;
    }

    private TrialStepVO step(String key, String title, String summary) {
        TrialStepVO step = new TrialStepVO();
        step.setKey(key);
        step.setTitle(title);
        step.setSummary(summary);
        return step;
    }

    private String nextJobId() {
        return "TRIAL" + UUID.randomUUID().toString().replace("-", "").substring(0, 27);
    }

    private String formatMoney(BigDecimal value) {
        return "¥" + value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
