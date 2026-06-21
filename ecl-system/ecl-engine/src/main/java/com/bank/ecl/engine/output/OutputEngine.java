package com.bank.ecl.engine.output;

import com.bank.ecl.common.constant.EngineType;
import com.bank.ecl.data.entity.EclCalcDetailEntity;
import com.bank.ecl.data.mapper.EclCalcDetailMapper;
import com.bank.ecl.engine.core.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class OutputEngine implements EclEngine {
    private static final Logger log = LoggerFactory.getLogger(OutputEngine.class);
    private final EclCalcDetailMapper calcDetailMapper;

    @Override
    public EngineType getType() {
        return EngineType.OUTPUT;
    }

    @Override
    public void execute(JobContext ctx) {
        log.info("[6.8 Output] start, jobId={}", ctx.getJobId());
        List<CustomerContext> customers = ctx.getCustomers();
        if (customers == null || customers.isEmpty()) {
            log.info("[6.8 Output] no customers");
            return;
        }

        List<EclCalcDetailEntity> batch = new ArrayList<>();
        for (CustomerContext c : customers) {
            if (c == null || c.getAssets() == null) continue;
            for (AssetInput a : c.getAssets()) {
                if (a == null) continue;
                batch.add(toEntity(a, ctx));
            }
        }

        if (!batch.isEmpty()) {
            for (EclCalcDetailEntity entity : batch) {
                calcDetailMapper.insert(entity);
            }
            log.info("[6.8 Output] inserted {} detail records", batch.size());
        }
        log.info("[6.8 Output] complete");
    }

    private EclCalcDetailEntity toEntity(AssetInput a, JobContext ctx) {
        EclCalcDetailEntity e = new EclCalcDetailEntity();
        e.setJobId(ctx.getJobId());
        e.setSchemeId(ctx.getSchemeId());
        e.setAssetId(a.getAssetId());
        e.setCalcDate(a.getCalcDate());
        e.setGroupId(a.getGroupId());
        e.setGroupException(a.getGroupException());

        // Stage
        if (a.getStageResult() != null) {
            e.setStageResult(a.getStageResult().getStage().name());
            e.setTriggerType(a.getStageResult().getTriggerType());
            e.setStageException(a.getStageResult().isExceptionFlag() ? "Y" : null);
        }

        // PD
        e.setPdDetails(a.getPdDetails() != null ? a.getPdDetails().toString() : null);
        e.setPdException(a.getPdException());

        // EAD
        e.setEadTotal(BigDecimal.valueOf(a.getTotalEad()));
        e.setEadException(a.getEadException());

        // LGD
        e.setLgdValue(BigDecimal.valueOf(a.getLgdValue()));
        e.setLgdException(a.getLgdException());

        // ECL
        e.setEclWeighted(BigDecimal.valueOf(a.getEclValue()));

        // Overlay
        e.setEclOverlayTotal(BigDecimal.valueOf(a.getOverlayAmount()));
        e.setEclFinal(BigDecimal.valueOf(a.getEclFinal()));

        // Summary
        StringBuilder errors = new StringBuilder();
        if (a.getPdException() != null) errors.append("PD:").append(a.getPdException()).append(";");
        if (a.getEadException() != null) errors.append("EAD:").append(a.getEadException()).append(";");
        if (a.getLgdException() != null) errors.append("LGD:").append(a.getLgdException()).append(";");
        String errorStr = errors.toString();
        e.setErrorSummary(errorStr.isEmpty() ? null : errorStr);
        e.setCalcStatus(errorStr.isEmpty() ? "SUCCESS" : "PARTIAL");

        return e;
    }
}
