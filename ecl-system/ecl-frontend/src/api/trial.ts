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

export interface AssetInputReq {
  assetId: string;
  businessLine?: string;
  customerType?: string;
  productType?: string;
  industryCode?: string;
  regionCode?: string;
  collateralType?: string;
  lastStage?: string;
  overdueDays?: number;
  crrRating?: string;
  fiveCategory?: string;
  defaultFlag?: boolean;
  mediaSentiment?: string;
  ratingDropLevels?: number;
  ratingCode?: string;
  maturityDate?: string;
  outstandingBalance?: number;
  accruedInterest?: number;
  totalLimit?: number;
  commitmentType?: string;
  commitmentDays?: number;
}

export interface AssetResult {
  assetId: string;
  groupId?: string;
  groupLabel: string;
  productType: string;
  ratingCode: string;
  stage: string;
  ead: string;
  lgd: string;
  pd12m: string;
  pdLifetime: string;
  eclValue: string;
  overlayAmount: string;
  eclFinal: string;
  exceptionSummary?: string;
  steps: TrialStepVO[];
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
  pd12m: string;
  pdLifetime: string;
  eclValue: string;
  overlayAmount: string;
  eclFinal: string;
  exceptionSummary?: string;
  steps: TrialStepVO[];

  /** 多借据结果 */
  assetResults?: AssetResult[];
}

export interface TrialCalculationReq {
  schemeId: string;
  assetId: string;
  calcDate?: string;
  scope: 'SINGLE' | 'BATCH';

  // 6.1 风险分组入参
  businessLine?: string;
  customerType?: string;
  productType?: string;
  industryCode?: string;
  regionCode?: string;
  collateralType?: string;

  // 6.2 阶段划分入参
  lastStage?: string;
  overdueDays?: number;
  crrRating?: string;
  fiveCategory?: string;
  defaultFlag?: boolean;
  mediaSentiment?: string;
  ratingDropLevels?: number;

  // 6.3 PD 入参
  ratingCode?: string;
  maturityDate?: string;

  // 6.4 EAD 入参
  outstandingBalance?: number;
  accruedInterest?: number;
  totalLimit?: number;
  commitmentType?: string;
  commitmentDays?: number;

  /** 多借据模式 */
  assets?: AssetInputReq[];
}

export const trialApi = {
  runTrial: (data: TrialCalculationReq) =>
    request.post<TrialCalculationResp>('/v1/ecl/calculate/trial', data),
};
