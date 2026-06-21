package com.bank.ecl.parameter.stage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StageRuleCreateReq {
    @NotBlank
    private String schemeId;

    @NotBlank
    private String groupId;

    @NotBlank
    private String ruleType;

    private String stageFrom;

    private String stageTo;

    private String sourceStage;

    private String targetStage;

    @NotNull
    private Integer priority;

    private Integer observationDays;

    private String conditions;

    private String jsonCondition;
}
