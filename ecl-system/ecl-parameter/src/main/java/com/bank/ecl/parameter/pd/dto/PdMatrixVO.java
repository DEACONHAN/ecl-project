package com.bank.ecl.parameter.pd.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class PdMatrixVO {
    private String schemeId;
    private String groupId;
    private List<String> ratingCodes;
    private List<PdScenarioVO> scenarios;
    private List<List<BigDecimal>> matrix;
}
