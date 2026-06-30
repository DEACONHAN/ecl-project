package com.bank.ecl.parameter.pd;

import com.bank.ecl.parameter.pd.dto.PdCurveBatchReq;
import com.bank.ecl.parameter.pd.dto.PdCurveVO;
import com.bank.ecl.parameter.pd.dto.PdMatrixVO;
import com.bank.ecl.parameter.pd.dto.PdScenarioCreateReq;
import com.bank.ecl.parameter.pd.dto.PdScenarioVO;

import java.util.List;

public interface PdService {

    // ======================== 情景管理 ========================

    List<PdScenarioVO> listScenarios(String schemeId);

    PdScenarioVO createScenario(PdScenarioCreateReq req);

    PdScenarioVO updateScenario(Long scenarioId, PdScenarioCreateReq req);

    void deleteScenario(Long scenarioId);

    // ======================== 曲线管理 ========================

    List<PdCurveVO> listCurves(String schemeId, String groupId, Long scenarioId);

    void batchUpdateCurves(PdCurveBatchReq req);

    PdMatrixVO getMatrix(String schemeId, String groupId);
}
