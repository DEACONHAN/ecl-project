package com.bank.ecl.calculation.trial.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrialMetricVO {
    private String label;
    private String value;
    private String note;
}
