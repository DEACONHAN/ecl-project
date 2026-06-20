package com.bank.ecl.parameter.riskgroup.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class RiskGroupVO {
    private String groupId;
    private String groupCode;
    private String schemeId;
    private String groupName;
    private Integer sortOrder;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<RiskGroupDetailVO> details;
}
