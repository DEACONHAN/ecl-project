package com.bank.ecl.engine.core;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class FacilityInput {

    private String facilityCd;
    private String limitCurrencyCd;
    private BigDecimal fxRateLimitToCny;
    private BigDecimal limitAmtFcy;
    private BigDecimal limitAmtCny;
    private BigDecimal limitAvailAmtFcy;
    private BigDecimal limitAvailAmtCny;
    private BigDecimal undrawnAmtCny;
    private String commitWithdrawFlg;
    private String isRevolving;
    private String calcTypeCd;
    private LocalDate facilityStartDate;
    private LocalDate facilityMaturityDate;
    private BigDecimal usedLimit;
    private String collateralPoolId;
    private String cifNo;
    private String customerName;
}
