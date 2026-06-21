package com.bank.ecl.calculation.trial.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class TrialStepVO {
    private String key;
    private String title;
    private String summary;
    private String note;
    private List<TrialMetricVO> metrics = new ArrayList<>();
    private List<TrialScenarioRowVO> scenarioRows = new ArrayList<>();
}
