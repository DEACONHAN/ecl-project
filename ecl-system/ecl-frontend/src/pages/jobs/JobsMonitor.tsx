import React, { useEffect, useState } from 'react';
import { Button, Drawer, Empty, Space, Table, Tag, message, Collapse, Descriptions } from 'antd';
import { ReloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { PageHeader, Panel } from '../../components';
import { jobsApi, type EclJobVO, type EclJobDetailVO } from '../../api/jobs';
import './JobsMonitor.css';

const statusColor: Record<string, string> = {
  SUCCESS: 'green',
  PROCESSING: 'blue',
  FAILED: 'red',
};

/** Parse request payload JSON into typed source tables */
function parseRequestPayload(json?: string): Record<string, unknown> | null {
  if (!json) return null;
  try { return JSON.parse(json); } catch { return null; }
}

/** Render a key-value table from a flat object */
function SourceTable({ data, title }: { data: unknown[] | undefined; title: string }) {
  if (!data || data.length === 0) return null;
  const rows = data as Record<string, unknown>[];
  const keys = Object.keys(rows[0] || {}).filter((k) => !k.startsWith('_'));
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--color-text)' }}>{title}（{rows.length} 行）</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="ecl-table" style={{ fontSize: 11 }}>
          <thead>
            <tr>{keys.map((k) => <th key={k}>{k}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>{keys.map((k) => <td key={k}>{String(row[k] ?? '-')}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Parse error JSON string into a readable object */
function parseError(json?: string): Record<string, string> | null {
  if (!json || json === '{}') return null;
  try { return JSON.parse(json); } catch { return null; }
}

const JobsMonitor: React.FC = () => {
  const [jobs, setJobs] = useState<EclJobVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<EclJobVO | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await jobsApi.list();
      setJobs((res.data as any)?.data || res.data || []);
    } catch {
      message.error('任务列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJobs(); }, []);

  const openDetail = async (jobId: string) => {
    try {
      const res = await jobsApi.getById(jobId);
      setDetail((res.data as any)?.data || res.data);
      setDetailOpen(true);
    } catch {
      message.error('任务详情加载失败');
    }
  };

  const columns = [
    { title: '任务 ID', dataIndex: 'jobId', key: 'jobId', width: 220, render: (v: string) => <span className="ecl-mono">{v.slice(0, 12)}…</span> },
    { title: '方案', dataIndex: 'schemeId', key: 'schemeId', width: 200, render: (v: string) => <span className="ecl-mono">{v}</span> },
    { title: '计量日', dataIndex: 'calcDate', key: 'calcDate', width: 120 },
    {
      title: '模式', dataIndex: 'trialMode', key: 'trialMode', width: 80,
      render: (v: boolean) => <Tag color={v ? 'purple' : 'default'}>{v ? '试算' : '正式'}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v: string) => <Tag color={statusColor[v] || 'default'}>{v}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 120,
      render: (_: unknown, record: EclJobVO) => (
        <Button type="link" icon={<FileTextOutlined />} onClick={() => openDetail(record.jobId)}>明细</Button>
      ),
    },
  ];

  return (
    <div className="ecl-page">
      <PageHeader
        title="跑批监控"
        subtitle="查看 ECL 试算任务的输入数据、计算明细与输出结果"
        extra={<Button icon={<ReloadOutlined />} onClick={loadJobs} loading={loading}>刷新</Button>}
      />

      <Panel title="任务列表">
        <Table
          columns={columns}
          dataSource={jobs}
          rowKey="jobId"
          loading={loading}
          locale={{ emptyText: <Empty description="暂无计算任务" /> }}
          pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 个任务` }}
        />
      </Panel>

      <Drawer
        title={detail ? `任务详情 · ${detail.jobId}` : '任务详情'}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={1100}
      >
        {detail && <JobDetailView job={detail} />}
      </Drawer>
    </div>
  );
};

/** ── Job Detail View ── */
const JobDetailView: React.FC<{ job: EclJobVO }> = ({ job }) => {
  const payload = parseRequestPayload(job.requestPayload);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── 1. Input ── */}
      <Panel title="📥 输入数据">
        {payload ? (
          <Collapse
            size="small"
            items={[
              payload.loans && { key: 'loans', label: `借据信息表（${(payload.loans as unknown[]).length} 行）`, children: <SourceTable data={payload.loans as unknown[]} title="" /> },
              payload.facilities && { key: 'facilities', label: `授信额度表（${(payload.facilities as unknown[]).length} 行）`, children: <SourceTable data={payload.facilities as unknown[]} title="" /> },
              payload.repaymentSchedules && { key: 'repayments', label: `还款计划表（${(payload.repaymentSchedules as unknown[]).length} 行）`, children: <SourceTable data={payload.repaymentSchedules as unknown[]} title="" /> },
              payload.collaterals && { key: 'collaterals', label: `抵质押品表（${(payload.collaterals as unknown[]).length} 行）`, children: <SourceTable data={payload.collaterals as unknown[]} title="" /> },
              payload.ratings && { key: 'ratings', label: `评级信息表（${(payload.ratings as unknown[]).length} 行）`, children: <SourceTable data={payload.ratings as unknown[]} title="" /> },
              payload.historicalStages && { key: 'stages', label: `历史阶段表（${(payload.historicalStages as unknown[]).length} 行）`, children: <SourceTable data={payload.historicalStages as unknown[]} title="" /> },
            ].filter((x): x is NonNullable<typeof x> => !!x).map((item, i) => ({ ...item, key: String(i) }))}
          />
        ) : (
          <Empty description="无输入数据记录" />
        )}
      </Panel>

      {/* ── 2. Output ── */}
      <Panel title="📊 输出结果 · 计算明细">
        {job.details && job.details.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="ecl-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th>借据 ID</th>
                  <th>分组</th>
                  <th>阶段</th>
                  <th>EAD</th>
                  <th>LGD</th>
                  <th>ECL 加权</th>
                  <th>叠加</th>
                  <th>ECL 最终</th>
                  <th>状态</th>
                  <th>异常摘要</th>
                </tr>
              </thead>
              <tbody>
                {job.details.map((d: EclJobDetailVO) => {
                  const errs = parseError(d.errorSummary);
                  return (
                    <tr key={d.detailId}>
                      <td><span className="ecl-mono">{d.assetId}</span></td>
                      <td>{d.groupId || '-'}</td>
                      <td>{d.stageResult || '-'}</td>
                      <td>{d.eadTotal != null ? d.eadTotal.toFixed(2) : '-'}</td>
                      <td>{d.lgdValue != null ? (d.lgdValue * 100).toFixed(2) + '%' : '-'}</td>
                      <td>{d.eclWeighted != null ? d.eclWeighted.toFixed(2) : '-'}</td>
                      <td>{d.eclOverlayTotal != null ? d.eclOverlayTotal.toFixed(2) : '-'}</td>
                      <td><strong>{d.eclFinal != null ? d.eclFinal.toFixed(2) : '-'}</strong></td>
                      <td><Tag color={d.calcStatus === 'SUCCESS' ? 'green' : 'orange'}>{d.calcStatus || '-'}</Tag></td>
                      <td style={{ maxWidth: 260, whiteSpace: 'pre-wrap', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        {errs ? Object.entries(errs).map(([k, v]) => `${k}: ${v}`).join('\n') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty description="暂无计算明细" />
        )}
      </Panel>

      {/* ── 3. Error Summary ── */}
      {job.errorSummary && job.errorSummary !== '{}' && (
        <Panel title="⚠️ 错误摘要">
          <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', margin: 0 }}>
            {JSON.stringify(JSON.parse(job.errorSummary), null, 2)}
          </pre>
        </Panel>
      )}
    </div>
  );
};

export default JobsMonitor;
