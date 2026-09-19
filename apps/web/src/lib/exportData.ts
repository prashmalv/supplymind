// Lightweight client-side export helpers for the demo (Excel via CSV, PDF via
// the browser print dialog). Production would render server-side XLSX/PDF/PPT.

export function exportCsv(filename: string, columns: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [columns.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printPage() {
  window.print();
}

/** Export to a real .xlsx workbook. SheetJS is dynamically imported so it
 *  stays out of the main bundle until a download is actually triggered. */
export async function exportXlsx(
  filename: string,
  columns: string[],
  rows: (string | number)[][],
  sheetName = 'Report',
) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([columns, ...rows]);
  // Auto-size columns to the widest cell (nice-to-have for the demo).
  ws['!cols'] = columns.map((c, i) => {
    const maxLen = Math.max(String(c).length, ...rows.map((r) => String(r[i] ?? '').length));
    return { wch: Math.min(Math.max(maxLen + 2, 8), 48) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31) || 'Report');
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}
