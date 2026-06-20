package com.bank.ecl.parameter.lgd.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class LgdDepreciationBatchReq {

    @NotBlank(message = "schemeId 不能为空")
    private String schemeId;

    @NotBlank(message = "collateralType 不能为空")
    private String collateralType;

    @Valid
    private List<DepreciationItem> items;

    @Data
    public static class DepreciationItem {

        @NotNull(message = "yearOffset 不能为空")
        private Integer yearOffset;

        @NotNull(message = "depreciationRate 不能为空")
        @DecimalMin(value = "0.0", inclusive = true, message = "depreciationRate 最小为 0")
        @DecimalMax(value = "1.0", inclusive = true, message = "depreciationRate 最大为 1")
        private BigDecimal depreciationRate;
    }
}
