package com.bank.ecl.parameter.stage.dto;

import lombok.Data;

@Data
public class StageRuleVO {
    private Long ruleId;
    private String schemeId;
    private String groupId;
    private String ruleType;
    private String stageFrom;
    private String stageTo;
    private String sourceStage;
    private String targetStage;
    private Integer priority;
    private Integer observationDays;
    private String conditions;
    private String jsonCondition;
}
