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

// 6.1a 借据信息表行
export interface TrialLoanRowReq {
  id: string;
  facilityCd?: string;
  customerNo?: string;
  customerName?: string;
  industryCn?: string;
  segment?: string;
  productType?: string;
  currencyCd?: string;
  amtFinancedCny?: number;
  loanBalCny?: number;
  intAccruedCny?: number;
  interestRate?: number;
  loanStartDt?: string;
  loanMaturityDt?: string;
  overdueDays?: number;
  isNpl?: string;
  guaranteeType?: string;
  normalConsecutiveDays?: number;
  otherRiskInfo?: string;
  businessType?: string;
  overduePrincipal?: number;
  overdueInterest?: number;
}

// 授信额度表行
export interface TrialFacilityRowReq {
  id: string;
  customerNo?: string;
  customerName?: string;
  facilityType?: string;
  currencyCd?: string;
  totalLimitCny?: number;
  usedLimitCny?: number;
  availableLimitCny?: number;
  effectiveDt?: string;
  expiryDt?: string;
  collateralPoolId?: string;
  riskGrade?: string;
}

// 还款计划表行
export interface TrialRepaymentRowReq {
  id: string;
  loanId?: string;
  dueDt?: string;
  duePrincipal?: number;
  dueInterest?: number;
  repaidPrincipal?: number;
  repaidInterest?: number;
  repaymentType?: string;
}

// 抵质押品表行
export interface TrialCollateralRowReq {
  id: string;
  collateralPoolId?: string;
  collateralType?: string;
  collateralValueCny?: number;
  coverageRatio?: number;
  valuationDt?: string;
}

// 评级信息表行
export interface TrialRatingRowReq {
  id: string;
  customerNo?: string;
  ratingCode?: string;
  ratingDate?: string;
}

// 历史阶段表行
export interface TrialHistoricalStageRowReq {
  id: string;
  loanId?: string;
  stage?: string;
  stageDate?: string;
  reasonCode?: string;
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

  // 源表数据 (Task 13)
  loans?: TrialLoanRowReq[];
  facilities?: TrialFacilityRowReq[];
  repaymentSchedules?: TrialRepaymentRowReq[];
  collaterals?: TrialCollateralRowReq[];
  ratings?: TrialRatingRowReq[];
  historicalStages?: TrialHistoricalStageRowReq[];
}

export const trialApi = {
  runTrial: (data: TrialCalculationReq) =>
    request.post<TrialCalculationResp>('/v1/ecl/calculate/trial', data),
};
