import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Descriptions, Button, Space, Modal, Form, Input, Select, message, Spin, Typography } from 'antd';
import { EditOutlined, SendOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { schemeApi, type SchemeVO } from '../../api/scheme';
import { Panel, StatusTag } from '../../components';

const moduleCards = [
  {
    key: 'risk-groups', title: '风险分组', desc: '定义资产风险分组及多维匹配规则',
    icon: '📊', iconBg: '#e8effd',
  },
  {
    key: 'stage', title: '阶段划分', desc: '配置三阶段判定规则与阈值',
    icon: '🧩', iconBg: '#fef3e2',
  },
  {
    key: 'pd', title: 'PD 参数', desc: '管理违约概率曲线及情景权重',
    icon: '📈', iconBg: '#e8f5f0',
  },
  {
    key: 'lgd', title: 'LGD 参数', desc: '配置违约损失率及押品折扣/折旧',
    icon: '📉', iconBg: '#fde8ef',
  },
  {
    key: 'ccf', title: 'CCF 参数', desc: '管理信用转换系数曲线',
    icon: '📐', iconBg: '#ede8fd',
  },
  {
    key: 'overlay', title: '管理层叠加', desc: '配置管理层判断的调整规则',
    icon: '🛡️', iconBg: '#e2f0fd',
  },
];

const SchemeOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setSchemeContext } = useOutletContext<any>();
  const [scheme, setScheme] = useState<SchemeVO | null>(null);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchScheme = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await schemeApi.getById(id);
      const s = (res.data as any)?.data || res.data || null;
      setScheme(s);
      if (s) {
        setSchemeContext({
          schemeId: s.schemeId,
          schemeCode: s.schemeCode,
          schemeName: s.schemeName,
          status: s.status,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScheme(); }, [id]);

  const handleEdit = async () => {
    if (!scheme) return;
    const values = await form.validateFields();
    await schemeApi.update(scheme.schemeId, {
      schemeName: values.schemeName,
      description: values.description,
    });
    message.success('方案信息已更新');
    setEditModalOpen(false);
    form.resetFields();
    fetchScheme();
  };

  const handlePublish = async () => {
    if (!scheme) return;
    const values = await form.validateFields();
    await schemeApi.publish(scheme.schemeId, values.immediate, values.effectiveDate);
    message.success('方案发布成功');
    setPublishModalOpen(false);
    form.resetFields();
    fetchScheme();
  };

  const handleDelete = async () => {
    if (!scheme) return;
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个 DRAFT 方案吗？',
      okButtonProps: { danger: true },
      onOk: async () => {
        await schemeApi.delete(scheme.schemeId);
        message.success('已删除');
        navigate('/schemes');
      },
    });
  };

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 100 }} />;
  if (!scheme) return <Panel><Typography.Text type="secondary">方案不存在或已删除</Typography.Text></Panel>;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <a onClick={() => navigate('/schemes')} style={{ color: 'var(--color-text-secondary)', cursor: 'pointer', textDecoration: 'none' }}>
          方案管理
        </a>
        <span style={{ color: 'var(--color-text-muted)' }}>/</span>
        <span>{scheme.schemeCode} · {scheme.schemeName}</span>
      </div>

      {/* Info Panel */}
      <Panel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{scheme.schemeName}</h1>
              <StatusTag status={scheme.status as any}>{scheme.statusDisplay}</StatusTag>
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              方案编码：{scheme.schemeCode} · 版本 {scheme.schemeVersion}
            </div>
          </div>
          <Space>
            {scheme.status === 'DRAFT' && (
              <>
                <Button icon={<EditOutlined />}
                  onClick={() => { form.setFieldsValue(scheme); setEditModalOpen(true); }}>编辑</Button>
                <Button type="primary" icon={<SendOutlined />}
                  onClick={() => setPublishModalOpen(true)}>发布</Button>
                <Button danger icon={<DeleteOutlined />}
                  onClick={handleDelete}>删除</Button>
              </>
            )}
            <Button onClick={() => {
              Modal.confirm({
                title: '基于本方案复制',
                content: '将基于当前方案创建一份全新的 DRAFT 方案。',
                onOk: async () => {
                  await schemeApi.copy('基于 ' + scheme.schemeCode + ' 复制');
                  message.success('复制成功');
                  navigate('/schemes');
                },
              });
            }}>基于本方案复制</Button>
          </Space>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div className="info-item">
            <div className="info-label">生效日期</div>
            <div className="info-value">{scheme.effectiveDate || '-'}</div>
          </div>
          <div className="info-item">
            <div className="info-label">创建人</div>
            <div className="info-value">{scheme.createdBy}</div>
          </div>
          <div className="info-item">
            <div className="info-label">创建时间</div>
            <div className="info-value">{scheme.createdAt}</div>
          </div>
          <div className="info-item">
            <div className="info-label">变更说明</div>
            <div className="info-value">{scheme.description || '-'}</div>
          </div>
        </div>
      </Panel>

      {/* Scheme-level Parameters */}
      <Panel title="方案级缺省参数" extra={<span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>点击可编辑</span>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <div className="info-item param-item" onClick={() => message.info('编辑折扣率功能')}>
            <div className="info-label">折扣率 (discount_rate)</div>
            <div className="info-value" style={{ color: 'var(--color-primary)' }}>{scheme.discountRate}%</div>
          </div>
          <div className="info-item param-item" onClick={() => message.info('编辑默认CCF功能')}>
            <div className="info-label">默认 CCF (default_ccf)</div>
            <div className="info-value" style={{ color: 'var(--color-primary)' }}>{scheme.defaultCcf}</div>
          </div>
          <div className="info-item param-item" onClick={() => message.info('编辑默认LGD功能')}>
            <div className="info-label">默认 LGD (default_lgd)</div>
            <div className="info-value" style={{ color: 'var(--color-primary)' }}>{scheme.defaultLgd}</div>
          </div>
        </div>
      </Panel>

      {/* Module Cards Grid */}
      <Panel title="参数模块">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {moduleCards.map((mod) => (
            <div
              key={mod.key}
              className="module-card"
              onClick={() => navigate(`/parameters/${mod.key}?schemeId=${scheme.schemeId}`)}
            >
              <div className="mc-icon" style={{ background: mod.iconBg }}>{mod.icon}</div>
              <div className="mc-title">{mod.title}</div>
              <div className="mc-desc">{mod.desc}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Modals same as before — edit / publish */}
      <Modal title="编辑方案" open={editModalOpen}
        onOk={handleEdit} onCancel={() => { setEditModalOpen(false); form.resetFields(); }}
        okText="保存" cancelText="取消">
        <Form form={form} layout="vertical">
          <Form.Item name="schemeName" label="方案名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="变更说明">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="发布方案" open={publishModalOpen}
        onOk={handlePublish} onCancel={() => { setPublishModalOpen(false); form.resetFields(); }}
        okText="发布" cancelText="取消">
        <p>方案：{scheme.schemeName}（{scheme.schemeCode}）</p>
        <Form form={form} layout="vertical" initialValues={{ immediate: true }}>
          <Form.Item name="immediate" label="生效方式">
            <Select options={[
              { label: '立即生效', value: true },
              { label: '计划生效', value: false },
            ]} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.immediate !== cur.immediate}>
            {({ getFieldValue }) =>
              getFieldValue('immediate') === false ? (
                <Form.Item name="effectiveDate" label="计划生效日期" rules={[{ required: true }]}>
                  <Input type="date" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .info-item { }
        .info-label {
          font-size: 11px;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .info-value {
          font-size: 15px;
          font-weight: 600;
          margin-top: 3px;
        }
        .param-item {
          cursor: pointer;
          padding: 8px;
          border-radius: var(--radius-sm);
          transition: background var(--transition-fast);
        }
        .param-item:hover {
          background: var(--color-bg-alt);
        }
        .module-card {
          padding: 14px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.12s;
        }
        .module-card:hover {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-xs);
        }
        .mc-icon {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          margin-bottom: 6px;
        }
        .mc-title {
          font-size: 14px;
          font-weight: 500;
        }
        .mc-desc {
          font-size: 11px;
          color: var(--color-text-secondary);
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
};

export default SchemeOverview;
