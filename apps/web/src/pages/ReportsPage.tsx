import React, { useMemo, useState } from 'react';
import { Printer, FileSpreadsheet } from 'lucide-react';
import { ReportTable } from '@supplymind/shared';
import { useMisReports } from '../lib/misApi';
import { ChartCard, Loading, PageHeader } from '../components/mis/kit';
import { DataExplorer } from '../components/mis/DataExplorer';
import { printPage } from '../lib/exportData';

const GROUP_ORDER = ['All', 'Management', 'Procurement', 'Inventory', 'Vendor', 'Other'];

export const ReportsPage: React.FC = () => {
  const { data, isLoading } = useMisReports();
  const [group, setGroup] = useState<string>('All');

  const groups = useMemo(() => {
    if (!data) return ['All'];
    const present = new Set(data.map((r) => r.group || 'Other'));
    return GROUP_ORDER.filter((g) => g === 'All' || present.has(g));
  }, [data]);

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

  const shown: ReportTable[] = group === 'All' ? data : data.filter((r) => (r.group || 'Other') === group);

  return (
    <div>
      <PageHeader
        title="Operational MIS Reports"
        subtitle="Search, filter by month, sort and export — replaces manual Excel consolidation"
        right={
          <button onClick={printPage}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <Printer size={14} /> Print / PDF
          </button>
        }
      />

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {groups.map((g) => {
          const count = g === 'All' ? data.length : data.filter((r) => (r.group || 'Other') === g).length;
          return (
            <button key={g} onClick={() => setGroup(g)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors inline-flex items-center gap-1.5 ${
                group === g ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}>
              {g}
              <span className={`text-[10px] tabular-nums rounded-full px-1.5 ${group === g ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/10'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {shown.map((r) => (
          <ChartCard key={r.key} title={r.name} subtitle={r.description}
            className={r.group === 'Management' && r.key.startsWith('monthly') ? 'xl:col-span-2' : ''}>
            <div className="flex items-center gap-1.5 mb-2 text-[11px] text-slate-400">
              <FileSpreadsheet size={12} /> {r.group || 'Report'}
            </div>
            <DataExplorer data={{ title: r.name, subtitle: r.description, columns: r.columns, rows: r.rows }} maxHeight="360px" />
          </ChartCard>
        ))}
      </div>
    </div>
  );
};
