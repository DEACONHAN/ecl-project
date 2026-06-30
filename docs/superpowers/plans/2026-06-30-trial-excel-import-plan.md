# Trial Center Excel Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Excel template download and import to Trial Center — one-click import fills 6 source data tables.

**Architecture:** Pure frontend feature using SheetJS. `excelFields.ts` defines column metadata for all 6 tables, `excelTemplate.ts` generates the downloadable .xlsx workbook, `excelParser.ts` reads and validates uploaded files, and `TrialCenter.tsx` wires the two buttons to the parser and state setters.

**Tech Stack:** React 18, TypeScript, Ant Design, `xlsx` (SheetJS), dayjs

## Global Constraints

- `xlsx` library version: latest (~0.18.x), install via npm
- Import strategy: replace all 6 table states with parsed data
- Error handling: skip bad rows, show count via `message.warning`
- No backend changes

---

### Task 1: Install xlsx dependency and create field definitions

**Files:**
- Create: `ecl-system/ecl-frontend/src/utils/excelFields.ts`

**Interfaces:**
- Produces: `SheetField` type, `SHEET_CONFIGS` array, `SheetKey` type

- [ ] **Step 1: Install the xlsx package**

```bash
cd /home/workspace/EclProject/ecl-system/ecl-frontend && npm install xlsx
```

Expected: package added to package.json, no errors.

- [ ] **Step 2: Create excelFields.ts with field metadata**

Create `ecl-system/ecl-frontend/src/utils/excelFields.ts`:

```typescript
export interface SheetField {
  key: string;        // DTO property name, e.g. 'id', 'customerNo'
  label: string;      // Column header in Excel, e.g. '借据编号'
  type: 'string' | 'number' | 'date';  // For parsing coercion
  required?: boolean; // If true, row skipped when empty
}

export type SheetKey = 'loans' | 'facilities' | 'repaymentSchedules' | 'collaterals' | 'ratings' | 'historicalStages';

export interface SheetConfig {
  key: SheetKey;
  title: string;       // Excel sheet name, e.g. '借据信息表'
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
```

- [ ] **Step 3: Commit**

```bash
git add ecl-system/ecl-frontend/src/utils/excelFields.ts ecl-system/ecl-frontend/package.json ecl-system/ecl-frontend/package-lock.json
git commit -m "feat: add excel field definitions and xlsx dependency"
```

---

### Task 2: Create Excel template generator

**Files:**
- Create: `ecl-system/ecl-frontend/src/utils/excelTemplate.ts`

**Interfaces:**
- Consumes: `SHEET_CONFIGS` from `./excelFields`
- Produces: `downloadExcelTemplate()` function

- [ ] **Step 1: Create excelTemplate.ts**

Create `ecl-system/ecl-frontend/src/utils/excelTemplate.ts`:

```typescript
import * as XLSX from 'xlsx';
import { SHEET_CONFIGS } from './excelFields';

/**
 * Generate and download the Excel template with header rows only.
 * Each sheet corresponds to one source data table.
 */
export function downloadExcelTemplate(): void {
  const wb = XLSX.utils.book_new();

  for (const config of SHEET_CONFIGS) {
    // Create header row from field labels
    const headers = config.fields.map((f) => f.label);
    const ws = XLSX.utils.aoa_to_sheet([headers]);

    // Set column widths (approximate, based on label length)
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length * 2, 12) }));

    XLSX.utils.book_append_sheet(wb, ws, config.title);
  }

  XLSX.writeFile(wb, '试算模板.xlsx');
}
```

- [ ] **Step 2: Commit**

```bash
git add ecl-system/ecl-frontend/src/utils/excelTemplate.ts
git commit -m "feat: add excel template generator"
```

---

### Task 3: Create Excel parser with validation

**Files:**
- Create: `ecl-system/ecl-frontend/src/utils/excelParser.ts`

