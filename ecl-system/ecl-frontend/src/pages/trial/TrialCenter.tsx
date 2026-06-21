import React, { useEffect, useMemo, useState } from 'react';
import { Button, Collapse, DatePicker, Input, InputNumber, Radio, Select, Space, Switch, Tag, message } from 'antd';
import { DownloadOutlined, ExperimentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader, Panel } from '../../components';
import { schemeApi, type SchemeVO } from '../../api/scheme';
import { trialApi, type TrialCalculationResp, type TrialStepVO } from '../../api/trial';
import './TrialCenter.css';

const today = dayjs();

// 常用选项
const BUSINESS_LINES = ['非零售', '零售'];
const CUSTOMER_TYPES = ['对公', '非银金融', '同业', '债券', '小微', '个人'];
const PRODUCT_TYPES = ['公司贷款', '银团贷款', '汽车贷款', '个经营贷', '个消费贷'];
const COLLATERAL_TYPES = ['房产', '土地', '存单', '保证金', '信用', '保证'];
const STAGES = ['STAGE_1', 'STAGE_2', 'STAGE_3'];
const RATING_CODES = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C'];
const FIVE_CATEGORIES = ['正常', '关注', '次级', '可疑', '损失'];
const COMMITMENT_TYPES = ['承诺', '不可撤销承诺', '可撤销承诺'];
const MEDIA_SEVERITIES = ['轻度', '中度', '重度'];

