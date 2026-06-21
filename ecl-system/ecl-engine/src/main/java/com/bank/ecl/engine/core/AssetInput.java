package com.bank.ecl.engine.core;

import com.bank.ecl.engine.stage.StageResult;
import lombok.Data;

/**
 * 借据输入及引擎逐层填充的中间结果。
 * 各引擎在 execute() 中读取/写入对应字段。
 */
@Data
public class AssetInput {

    // ========== 入参字段（上游数据层填充）==========

    /** 借据 ID */
    private String assetId;

    /** 所属客户 ID */
    private String customerId;

    /** 业务条线 */
    private String businessLine;

    /** 客户类型 */
    private String customerType;

    /** 产品类型 */
    private String productType;

    /** 行业代码 */
    private String industryCode;

    /** 地区代码 */
    private String regionCode;

    /** 担保类型 */
    private String collateralType;

    // ========== 6.1 风险分组引擎输出 ==========

    /** 匹配到的分组 ID */
    private String groupId;

    /** 分组名称 */
    private String groupName;

    /** "Y" = 异常（命中兜底分组 GRP_DEFAULT） */
    private String groupException;

    // ========== 6.2 阶段划分引擎入参（上游数据层填充）==========

    /** 上期计算的阶段（首次计算时为 null，引擎内视为 STAGE_1） */
    private Stage lastStage;

    /** 逾期天数 */
    private Integer overdueDays;

    /** CRR/国际评级（如 CRR1~CRR8） */
    private String crrRating;

    /** 五级分类（正常/关注/次级/可疑/损失） */
    private String fiveCategory;

    /** 是否违约 */
    private Boolean defaultFlag;

    /** 舆情严重程度（轻度/中度/重度） */
    private String mediaSentiment;

    /** 评级下降级数（上游预计算） */
    private Integer ratingDropLevels;

    // ========== 6.2 阶段划分引擎输出 ==========

    /** 阶段判定结果 */
    private StageResult stageResult;

    // ========== 预留字段（后续引擎使用）==========
    // pdDetails, totalEad, lgdValue, eclValue ...
}
