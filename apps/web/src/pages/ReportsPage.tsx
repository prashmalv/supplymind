import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { ReportTable } from '@supplymind/shared';
import { useMisReports } from '../lib/misApi';
import { ChartCard, Loading, PageHeader, ExportBtn } from '../components/mis/kit';
import { printPage } from '../lib/exportData';

const th = 'py-2 px-3 font-semibold text-[11px] uppercase tracking-wider text-slate-500 whitespace-nowrap';
const rowBorder = 'border-b border-slate-200 dark:border-white/5 last:border-0';

const isNumericCol = (rows: (string | number)[][], i: number) =>
  rows.length > 0 && rows.every((r) => typeof r[i] === 'number');

const ReportBlock: React.FC<{ r: ReportTable }> = ({ r }) => (
  <ChartCard title={r.name} subtitle={r.description}>
    <div className="flex justify-end mb-2">
      <ExportBtn filename={r.key} columns={r.columns} rows={r.rows} />
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={`text-left ${rowBorder}`}>
            {r.columns.map((c, i) => (
              <th key={c} className={`${th} ${isNumericCol(r.rows, i) ? 'text-right' : ''}`}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {r.rows.map((row, ri) => (
            <tr key={ri} className={`${rowBorder} hover:bg-slate-100/60 dark:hover:bg-white/[0.02]`}>
              {row.map((cell, ci) => (
                <td key={ci} className={`py-2 px-3 ${typeof cell === 'number' ? 'text-right tabular-nums text-slate-700 dark:text-slate-200' : 'text-slate-600 dark:text-slate-300'}`}>
                  {typeof cell === 'number' ? cell.toLocaleString('en-IN') : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </ChartCard>
);

export const ReportsPage: React.FC = () => {
  const { data, isLoading } = useMisReports();
  const [group, setGroup] = useState<string>('All');
  if (isLoading || !data) return <Loading />;

  if (data.length === 0) {
    return (
      <div>
        <PageHeader title="Operational MIS Reports" subtitle="Automated, exportable reports from SAP ECC" />
        <ChartCard title="No reports configured">
          <p className="text-sm text-slate-500">Operational reports are available for the Bajaj Energy dataset.</p>
        </ChartCard>
      </div>
    );
  }

  const groups = ['All', ...Array.from(new Set(data.map((r) => r.group || 'Other')))];
  const shown = group === 'All' ? data : data.filter((r) => (r.group || 'Other') === group);

  return (
    <div>
      <PageHeader
        title="Operational MIS Reports"
        subtitle="Automated, exportable reports — replaces manual Excel consolidation"
        right={
          <button
            onClick={printPage}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <Printer size={14} /> Print / PDF
          </button>
        }
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              group === g
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {shown.map((r) => <ReportBlock key={r.key} r={r} />)}
      </div>
    </div>
  );
};
