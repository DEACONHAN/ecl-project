package com.bank.ecl.parameter.riskgroup;

import com.bank.ecl.common.model.Result;
import com.bank.ecl.parameter.riskgroup.dto.RiskGroupCreateReq;
import com.bank.ecl.parameter.riskgroup.dto.RiskGroupCreateReq.RiskGroupDetailReq;
import com.bank.ecl.parameter.riskgroup.dto.RiskGroupVO;
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
@RequestMapping("/api/v1/parameters/risk-groups")
@RequiredArgsConstructor
public class RiskGroupController {

    private final RiskGroupService riskGroupService;

    @GetMapping
    public Result<List<RiskGroupVO>> listByScheme(@RequestParam String schemeId) {
        return Result.success(riskGroupService.listByScheme(schemeId));
    }

    @GetMapping("/{groupId}")
    public Result<RiskGroupVO> getGroup(@RequestParam String schemeId, @PathVariable String groupId) {
        return Result.success(riskGroupService.getGroup(schemeId, groupId));
    }

    @PostMapping
    public Result<RiskGroupVO> createGroup(@Valid @RequestBody RiskGroupCreateReq req) {
        return Result.success(riskGroupService.createGroup(req));
    }

    @PutMapping("/{groupId}")
    public Result<RiskGroupVO> updateGroup(@PathVariable String groupId,
                                           @Valid @RequestBody RiskGroupCreateReq req) {
        return Result.success(riskGroupService.updateGroup(groupId, req));
    }

    @DeleteMapping("/{groupId}")
    public Result<Void> deleteGroup(@RequestParam String schemeId, @PathVariable String groupId) {
        riskGroupService.deleteGroup(schemeId, groupId);
        return Result.success();
    }

    @PutMapping("/{groupId}/details")
    public Result<Void> updateDetails(@RequestParam String schemeId,
                                      @PathVariable String groupId,
                                      @RequestBody List<RiskGroupDetailReq> details) {
        riskGroupService.updateDetails(schemeId, groupId, details);
        return Result.success();
    }
}
