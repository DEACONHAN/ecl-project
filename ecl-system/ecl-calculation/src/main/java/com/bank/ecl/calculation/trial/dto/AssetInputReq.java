package com.bank.ecl.calculation.trial.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AssetInputReq {
    private String assetId;
    // 6.1
    private String businessLine;
    private String customerType;
    private String productType;
    private String industryCode;
    private String regionCode;
    private String collateralType;
    // 6.2
    private String lastStage;
    private Integer overdueDays;
    private String crrRating;
    private String fiveCategory;
    private Boolean defaultFlag;
    private String mediaSentiment;
    private Integer ratingDropLevels;
    // 6.3
    private String ratingCode;
    private LocalDate maturityDate;
    // 6.4
    private BigDecimal outstandingBalance;
    private BigDecimal accruedInterest;
    private BigDecimal totalLimit;
    private String commitmentType;
    private Integer commitmentDays;

    public static AssetInputReq from(TrialCalculationReq req) {
        AssetInputReq r = new AssetInputReq();
        r.setAssetId(req.getAssetId());
        r.setBusinessLine(req.getBusinessLine());
        r.setCustomerType(req.getCustomerType());
        r.setProductType(req.getProductType());
        r.setIndustryCode(req.getIndustryCode());
        r.setRegionCode(req.getRegionCode());
        r.setCollateralType(req.getCollateralType());
        r.setLastStage(req.getLastStage());
        r.setOverdueDays(req.getOverdueDays());
        r.setCrrRating(req.getCrrRating());
        r.setFiveCategory(req.getFiveCategory());
        r.setDefaultFlag(req.getDefaultFlag());
        r.setMediaSentiment(req.getMediaSentiment());
        r.setRatingDropLevels(req.getRatingDropLevels());
        r.setRatingCode(req.getRatingCode());
        r.setMaturityDate(req.getMaturityDate());
        r.setOutstandingBalance(req.getOutstandingBalance());
        r.setAccruedInterest(req.getAccruedInterest());
        r.setTotalLimit(req.getTotalLimit());
        r.setCommitmentType(req.getCommitmentType());
        r.setCommitmentDays(req.getCommitmentDays());
        return r;
    }
}
