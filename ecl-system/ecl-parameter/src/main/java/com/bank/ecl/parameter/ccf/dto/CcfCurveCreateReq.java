package com.bank.ecl.parameter.ccf.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CcfCurveCreateReq {

    @NotBlank(message = "schemeId 不能为空")
    private String schemeId;

    @NotBlank(message = "productType 不能为空")
    private String productType;

    @NotBlank(message = "commitmentType 不能为空")
    private String commitmentType;

    @NotNull(message = "commitmentDaysMin 不能为空")
    private Integer commitmentDaysMin;

    @NotNull(message = "commitmentDaysMax 不能为空")
    private Integer commitmentDaysMax;

    @NotNull(message = "ccfValue 不能为空")
    @DecimalMin(value = "0.0", inclusive = true, message = "ccfValue 最小为 0")
    @DecimalMax(value = "1.0", inclusive = true, message = "ccfValue 最大为 1")
    private BigDecimal ccfValue;
}
