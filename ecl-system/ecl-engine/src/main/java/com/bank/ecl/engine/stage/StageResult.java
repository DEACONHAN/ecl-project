package com.bank.ecl.engine.stage;

import com.bank.ecl.engine.core.Stage;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 阶段判定结果 —— 6.2 引擎输出。
 */
@Data
@AllArgsConstructor
public class StageResult {

    /** 判定结果阶段 */
    private Stage stage;

    /** 触发规则类型（如"逾期天数"、"五级分类"、"评级下降"、"ROLLBACK_BLOCKED"） */
    private String triggerType;

    /** true=异常（走兜底或被回跳阻断） */
    private boolean exceptionFlag;
}
