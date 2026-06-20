package com.bank.ecl.parameter.lgd;

import com.bank.ecl.parameter.lgd.dto.LgdCollateralDiscountCreateReq;
import com.bank.ecl.parameter.lgd.dto.LgdCollateralDiscountVO;
import com.bank.ecl.parameter.lgd.dto.LgdCurveCreateReq;
import com.bank.ecl.parameter.lgd.dto.LgdCurveVO;
import com.bank.ecl.parameter.lgd.dto.LgdDepreciationCreateReq;
import com.bank.ecl.parameter.lgd.dto.LgdDepreciationVO;

import java.util.List;

public interface LgdService {

    // ======================== 基准曲线 ========================

    List<LgdCurveVO> listCurves(String schemeId, String groupId);

    void batchUpdateCurves(String schemeId, String groupId, List<LgdCurveCreateReq> curves);

    // ======================== 押品折扣率 ========================

    List<LgdCollateralDiscountVO> listDiscounts(String schemeId);

    void batchUpdateDiscounts(String schemeId, List<LgdCollateralDiscountCreateReq> discounts);

    // ======================== 押品折旧率 ========================

    List<LgdDepreciationVO> listDepreciations(String schemeId, String collateralType);

    void batchUpdateDepreciations(String schemeId, String collateralType, List<LgdDepreciationCreateReq> items);
}