const TrialCenter: React.FC = () => {
  const [schemes, setSchemes] = useState<SchemeVO[]>([]);
  // 基础
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');
  const [assetId, setAssetId] = useState('TRIAL_AST_001');
  const [scope, setScope] = useState<'SINGLE' | 'BATCH'>('SINGLE');
  const [calcDate, setCalcDate] = useState(today);
  // 6.1
  const [businessLine, setBusinessLine] = useState<string>('');
  const [customerType, setCustomerType] = useState<string>('');
  const [productType, setProductType] = useState<string>('');
  const [industryCode, setIndustryCode] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [collateralType, setCollateralType] = useState<string>('');
  // 6.2
  const [lastStage, setLastStage] = useState<string>('STAGE_1');
  const [overdueDays, setOverdueDays] = useState<number | null>(null);
  const [crrRating, setCrrRating] = useState<string>('');
  const [fiveCategory, setFiveCategory] = useState<string>('');
  const [defaultFlag, setDefaultFlag] = useState(false);
  const [mediaSentiment, setMediaSentiment] = useState<string>('');
  const [ratingDropLevels, setRatingDropLevels] = useState<number | null>(null);
  // 6.3
  const [ratingCode, setRatingCode] = useState<string>('');
  const [maturityDate, setMaturityDate] = useState(today.add(2, 'year'));
  // 6.4
  const [outstandingBalance, setOutstandingBalance] = useState<number | null>(null);
  const [accruedInterest, setAccruedInterest] = useState<number | null>(0);
  const [totalLimit, setTotalLimit] = useState<number | null>(null);
  const [commitmentType, setCommitmentType] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrialCalculationResp | null>(null);

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

  const handleRunTrial = async () => {
    if (!selectedSchemeId) { message.warning('请选择方案'); return; }
    if (!assetId.trim()) { message.warning('请输入借据 ID'); return; }
    setLoading(true);
    try {
      const res = await trialApi.runTrial({
        schemeId: selectedSchemeId,
        assetId: assetId.trim(),
        calcDate: calcDate.format('YYYY-MM-DD'),
        scope,
        businessLine: businessLine || undefined,
        customerType: customerType || undefined,
        productType: productType || undefined,
        industryCode: industryCode || undefined,
        regionCode: regionCode || undefined,
        collateralType: collateralType || undefined,
        lastStage: lastStage || undefined,
        overdueDays: overdueDays ?? undefined,
        crrRating: crrRating || undefined,
        fiveCategory: fiveCategory || undefined,
        defaultFlag: defaultFlag || undefined,
        mediaSentiment: mediaSentiment || undefined,
        ratingDropLevels: ratingDropLevels ?? undefined,
        ratingCode: ratingCode || undefined,
        maturityDate: maturityDate ? maturityDate.format('YYYY-MM-DD') : undefined,
        outstandingBalance: outstandingBalance ?? undefined,
        accruedInterest: accruedInterest ?? undefined,
        totalLimit: totalLimit ?? undefined,
        commitmentType: commitmentType || undefined,
      });
      setResult((res.data as any)?.data || res.data);
      message.success('试算完成');
    } catch (err) {
      console.error(err);
      message.error('试算失败，请检查参数');
    } finally {
      setLoading(false);
    }
  };

  // 快速预设场景
  const applyPreset = (preset: string) => {
    const d = today;
    switch (preset) {
      case 'corp_normal':
        setAssetId('TRIAL_CORP_STAGE1');
        setBusinessLine('非零售'); setCustomerType('对公'); setProductType('公司贷款');
        setIndustryCode('J'); setRegionCode('110000'); setCollateralType('房产');
        setLastStage('STAGE_1'); setOverdueDays(10); setCrrRating('CRR5');
        setFiveCategory('正常'); setDefaultFlag(false); setRatingDropLevels(0);
        setRatingCode('AAA'); setMaturityDate(d.add(2, 'year'));
        setOutstandingBalance(5000000); setAccruedInterest(10000);
        setTotalLimit(8000000); setCommitmentType('承诺');
        break;
      case 'corp_stage2':
        setAssetId('TRIAL_CORP_STAGE2');
        setBusinessLine('非零售'); setCustomerType('对公'); setProductType('公司贷款');
        setIndustryCode('J'); setRegionCode('110000'); setCollateralType('房产');
        setLastStage('STAGE_1'); setOverdueDays(45); setCrrRating('CRR5');
        setFiveCategory('关注'); setDefaultFlag(false); setRatingDropLevels(3);
        setRatingCode('BBB'); setMaturityDate(d.add(3, 'year'));
        setOutstandingBalance(5000000); setAccruedInterest(20000);
        setTotalLimit(8000000); setCommitmentType('承诺');
        break;
      case 'retail_normal':
        setAssetId('TRIAL_RETAIL_STAGE1');
        setBusinessLine('零售'); setCustomerType('个人'); setProductType('个消费贷');
        setIndustryCode('X'); setRegionCode('310000'); setCollateralType('信用');
        setLastStage('STAGE_1'); setOverdueDays(0); setCrrRating('CRR3');
        setFiveCategory('正常'); setDefaultFlag(false); setRatingDropLevels(0);
        setRatingCode('AA'); setMaturityDate(d.add(1, 'year'));
        setOutstandingBalance(200000); setAccruedInterest(500);
        setTotalLimit(200000); setCommitmentType('承诺');
        break;
      case 'default_stage3':
        setAssetId('TRIAL_DEFAULT_S3');
        setBusinessLine('非零售'); setCustomerType('对公'); setProductType('公司贷款');
        setIndustryCode('J'); setRegionCode('110000'); setCollateralType('信用');
        setLastStage('STAGE_2'); setOverdueDays(120); setCrrRating('CRR7');
        setFiveCategory('可疑'); setDefaultFlag(true); setRatingDropLevels(5);
        setRatingCode('CCC'); setMaturityDate(d.add(5, 'year'));
        setOutstandingBalance(3000000); setAccruedInterest(50000);
        setTotalLimit(3000000); setCommitmentType('承诺');
        break;
    }
    message.success('预设数据已加载');
  };

  const field = (label: string, child: React.ReactNode, span?: number) => (
    <div className="trial-field" style={span ? { flex: `0 0 ${span}px` } : undefined}>
      <label>{label}</label>
      {child}
    </div>
  );

  const select = (value: string, onChange: (v: string) => void, options: string[], placeholder?: string, allowClear = true) => (
    <Select
      style={{ width: 160 }}
      value={value || undefined}
      onChange={onChange}
      placeholder={placeholder || '不限'}
      allowClear={allowClear}
      options={options.map((o) => ({ label: o, value: o }))}
    />
  );

  return (
    <div className="ecl-page">
      <PageHeader
        title="试算中心"
        subtitle="手工构造借据参数，验证 ECL 全链路计算结果。试算数据与正式跑批完全隔离。"
      />

      {/* 预设场景 */}
      <Panel title="快速预设场景" collapsible defaultOpen={false}>
        <Space wrap>
          <Button size="small" onClick={() => applyPreset('corp_normal')}>
            对公 · Stage 1 正常
          </Button>
          <Button size="small" onClick={() => applyPreset('corp_stage2')}>
            对公 · Stage 2 关注
          </Button>
          <Button size="small" onClick={() => applyPreset('retail_normal')}>
            零售 · 个消费贷
          </Button>
          <Button size="small" onClick={() => applyPreset('default_stage3')}>
            兜底 · Stage 3 损失
          </Button>
        </Space>
      </Panel>

      {/* 试算条件 */}
      <Panel
        title="试算条件"
        extra={<Tag color="blue">试算数据 · 不写入正式跑批</Tag>}
      >
        {/* 基础信息 */}
        <div className="trial-form-row">
          {field('选择方案', (
            <Select style={{ width: 280 }} placeholder="请选择 ECL 方案"
              value={selectedSchemeId || undefined} onChange={setSelectedSchemeId}
              options={schemeOptions} />
          ))}
          {field('试算日期', <DatePicker value={calcDate} onChange={(v) => v && setCalcDate(v)} />)}
          {field('范围', (
            <Radio.Group value={scope} onChange={(e) => setScope(e.target.value)}>
              <Radio value="SINGLE">单笔借据</Radio>
              <Radio value="BATCH" disabled>批量</Radio>
            </Radio.Group>
          ))}
          {field('借据 ID', <Input style={{ width: 180 }} value={assetId}
            onChange={(e) => setAssetId(e.target.value)} placeholder="借据 ID" />)}
        </div>

        <Collapse
          style={{ marginTop: 12 }}
          size="small"
          items={[
            {
              key: 'risk',
              label: '① 风险分组入参（6 维匹配）',
              children: (
                <div className="trial-form-row">
                  {field('业务条线', select(businessLine, setBusinessLine, BUSINESS_LINES))}
                  {field('客户类型', select(customerType, setCustomerType, CUSTOMER_TYPES))}
                  {field('产品类型', select(productType, setProductType, PRODUCT_TYPES))}
                  {field('行业代码', <Input style={{ width: 120 }} value={industryCode}
                    onChange={(e) => setIndustryCode(e.target.value)} placeholder="如 J, K" />)}
                  {field('地区代码', <Input style={{ width: 120 }} value={regionCode}
                    onChange={(e) => setRegionCode(e.target.value)} placeholder="如 110000" />)}
                  {field('担保类型', select(collateralType, setCollateralType, COLLATERAL_TYPES))}
                </div>
              ),
            },
            {
              key: 'stage',
              label: '② 阶段划分入参',
              children: (
                <div className="trial-form-row">
                  {field('上期阶段', select(lastStage, setLastStage, STAGES, undefined, false))}
                  {field('逾期天数', <InputNumber style={{ width: 100 }} value={overdueDays}
                    onChange={(v) => setOverdueDays(v)} min={0} max={9999} placeholder="逾期天数" />)}
                  {field('CRR 评级', select(crrRating, setCrrRating, ['CRR1', 'CRR2', 'CRR3', 'CRR4', 'CRR5', 'CRR6', 'CRR7', 'CRR8']))}
                  {field('五级分类', select(fiveCategory, setFiveCategory, FIVE_CATEGORIES))}
                  {field('违约标识', <Switch checked={defaultFlag} onChange={setDefaultFlag}
                    checkedChildren="是" unCheckedChildren="否" />)}
                  {field('舆情', select(mediaSentiment, setMediaSentiment, MEDIA_SEVERITIES))}
                  {field('评级下降级数', <InputNumber style={{ width: 100 }} value={ratingDropLevels}
                    onChange={(v) => setRatingDropLevels(v)} min={0} max={10} placeholder="下降级数" />)}
                </div>
              ),
            },
            {
              key: 'pd',
              label: '③ PD 入参',
              children: (
                <div className="trial-form-row">
                  {field('评级代码', select(ratingCode, setRatingCode, RATING_CODES))}
                  {field('到期日', <DatePicker value={maturityDate}
                    onChange={(v) => v && setMaturityDate(v)} placeholder="到期日" />)}
                </div>
              ),
            },
            {
              key: 'ead',
              label: '④ EAD 入参',
              children: (
                <div className="trial-form-row">
                  {field('未偿余额', <InputNumber style={{ width: 160 }} value={outstandingBalance}
                    onChange={(v) => setOutstandingBalance(v)} min={0} step={10000}
                    placeholder="未偿余额" formatter={(v) => `¥ ${v}`} />)}
                  {field('应计利息', <InputNumber style={{ width: 160 }} value={accruedInterest}
                    onChange={(v) => setAccruedInterest(v)} min={0} step={1000}
                    placeholder="应计利息" formatter={(v) => `¥ ${v}`} />)}
                  {field('授信总额', <InputNumber style={{ width: 160 }} value={totalLimit}
                    onChange={(v) => setTotalLimit(v)} min={0} step={10000}
                    placeholder="授信总额" formatter={(v) => `¥ ${v}`} />)}
                  {field('承诺类型', select(commitmentType, setCommitmentType, COMMITMENT_TYPES))}
                </div>
              ),
            },
          ]}
        />

        <div style={{ marginTop: 16 }}>
          <Button type="primary" size="large" icon={<ExperimentOutlined />}
            loading={loading} onClick={handleRunTrial}>
            开始试算
          </Button>
        </div>
      </Panel>

      {/* 结果 */}
      {result && (
        <Panel
          title="试算结果"
          extra={
            <Space>
              <span className="ecl-mono">{result.jobId}</span>
              <Tag color={result.status === 'SUCCESS' ? 'green' : 'orange'}>
                耗时 {result.durationMs}ms
              </Tag>
              {result.exceptionSummary && (
                <Tag color="red">{result.exceptionSummary}</Tag>
              )}
              <Button size="small" icon={<DownloadOutlined />}
                onClick={() => message.info('导出功能待接入')}>导出</Button>
            </Space>
          }
        >
          {/* 概览 */}
          <div className="trial-result-meta">
            <span><strong>借据：</strong>{result.assetId}</span>
            <span><strong>分组：</strong>{result.groupLabel}</span>
            <span><strong>产品：</strong>{result.productType}</span>
            <span><strong>评级：</strong>{result.ratingCode}</span>
          </div>

          {/* 结果卡片 */}
          <div className="trial-final-bar">
            <div>
              <div className="trial-final-label">阶段</div>
              <div className="trial-final-value">{result.stage}</div>
            </div>
            <div>
              <div className="trial-final-label">PD (12M)</div>
              <div className="trial-final-value">{result.pd12m}</div>
            </div>
            <div>
              <div className="trial-final-label">PD (存续期)</div>
              <div className="trial-final-value">{result.pdLifetime}</div>
            </div>
            <div>
              <div className="trial-final-label">EAD</div>
              <div className="trial-final-value">{result.ead}</div>
            </div>
            <div>
              <div className="trial-final-label">LGD</div>
              <div className="trial-final-value">{result.lgd}</div>
            </div>
            <div>
              <div className="trial-final-label">ECL 加权</div>
              <div className="trial-final-value">{result.eclValue}</div>
            </div>
            <div>
              <div className="trial-final-label">叠加</div>
              <div className="trial-final-value">{result.overlayAmount}</div>
            </div>
            <div>
              <div className="trial-final-label">ECL 最终</div>
              <div className="trial-final-value emphasis">{result.eclFinal}</div>
            </div>
          </div>

          {/* 步骤详情 */}
          {result.steps.map((step) => (
            <TrialStep key={step.key} step={step} />
          ))}
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
          <thead>
            <tr><th>情景</th><th>权重</th><th>PD</th><th>加权 PD</th></tr>
          </thead>
          <tbody>
            {step.scenarioRows.map((row) => (
              <tr key={row.scenario} className={row.highlight ? 'highlight' : undefined}>
                <td>{row.scenario}</td><td>{row.weight}</td>
                <td>{row.pd}</td><td>{row.weightedPd}</td>
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
