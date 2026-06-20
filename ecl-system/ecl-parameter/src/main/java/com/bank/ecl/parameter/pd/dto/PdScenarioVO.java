package com.bank.ecl.parameter.pd.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PdScenarioVO {
    private Long scenarioId;
    private String schemeId;
    private String scenarioType;
    private String scenarioName;
    private BigDecimal weight;
}
