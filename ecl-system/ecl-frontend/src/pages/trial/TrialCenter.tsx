import React, { useEffect, useMemo, useState } from 'react';
import { Button, Collapse, DatePicker, Input, InputNumber, Radio, Select, Space, Table, Tag, message } from 'antd';
import { ExperimentOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader, Panel } from '../../components';
import { schemeApi, type SchemeVO } from '../../api/scheme';
import {
  trialApi, type TrialCalculationResp, type TrialStepVO, type AssetResult,
  type TrialLoanRowReq, type TrialFacilityRowReq, type TrialRepaymentRowReq,
  type TrialCollateralRowReq, type TrialRatingRowReq, type TrialHistoricalStageRowReq,
} from '../../api/trial';
import './TrialCenter.css';

const today = dayjs();
const BUSINESS_LINES = ['非零售', '零售'];
const CUSTOMER_TYPES = ['对公', '非银金融', '同业', '债券', '小微', '个人'];
const PRODUCT_TYPES = ['公司贷款', '银团贷款', '汽车贷款', '个经营贷', '个消费贷'];
const COLLATERAL_TYPES = ['房产', '土地', '存单', '保证金', '信用', '保证'];
const RATING_CODES = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C'];
const GUARANTEE_TYPES = ['信用', '保证', '抵押', '质押', '保证金', '存单'];
const FACILITY_TYPES = ['循环', '非循环', '一次性'];
const STAGE_OPTIONS = ['STAGE_1', 'STAGE_2', 'STAGE_3'];
const SEGMENT_OPTIONS = ['大型', '中型', '小型', '微型'];
const INDUSTRY_OPTIONS = ['制造业', '金融业', '批发零售', '房地产', '建筑', '交通运输', '信息技术', '农林牧渔', '其他'];
const REPAYMENT_TYPES = ['正常', '提前', '逾期', '展期'];

// ---------------------------------------------------------------------------
// Helpers: default row factories (called during render / preset)
// ---------------------------------------------------------------------------
const makeDefaultLoan = (): TrialLoanRowReq => ({
  id: `LN_${String(Date.now()).slice(-6)}`,
  facilityCd: `FAC_${String(Date.now()).slice(-6)}`,
  customerNo: 'CUST_001',
  customerName: '试算企业',
  industryCn: '制造业',
  segment: '大型',
  productType: '公司贷款',
  currencyCd: 'CNY',
  amtFinancedCny: 5000000,
  loanBalCny: 5000000,
  intAccruedCny: 10000,
  interestRate: 4.5,
  loanStartDt: today.format('YYYY-MM-DD'),
  loanMaturityDt: today.add(2, 'year').format('YYYY-MM-DD'),
  overdueDays: 0,
  isNpl: 'N',
  guaranteeType: '信用',
  normalConsecutiveDays: 180,
  otherRiskInfo: '',
  businessType: '流动资金贷款',
  overduePrincipal: 0,
  overdueInterest: 0,
});

const makeDefaultFacility = (): TrialFacilityRowReq => ({
  id: `FAC_${String(Date.now()).slice(-6)}`,
  customerNo: 'CUST_001',
  customerName: '试算企业',
  facilityType: '循环',
  currencyCd: 'CNY',
  totalLimitCny: 8000000,
  usedLimitCny: 5000000,
  availableLimitCny: 3000000,
  effectiveDt: today.format('YYYY-MM-DD'),
  expiryDt: today.add(2, 'year').format('YYYY-MM-DD'),
  collateralPoolId: 'POOL_001',
  riskGrade: 'AA',
});

const makeDefaultCollateral = (): TrialCollateralRowReq => ({
  id: `COL_${String(Date.now()).slice(-6)}`,
  collateralPoolId: 'POOL_001',
  collateralType: '房产',
  collateralValueCny: 10000000,
  coverageRatio: 200,
  valuationDt: today.format('YYYY-MM-DD'),
});

const makeDefaultRating = (): TrialRatingRowReq => ({
  id: `RAT_${String(Date.now()).slice(-6)}`,
  customerNo: 'CUST_001',
  ratingCode: 'AAA',
  ratingDate: today.format('YYYY-MM-DD'),
});

const makeDefaultRepayment = (loanId: string): TrialRepaymentRowReq => ({
  id: `REP_${String(Date.now()).slice(-6)}`,
  loanId,
  dueDt: today.add(1, 'year').format('YYYY-MM-DD'),
  duePrincipal: 1000000,
  dueInterest: 50000,
  repaidPrincipal: 0,
  repaidInterest: 0,
  repaymentType: '正常',
});

const makeDefaultHistoricalStage = (loanId: string): TrialHistoricalStageRowReq => ({
  id: `HST_${String(Date.now()).slice(-6)}`,
  loanId,
  stage: 'STAGE_1',
  stageDate: today.format('YYYY-MM-DD'),
  reasonCode: '新增',
});

