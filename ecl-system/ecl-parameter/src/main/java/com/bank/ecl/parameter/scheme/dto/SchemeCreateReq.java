package com.bank.ecl.parameter.scheme.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SchemeCreateReq {
    @NotBlank
    private String schemeName;
    private String description;
}
