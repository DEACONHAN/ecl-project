# 阶段划分条件 — 逾期天数范围开/闭区间支持

## 目标

阶段划分的条件编辑器中，"逾期天数"条件新增范围类型，支持设置开/闭区间边界（如 `30 < 逾期天数 ≤ 90`）。

## 新增条件类型

在编辑器条件列表中新增 `"逾期天数范围"` 类型，与现有的 `"逾期天数"`（单侧比较）并列。

### 编辑器 JSON 格式

```json
{
  "type": "逾期天数范围",
  "min": 31,
  "minExclusive": true,
  "max": 90,
  "maxExclusive": false
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 固定值 `"逾期天数范围"` |
| `min` | number | 否 | 下限值（至少填一个边界） |
| `minExclusive` | boolean | 否 | 默认 `false`。`true` = 左开 `x <`，`false` = 左闭 `x ≤` |
| `max` | number | 否 | 上限值（至少填一个边界） |
| `maxExclusive` | boolean | 否 | 默认 `false`。`true` = 右开 `< x`，`false` = 右闭 `≤ x` |

- 如果 `min > max`：条件直接返回 `false`（无效区间）
- 向前兼容：`minExclusive`/`maxExclusive` 未传时默认闭区间

### 原始 JSON 格式（向后兼容扩展）

现有 `evaluateRange` 处理的 `{"overdue_days": {"min": 31, "max": 90}}` 增加可选 key：

```json
{"overdue_days": {"min": 31, "minExclusive": true, "max": 90, "maxExclusive": false}}
```

---

## 后端改动

### StageConditionEvaluator.java

**1. `evaluateEditorCondition` 新增 case：**

```java
case "逾期天数范围" -> evaluateRangeCondition(asset.getOverdueDays(), condition);
```

**2. 新增 `evaluateRangeCondition` 方法：**

```java
private static boolean evaluateRangeCondition(Integer actual, Map<String, Object> condition) {
    if (actual == null) return false;
    Integer min = condition.get("min") != null ? toInt(condition.get("min")) : null;
    Integer max = condition.get("max") != null ? toInt(condition.get("max")) : null;
    boolean minEx = Boolean.TRUE.equals(condition.get("minExclusive"));
    boolean maxEx = Boolean.TRUE.equals(condition.get("maxExclusive"));
    if (min != null && max != null && min > max) return false;
    if (min != null && (minEx ? actual <= min : actual < min)) return false;
    if (max != null && (maxEx ? actual >= max : actual > max)) return false;
    return true;
}
```

**3. 更新现有 `evaluateRange` 方法：**

在 `min`/`max` 比较中增加 `exclusive` 标记判断，逻辑与 `evaluateRangeCondition` 一致。向前兼容（无 `minExclusive`/`maxExclusive` 时默认闭区间）。

---

## 前端改动

### StageConfig.tsx

**1. 条件描述函数 `conditionLabel` 新增：**

```ts
case '逾期天数范围': {
  const left = c.minExclusive ? `${c.min} < ` : `${c.min} ≤ `;
  const right = c.maxExclusive ? ` < ${c.max}` : ` ≤ ${c.max}`;
  return `逾期天数 ${left}x${right} 天`;
}
```

**2. 类型下拉框新增选项：**

在 `<select>` 中追加 `<option value="逾期天数范围">逾期天数(范围)</option>`。

**3. 条件编辑 UI 新增范围编辑：**

选中 `"逾期天数范围"` 时渲染：

```
[☐ 左开] 最小值: [____]  ~  最大值: [____]  [☐ 右开]
```

- 两个 `<InputNumber>` 组件（`min` / `max`）
- 两个 checkbox（`minExclusive` / `maxExclusive`），默认未勾选（闭区间）
- 至少填一个边界值；`min` 和 `max` 同时为空时不添加条件

**4. 条件标签中渲染可读文本：**

使用 `conditionLabel` 输出如 `30 < 逾期天数 ≤ 90 天`。

**5. JSON 序列化更新：**

在 JSON 预览区，`"逾期天数范围"` 序列化为 `{type, min, minExclusive, max, maxExclusive}`。

**6. 条件列表显示：**

现有 `"逾期天数"` 条件的显示逻辑不变；`"逾期天数范围"` 在列表中显示为独立的条件条目。

**7. 验证：**

- `min > max`：编辑时前端阻止保存，提示"最小值不能大于最大值"
- 至少一个边界非空

---

## 测试

### 后端单元测试

- 左开右闭区间 `30 < x ≤ 90`，实际值 45 → true
- 左开右闭区间 `30 < x ≤ 90`，实际值 30 → false（开区间不含边界）
- 左开右闭区间 `30 < x ≤ 90`，实际值 91 → false
- 左闭右开区间 `30 ≤ x < 90`，实际值 30 → true
- 缺省边界（无 minExclusive/maxExclusive）→ 向前兼容，等同闭区间
- min > max → false
- min 和 max 均为 null → true（无条件通过）
- actual 为 null → false

### 前端验证

- 范围条件在列表中的显示格式正确
- 开/闭切换后预览 JSON 正确
- min > max 时提示不可保存
- 构建无 TS 错误
