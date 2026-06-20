package com.bank.ecl.parameter.overlay;

import com.bank.ecl.parameter.overlay.dto.OverlayMatchTestReq;
import com.bank.ecl.parameter.overlay.dto.OverlayMatchTestResp;
import com.bank.ecl.parameter.overlay.dto.OverlayRuleCreateReq;
import com.bank.ecl.parameter.overlay.dto.OverlayRuleVO;

import java.util.List;

public interface OverlayService {

    List<OverlayRuleVO> listRules(String schemeId, String groupId);

    OverlayRuleVO createRule(OverlayRuleCreateReq req);

    OverlayRuleVO updateRule(Long ruleId, OverlayRuleCreateReq req);

    void deleteRule(Long ruleId);

    OverlayMatchTestResp testMatch(OverlayMatchTestReq req);
}
