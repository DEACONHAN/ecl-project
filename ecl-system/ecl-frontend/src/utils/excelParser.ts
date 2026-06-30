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
                    const yyyy = value.getFullYear();
                    const mm = String(value.getMonth() + 1).padStart(2, '0');
                    const dd = String(value.getDate()).padStart(2, '0');
                    value = `${yyyy}-${mm}-${dd}`;
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
