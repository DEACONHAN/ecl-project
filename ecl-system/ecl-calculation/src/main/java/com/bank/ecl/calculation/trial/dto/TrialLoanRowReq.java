package com.bank.ecl.calculation.trial.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TrialLoanRowReq {

    private LocalDate reportDt;
    private String id;
    private String facilityCd;
    private String customerNo;
    private String customerName;
    private String industryCn;
    private String subIndustry1;
    private String subIndustry2;
    private String segment;
    private String subProductCd;
    private String productType;
    private String currencyCd;
    private BigDecimal amtFinancedFcy;
    private BigDecimal loanBalFcy;
    private BigDecimal intAccruedFcy;
    private BigDecimal fxRateContractToCny;
    private BigDecimal amtFinancedCny;
    private BigDecimal loanBalCny;
    private BigDecimal intAccruedCny;
    private BigDecimal interestRate;
    private LocalDate loanStartDt;
    private LocalDate loanMaturityDt;
    private BigDecimal remainingYrsToMaturity;
    private Integer overdueDays;
    private String loanClassifCd;
    private String isNpl;
    private String loanStatus;
    private BigDecimal penaltyInterest;
    private String affiliatedGroup;
    private String isSoe;
    private String guaranteeType;
    private Integer normalConsecutiveDays;
    private String otherRiskInfo;
    private String businessType;
    private BigDecimal overduePrincipal;
    private BigDecimal overdueInterest;
}
