import React, { useEffect, useMemo, useState } from 'react';
import { Button, Collapse, DatePicker, Input, InputNumber, Radio, Select, Space, Switch, Table, Tag, message } from 'antd';
import { DownloadOutlined, ExperimentOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader, Panel } from '../../components';
import { schemeApi, type SchemeVO } from '../../api/scheme';
import { trialApi, type TrialCalculationResp, type TrialStepVO, type AssetInputReq, type AssetResult } from '../../api/trial';
import './TrialCenter.css';

const today = dayjs();
const BUSINESS_LINES = ['非零售', '零售'];
const CUSTOMER_TYPES = ['对公', '非银金融', '同业', '债券', '小微', '个人'];
const PRODUCT_TYPES = ['公司贷款', '银团贷款', '汽车贷款', '个经营贷', '个消费贷'];
const COLLATERAL_TYPES = ['房产', '土地', '存单', '保证金', '信用', '保证'];
const RATING_CODES = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C'];
const COMMITMENT_TYPES = ['承诺', '不可撤销承诺', '可撤销承诺'];

const makeDefaultAsset = (): AssetInputReq => ({
  assetId: `TRIAL_AST_${String(Date.now()).slice(-4)}`,
  lastStage: 'STAGE_1',
  maturityDate: today.add(2, 'year').format('YYYY-MM-DD'),
});

