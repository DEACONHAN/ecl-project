package com.bank.ecl.calculation.trial.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class TrialHistoricalStageRowReq {

    private String assetId;
    private LocalDate calcDate;
    private String stageResult;
}
