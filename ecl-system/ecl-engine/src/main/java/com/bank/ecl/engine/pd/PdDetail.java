package com.bank.ecl.engine.pd;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class PdDetail {
    private String scenarioType;
    private String scenarioName;
    private BigDecimal weight;
    private double pdValue;
    private double weightedPd;
}
