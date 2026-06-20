import React, { useState, useEffect, useCallback } from 'react';
import {
  Select,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Tabs,
  Typography,
  Empty,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { schemeApi, type SchemeVO } from '../../api/scheme';
import { riskGroupApi, type RiskGroupVO } from '../../api/riskGroup';
import {
  stageApi,
  type StageRuleVO,
  type RatingDowngradeRuleVO,
  type StageVO,
} from '../../api/stage';
import { PageHeader, Panel, GroupSelector } from '../../components';

const { TextArea } = Input;

const StageConfig: React.FC = () => {
  const [searchParams] = useSearchParams();
  const schemeIdFromUrl = searchParams.get('schemeId') || '';
  const { schemeContext } = useOutletContext<{ schemeContext?: { schemeId: string } }>();
  const effectiveSchemeId = schemeIdFromUrl || schemeContext?.schemeId || '';

  // ─── 方案 & 分组 ───
  const [schemes, setSchemes] = useState<SchemeVO[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(effectiveSchemeId);
  const [groups, setGroups] = useState<RiskGroupVO[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // ─── 阶段判定规则 ───
  const [stageRules, setStageRules] = useState<StageRuleVO[]>([]);
  const [stageRuleLoading, setStageRuleLoading] = useState(false);
  const [stageRuleModalOpen, setStageRuleModalOpen] = useState(false);
  const [editingStageRule, setEditingStageRule] = useState<StageRuleVO | null>(null);
  const [stageRuleForm] = Form.useForm();

  // ─── 评级下降规则 ───
  const [ratingRules, setRatingRules] = useState<RatingDowngradeRuleVO[]>([]);
  const [ratingRuleLoading, setRatingRuleLoading] = useState(false);
  const [ratingRuleModalOpen, setRatingRuleModalOpen] = useState(false);
  const [editingRatingRule, setEditingRatingRule] = useState<RatingDowngradeRuleVO | null>(null);
  const [ratingRuleForm] = Form.useForm();

  // ─── 阶段列表（用于下拉选择） ───
  const [stages, setStages] = useState<StageVO[]>([]);

  // 加载方案列表
  useEffect(() => {
    schemeApi.list().then((res) => {
      setSchemes((res.data as any)?.data || res.data || []);
    });
  }, []);

  // 方案变化 -> 加载分组 & 阶段
  useEffect(() => {
    if (!selectedSchemeId) {
      setGroups([]);
      setStages([]);
      setSelectedGroupId('');
      setStageRules([]);
      setRatingRules([]);
      return;
    }
    riskGroupApi.listByScheme(selectedSchemeId).then((res) => {
      setGroups((res.data as any)?.data || res.data || []);
    });
    stageApi.list(selectedSchemeId).then((res) => {
      setStages((res.data as any)?.data || res.data || []);
    });
    setSelectedGroupId('');
    setStageRules([]);
    setRatingRules([]);
  }, [selectedSchemeId]);

  // 分组变化 -> 加载规则
  const loadRules = useCallback(async () => {
    if (!selectedSchemeId || !selectedGroupId) {
      setStageRules([]);
      setRatingRules([]);
      return;
    }
    setStageRuleLoading(true);
    setRatingRuleLoading(true);
    try {
      const [stageRes, ratingRes] = await Promise.all([
        stageApi.getRulesByGroup(selectedSchemeId, selectedGroupId),
        stageApi.getRatingRulesByGroup(selectedSchemeId, selectedGroupId),
      ]);
      setStageRules((stageRes.data as any)?.data || stageRes.data || []);
      setRatingRules((ratingRes.data as any)?.data || ratingRes.data || []);
    } finally {
      setStageRuleLoading(false);
      setRatingRuleLoading(false);
    }
  }, [selectedSchemeId, selectedGroupId]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  // ─── 阶段判定规则 CRUD ───
  const handleSaveStageRule = async () => {
    const values = await stageRuleForm.validateFields();
    if (editingStageRule) {
      await stageApi.updateRule(editingStageRule.ruleId!, {
        ...values,
        schemeId: selectedSchemeId,
        groupId: selectedGroupId,
      });
      message.success('阶段判定规则更新成功');
    } else {
      await stageApi.createRule({
        ...values,
        schemeId: selectedSchemeId,
        groupId: selectedGroupId,
      });
      message.success('阶段判定规则创建成功');
    }
    setStageRuleModalOpen(false);
    setEditingStageRule(null);
    stageRuleForm.resetFields();
    loadRules();
  };

  const handleDeleteStageRule = (ruleId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条阶段判定规则吗？',
      onOk: async () => {
        await stageApi.deleteRule(ruleId);
        message.success('已删除');
        loadRules();
      },
    });
  };

  // ─── 评级下降规则 CRUD ───
  const handleSaveRatingRule = async () => {
    const values = await ratingRuleForm.validateFields();
    if (editingRatingRule) {
      await stageApi.updateRatingRule(editingRatingRule.ruleId!, {
        ...values,
        schemeId: selectedSchemeId,
        groupId: selectedGroupId,
      });
      message.success('评级下降规则更新成功');
    } else {
      await stageApi.createRatingRule({
        ...values,
        schemeId: selectedSchemeId,
        groupId: selectedGroupId,
      });
      message.success('评级下降规则创建成功');
    }
    setRatingRuleModalOpen(false);
    setEditingRatingRule(null);
    ratingRuleForm.resetFields();
    loadRules();
  };

  const handleDeleteRatingRule = (ruleId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条评级下降规则吗？',
      onOk: async () => {
        await stageApi.deleteRatingRule(ruleId);
        message.success('已删除');
        loadRules();
      },
    });
  };

  // ─── 渲染 ───
  if (!selectedSchemeId) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px' }}>
        <PageHeader
          title="阶段划分配置"
          subtitle="按风险分组管理阶段判定规则和评级下降规则"
        />
        <Panel>
          <Empty description="请先选择一个 ECL 方案">
            <Select
              style={{ width: 300, marginTop: 16 }}
              placeholder="请选择 ECL 方案"
              value={selectedSchemeId || undefined}
              onChange={setSelectedSchemeId}
              options={schemes.map((s) => ({
                label: `${s.schemeName}(${s.schemeCode})`,
                value: s.schemeId,
              }))}
            />
          </Empty>
        </Panel>
      </div>
    );
  }

  if (!selectedGroupId) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px' }}>
        <PageHeader
          title="阶段划分配置"
          subtitle="按风险分组管理阶段判定规则和评级下降规则"
          extra={
            <Space>
              <Select
                style={{ width: 280 }}
                placeholder="请选择 ECL 方案"
                value={selectedSchemeId || undefined}
                onChange={setSelectedSchemeId}
                options={schemes.map((s) => ({
                  label: `${s.schemeName}(${s.schemeCode})`,
                  value: s.schemeId,
                }))}
              />
            </Space>
          }
        />
        <Panel>
          <Empty description="请先选择一个风险分组">
            {groups.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <GroupSelector
                  groups={groups.map((g) => ({ groupId: g.groupId, groupName: g.groupName, groupCode: g.groupCode }))}
                  onChange={setSelectedGroupId}
                />
              </div>
            )}
          </Empty>
        </Panel>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'stageRules',
      label: '阶段判定规则',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingStageRule(null);
                stageRuleForm.resetFields();
                setStageRuleModalOpen(true);
              }}
            >
              新增规则
            </Button>
          </div>
          <table className="ecl-table">
            <thead>
              <tr>
                <th>规则 ID</th>
                <th>类型</th>
                <th>来源阶段</th>
                <th>目标阶段</th>
                <th>优先级</th>
                <th>观察期(天)</th>
                <th>JSON 条件</th>
                <th style={{ width: 120 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {stageRules.map((r) => (
                <tr key={r.ruleId}>
                  <td>{r.ruleId}</td>
                  <td><Tag color={r.ruleType === 'FORWARD' ? 'blue' : 'orange'}>{r.ruleType}</Tag></td>
                  <td>{r.sourceStage}</td>
                  <td>{r.targetStage}</td>
                  <td>{r.priority}</td>
                  <td>{r.observationDays ?? '-'}</td>
                  <td>{r.jsonCondition ? <code style={{ fontSize: 12 }}>{r.jsonCondition}</code> : '-'}</td>
                  <td>
                    <Space>
                      <Button type="link" size="small" icon={<EditOutlined />}
                        onClick={() => { setEditingStageRule(r); stageRuleForm.setFieldsValue(r); setStageRuleModalOpen(true); }} />
                      <Button type="link" size="small" danger icon={<DeleteOutlined />}
                        onClick={() => handleDeleteStageRule(r.ruleId!)} />
                    </Space>
                  </td>
                </tr>
              ))}
              {stageRules.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 40 }}>暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </>
      ),
    },
    {
      key: 'ratingRules',
      label: '评级下降规则',
      children: (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRatingRule(null);
                ratingRuleForm.resetFields();
                setRatingRuleModalOpen(true);
              }}
            >
              新增规则
            </Button>
          </div>
          <table className="ecl-table">
            <thead>
              <tr>
                <th>当前评级</th>
                <th>下降阈值</th>
                <th style={{ width: 120 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {ratingRules.map((r) => (
                <tr key={r.ruleId}>
                  <td>{r.currentRating}</td>
                  <td>{(r.downgradeThreshold * 100).toFixed(2)}%</td>
                  <td>
                    <Space>
                      <Button type="link" size="small" icon={<EditOutlined />}
                        onClick={() => { setEditingRatingRule(r); ratingRuleForm.setFieldsValue(r); setRatingRuleModalOpen(true); }} />
                      <Button type="link" size="small" danger icon={<DeleteOutlined />}
                        onClick={() => handleDeleteRatingRule(r.ruleId!)} />
                    </Space>
                  </td>
                </tr>
              ))}
              {ratingRules.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 40 }}>暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px' }}>
      <PageHeader
        title="阶段划分配置"
        subtitle="按风险分组管理阶段判定规则和评级下降规则"
        extra={
          <Space>
            <Select
              style={{ width: 280 }}
              placeholder="请选择 ECL 方案"
              value={selectedSchemeId || undefined}
              onChange={setSelectedSchemeId}
              options={schemes.map((s) => ({
                label: `${s.schemeName}(${s.schemeCode})`,
                value: s.schemeId,
              }))}
            />
            <GroupSelector
              groups={groups.map((g) => ({ groupId: g.groupId, groupName: g.groupName, groupCode: g.groupCode }))}
              selectedId={selectedGroupId || undefined}
              onChange={setSelectedGroupId}
            />
          </Space>
        }
      />

      <Panel>
        <Tabs items={tabItems} />
      </Panel>

      {/* ─── 阶段判定规则弹窗 ─── */}
      <Modal
        title={editingStageRule ? '编辑阶段判定规则' : '新增阶段判定规则'}
        open={stageRuleModalOpen}
        onOk={handleSaveStageRule}
        onCancel={() => {
          setStageRuleModalOpen(false);
          stageRuleForm.resetFields();
        }}
      >
        <Form form={stageRuleForm} layout="vertical">
          <Form.Item
            name="ruleType"
            label="规则类型"
            rules={[{ required: true, message: '请选择规则类型' }]}
          >
            <Select
              options={[
                { label: 'FORWARD — 前向判定', value: 'FORWARD' },
                { label: 'ROLLBACK — 回滚判定', value: 'ROLLBACK' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="sourceStage"
            label="来源阶段"
            rules={[{ required: true, message: '请选择来源阶段' }]}
          >
            <Select
              options={stages.map((s) => ({
                label: `${s.stageName}(${s.stageCode})`,
                value: s.stageCode,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="targetStage"
            label="目标阶段"
            rules={[{ required: true, message: '请选择目标阶段' }]}
          >
            <Select
              options={stages.map((s) => ({
                label: `${s.stageName}(${s.stageCode})`,
                value: s.stageCode,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请输入优先级' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="observationDays" label="观察期(天)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="jsonCondition" label="JSON 条件">
            <TextArea rows={3} placeholder='如：{"creditRating": "CCC+"}' />
          </Form.Item>
        </Form>
      </Modal>

      {/* ─── 评级下降规则弹窗 ─── */}
      <Modal
        title={editingRatingRule ? '编辑评级下降规则' : '新增评级下降规则'}
        open={ratingRuleModalOpen}
        onOk={handleSaveRatingRule}
        onCancel={() => {
          setRatingRuleModalOpen(false);
          ratingRuleForm.resetFields();
        }}
      >
        <Form form={ratingRuleForm} layout="vertical">
          <Form.Item
            name="currentRating"
            label="当前评级"
            rules={[{ required: true, message: '请输入当前评级' }]}
          >
            <Input placeholder="如：AAA" />
          </Form.Item>
          <Form.Item
            name="downgradeThreshold"
            label="下降阈值"
            rules={[{ required: true, message: '请输入下降阈值' }]}
          >
            <InputNumber
              min={0}
              max={1}
              step={0.01}
              style={{ width: '100%' }}
              placeholder="0 ~ 1 之间的数值，如 0.05"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StageConfig;
