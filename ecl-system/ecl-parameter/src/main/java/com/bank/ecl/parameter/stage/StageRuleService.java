package com.bank.ecl.parameter.stage;

import com.bank.ecl.parameter.stage.dto.CrrDropRuleCreateReq;
import com.bank.ecl.parameter.stage.dto.CrrDropRuleVO;
import com.bank.ecl.parameter.stage.dto.StageRuleCreateReq;
import com.bank.ecl.parameter.stage.dto.StageRuleVO;

import java.util.List;

public interface StageRuleService {

    // ========== 阶段规则 ==========

    List<StageRuleVO> listStageRules(String schemeId, String groupId);

    StageRuleVO createStageRule(StageRuleCreateReq req);

    StageRuleVO updateStageRule(Long ruleId, StageRuleCreateReq req);

    void deleteStageRule(Long ruleId);

    // ========== CRR 评级下降规则 ==========

    List<CrrDropRuleVO> listCrrDropRules(String schemeId, String groupId);

    CrrDropRuleVO createCrrDropRule(CrrDropRuleCreateReq req);

    CrrDropRuleVO updateCrrDropRule(Long ruleId, CrrDropRuleCreateReq req);

    void deleteCrrDropRule(Long ruleId);
}
