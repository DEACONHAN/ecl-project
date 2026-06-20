package com.bank.ecl.parameter.stage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CrrDropRuleCreateReq {
    @NotBlank
    private String schemeId;

    @NotBlank
    private String groupId;

    @NotBlank
    private String currentRating;

    @NotNull
    private Integer dropThreshold;
}
