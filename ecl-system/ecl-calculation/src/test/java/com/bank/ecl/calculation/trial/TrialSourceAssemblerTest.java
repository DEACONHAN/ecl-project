package com.bank.ecl.calculation.trial;

import com.bank.ecl.calculation.trial.dto.TrialCalculationReq;
import com.bank.ecl.calculation.trial.dto.TrialLoanRowReq;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TrialSourceAssemblerTest {

    @Test
    void shouldAcceptSourceTableRowsInTrialRequest() {
        TrialCalculationReq req = new TrialCalculationReq();
        req.setSchemeId("SCH_001");
        req.setCalcDate(LocalDate.of(2026, 6, 24));

        TrialLoanRowReq loan = new TrialLoanRowReq();
        loan.setId("LN_001");
        loan.setFacilityCd("FAC_001");
        loan.setCustomerNo("CUST_001");
        loan.setCustomerName("客户A");
        loan.setSegment("2 Loan");
        loan.setProductType("公司贷款");
        loan.setIndustryCn("制造业");
        loan.setGuaranteeType("房产抵押");
        loan.setCurrencyCd("CNY");
        loan.setAmtFinancedCny(new BigDecimal("1000000"));
        loan.setLoanBalCny(new BigDecimal("800000"));
        loan.setIntAccruedCny(new BigDecimal("1000"));
        loan.setInterestRate(new BigDecimal("0.045"));
        loan.setLoanStartDt(LocalDate.of(2025, 1, 1));
        loan.setLoanMaturityDt(LocalDate.of(2028, 1, 1));
        loan.setOverdueDays(0);
        loan.setIsNpl("N");
        loan.setNormalConsecutiveDays(200);
        loan.setBusinessType("ON_BS");

        req.setLoans(List.of(loan));

        assertEquals("LN_001", req.getLoans().get(0).getId());
        assertEquals("房产抵押", req.getLoans().get(0).getGuaranteeType());
    }
}
