package com.bank.ecl.api;

import com.bank.ecl.calculation.trial.TrialCalculationService;
import com.bank.ecl.calculation.trial.dto.TrialCalculationReq;
import com.bank.ecl.calculation.trial.dto.TrialCalculationResp;
import com.bank.ecl.common.model.Result;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ecl/calculate")
@RequiredArgsConstructor
public class TrialCalculationController {

    private final TrialCalculationService trialCalculationService;

    @PostMapping("/trial")
    public Result<TrialCalculationResp> runTrial(@Valid @RequestBody TrialCalculationReq req) {
        return Result.success(trialCalculationService.runTrial(req));
    }
}
