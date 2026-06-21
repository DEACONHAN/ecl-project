package com.bank.ecl.parameter.stage.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CrrDropRuleCreateReq {
    @NotBlank
    private String schemeId;

    @NotBlank
    private String groupId;

    @NotBlank
    private String currentRating;

    private Integer dropThreshold;

    private Integer downgradeThreshold;
}
