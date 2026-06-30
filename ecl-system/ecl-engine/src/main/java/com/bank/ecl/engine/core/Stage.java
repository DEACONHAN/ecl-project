package com.bank.ecl.engine.core;

/**
 * IFRS 9 三阶段枚举。
 * STAGE_1（正常类）→ STAGE_2（关注类）→ STAGE_3（损失类）。
 */
public enum Stage {
    STAGE_1("正常类"),
    STAGE_2("关注类"),
    STAGE_3("损失类");

    private final String label;

    Stage(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
