package com.bank.ecl.parameter.overlay.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class OverlayRuleVO {
    private Long ruleId;
    private String schemeId;
    private String groupId;
    private String overlayType;
    private String adjustmentTarget;
    private String adjustmentType;
    private BigDecimal adjustmentValue;
    private Integer priority;
    private String conditions;
    private LocalDate effectiveDate;
    private LocalDate expiryDate;
}
