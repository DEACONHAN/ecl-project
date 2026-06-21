package com.bank.ecl.parameter.stage;

import com.bank.ecl.common.model.Result;
import com.bank.ecl.parameter.stage.dto.CrrDropRuleCreateReq;
import com.bank.ecl.parameter.stage.dto.CrrDropRuleVO;
import com.bank.ecl.parameter.stage.dto.StageRuleCreateReq;
import com.bank.ecl.parameter.stage.dto.StageRuleVO;
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
import java.util.Map;

@RestController
@RequestMapping("/api/v1/parameters/stage-rules")
@RequiredArgsConstructor
public class StageRuleController {

    private final StageRuleService stageRuleService;

    // ========== 阶段规则 CRUD ==========

    @GetMapping
    public Result<List<StageRuleVO>> listStageRules(@RequestParam String schemeId,
                                                     @RequestParam String groupId) {
        return Result.success(stageRuleService.listStageRules(schemeId, groupId));
    }

    @GetMapping("/by-group")
    public Result<Map<String, Object>> getByGroup(@RequestParam String schemeId,
                                                  @RequestParam String groupId) {
        return Result.success(Map.of(
                "stageRules", stageRuleService.listStageRules(schemeId, groupId),
                "ratingRules", stageRuleService.listCrrDropRules(schemeId, groupId)
        ));
    }

    @PostMapping
    public Result<StageRuleVO> createStageRule(@Valid @RequestBody StageRuleCreateReq req) {
        return Result.success(stageRuleService.createStageRule(req));
    }

    @PutMapping("/{ruleId}")
    public Result<StageRuleVO> updateStageRule(@PathVariable Long ruleId,
                                               @Valid @RequestBody StageRuleCreateReq req) {
        return Result.success(stageRuleService.updateStageRule(ruleId, req));
    }

    @DeleteMapping("/{ruleId}")
    public Result<Void> deleteStageRule(@PathVariable Long ruleId) {
        stageRuleService.deleteStageRule(ruleId);
        return Result.success();
    }

    // ========== CRR 评级下降规则 CRUD ==========

    @GetMapping("/crr-drop")
    public Result<List<CrrDropRuleVO>> listCrrDropRules(@RequestParam String schemeId,
                                                          @RequestParam String groupId) {
        return Result.success(stageRuleService.listCrrDropRules(schemeId, groupId));
    }

    @PostMapping("/crr-drop")
    public Result<CrrDropRuleVO> createCrrDropRule(@Valid @RequestBody CrrDropRuleCreateReq req) {
        return Result.success(stageRuleService.createCrrDropRule(req));
    }

    @PutMapping("/crr-drop/{ruleId}")
    public Result<CrrDropRuleVO> updateCrrDropRule(@PathVariable Long ruleId,
                                                    @Valid @RequestBody CrrDropRuleCreateReq req) {
        return Result.success(stageRuleService.updateCrrDropRule(ruleId, req));
    }

    @DeleteMapping("/crr-drop/{ruleId}")
    public Result<Void> deleteCrrDropRule(@PathVariable Long ruleId) {
        stageRuleService.deleteCrrDropRule(ruleId);
        return Result.success();
    }
}
