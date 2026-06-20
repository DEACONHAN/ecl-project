package com.bank.ecl.parameter.ccf;

import com.bank.ecl.parameter.ccf.dto.CcfCurveCreateReq;
import com.bank.ecl.parameter.ccf.dto.CcfCurveVO;

import java.util.List;

public interface CcfService {

    List<CcfCurveVO> listCurves(String schemeId, String productType);

    CcfCurveVO createCurve(CcfCurveCreateReq req);

    CcfCurveVO updateCurve(Long curveId, CcfCurveCreateReq req);

    void deleteCurve(Long curveId);

    void batchUpdateCurves(String schemeId, List<CcfCurveCreateReq> curves);
}
