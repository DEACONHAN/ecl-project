package com.bank.ecl.parameter.riskgroup;

import com.bank.ecl.parameter.riskgroup.dto.RiskGroupCreateReq;
import com.bank.ecl.parameter.riskgroup.dto.RiskGroupVO;

import java.util.List;

public interface RiskGroupService {

    List<RiskGroupVO> listByScheme(String schemeId);

    RiskGroupVO getGroup(String schemeId, String groupId);

    RiskGroupVO createGroup(RiskGroupCreateReq req);

    RiskGroupVO updateGroup(String groupId, RiskGroupCreateReq req);

    void deleteGroup(String schemeId, String groupId);

    void updateDetails(String schemeId, String groupId, List<RiskGroupCreateReq.RiskGroupDetailReq> details);
}
