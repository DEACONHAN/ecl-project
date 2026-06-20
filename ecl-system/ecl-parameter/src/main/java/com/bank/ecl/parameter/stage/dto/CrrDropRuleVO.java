package com.bank.ecl.parameter.stage.dto;

import lombok.Data;

@Data
public class CrrDropRuleVO {
    private Long dropRuleId;
    private String schemeId;
    private String groupId;
    private String currentRating;
    private Integer dropThreshold;
}
