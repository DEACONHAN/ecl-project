package com.bank.ecl.parameter.lgd.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class LgdDepreciationVO {
    private Long depreciationId;
    private String schemeId;
    private String collateralType;
    private Integer yearOffset;
    private BigDecimal depreciationRate;
}
