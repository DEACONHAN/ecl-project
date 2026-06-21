package com.bank.ecl.calculation.trial.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TrialCalculationReq {

    @NotBlank(message = "schemeId 不能为空")
    private String schemeId;

    @NotBlank(message = "assetId 不能为空")
    private String assetId;

    private LocalDate calcDate;

    private String scope = "SINGLE";
}
