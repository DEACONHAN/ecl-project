package com.bank.ecl.engine.core;

import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 任务级上下文 —— 贯穿一次 ECL 计算任务的全部引擎。
 */
@Data
public class JobContext {

    /** 任务 ID */
    private String jobId;

    /** 绑定的 ECL 方案 ID */
    private String schemeId;

    /** 计算日期 */
    private LocalDate calcDate;

    /** true=试算，false=正式跑批 */
    private boolean trialMode;

    /** 方案 CCF 缺省值（由 tbl_ecl_scheme.default_ccf 加载） */
    private double defaultCcf;

    /** 方案 LGD 缺省值（由 tbl_ecl_scheme.default_lgd 加载） */
    private double defaultLgd;

    /** LGD 下限 */
    private double lgdFloor;

    /** 折现率（由 tbl_ecl_scheme.discount_rate 加载） */
    private double discountRate;

    /** 按客户分批的上下文列表 */
    private List<CustomerContext> customers = new ArrayList<>();

    /** 授信额度输入 */
    private List<FacilityInput> facilities = new ArrayList<>();

    /** 按抵质押品池编号分组的押品输入 */
    private Map<String, List<CollateralInput>> collateralsByPool = new HashMap<>();
}
