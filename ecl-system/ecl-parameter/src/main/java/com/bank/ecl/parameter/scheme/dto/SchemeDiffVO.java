package com.bank.ecl.parameter.scheme.dto;

import lombok.Data;

@Data
public class SchemeDiffVO {
    private String module;
    private String versionFrom;
    private String versionTo;
    private int changedItems;
    private boolean same;
}
