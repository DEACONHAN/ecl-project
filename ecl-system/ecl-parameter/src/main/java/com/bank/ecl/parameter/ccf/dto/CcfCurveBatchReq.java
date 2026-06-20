package com.bank.ecl.parameter.ccf.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CcfCurveBatchReq {

    @NotBlank(message = "schemeId 不能为空")
    private String schemeId;

    @Valid
    private List<CcfCurveCreateReq> curves;
}
