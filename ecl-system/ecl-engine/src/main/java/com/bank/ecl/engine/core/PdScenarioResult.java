package com.bank.ecl.engine.core;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PdScenarioResult {

    private String scenarioCode;
    private String scenarioName;
    private BigDecimal weight;
    private double pdValue;
}
