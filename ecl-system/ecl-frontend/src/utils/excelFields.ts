export interface SheetField {
  key: string;        // DTO property name, e.g. 'id', 'customerNo'
  label: string;      // Column header in Excel, e.g. '借据编号'
  type: 'string' | 'number' | 'date';  // For parsing coercion
  required?: boolean; // If true, row skipped when empty
}

export type SheetKey = 'loans' | 'facilities' | 'repaymentSchedules' | 'collaterals' | 'ratings' | 'historicalStages';

export interface SheetConfig {
  key: SheetKey;
  title: string;       // Excel sheet name
  fields: SheetField[];
}

export const SHEET_CONFIGS: SheetConfig[] = [
  {
    key: 'loans',
    title: '借据信息表',
    fields: [
      { key: 'reportDt', label: '数据日期', type: 'date' },
      { key: 'id', label: '借据编号', type: 'string', required: true },
      { key: 'facilityCd', label: '额度编号', type: 'string' },
      { key: 'customerNo', label: '客户号', type: 'string' },
      { key: 'customerName', label: '客户名称', type: 'string' },
      { key: 'industryCn', label: '行业', type: 'string' },
      { key: 'segment', label: '客户规模', type: 'string' },
      { key: 'productType', label: '产品类型', type: 'string' },
      { key: 'currencyCd', label: '币种', type: 'string' },
      { key: 'amtFinancedCny', label: '融资本金(CNY)', type: 'number' },
      { key: 'loanBalCny', label: '贷款余额(CNY)', type: 'number' },
      { key: 'intAccruedCny', label: '应计利息(CNY)', type: 'number' },
      { key: 'interestRate', label: '利率(%)', type: 'number' },
      { key: 'loanStartDt', label: '贷款起始日', type: 'date' },
      { key: 'loanMaturityDt', label: '贷款到期日', type: 'date' },
      { key: 'overdueDays', label: '逾期天数', type: 'number' },
      { key: 'loanClassifCd', label: '贷款分类', type: 'string' },
      { key: 'isNpl', label: '是否不良', type: 'string' },
      { key: 'guaranteeType', label: '担保方式', type: 'string' },
      { key: 'normalConsecutiveDays', label: '正常连续天数', type: 'number' },
      { key: 'otherRiskInfo', label: '其他风险信息', type: 'string' },
      { key: 'businessType', label: '业务类型', type: 'string' },
      { key: 'overduePrincipal', label: '逾期本金', type: 'number' },
      { key: 'overdueInterest', label: '逾期利息', type: 'number' },
    ],
  },
  {
    key: 'facilities',
    title: '授信额度表',
    fields: [
      { key: 'facilityCd', label: '额度编号', type: 'string', required: true },
      { key: 'cifNo', label: '客户号', type: 'string' },
      { key: 'customerName', label: '客户名称', type: 'string' },
      { key: 'limitCurrencyCd', label: '额度币种', type: 'string' },
      { key: 'limitAmtCny', label: '额度金额(CNY)', type: 'number' },
      { key: 'usedLimit', label: '已用额度', type: 'number' },
      { key: 'limitAvailAmtCny', label: '可用额度(CNY)', type: 'number' },
      { key: 'undrawnAmtCny', label: '未提取金额(CNY)', type: 'number' },
      { key: 'isRevolving', label: '是否循环', type: 'string' },
      { key: 'facilityStartDate', label: '额度起始日', type: 'date' },
      { key: 'facilityMaturityDate', label: '额度到期日', type: 'date' },
      { key: 'collateralPoolId', label: '押品池编号', type: 'string' },
    ],
  },
  {
    key: 'repaymentSchedules',
    title: '还款计划表',
    fields: [
      { key: 'loanReceiptNo', label: '借据编号', type: 'string', required: true },
      { key: 'totalPeriods', label: '总期数', type: 'number' },
      { key: 'periodNo', label: '当前期数', type: 'number' },
      { key: 'dueDate', label: '到期日', type: 'date' },
      { key: 'duePrincipal', label: '应还本金', type: 'number' },
      { key: 'dueInterest', label: '应还利息', type: 'number' },
    ],
  },
  {
    key: 'collaterals',
    title: '抵质押品表',
    fields: [
      { key: 'collateralCode', label: '押品编号', type: 'string', required: true },
      { key: 'collateralPoolCode', label: '押品池编号', type: 'string' },
      { key: 'cifNo', label: '客户号', type: 'string' },
      { key: 'customerName', label: '客户名称', type: 'string' },
      { key: 'facilityUniqueCode', label: '额度唯一码', type: 'string' },
      { key: 'collateralCategory', label: '押品大类', type: 'string' },
      { key: 'collateralType', label: '押品类型', type: 'string' },
      { key: 'collateralStatus', label: '押品状态', type: 'string' },
      { key: 'collateralCurrency', label: '押品币种', type: 'string' },
      { key: 'collateralValue', label: '押品价值', type: 'number' },
      { key: 'reportCurrency', label: '报表币种', type: 'string' },
      { key: 'appraisalEffectiveDate', label: '评估生效日', type: 'date' },
      { key: 'appraisalValue', label: '评估价值', type: 'number' },
      { key: 'guaranteeMethod', label: '担保方式', type: 'string' },
    ],
  },
  {
    key: 'ratings',
    title: '评级信息表',
    fields: [
      { key: 'cifNo', label: '客户号', type: 'string', required: true },
      { key: 'customerName', label: '客户名称', type: 'string' },
      { key: 'crrIntLastYear', label: '上年内部评级', type: 'string' },
      { key: 'crrIntThisYear', label: '本年内部评级', type: 'string' },
      { key: 'crrFinal', label: '最终内部评级', type: 'string' },
      { key: 'extRatingCoLastYear', label: '上年外部评级机构', type: 'string' },
      { key: 'extRatingLastYear', label: '上年外部评级', type: 'string' },
      { key: 'extRatingCoThisYear', label: '本年外部评级机构', type: 'string' },
      { key: 'extRatingThisYear', label: '本年外部评级', type: 'string' },
    ],
  },
  {
    key: 'historicalStages',
    title: '历史阶段表',
    fields: [
      { key: 'assetId', label: '借据编号', type: 'string', required: true },
      { key: 'calcDate', label: '计算日期', type: 'date' },
      { key: 'stageResult', label: '阶段结果', type: 'string' },
    ],
  },
];
