package com.bank.ecl.calculation.trial.dto;

import lombok.Data;

@Data
public class TrialRatingRowReq {

    private String cifNo;
    private String customerName;
    private String extRatingCoLastYear;
    private String extRatingLastYear;
    private String crrIntLastYear;
    private String extRatingCoThisYear;
    private String extRatingThisYear;
    private String crrIntThisYear;
    private String crrFinal;
}