**Interfaces:**
- Consumes: `SHEET_CONFIGS`, `SheetKey` from `./excelFields`
- Produces: `parseTrialExcel(file: File): Promise<ExcelParseResult>`, `ExcelParseResult` type

- [ ] **Step 1: Create excelParser.ts**

Create `ecl-system/ecl-frontend/src/utils/excelParser.ts`:

```typescript
import * as XLSX from 'xlsx';
import { SHEET_CONFIGS, type SheetKey } from './excelFields';

export interface ExcelParseError {
  sheet: string;
  row: number;
  field: string;
  message: string;
}

export interface ExcelParseResult {
  loans: Record<string, unknown>[];
  facilities: Record<string, unknown>[];
  repaymentSchedules: Record<string, unknown>[];
  collaterals: Record<string, unknown>[];
  ratings: Record<string, unknown>[];
  historicalStages: Record<string, unknown>[];
  errors: ExcelParseError[];
}

/**
 * Parse an uploaded Excel file into typed row arrays.
 * Each sheet is matched by name to a SHEET_CONFIG entry.
 * Rows with missing required fields are skipped and recorded as errors.
 */
export function parseTrialExcel(file: File): Promise<ExcelParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const result: ExcelParseResult = {
          loans: [],
          facilities: [],
          repaymentSchedules: [],
          collaterals: [],
          ratings: [],
          historicalStages: [],
          errors: [],
        };

        for (const config of SHEET_CONFIGS) {
          const sheet = workbook.Sheets[config.title];
          if (!sheet) {
            // Sheet not found — skip (user may not have data for this table)
            continue;
          }

          // Convert sheet to array-of-arrays, first row = headers
          const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: undefined,
            raw: false,
            dateNF: 'yyyy-mm-dd',
          });

          if (rows.length < 2) continue; // header only, no data

          const headers = rows[0] as string[];

          // Build label → field mapping
          const labelToField = new Map<string, (typeof config.fields)[0]>();
          for (const f of config.fields) {
            labelToField.set(f.label, f);
          }

          const tableRows: Record<string, unknown>[] = [];

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || (Array.isArray(row) && row.every((c) => c === undefined || c === null || c === ''))) {
              continue; // skip fully empty rows
            }

            const obj: Record<string, unknown> = {};
            let hasError = false;

            for (let col = 0; col < headers.length; col++) {
              const label = headers[col]?.trim();
              if (!label) continue;

              const field = labelToField.get(label);
              if (!field) continue; // unknown column, ignore

              let value: unknown = (row as unknown[])[col];

              // Coerce types
              if (value !== undefined && value !== null && value !== '') {
                if (field.type === 'number') {
                  const num = Number(value);
                  if (isNaN(num)) {
                    result.errors.push({
                      sheet: config.title,
                      row: i,
                      field: field.label,
                      message: `"${value}" 不是有效的数字`,
                    });
                    hasError = true;
                    continue;
                  }
                  value = num;
                } else if (field.type === 'date') {
                  // XLSX with cellDates:true returns Date objects; keep as YYYY-MM-DD string
                  if (value instanceof Date) {
                    value = value.toISOString().slice(0, 10);
                  }
                  value = String(value).trim();
                } else {
                  value = String(value).trim();
                }
              }

              // Check required
              if (field.required && (value === undefined || value === null || value === '')) {
                result.errors.push({
                  sheet: config.title,
                  row: i,
                  field: field.label,
                  message: '必填字段为空',
                });
                hasError = true;
              }

              obj[field.key] = value ?? undefined;
            }

            if (!hasError) {
              tableRows.push(obj);
            }
          }

          // Map to result key
          const keyMapping: Record<string, SheetKey> = {
            loans: 'loans',
            facilities: 'facilities',
            repaymentSchedules: 'repaymentSchedules',
            collaterals: 'collaterals',
            ratings: 'ratings',
            historicalStages: 'historicalStages',
          };

          result[keyMapping[config.key]] = tableRows;
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add ecl-system/ecl-frontend/src/utils/excelParser.ts
git commit -m "feat: add excel parser with validation"
```

