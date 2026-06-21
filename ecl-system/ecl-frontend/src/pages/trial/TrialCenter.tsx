import React, { useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Input, Radio, Select, Space, Tag, message } from 'antd';
import { DownloadOutlined, ExperimentOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader, Panel } from '../../components';
import { schemeApi, type SchemeVO } from '../../api/scheme';
import { trialApi, type TrialCalculationResp, type TrialStepVO } from '../../api/trial';
import './TrialCenter.css';

const today = dayjs();

const TrialCenter: React.FC = () => {
  const [schemes, setSchemes] = useState<SchemeVO[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');
  const [assetId, setAssetId] = useState('AST20260618000001');
  const [scope, setScope] = useState<'SINGLE' | 'BATCH'>('SINGLE');
  const [calcDate, setCalcDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrialCalculationResp | null>(null);

  useEffect(() => {
    schemeApi.list().then((res) => {
      const list = (res.data as any)?.data || res.data || [];
      setSchemes(list);
      const preferred = list.find((s: SchemeVO) => s.status === 'DRAFT') || list[0];
      if (preferred) {
        setSelectedSchemeId(preferred.schemeId);
      }
    }).catch(() => message.error('方案列表加载失败'));
  }, []);

  const schemeOptions = useMemo(() => schemes.map((s) => ({
    label: `${s.schemeCode} · ${s.schemeName} (${s.status})`,
    value: s.schemeId,
  })), [schemes]);

  const handleQueryAsset = () => {
    if (!assetId.trim()) {
      message.warning('请输入借据 ID');
      return;
    }
    message.success('借据信息已加载：公司贷款，CRR_5，余额 200 万');
  };

  const handleRunTrial = async () => {
    if (!selectedSchemeId) {
      message.warning('请选择方案');
      return;
    }
    if (!assetId.trim()) {
      message.warning('请输入借据 ID');
      return;
    }
    setLoading(true);
    try {
      const res = await trialApi.runTrial({
        schemeId: selectedSchemeId,
        assetId: assetId.trim(),
        calcDate: calcDate.format('YYYY-MM-DD'),
        scope,
      });
      setResult((res.data as any)?.data || res.data);
      message.success('试算完成');
    } catch (err) {
      console.error(err);
      message.error('试算失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ecl-page">
      <PageHeader
        title="试算中心"
        subtitle="快速验证参数调整后的 ECL 计算结果，不写入正式跑批数据"
      />

      <Panel
        title="试算条件"
        extra={<span className="ecl-muted" style={{ fontSize: 12 }}>DRAFT 模式 · 不写入正式数据</span>}
      >
        <div className="trial-form-row">
          <div className="trial-field">
            <label>选择方案</label>
            <Select
              style={{ width: 320 }}
              placeholder="请选择 ECL 方案"
              value={selectedSchemeId || undefined}
              onChange={setSelectedSchemeId}
              options={schemeOptions}
            />
          </div>
          <div className="trial-field">
            <label>试算日期</label>
            <DatePicker value={calcDate} onChange={(v) => v && setCalcDate(v)} />
          </div>
          <div className="trial-field">
            <label>试算范围</label>
            <Radio.Group value={scope} onChange={(e) => setScope(e.target.value)}>
              <Radio value="SINGLE">单笔借据</Radio>
              <Radio value="BATCH" disabled>批量试算</Radio>
            </Radio.Group>
          </div>
        </div>
        <div className="trial-actions">
          <Input
            className="trial-asset-input"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            placeholder="借据 ID"
          />
          <Button icon={<SearchOutlined />} onClick={handleQueryAsset}>查询</Button>
          <Button
            type="primary"
            icon={<ExperimentOutlined />}
            loading={loading}
            onClick={handleRunTrial}
          >
            开始试算
          </Button>
        </div>
      </Panel>

      {result && (
        <Panel
          title="试算结果"
          extra={
            <Space>
              <span className="ecl-mono">{result.jobId}</span>
              <Tag color="green">试算完成 {result.durationMs}ms</Tag>
              <Button size="small" icon={<DownloadOutlined />} onClick={() => message.info('试算报告导出待接入')}>
                导出报告
              </Button>
            </Space>
          }
        >
          <div className="trial-result-meta">
            <span><strong>借据：</strong>{result.assetId}</span>
            <span>{result.groupLabel}</span>
            <span>产品：{result.productType}</span>
            <span>CRR 评级：{result.ratingCode}</span>
          </div>

          {result.steps.map((step) => (
            <TrialStep key={step.key} step={step} />
          ))}

          <div className="trial-final-bar">
            <div>
              <div className="trial-final-label">阶段</div>
              <div className="trial-final-value">{result.stage}</div>
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
              <div className="trial-final-label">ECL 最终</div>
              <div className="trial-final-value emphasis">{result.eclFinal}</div>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
};

const TrialStep: React.FC<{ step: TrialStepVO }> = ({ step }) => (
  <div className="trial-step">
    <div className="trial-step-header">
      <span className="trial-step-icon">✓</span>
      <span className="trial-step-title">{step.title}</span>
      <span className="trial-step-summary">{step.summary}</span>
    </div>
    <div className="trial-step-body">
      {step.note && <div className="trial-note">{step.note}</div>}
      {step.scenarioRows && step.scenarioRows.length > 0 ? (
        <table className="trial-scenario-table">
          <thead>
            <tr>
              <th>情景</th>
              <th>权重</th>
              <th>12M PD</th>
              <th>加权 PD</th>
            </tr>
          </thead>
          <tbody>
            {step.scenarioRows.map((row) => (
              <tr key={row.scenario} className={row.highlight ? 'highlight' : undefined}>
                <td>{row.scenario}</td>
                <td>{row.weight}</td>
                <td>{row.pd}</td>
                <td>{row.weightedPd}</td>
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
