# 试算中心 Excel 导入功能

## 概述
在试算中心增加 Excel 模板下载和导入功能，用户可下载包含6个 sheet 的 Excel 模板，填好后一键导入，数据直接填充到页面6张源数据表中。

## 范围
纯前端改动，后端零修改。

## 技术方案
- 库: `xlsx` (SheetJS) ~500KB
- 模板生成: 前端 JS 构建 workbook → 浏览器下载
- 导入解析: 前端 FileReader 读取 → `XLSX.read()` 解析 → 字段映射 → 填充 state

## UI 改动
- 在"试算条件"Panel 顶部新增两个按钮:
  - 「下载模板」: 下载包含6个 sheet 的空模板 Excel
  - 「导入 Excel」: 选择文件，解析并填充6张表
- 导入错误时使用 `message.warning` 汇总提示跳过的行数

## 新增文件
- `src/utils/excelTemplate.ts` — 模板生成
- `src/utils/excelParser.ts` — 导入解析与校验
- `src/utils/excelFields.ts` — 6张表的字段定义(元数据)

## 修改文件
- `src/pages/trial/TrialCenter.tsx` — 添加按钮 + 导入逻辑

## 数据处理
- 导入策略: 覆盖替换(清空6张表后用 Excel 数据填充)
- 错误处理: 跳过错误行 + message 汇总提示(不存在 sheet 则跳过该表)
