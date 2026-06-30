package com.bank.ecl.parameter.ccf.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CcfCurveVO {
    private Long curveId;
    private String schemeId;
    private String productType;
    private String commitmentType;
    private Integer commitmentDaysMin;
    private Integer commitmentDaysMax;
    private Integer daysMin;
    private Integer daysMax;
    private BigDecimal ccfValue;
}
