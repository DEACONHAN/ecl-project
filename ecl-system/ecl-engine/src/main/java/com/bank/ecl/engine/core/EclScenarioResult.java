package com.bank.ecl.engine.core;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class EclScenarioResult {

    private String scenarioCode;
    private BigDecimal weight;
    private double scenarioEcl;
    private double weightedEcl;
}
