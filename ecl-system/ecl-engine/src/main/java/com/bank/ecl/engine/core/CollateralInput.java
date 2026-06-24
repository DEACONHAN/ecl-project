package com.bank.ecl.engine.core;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CollateralInput {

    private String branchCode;
    private String cifNo;
    private String customerName;
    private String facilityUniqueCode;
    private String facilityNumber;
    private String guaranteeContractNo;
    private String collateralType;
    private String collateralCategory;
    private String categoryDesc;
    private String collateralCode;
    private String collateralPoolCode;
    private String collateralStatus;
    private String collateralDesc;
    private LocalDate collateralStartDate;
    private LocalDate collateralEndDate;
    private String collateralCurrency;
    private BigDecimal collateralValue;
    private String reportCurrency;
    private BigDecimal collateralValueFcy;
    private String appraisalCompany;
    private LocalDate appraisalEffectiveDate;
    private LocalDate appraisalExpiryDate;
    private BigDecimal appraisalValue;
    private String guaranteeMethod;
}