// ---------------------------------------------------------------------------
// Form builder helpers
// ---------------------------------------------------------------------------
const field = (label: string, child: React.ReactNode) => (
  <div className="trial-field"><label>{label}</label>{child}</div>
);

const select = (value: string | undefined, onChange: (v: string) => void, options: string[], placeholder?: string) => (
  <Select style={{ width: 140 }} value={value || undefined} onChange={onChange}
    placeholder={placeholder || '不限'} allowClear options={options.map((o) => ({ label: o, value: o }))} />
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const TrialCenter: React.FC = () => {
  const [schemes, setSchemes] = useState<SchemeVO[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');
  const [scope, setScope] = useState<'SINGLE' | 'BATCH'>('SINGLE');
  const [calcDate, setCalcDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrialCalculationResp | null>(null);

  // ---- Source table state ------------------------------------------------
  const [loans, setLoans] = useState<TrialLoanRowReq[]>([makeDefaultLoan()]);
  const [facilities, setFacilities] = useState<TrialFacilityRowReq[]>([makeDefaultFacility()]);
  const [repaymentSchedules, setRepaymentSchedules] = useState<TrialRepaymentRowReq[]>([]);
  const [collaterals, setCollaterals] = useState<TrialCollateralRowReq[]>([makeDefaultCollateral()]);
  const [ratings, setRatings] = useState<TrialRatingRowReq[]>([makeDefaultRating()]);
  const [historicalStages, setHistoricalStages] = useState<TrialHistoricalStageRowReq[]>([]);

  // ---- Load schemes ------------------------------------------------------
  useEffect(() => {
    schemeApi.list().then((res) => {
      const list = (res.data as any)?.data || res.data || [];
      setSchemes(list);
      const preferred = list.find((s: SchemeVO) => s.status === 'DRAFT') || list[0];
      if (preferred) setSelectedSchemeId(preferred.schemeId);
    }).catch(() => message.error('方案列表加载失败'));
  }, []);

  const schemeOptions = useMemo(() => schemes.map((s) => ({
    label: `${s.schemeCode} · ${s.schemeName} (${s.status})`,
    value: s.schemeId,
  })), [schemes]);

  // ---- Update helpers per table -------------------------------------------
  const updateLoan = (idx: number, patch: Partial<TrialLoanRowReq>) =>
    setLoans((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const updateFacility = (idx: number, patch: Partial<TrialFacilityRowReq>) =>
    setFacilities((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const updateRepayment = (idx: number, patch: Partial<TrialRepaymentRowReq>) =>
    setRepaymentSchedules((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const updateCollateral = (idx: number, patch: Partial<TrialCollateralRowReq>) =>
    setCollaterals((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const updateRating = (idx: number, patch: Partial<TrialRatingRowReq>) =>
    setRatings((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const updateHistoricalStage = (idx: number, patch: Partial<TrialHistoricalStageRowReq>) =>
    setHistoricalStages((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  // ---- Add / Remove helpers -----------------------------------------------
  const addLoan = () => setLoans((prev) => [...prev, makeDefaultLoan()]);
  const removeLoan = (idx: number) => setLoans((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const addFacility = () => setFacilities((prev) => [...prev, makeDefaultFacility()]);
  const removeFacility = (idx: number) => setFacilities((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const addRepayment = () => {
    const loanId = loans[0]?.id || '';
    setRepaymentSchedules((prev) => [...prev, makeDefaultRepayment(loanId)]);
  };
  const removeRepayment = (idx: number) => setRepaymentSchedules((prev) => prev.filter((_, i) => i !== idx));

  const addCollateral = () => setCollaterals((prev) => [...prev, makeDefaultCollateral()]);
  const removeCollateral = (idx: number) => setCollaterals((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const addRating = () => setRatings((prev) => [...prev, makeDefaultRating()]);
  const removeRating = (idx: number) => setRatings((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const addHistoricalStage = () => {
    const loanId = loans[0]?.id || '';
    setHistoricalStages((prev) => [...prev, makeDefaultHistoricalStage(loanId)]);
  };
  const removeHistoricalStage = (idx: number) => setHistoricalStages((prev) => prev.filter((_, i) => i !== idx));

  // ---- Presets -----------------------------------------------------------
  const applyPreset = (preset: string) => {
    const d = today;
    switch (preset) {
      case 'corp_dual': {
        setLoans([
          { ...makeDefaultLoan(), id: 'LN_001', facilityCd: 'FAC_001', customerNo: 'CUST_001', customerName: '测试企业A', industryCn: '制造业', segment: '大型', productType: '公司贷款', amtFinancedCny: 5000000, loanBalCny: 5000000, intAccruedCny: 10000, interestRate: 4.5, loanStartDt: d.subtract(1, 'year').format('YYYY-MM-DD'), loanMaturityDt: d.add(1, 'year').format('YYYY-MM-DD'), overdueDays: 10, guaranteeType: '抵押', businessType: '流动资金贷款' },
          { ...makeDefaultLoan(), id: 'LN_002', facilityCd: 'FAC_002', customerNo: 'CUST_002', customerName: '测试企业B', industryCn: '制造业', segment: '中型', productType: '公司贷款', amtFinancedCny: 3000000, loanBalCny: 3000000, intAccruedCny: 15000, interestRate: 5.0, loanStartDt: d.subtract(6, 'month').format('YYYY-MM-DD'), loanMaturityDt: d.add(2, 'year').format('YYYY-MM-DD'), overdueDays: 45, guaranteeType: '信用', businessType: '流动资金贷款' },
        ]);
        setFacilities([
          { ...makeDefaultFacility(), id: 'FAC_001', customerNo: 'CUST_001', customerName: '测试企业A', totalLimitCny: 8000000, usedLimitCny: 5000000, availableLimitCny: 3000000, collateralPoolId: 'POOL_001', riskGrade: 'AA' },
          { ...makeDefaultFacility(), id: 'FAC_002', customerNo: 'CUST_002', customerName: '测试企业B', totalLimitCny: 5000000, usedLimitCny: 3000000, availableLimitCny: 2000000, collateralPoolId: 'POOL_002', riskGrade: 'BBB' },
        ]);
        setCollaterals([
          { ...makeDefaultCollateral(), id: 'COL_001', collateralPoolId: 'POOL_001', collateralType: '房产', collateralValueCny: 10000000, coverageRatio: 200 },
          { ...makeDefaultCollateral(), id: 'COL_002', collateralPoolId: 'POOL_002', collateralType: '信用', collateralValueCny: 0, coverageRatio: 0 },
        ]);
        setRatings([
          { ...makeDefaultRating(), id: 'RAT_001', customerNo: 'CUST_001', ratingCode: 'AAA', ratingDate: d.subtract(3, 'month').format('YYYY-MM-DD') },
          { ...makeDefaultRating(), id: 'RAT_002', customerNo: 'CUST_002', ratingCode: 'BBB', ratingDate: d.subtract(6, 'month').format('YYYY-MM-DD') },
        ]);
        setRepaymentSchedules([
          { ...makeDefaultRepayment('LN_001'), id: 'REP_001', loanId: 'LN_001', dueDt: d.add(6, 'month').format('YYYY-MM-DD'), duePrincipal: 2500000, dueInterest: 50000 },
          { ...makeDefaultRepayment('LN_001'), id: 'REP_002', loanId: 'LN_001', dueDt: d.add(12, 'month').format('YYYY-MM-DD'), duePrincipal: 2500000, dueInterest: 50000 },
        ]);
        setHistoricalStages([]);
        break;
      }
      case 'retail_multi': {
        setLoans([
          { ...makeDefaultLoan(), id: 'LN_003', facilityCd: 'FAC_003', customerNo: 'CUST_003', customerName: '测试个人A', industryCn: '其他', segment: '个人', productType: '个消费贷', amtFinancedCny: 150000, loanBalCny: 150000, intAccruedCny: 0, interestRate: 6.0, loanStartDt: d.subtract(1, 'year').format('YYYY-MM-DD'), loanMaturityDt: d.add(1, 'year').format('YYYY-MM-DD'), overdueDays: 0, guaranteeType: '信用', businessType: '消费贷' },
          { ...makeDefaultLoan(), id: 'LN_004', facilityCd: 'FAC_004', customerNo: 'CUST_004', customerName: '测试个人B', industryCn: '其他', segment: '个人', productType: '个消费贷', amtFinancedCny: 80000, loanBalCny: 80000, intAccruedCny: 0, interestRate: 6.5, loanStartDt: d.subtract(6, 'month').format('YYYY-MM-DD'), loanMaturityDt: d.add(1, 'year').format('YYYY-MM-DD'), overdueDays: 5, guaranteeType: '信用', businessType: '消费贷' },
        ]);
        setFacilities([
          { ...makeDefaultFacility(), id: 'FAC_003', customerNo: 'CUST_003', customerName: '测试个人A', totalLimitCny: 150000, usedLimitCny: 150000, availableLimitCny: 0, collateralPoolId: 'POOL_003', riskGrade: 'A' },
          { ...makeDefaultFacility(), id: 'FAC_004', customerNo: 'CUST_004', customerName: '测试个人B', totalLimitCny: 80000, usedLimitCny: 80000, availableLimitCny: 0, collateralPoolId: 'POOL_004', riskGrade: 'BBB' },
        ]);
        setCollaterals([
          { ...makeDefaultCollateral(), id: 'COL_003', collateralPoolId: 'POOL_003', collateralType: '信用', collateralValueCny: 0, coverageRatio: 0 },
        ]);
        setRatings([
          { ...makeDefaultRating(), id: 'RAT_003', customerNo: 'CUST_003', ratingCode: 'A', ratingDate: d.subtract(3, 'month').format('YYYY-MM-DD') },
          { ...makeDefaultRating(), id: 'RAT_004', customerNo: 'CUST_004', ratingCode: 'BBB', ratingDate: d.subtract(6, 'month').format('YYYY-MM-DD') },
        ]);
        setRepaymentSchedules([]);
        setHistoricalStages([]);
        break;
      }
    }
    message.success('预设数据已加载');
  };

  // ---- Submit ------------------------------------------------------------
  const handleRunTrial = async () => {
    if (!selectedSchemeId) { message.warning('请选择方案'); return; }
    setLoading(true);
    try {
      const res = await trialApi.runTrial({
        schemeId: selectedSchemeId,
        assetId: loans[0]?.id || 'TRIAL_AST',
        calcDate: calcDate.format('YYYY-MM-DD'),
        scope,
        // Source tables
        loans,
        facilities,
        repaymentSchedules,
        collaterals,
        ratings,
        historicalStages,
      });
      setResult((res.data as any)?.data || res.data);
      message.success(`试算完成 · ${loans.length} 笔借据`);
    } catch (err) { console.error(err); message.error('试算失败'); }
    finally { setLoading(false); }
  };

  // =====================================================================
  // Section renderers (each returns the children for a Collapse panel)
  // =====================================================================

  const renderLoanRows = () => {
    const rows = loans;
    return (
      <div>
        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addLoan} style={{ marginBottom: 8 }}>
          添加借据
        </Button>
        {rows.length === 0 && <span style={{ color: '#999', fontSize: 12 }}>暂无数据，请添加借据</span>}
        {rows.map((r, idx) => (
          <div key={idx} className="trial-source-row">
            <div className="trial-field"><label>ID</label>
              <Input style={{ width: 110, fontSize: 11 }} size="small" value={r.id} onChange={(e) => updateLoan(idx, { id: e.target.value })} /></div>
            <div className="trial-field"><label>客户号</label>
              <Input style={{ width: 100, fontSize: 11 }} size="small" value={r.customerNo} onChange={(e) => updateLoan(idx, { customerNo: e.target.value })} /></div>
            <div className="trial-field"><label>客户名称</label>
              <Input style={{ width: 120, fontSize: 11 }} size="small" value={r.customerName} onChange={(e) => updateLoan(idx, { customerName: e.target.value })} /></div>
            <div className="trial-field"><label>行业</label>
              {select(r.industryCn, (v) => updateLoan(idx, { industryCn: v }), INDUSTRY_OPTIONS)}</div>
            <div className="trial-field"><label>规模</label>
              {select(r.segment, (v) => updateLoan(idx, { segment: v }), SEGMENT_OPTIONS)}</div>
            <div className="trial-field"><label>产品类型</label>
              {select(r.productType, (v) => updateLoan(idx, { productType: v }), PRODUCT_TYPES)}</div>
            <div className="trial-field"><label>融资金额</label>
              <InputNumber style={{ width: 120, fontSize: 11 }} size="small" value={r.amtFinancedCny} onChange={(v) => updateLoan(idx, { amtFinancedCny: v ?? undefined })} min={0} step={10000} /></div>
            <div className="trial-field"><label>贷款余额</label>
              <InputNumber style={{ width: 120, fontSize: 11 }} size="small" value={r.loanBalCny} onChange={(v) => updateLoan(idx, { loanBalCny: v ?? undefined })} min={0} step={10000} /></div>
            <div className="trial-field"><label>应计利息</label>
              <InputNumber style={{ width: 110, fontSize: 11 }} size="small" value={r.intAccruedCny} onChange={(v) => updateLoan(idx, { intAccruedCny: v ?? undefined })} min={0} /></div>
            <div className="trial-field"><label>利率(%)</label>
              <InputNumber style={{ width: 80, fontSize: 11 }} size="small" value={r.interestRate} onChange={(v) => updateLoan(idx, { interestRate: v ?? undefined })} min={0} step={0.1} precision={2} /></div>
            <div className="trial-field"><label>起贷日</label>
              <DatePicker size="small" style={{ width: 120, fontSize: 11 }} value={r.loanStartDt ? dayjs(r.loanStartDt) : undefined} onChange={(v) => updateLoan(idx, { loanStartDt: v ? v.format('YYYY-MM-DD') : undefined })} /></div>
            <div className="trial-field"><label>到期日</label>
              <DatePicker size="small" style={{ width: 120, fontSize: 11 }} value={r.loanMaturityDt ? dayjs(r.loanMaturityDt) : undefined} onChange={(v) => updateLoan(idx, { loanMaturityDt: v ? v.format('YYYY-MM-DD') : undefined })} /></div>
            <div className="trial-field"><label>逾期天数</label>
              <InputNumber style={{ width: 80, fontSize: 11 }} size="small" value={r.overdueDays} onChange={(v) => updateLoan(idx, { overdueDays: v ?? undefined })} min={0} /></div>
            <div className="trial-field"><label>担保类型</label>
              {select(r.guaranteeType, (v) => updateLoan(idx, { guaranteeType: v }), GUARANTEE_TYPES)}</div>
            <div className="trial-field"><label>业务类型</label>
              <Input style={{ width: 120, fontSize: 11 }} size="small" value={r.businessType} onChange={(e) => updateLoan(idx, { businessType: e.target.value })} /></div>
            <div className="trial-field"><label>授信编码</label>
              <Input style={{ width: 100, fontSize: 11 }} size="small" value={r.facilityCd} onChange={(e) => updateLoan(idx, { facilityCd: e.target.value })} /></div>
            {rows.length > 1 && (
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeLoan(idx)} style={{ alignSelf: 'center' }} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderFacilityRows = () => {
    const rows = facilities;
    return (
      <div>
        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addFacility} style={{ marginBottom: 8 }}>
          添加授信额度
        </Button>
        {rows.length === 0 && <span style={{ color: '#999', fontSize: 12 }}>暂无数据，请添加授信额度</span>}
        {rows.map((r, idx) => (
          <div key={idx} className="trial-source-row">
            <div className="trial-field"><label>ID</label>
              <Input style={{ width: 110, fontSize: 11 }} size="small" value={r.id} onChange={(e) => updateFacility(idx, { id: e.target.value })} /></div>
            <div className="trial-field"><label>客户号</label>
              <Input style={{ width: 100, fontSize: 11 }} size="small" value={r.customerNo} onChange={(e) => updateFacility(idx, { customerNo: e.target.value })} /></div>
            <div className="trial-field"><label>授信类型</label>
              {select(r.facilityType, (v) => updateFacility(idx, { facilityType: v }), FACILITY_TYPES)}</div>
            <div className="trial-field"><label>总额(CNY)</label>
              <InputNumber style={{ width: 120, fontSize: 11 }} size="small" value={r.totalLimitCny} onChange={(v) => updateFacility(idx, { totalLimitCny: v ?? undefined })} min={0} step={10000} /></div>
            <div className="trial-field"><label>已用额度</label>
              <InputNumber style={{ width: 110, fontSize: 11 }} size="small" value={r.usedLimitCny} onChange={(v) => updateFacility(idx, { usedLimitCny: v ?? undefined })} min={0} step={10000} /></div>
            <div className="trial-field"><label>可用额度</label>
              <InputNumber style={{ width: 110, fontSize: 11 }} size="small" value={r.availableLimitCny} onChange={(v) => updateFacility(idx, { availableLimitCny: v ?? undefined })} min={0} step={10000} /></div>
            <div className="trial-field"><label>生效日</label>
              <DatePicker size="small" style={{ width: 120, fontSize: 11 }} value={r.effectiveDt ? dayjs(r.effectiveDt) : undefined} onChange={(v) => updateFacility(idx, { effectiveDt: v ? v.format('YYYY-MM-DD') : undefined })} /></div>
            <div className="trial-field"><label>到期日</label>
              <DatePicker size="small" style={{ width: 120, fontSize: 11 }} value={r.expiryDt ? dayjs(r.expiryDt) : undefined} onChange={(v) => updateFacility(idx, { expiryDt: v ? v.format('YYYY-MM-DD') : undefined })} /></div>
            <div className="trial-field"><label>抵押池</label>
              <Input style={{ width: 100, fontSize: 11 }} size="small" value={r.collateralPoolId} onChange={(e) => updateFacility(idx, { collateralPoolId: e.target.value })} /></div>
            <div className="trial-field"><label>风险等级</label>
              {select(r.riskGrade, (v) => updateFacility(idx, { riskGrade: v }), RATING_CODES)}</div>
            {rows.length > 1 && (
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeFacility(idx)} style={{ alignSelf: 'center' }} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderRepaymentRows = () => {
    const rows = repaymentSchedules;
    return (
      <div>
        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addRepayment} style={{ marginBottom: 8 }}>
          添加还款计划
        </Button>
        {rows.length === 0 && <span style={{ color: '#999', fontSize: 12 }}>暂无还款计划数据</span>}
        {rows.map((r, idx) => (
          <div key={idx} className="trial-source-row">
            <div className="trial-field"><label>ID</label>
              <Input style={{ width: 110, fontSize: 11 }} size="small" value={r.id} onChange={(e) => updateRepayment(idx, { id: e.target.value })} /></div>
            <div className="trial-field"><label>借据ID</label>
              <Input style={{ width: 110, fontSize: 11 }} size="small" value={r.loanId} onChange={(e) => updateRepayment(idx, { loanId: e.target.value })} /></div>
            <div className="trial-field"><label>到期日</label>
              <DatePicker size="small" style={{ width: 120, fontSize: 11 }} value={r.dueDt ? dayjs(r.dueDt) : undefined} onChange={(v) => updateRepayment(idx, { dueDt: v ? v.format('YYYY-MM-DD') : undefined })} /></div>
            <div className="trial-field"><label>应还本金</label>
              <InputNumber style={{ width: 110, fontSize: 11 }} size="small" value={r.duePrincipal} onChange={(v) => updateRepayment(idx, { duePrincipal: v ?? undefined })} min={0} /></div>
            <div className="trial-field"><label>应还利息</label>
              <InputNumber style={{ width: 110, fontSize: 11 }} size="small" value={r.dueInterest} onChange={(v) => updateRepayment(idx, { dueInterest: v ?? undefined })} min={0} /></div>
            <div className="trial-field"><label>已还本金</label>
              <InputNumber style={{ width: 110, fontSize: 11 }} size="small" value={r.repaidPrincipal} onChange={(v) => updateRepayment(idx, { repaidPrincipal: v ?? undefined })} min={0} /></div>
            <div className="trial-field"><label>已还利息</label>
              <InputNumber style={{ width: 110, fontSize: 11 }} size="small" value={r.repaidInterest} onChange={(v) => updateRepayment(idx, { repaidInterest: v ?? undefined })} min={0} /></div>
            <div className="trial-field"><label>还款类型</label>
              {select(r.repaymentType, (v) => updateRepayment(idx, { repaymentType: v }), REPAYMENT_TYPES, '正常')}</div>
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeRepayment(idx)} style={{ alignSelf: 'center' }} />
          </div>
        ))}
      </div>
    );
  };

  const renderCollateralRows = () => {
    const rows = collaterals;
    return (
      <div>
        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addCollateral} style={{ marginBottom: 8 }}>
          添加抵质押品
        </Button>
        {rows.length === 0 && <span style={{ color: '#999', fontSize: 12 }}>暂无抵质押品数据</span>}
        {rows.map((r, idx) => (
          <div key={idx} className="trial-source-row">
            <div className="trial-field"><label>ID</label>
              <Input style={{ width: 110, fontSize: 11 }} size="small" value={r.id} onChange={(e) => updateCollateral(idx, { id: e.target.value })} /></div>
            <div className="trial-field"><label>抵押池ID</label>
              <Input style={{ width: 110, fontSize: 11 }} size="small" value={r.collateralPoolId} onChange={(e) => updateCollateral(idx, { collateralPoolId: e.target.value })} /></div>
            <div className="trial-field"><label>类型</label>
              {select(r.collateralType, (v) => updateCollateral(idx, { collateralType: v }), COLLATERAL_TYPES)}</div>
            <div className="trial-field"><label>价值(CNY)</label>
              <InputNumber style={{ width: 120, fontSize: 11 }} size="small" value={r.collateralValueCny} onChange={(v) => updateCollateral(idx, { collateralValueCny: v ?? undefined })} min={0} step={10000} /></div>
            <div className="trial-field"><label>覆盖率(%)</label>
              <InputNumber style={{ width: 90, fontSize: 11 }} size="small" value={r.coverageRatio} onChange={(v) => updateCollateral(idx, { coverageRatio: v ?? undefined })} min={0} /></div>
            <div className="trial-field"><label>评估日</label>
              <DatePicker size="small" style={{ width: 120, fontSize: 11 }} value={r.valuationDt ? dayjs(r.valuationDt) : undefined} onChange={(v) => updateCollateral(idx, { valuationDt: v ? v.format('YYYY-MM-DD') : undefined })} /></div>
            {rows.length > 1 && (
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeCollateral(idx)} style={{ alignSelf: 'center' }} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderRatingRows = () => {
    const rows = ratings;
    return (
      <div>
        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addRating} style={{ marginBottom: 8 }}>
          添加评级信息
        </Button>
        {rows.length === 0 && <span style={{ color: '#999', fontSize: 12 }}>暂无评级数据</span>}
        {rows.map((r, idx) => (
          <div key={idx} className="trial-source-row">
            <div className="trial-field"><label>ID</label>
              <Input style={{ width: 110, fontSize: 11 }} size="small" value={r.id} onChange={(e) => updateRating(idx, { id: e.target.value })} /></div>
            <div className="trial-field"><label>客户号</label>
              <Input style={{ width: 100, fontSize: 11 }} size="small" value={r.customerNo} onChange={(e) => updateRating(idx, { customerNo: e.target.value })} /></div>
            <div className="trial-field"><label>评级代码</label>
              {select(r.ratingCode, (v) => updateRating(idx, { ratingCode: v }), RATING_CODES)}</div>
            <div className="trial-field"><label>评级日期</label>
              <DatePicker size="small" style={{ width: 120, fontSize: 11 }} value={r.ratingDate ? dayjs(r.ratingDate) : undefined} onChange={(v) => updateRating(idx, { ratingDate: v ? v.format('YYYY-MM-DD') : undefined })} /></div>
            {rows.length > 1 && (
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeRating(idx)} style={{ alignSelf: 'center' }} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderHistoricalStageRows = () => {
    const rows = historicalStages;
    return (
      <div>
        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addHistoricalStage} style={{ marginBottom: 8 }}>
          添加历史阶段
        </Button>
        {rows.length === 0 && <span style={{ color: '#999', fontSize: 12 }}>暂无历史阶段数据</span>}
        {rows.map((r, idx) => (
          <div key={idx} className="trial-source-row">
            <div className="trial-field"><label>ID</label>
              <Input style={{ width: 110, fontSize: 11 }} size="small" value={r.id} onChange={(e) => updateHistoricalStage(idx, { id: e.target.value })} /></div>
            <div className="trial-field"><label>借据ID</label>
              <Input style={{ width: 110, fontSize: 11 }} size="small" value={r.loanId} onChange={(e) => updateHistoricalStage(idx, { loanId: e.target.value })} /></div>
            <div className="trial-field"><label>阶段</label>
              {select(r.stage, (v) => updateHistoricalStage(idx, { stage: v }), STAGE_OPTIONS)}</div>
            <div className="trial-field"><label>阶段日期</label>
              <DatePicker size="small" style={{ width: 120, fontSize: 11 }} value={r.stageDate ? dayjs(r.stageDate) : undefined} onChange={(v) => updateHistoricalStage(idx, { stageDate: v ? v.format('YYYY-MM-DD') : undefined })} /></div>
            <div className="trial-field"><label>原因</label>
              <Input style={{ width: 140, fontSize: 11 }} size="small" value={r.reasonCode} onChange={(e) => updateHistoricalStage(idx, { reasonCode: e.target.value })} /></div>
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeHistoricalStage(idx)} style={{ alignSelf: 'center' }} />
          </div>
        ))}
      </div>
    );
  };

  // ---- Result table columns -----------------------------------------------
  const resultColumns = [
    { title: '借据', dataIndex: 'assetId', key: 'assetId', width: 180 },
    { title: '分组', dataIndex: 'groupLabel', key: 'groupLabel' },
    { title: '产品', dataIndex: 'productType', key: 'productType', width: 100 },
    { title: '阶段', dataIndex: 'stage', key: 'stage', width: 80 },
    { title: 'PD(存续期)', dataIndex: 'pdLifetime', key: 'pdLifetime', width: 110 },
    { title: 'EAD', dataIndex: 'ead', key: 'ead', width: 130 },
    { title: 'LGD', dataIndex: 'lgd', key: 'lgd', width: 100 },
    { title: 'ECL 最终', dataIndex: 'eclFinal', key: 'eclFinal', width: 140,
      render: (v: string) => <strong style={{ color: '#f5222d' }}>{v}</strong> },
    { title: '异常', dataIndex: 'exceptionSummary', key: 'exceptionSummary',
      render: (v: string) => v ? <Tag color="red" style={{ fontSize: 10 }}>{v}</Tag> : null },
  ];

  // =====================================================================
  // Render
  // =====================================================================
  return (
    <div className="ecl-page">
      <PageHeader title="试算中心"
        subtitle="手工构造借据参数，支持多笔借据按客户维度跑批。试算数据与正式跑批完全隔离。" />

      <Panel title="快速预设">
        <Space wrap>
          <Button size="small" onClick={() => applyPreset('corp_dual')}>对公 · 双借据</Button>
          <Button size="small" onClick={() => applyPreset('retail_multi')}>零售 · 双借据</Button>
        </Space>
      </Panel>

      <Panel title="试算条件" extra={<Tag color="blue">试算数据 · 不写入正式跑批</Tag>}>
        <div className="trial-form-row">
          <div className="trial-field">
            <label>选择方案</label>
            <Select style={{ width: 280 }} placeholder="请选择" value={selectedSchemeId || undefined}
              onChange={setSelectedSchemeId} options={schemeOptions} />
          </div>
          <div className="trial-field">
            <label>试算日期</label>
            <DatePicker value={calcDate} onChange={(v) => v && setCalcDate(v)} />
          </div>
          <div className="trial-field">
            <label>范围</label>
            <Radio.Group value={scope} onChange={(e) => setScope(e.target.value)}>
              <Radio value="SINGLE">单笔/多笔</Radio>
              <Radio value="BATCH" disabled>批量</Radio>
            </Radio.Group>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <Collapse size="small" defaultActiveKey={['loans']}
            items={[
              {
                key: 'loans',
                label: `借据信息表（${loans.length} 行）`,
                children: renderLoanRows(),
              },
              {
                key: 'facilities',
                label: `授信额度表（${facilities.length} 行）`,
                children: renderFacilityRows(),
              },
              {
                key: 'repayments',
                label: `还款计划表（${repaymentSchedules.length} 行）`,
                children: renderRepaymentRows(),
              },
              {
                key: 'collaterals',
                label: `抵质押品表（${collaterals.length} 行）`,
                children: renderCollateralRows(),
              },
              {
                key: 'ratings',
                label: `评级信息表（${ratings.length} 行）`,
                children: renderRatingRows(),
              },
              {
                key: 'stages',
                label: `历史阶段表（${historicalStages.length} 行）`,
                children: renderHistoricalStageRows(),
              },
            ]}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <Button type="primary" size="large" icon={<ExperimentOutlined />}
            loading={loading} onClick={handleRunTrial}>开始试算</Button>
        </div>
      </Panel>

      {result && (
        <Panel title="试算结果" extra={
          <Space>
            <span className="ecl-mono">{result.jobId}</span>
            <Tag color="green">耗时 {result.durationMs}ms</Tag>
          </Space>
        }>
          {result.assetResults && result.assetResults.length > 1 ? (
            <Table rowKey="assetId" columns={resultColumns} dataSource={result.assetResults}
              size="small" pagination={false}
              expandable={{
                expandedRowRender: (row: AssetResult) => (
                  <div style={{ padding: 8 }}>
                    {row.steps.map((step) => <TrialStep key={step.key} step={step} />)}
                  </div>
                ),
              }}
            />
          ) : (
            <>
              <div className="trial-final-bar">
                <div><div className="trial-final-label">阶段</div><div className="trial-final-value">{result.stage}</div></div>
                <div><div className="trial-final-label">PD (12M)</div><div className="trial-final-value">{result.pd12m}</div></div>
                <div><div className="trial-final-label">PD (存续期)</div><div className="trial-final-value">{result.pdLifetime}</div></div>
                <div><div className="trial-final-label">EAD</div><div className="trial-final-value">{result.ead}</div></div>
                <div><div className="trial-final-label">LGD</div><div className="trial-final-value">{result.lgd}</div></div>
                <div><div className="trial-final-label">ECL 加权</div><div className="trial-final-value">{result.eclValue}</div></div>
                <div><div className="trial-final-label">叠加</div><div className="trial-final-value">{result.overlayAmount}</div></div>
                <div><div className="trial-final-label">ECL 最终</div><div className="trial-final-value emphasis">{result.eclFinal}</div></div>
              </div>
              {result.steps.map((step) => <TrialStep key={step.key} step={step} />)}
            </>
          )}
        </Panel>
      )}
    </div>
  );
};

const TrialStep: React.FC<{ step: TrialStepVO }> = ({ step }) => (
  <div className="trial-step">
    <div className="trial-step-header">
      <span className="trial-step-icon">{step.note ? '!' : '✓'}</span>
      <span className="trial-step-title">{step.title}</span>
      <span className="trial-step-summary">{step.summary}</span>
    </div>
    <div className="trial-step-body">
      {step.note && <div className="trial-note">{step.note}</div>}
      {step.scenarioRows && step.scenarioRows.length > 0 ? (
        <table className="trial-scenario-table">
          <thead><tr><th>情景</th><th>权重</th><th>PD</th><th>加权 PD</th></tr></thead>
          <tbody>
            {step.scenarioRows.map((row) => (
              <tr key={row.scenario} className={row.highlight ? 'highlight' : undefined}>
                <td>{row.scenario}</td><td>{row.weight}</td><td>{row.pd}</td><td>{row.weightedPd}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="trial-metrics">
          {step.metrics?.map((metric) => (
            <div className="trial-metric" key={metric.label}>
              <div className="trial-metric-label">{metric.label}</div>
              <div className="trial-metric-value">{metric.value}</div>
              {metric.note && <div className="trial-metric-note">{metric.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default TrialCenter;
