package com.bank.ecl.parameter.overlay.dto;

import lombok.Data;

import java.util.List;

@Data
public class OverlayMatchTestResp {
    private List<OverlayRuleVO> matchedRules;
    private OverlayRuleVO selectedRule;
    private Double effectiveRatio;
    private boolean hasMatch;
}
