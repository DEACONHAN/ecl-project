package com.bank.ecl.parameter.pd.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PdScenarioCreateReq {

    @NotBlank(message = "schemeId 不能为空")
    private String schemeId;

    @NotBlank(message = "scenarioType 不能为空")
    private String scenarioType;

    private String scenarioName;

    @NotNull(message = "weight 不能为空")
    @DecimalMin(value = "0.0", inclusive = true, message = "weight 最小为 0")
    @DecimalMax(value = "1.0", inclusive = true, message = "weight 最大为 1")
    private BigDecimal weight;
}
