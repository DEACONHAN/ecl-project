import request from './request';

export interface TrialMetricVO {
  label: string;
  value: string;
  note?: string;
}

export interface TrialScenarioRowVO {
  scenario: string;
  weight: string;
  pd: string;
  weightedPd: string;
  highlight?: boolean;
}

export interface TrialStepVO {
  key: string;
  title: string;
  summary: string;
  note?: string;
  metrics?: TrialMetricVO[];
  scenarioRows?: TrialScenarioRowVO[];
}

export interface TrialCalculationResp {
  jobId: string;
  status: string;
  durationMs: number;
  assetId: string;
  groupId?: string;
  groupLabel: string;
  productType: string;
  ratingCode: string;
  stage: string;
  ead: string;
  lgd: string;
  eclFinal: string;
  steps: TrialStepVO[];
}

export interface TrialCalculationReq {
  schemeId: string;
  assetId: string;
  calcDate?: string;
  scope: 'SINGLE' | 'BATCH';
}

export const trialApi = {
  runTrial: (data: TrialCalculationReq) =>
    request.post<TrialCalculationResp>('/v1/ecl/calculate/trial', data),
};
