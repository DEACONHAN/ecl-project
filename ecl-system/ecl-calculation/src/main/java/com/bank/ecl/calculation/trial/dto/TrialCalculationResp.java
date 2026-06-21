package com.bank.ecl.calculation.trial.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class TrialCalculationResp {
    private String jobId;
    private String status;
    private Long durationMs;
    private String assetId;
    private String groupId;
    private String groupLabel;
    private String productType;
    private String ratingCode;
    private String stage;
    private String ead;
    private String lgd;
    private String eclFinal;
    private List<TrialStepVO> steps = new ArrayList<>();
}
