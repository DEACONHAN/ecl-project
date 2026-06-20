package com.bank.ecl.parameter.ccf;

import com.bank.ecl.common.model.Result;
import com.bank.ecl.parameter.ccf.dto.CcfCurveBatchReq;
import com.bank.ecl.parameter.ccf.dto.CcfCurveCreateReq;
import com.bank.ecl.parameter.ccf.dto.CcfCurveVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/parameters/ccf")
@RequiredArgsConstructor
public class CcfController {

    private final CcfService ccfService;

    @GetMapping("/curves")
    public Result<List<CcfCurveVO>> listCurves(@RequestParam String schemeId,
                                               @RequestParam(required = false) String productType) {
        return Result.success(ccfService.listCurves(schemeId, productType));
    }

    @PostMapping("/curves")
    public Result<CcfCurveVO> createCurve(@Valid @RequestBody CcfCurveCreateReq req) {
        return Result.success(ccfService.createCurve(req));
    }

    @PutMapping("/curves/{curveId}")
    public Result<CcfCurveVO> updateCurve(@PathVariable Long curveId,
                                          @Valid @RequestBody CcfCurveCreateReq req) {
        return Result.success(ccfService.updateCurve(curveId, req));
    }

    @DeleteMapping("/curves/{curveId}")
    public Result<Void> deleteCurve(@PathVariable Long curveId) {
        ccfService.deleteCurve(curveId);
        return Result.success();
    }

    @PostMapping("/curves/batch")
    public Result<Void> batchUpdateCurves(@Valid @RequestBody CcfCurveBatchReq req) {
        ccfService.batchUpdateCurves(req.getSchemeId(), req.getCurves());
        return Result.success();
    }
}
