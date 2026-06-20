package com.bank.ecl.parameter.lgd.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class LgdCollateralDiscountVO {
    private Long discountId;
    private String schemeId;
    private String collateralType;
    private BigDecimal discountRate;
}
