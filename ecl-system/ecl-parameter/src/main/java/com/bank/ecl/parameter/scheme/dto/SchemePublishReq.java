package com.bank.ecl.parameter.scheme.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class SchemePublishReq {
    private boolean immediate = true;
    private LocalDate effectiveDate;
}
