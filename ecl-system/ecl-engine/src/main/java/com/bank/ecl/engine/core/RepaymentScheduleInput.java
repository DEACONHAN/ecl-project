package com.bank.ecl.engine.core;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class RepaymentScheduleInput {

    private String loanReceiptNo;
    private Integer totalPeriods;
    private Integer periodNo;
    private LocalDate dueDate;
    private BigDecimal duePrincipal;
    private BigDecimal dueInterest;
}
