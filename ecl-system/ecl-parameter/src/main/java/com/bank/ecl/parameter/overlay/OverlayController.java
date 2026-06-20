package com.bank.ecl.parameter.overlay;

import com.bank.ecl.common.model.Result;
import com.bank.ecl.parameter.overlay.dto.OverlayMatchTestReq;
import com.bank.ecl.parameter.overlay.dto.OverlayMatchTestResp;
import com.bank.ecl.parameter.overlay.dto.OverlayRuleCreateReq;
import com.bank.ecl.parameter.overlay.dto.OverlayRuleVO;
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
@RequestMapping("/api/v1/parameters/overlay/rules")
@RequiredArgsConstructor
public class OverlayController {

    private final OverlayService overlayService;

    @GetMapping("")
    public Result<List<OverlayRuleVO>> listRules(@RequestParam String schemeId,
                                                 @RequestParam String groupId) {
        return Result.success(overlayService.listRules(schemeId, groupId));
    }

    @PostMapping("")
    public Result<OverlayRuleVO> createRule(@Valid @RequestBody OverlayRuleCreateReq req) {
        return Result.success(overlayService.createRule(req));
    }

    @PutMapping("/{ruleId}")
    public Result<OverlayRuleVO> updateRule(@PathVariable Long ruleId,
                                            @Valid @RequestBody OverlayRuleCreateReq req) {
        return Result.success(overlayService.updateRule(ruleId, req));
    }

    @DeleteMapping("/{ruleId}")
    public Result<Void> deleteRule(@PathVariable Long ruleId) {
        overlayService.deleteRule(ruleId);
        return Result.success();
    }

    @PostMapping("/test-match")
    public Result<OverlayMatchTestResp> testMatch(@Valid @RequestBody OverlayMatchTestReq req) {
        return Result.success(overlayService.testMatch(req));
    }
}
