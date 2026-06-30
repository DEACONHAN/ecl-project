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
