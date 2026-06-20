package com.bank.ecl.parameter.pd;

import com.bank.ecl.common.model.Result;
import com.bank.ecl.parameter.pd.dto.PdCurveBatchReq;
import com.bank.ecl.parameter.pd.dto.PdCurveVO;
import com.bank.ecl.parameter.pd.dto.PdMatrixVO;
import com.bank.ecl.parameter.pd.dto.PdScenarioCreateReq;
import com.bank.ecl.parameter.pd.dto.PdScenarioVO;
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
@RequestMapping("/api/v1/parameters/pd")
@RequiredArgsConstructor
public class PdController {

    private final PdService pdService;

    // ======================== 情景端点 ========================

    @GetMapping("/scenarios")
    public Result<List<PdScenarioVO>> listScenarios(@RequestParam String schemeId) {
        return Result.success(pdService.listScenarios(schemeId));
    }

    @PostMapping("/scenarios")
    public Result<PdScenarioVO> createScenario(@Valid @RequestBody PdScenarioCreateReq req) {
        return Result.success(pdService.createScenario(req));
    }

    @PutMapping("/scenarios/{scenarioId}")
    public Result<PdScenarioVO> updateScenario(@PathVariable Long scenarioId,
                                               @Valid @RequestBody PdScenarioCreateReq req) {
        return Result.success(pdService.updateScenario(scenarioId, req));
    }

    @DeleteMapping("/scenarios/{scenarioId}")
    public Result<Void> deleteScenario(@PathVariable Long scenarioId) {
        pdService.deleteScenario(scenarioId);
        return Result.success();
    }

    // ======================== 曲线端点 ========================

    @GetMapping("/curves")
    public Result<List<PdCurveVO>> listCurves(@RequestParam String schemeId,
                                              @RequestParam String groupId) {
        return Result.success(pdService.listCurves(schemeId, groupId));
    }

    @PostMapping("/curves/batch")
    public Result<Void> batchUpdateCurves(@Valid @RequestBody PdCurveBatchReq req) {
        pdService.batchUpdateCurves(req);
        return Result.success();
    }

    @GetMapping("/matrix")
    public Result<PdMatrixVO> getMatrix(@RequestParam String schemeId,
                                        @RequestParam String groupId) {
        return Result.success(pdService.getMatrix(schemeId, groupId));
    }
}
