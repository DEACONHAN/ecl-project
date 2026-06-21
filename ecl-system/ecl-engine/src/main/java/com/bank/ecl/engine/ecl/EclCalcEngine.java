package com.bank.ecl.engine.ecl;

import com.bank.ecl.common.constant.EngineType;
import com.bank.ecl.engine.core.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class EclCalcEngine implements EclEngine {
    private static final Logger log = LoggerFactory.getLogger(EclCalcEngine.class);

    @Override
    public EngineType getType() {
        return EngineType.ECL;
    }

    @Override
    public void execute(JobContext ctx) {
        log.info("[6.6 ECL] start");
        List<CustomerContext> customers = ctx.getCustomers();
        if (customers == null || customers.isEmpty()) {
            log.info("[6.6 ECL] no customers");
            return;
        }

        for (CustomerContext c : customers) {
            if (c == null || c.getAssets() == null) continue;
            for (AssetInput a : c.getAssets()) {
                if (a == null) continue;
                // PD 异常则跳过
                if (a.getPdException() != null) continue;
                double ecl = a.getPdLifetime() * a.getLgdValue() * a.getTotalEad();
                a.setEclValue(ecl);
            }
        }
        log.info("[6.6 ECL] complete");
    }
}