---

### Task 4: Wire import/download buttons into TrialCenter.tsx

**Files:**
- Modify: `ecl-system/ecl-frontend/src/pages/trial/TrialCenter.tsx`

**Interfaces:**
- Consumes: `downloadExcelTemplate` from `../../utils/excelTemplate`, `parseTrialExcel` from `../../utils/excelParser`
- Produces: Two new buttons in the "试算条件" Panel, `handleImportExcel` click handler

- [ ] **Step 1: Add imports to TrialCenter.tsx**

Add at top of file (after existing imports, around line 12):

```typescript
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { downloadExcelTemplate } from '../../utils/excelTemplate';
import { parseTrialExcel } from '../../utils/excelParser';
```

- [ ] **Step 2: Add hidden file input ref and import handler**

Add inside the component body (after `const [historicalStages, setHistoricalStages] = ...` around line 143):

```typescript
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportExcel = async (file: File) => {
    try {
      const result = await parseTrialExcel(file);

      setLoans(result.loans.length > 0 ? result.loans as TrialLoanRowReq[] : [makeDefaultLoan()]);
      setFacilities(result.facilities as TrialFacilityRowReq[]);
      setRepaymentSchedules(result.repaymentSchedules as TrialRepaymentRowReq[]);
      setCollaterals(result.collaterals as TrialCollateralRowReq[]);
      setRatings(result.ratings as TrialRatingRowReq[]);
      setHistoricalStages(result.historicalStages as TrialHistoricalStageRowReq[]);

      const totalRows = result.loans.length + result.facilities.length
        + result.repaymentSchedules.length + result.collaterals.length
        + result.ratings.length + result.historicalStages.length;

      if (result.errors.length > 0) {
        message.warning(
          `导入完成：${totalRows} 行数据已填充，${result.errors.length} 行因数据错误被跳过`,
          6,
        );
      } else {
        message.success(`导入完成：${totalRows} 行数据已填充`);
      }
    } catch (err) {
      console.error(err);
      message.error('Excel 解析失败，请确认文件格式正确');
    }
  };
```

- [ ] **Step 3: Add buttons and hidden file input to the "试算条件" Panel**

In the JSX, inside `<Panel title="试算条件" ...>`, right after the opening and before `<div className="trial-form-row">`:

```tsx
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={downloadExcelTemplate}
          >
            下载模板
          </Button>
          <Button
            size="small"
            icon={<UploadOutlined />}
            onClick={() => fileInputRef.current?.click()}
          >
            导入 Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImportExcel(file);
                // Reset so re-selecting same file triggers onChange
                e.target.value = '';
              }
            }}
          />
        </div>
```

- [ ] **Step 4: Verify build compiles**

```bash
cd /home/workspace/EclProject/ecl-system/ecl-frontend && npx tsc --noEmit 2>&1 | head -30
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add ecl-system/ecl-frontend/src/pages/trial/TrialCenter.tsx
git commit -m "feat: add excel import/download buttons to trial center"
```

---

### Task 5: Manual smoke test

**Files:**
- None

- [ ] **Step 1: Verify frontend dev server is running**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: 200

- [ ] **Step 2: Verify template downloads correctly**

Open browser at `http://localhost:3000/trial`, click "下载模板". Template should download as `试算模板.xlsx` with 6 sheets:
- 借据信息表 (23 columns)
- 授信额度表 (12 columns)
- 还款计划表 (6 columns)
- 抵质押品表 (14 columns)
- 评级信息表 (9 columns)
- 历史阶段表 (3 columns)

- [ ] **Step 3: Verify import works**

Fill a few rows in the downloaded template, click "导入 Excel", verify data populates the corresponding tables on the page.

- [ ] **Step 4: Verify error handling**

Delete a required field (e.g., 借据编号 in loans sheet), import. Expected: skipped row + warning message.