const TrialCenter: React.FC = () => {
  const [schemes, setSchemes] = useState<SchemeVO[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');
  const [scope, setScope] = useState<'SINGLE' | 'BATCH'>('SINGLE');
  const [calcDate, setCalcDate] = useState(today);
  const [assets, setAssets] = useState<AssetInputReq[]>([makeDefaultAsset()]);
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

  const updateAsset = (idx: number, patch: Partial<AssetInputReq>) => {
    setAssets((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };

  const addAsset = () => setAssets((prev) => [...prev, makeDefaultAsset()]);
  const removeAsset = (idx: number) => {
    if (assets.length <= 1) return;
    setAssets((prev) => prev.filter((_, i) => i !== idx));
  };

  const applyPreset = (preset: string) => {
    const d = today;
    const list: AssetInputReq[] = [];
    switch (preset) {
      case 'corp_dual':
        list.push({
          assetId: 'TRIAL_CORP_A', businessLine: '非零售', customerType: '对公', productType: '公司贷款',
          industryCode: 'J', regionCode: '110000', collateralType: '房产',
          lastStage: 'STAGE_1', overdueDays: 10, crrRating: 'CRR5', fiveCategory: '正常',
          defaultFlag: false, ratingDropLevels: 0, ratingCode: 'AAA',
          maturityDate: d.add(2, 'year').format('YYYY-MM-DD'),
          outstandingBalance: 5000000, accruedInterest: 10000, totalLimit: 8000000, commitmentType: '承诺',
        });
        list.push({
          assetId: 'TRIAL_CORP_B', businessLine: '非零售', customerType: '对公', productType: '公司贷款',
          industryCode: 'J', regionCode: '110000', collateralType: '信用',
          lastStage: 'STAGE_1', overdueDays: 45, crrRating: 'CRR5', fiveCategory: '关注',
          defaultFlag: false, ratingDropLevels: 3, ratingCode: 'BBB',
          maturityDate: d.add(3, 'year').format('YYYY-MM-DD'),
          outstandingBalance: 3000000, accruedInterest: 15000, totalLimit: 5000000, commitmentType: '承诺',
        });
        break;
      case 'retail_multi':
        list.push({
          assetId: 'TRIAL_RETAIL_A', businessLine: '零售', customerType: '个人', productType: '个消费贷',
          industryCode: 'X', regionCode: '310000', collateralType: '信用',
          lastStage: 'STAGE_1', overdueDays: 0, crrRating: 'CRR3', fiveCategory: '正常',
          defaultFlag: false, ratingDropLevels: 0, ratingCode: 'AA',
          maturityDate: d.add(1, 'year').format('YYYY-MM-DD'),
          outstandingBalance: 150000, accruedInterest: 0, totalLimit: 150000, commitmentType: '承诺',
        });
        list.push({
          assetId: 'TRIAL_RETAIL_B', businessLine: '零售', customerType: '个人', productType: '个消费贷',
          industryCode: 'X', regionCode: '310000', collateralType: '信用',
          lastStage: 'STAGE_1', overdueDays: 5, crrRating: 'CRR3', fiveCategory: '正常',
          defaultFlag: false, ratingDropLevels: 0, ratingCode: 'A',
          maturityDate: d.add(2, 'year').format('YYYY-MM-DD'),
          outstandingBalance: 80000, accruedInterest: 0, totalLimit: 80000, commitmentType: '承诺',
        });
        break;
    }
    setAssets(list.length > 0 ? list : [makeDefaultAsset()]);
    if (list.length > 1) setScope('SINGLE'); // multi-asset mode
    message.success('预设数据已加载');
  };

  const handleRunTrial = async () => {
    if (!selectedSchemeId) { message.warning('请选择方案'); return; }
    setLoading(true);
    try {
      const res = await trialApi.runTrial({
        schemeId: selectedSchemeId,
        assetId: assets[0]?.assetId || 'TRIAL_AST',
        calcDate: calcDate.format('YYYY-MM-DD'),
        scope,
        ...(assets.length === 1 ? { ...assets[0] } : {}),
        assets: assets.length > 1 ? assets : undefined,
      });
      setResult((res.data as any)?.data || res.data);
      message.success(`试算完成 · ${assets.length} 笔借据`);
    } catch (err) { console.error(err); message.error('试算失败'); }
    finally { setLoading(false); }
  };

  const select = (value: string | undefined, onChange: (v: string) => void, options: string[], placeholder?: string) => (
    <Select style={{ width: 160 }} value={value || undefined} onChange={onChange}
      placeholder={placeholder || '不限'} allowClear options={options.map((o) => ({ label: o, value: o }))} />
  );

  const assetFields = (a: AssetInputReq, idx: number) => (
    <div key={idx}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="trial-field">
          <label>借据 ID</label>
          <Input style={{ width: 160 }} value={a.assetId}
            onChange={(e) => updateAsset(idx, { assetId: e.target.value })} />
        </div>
        <div className="trial-field">{field('业务条线', select(a.businessLine, (v) => updateAsset(idx, { businessLine: v }), BUSINESS_LINES))}</div>
        <div className="trial-field">{field('客户类型', select(a.customerType, (v) => updateAsset(idx, { customerType: v }), CUSTOMER_TYPES))}</div>
        <div className="trial-field">{field('产品类型', select(a.productType, (v) => updateAsset(idx, { productType: v }), PRODUCT_TYPES))}</div>
        <div className="trial-field">{field('担保类型', select(a.collateralType, (v) => updateAsset(idx, { collateralType: v }), COLLATERAL_TYPES))}</div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 8 }}>
        <div className="trial-field">{field('上期阶段', select(a.lastStage, (v) => updateAsset(idx, { lastStage: v }), ['STAGE_1','STAGE_2','STAGE_3'], undefined))}</div>
        <div className="trial-field">
          <label>逾期天数</label>
          <InputNumber style={{ width: 100 }} value={a.overdueDays} onChange={(v) => updateAsset(idx, { overdueDays: v ?? undefined })} min={0} max={9999} />
        </div>
        <div className="trial-field">{field('CRR 评级', select(a.crrRating, (v) => updateAsset(idx, { crrRating: v }), ['CRR1','CRR2','CRR3','CRR4','CRR5','CRR6','CRR7','CRR8']))}</div>
        <div className="trial-field">{field('五级分类', select(a.fiveCategory, (v) => updateAsset(idx, { fiveCategory: v }), ['正常','关注','次级','可疑','损失']))}</div>
        <div className="trial-field">
          <label>违约</label>
          <Switch size="small" checked={a.defaultFlag} onChange={(v) => updateAsset(idx, { defaultFlag: v })} checkedChildren="是" unCheckedChildren="否" />
        </div>
        <div className="trial-field">{field('评级代码', select(a.ratingCode, (v) => updateAsset(idx, { ratingCode: v }), RATING_CODES))}</div>
        <div className="trial-field">
          <label>到期日</label>
          <DatePicker value={a.maturityDate ? dayjs(a.maturityDate) : undefined}
            onChange={(v) => updateAsset(idx, { maturityDate: v ? v.format('YYYY-MM-DD') : undefined })} />
        </div>
        <div className="trial-field">
          <label>未偿余额</label>
          <InputNumber style={{ width: 140 }} value={a.outstandingBalance} onChange={(v) => updateAsset(idx, { outstandingBalance: v ?? undefined })} min={0} step={10000} placeholder="未偿余额" />
        </div>
        <div className="trial-field">
          <label>授信总额</label>
          <InputNumber style={{ width: 140 }} value={a.totalLimit} onChange={(v) => updateAsset(idx, { totalLimit: v ?? undefined })} min={0} step={10000} placeholder="授信总额" />
        </div>
        <div className="trial-field">{field('承诺类型', select(a.commitmentType, (v) => updateAsset(idx, { commitmentType: v }), COMMITMENT_TYPES))}</div>
        <div className="trial-field">
          <label>行业代码</label>
          <Input style={{ width: 100 }} value={a.industryCode} onChange={(e) => updateAsset(idx, { industryCode: e.target.value })} placeholder="如 J" />
        </div>
        <div className="trial-field">
          <label>地区代码</label>
          <Input style={{ width: 100 }} value={a.regionCode} onChange={(e) => updateAsset(idx, { regionCode: e.target.value })} placeholder="如 110000" />
        </div>
      </div>
    </div>
  );

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

  return (
    <div className="ecl-page">
      <PageHeader title="试算中心"
        subtitle="手工构造借据参数，支持多笔借据按客户维度跑批。试算数据与正式跑批完全隔离。" />

      <Panel title="快速预设" collapsible defaultOpen={false}>
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
          <Space style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>借据列表（{assets.length} 笔 · 同一客户维度）</span>
            <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={addAsset}>添加借据</Button>
          </Space>
          <Collapse size="small" items={assets.map((a, idx) => ({
            key: String(idx),
            label: `借据 ${idx + 1}: ${a.assetId} — ${a.productType || '未选择产品'} — ${a.customerType || '未选客户类型'}`,
            extra: assets.length > 1 ? (
              <Button size="small" danger icon={<DeleteOutlined />}
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); removeAsset(idx); }}>删除</Button>
            ) : undefined,
            children: assetFields(a, idx),
          }))} />
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

const field = (label: string, child: React.ReactNode) => (
  <div className="trial-field"><label>{label}</label>{child}</div>
);

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
