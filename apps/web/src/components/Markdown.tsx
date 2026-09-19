import React, { useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { Download, FileSpreadsheet, Table2, Pin, Check } from 'lucide-react';
import { getCategorical, getChrome } from '../lib/viz';
import { useTheme } from '../theme/ThemeProvider';
import { DarkTooltip } from './mis/kit';
import { exportCsv, exportXlsx } from '../lib/exportData';
import { addWidget, ChartSpec, ReportSpec } from '../lib/dashboardStore';
import { useAuth } from '../auth/AuthProvider';

/** "Pin to My Dashboard" — saves this chart/report as a custom widget. */
const PinToDashboard: React.FC<{ make: () => Parameters<typeof addWidget>[1] }> = ({ make }) => {
  const { currentOrgId } = useAuth();
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => { addWidget(currentOrgId || 'default', make()); setDone(true); setTimeout(() => setDone(false), 2500); }}
      title="Pin to My Dashboard"
      className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-md px-2 py-1 border transition-colors ${
        done ? 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
             : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
      }`}
    >
      {done ? <><Check size={12} /> Pinned</> : <><Pin size={12} /> Pin</>}
    </button>
  );
};

/** A model-generated report table with one-click CSV / Excel download. */
const MdReport: React.FC<{ spec: ReportSpec }> = ({ spec }) => {
  const cols = spec.columns || [];
  const rows = spec.rows || [];
  const name = (spec.filename || spec.title || 'supplymind-report').replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '-').toLowerCase() || 'report';
  const preview = rows.slice(0, 50);
  return (
    <div className="my-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <Table2 size={14} className="text-red-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{spec.title || 'Generated report'}</span>
          <span className="text-[11px] text-slate-400 tabular-nums flex-shrink-0">{rows.length} rows</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <PinToDashboard make={() => ({ kind: 'report', title: spec.title || 'Report', width: 'full', reportSpec: spec })} />
          <button onClick={() => exportCsv(name, cols, rows)} title="Download CSV"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-md px-2 py-1 hover:bg-slate-100 dark:hover:bg-white/10">
            <Download size={12} /> CSV
          </button>
          <button onClick={() => exportXlsx(name, cols, rows, spec.title || 'Report')} title="Download Excel (.xlsx)"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-md px-2 py-1">
            <FileSpreadsheet size={12} /> Excel
          </button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-72">
        <table className="w-full text-xs">
          <thead className="sticky top-0">
            <tr className="bg-slate-100/90 dark:bg-[#0b1220]/95">
              {cols.map((h, hi) => <th key={hi} className="text-left font-semibold text-slate-600 dark:text-slate-300 px-2.5 py-1.5 whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {preview.map((r, ri) => (
              <tr key={ri} className="border-t border-slate-200 dark:border-white/5">
                {r.map((c, ci) => (
                  <td key={ci} className={`px-2.5 py-1.5 whitespace-nowrap ${typeof c === 'number' ? 'text-right tabular-nums text-slate-800 dark:text-slate-100' : 'text-slate-700 dark:text-slate-200'}`}>
                    {typeof c === 'number' ? c.toLocaleString('en-IN') : c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > preview.length && (
        <div className="px-3 py-1.5 text-[11px] text-slate-400 border-t border-slate-200 dark:border-white/10">Showing first {preview.length} of {rows.length} rows — download for the full report.</div>
      )}
    </div>
  );
};

// --- inline formatting: **bold** and `code` ---
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) {
      nodes.push(<strong key={`${keyPrefix}-b${i}`} className="font-semibold text-slate-900 dark:text-white">{tok.slice(2, -2)}</strong>);
    } else {
      nodes.push(<code key={`${keyPrefix}-c${i}`} className="px-1 py-0.5 rounded bg-slate-200/70 dark:bg-white/10 text-[0.85em] font-mono">{tok.slice(1, -1)}</code>);
    }
    last = m.index + tok.length;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const MdChart: React.FC<{ spec: ChartSpec }> = ({ spec }) => {
  const { theme } = useTheme();
  const CHROME = getChrome(theme);
  const CAT = getCategorical(theme);
  const axis = { tick: { fill: CHROME.muted, fontSize: 11 }, axisLine: { stroke: CHROME.axis }, tickLine: { stroke: CHROME.axis } };
  const data = spec.data || [];
  return (
    <div className="my-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        {spec.title ? <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{spec.title}</div> : <span />}
        <PinToDashboard make={() => ({ kind: 'chart', title: spec.title || 'Chart', width: 'half', chartSpec: spec })} />
      </div>
      <ResponsiveContainer width="100%" height={200}>
        {spec.type === 'line' ? (
          <LineChart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHROME.grid} vertical={false} />
            <XAxis dataKey="name" {...axis} />
            <YAxis {...axis} width={40} />
            <Tooltip content={<DarkTooltip unit={spec.unit} />} cursor={{ stroke: CHROME.axis }} />
            <Line type="monotone" dataKey="value" name={spec.unit || 'Value'} stroke={CAT[0]} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHROME.grid} vertical={false} />
            <XAxis dataKey="name" {...axis} interval={0} angle={data.length > 5 ? -20 : 0} textAnchor={data.length > 5 ? 'end' : 'middle'} height={data.length > 5 ? 50 : 30} />
            <YAxis {...axis} width={40} />
            <Tooltip content={<DarkTooltip unit={spec.unit} />} cursor={{ fill: 'rgba(120,120,120,0.08)' }} />
            <Bar dataKey="value" name={spec.unit || 'Value'} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map((d, i) => <Cell key={i} fill={d.color || CAT[i % CAT.length]} />)}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

/** Renders a subset of markdown (headings, bold, bullet/numbered lists) plus
 *  ```chart and ```report fenced blocks as inline charts / downloadable tables. */
export const Markdown: React.FC<{ text: string }> = ({ text }) => {
  const blocks: React.ReactNode[] = [];
  // Split out ```chart ... ``` and ```report ... ``` fenced blocks.
  // With two capture groups, split yields [text, kind, body, text, kind, body, ...].
  const parts = text.split(/```(chart|report)\s*([\s\S]*?)```/g);
  parts.forEach((part, pi) => {
    const mod = pi % 3;
    if (mod === 1) return; // the captured fence kind — handled with its body
    if (mod === 2) {
      const kind = parts[pi - 1];
      try {
        const spec = JSON.parse(part.trim());
        if (kind === 'chart' && spec && Array.isArray(spec.data)) blocks.push(<MdChart key={`chart-${pi}`} spec={spec as ChartSpec} />);
        else if (kind === 'report' && spec && Array.isArray(spec.columns) && Array.isArray(spec.rows)) blocks.push(<MdReport key={`report-${pi}`} spec={spec as ReportSpec} />);
      } catch {
        /* ignore malformed block */
      }
      return;
    }
    // regular markdown text
    const lines = part.split('\n');
    let list: React.ReactNode[] = [];
    let listType: 'ul' | 'ol' | null = null;
    const flush = (k: string) => {
      if (list.length) {
        blocks.push(
          listType === 'ol'
            ? <ol key={`ol-${k}`} className="list-decimal ml-5 space-y-1 my-1.5">{list}</ol>
            : <ul key={`ul-${k}`} className="list-disc ml-5 space-y-1 my-1.5">{list}</ul>,
        );
        list = [];
        listType = null;
      }
    };
    const splitRow = (l: string) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
    const isSeparator = (l: string) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(l) && l.includes('-');

    for (let li = 0; li < lines.length; li++) {
      const raw = lines[li];
      const line = raw.trimEnd();
      const key = `${pi}-${li}`;
      if (!line.trim()) { flush(key); continue; }

      // Markdown table: header row + separator + body rows.
      if (isTableRow(line) && li + 1 < lines.length && isSeparator(lines[li + 1])) {
        flush(key);
        const header = splitRow(line);
        const bodyRows: string[][] = [];
        let j = li + 2;
        while (j < lines.length && isTableRow(lines[j])) { bodyRows.push(splitRow(lines[j])); j++; }
        const dlName = 'supplymind-table';
        blocks.push(
          <div key={`tbl-${key}`} className="my-2 rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
            {bodyRows.length >= 3 && (
              <div className="flex items-center justify-end gap-1.5 px-2 py-1 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                <button onClick={() => exportCsv(dlName, header, bodyRows)} title="Download CSV" className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 hover:bg-slate-100 dark:hover:bg-white/10"><Download size={11} /> CSV</button>
                <button onClick={() => exportXlsx(dlName, header, bodyRows)} title="Download Excel" className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded px-1.5 py-0.5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"><FileSpreadsheet size={11} /> Excel</button>
              </div>
            )}
            <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-white/5">
                  {header.map((h, hi) => (
                    <th key={hi} className="text-left font-semibold text-slate-600 dark:text-slate-300 px-2.5 py-1.5 whitespace-nowrap">{renderInline(h, `${key}-h${hi}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((r, ri) => (
                  <tr key={ri} className="border-t border-slate-200 dark:border-white/5">
                    {r.map((c, ci) => (
                      <td key={ci} className="px-2.5 py-1.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">{renderInline(c, `${key}-r${ri}c${ci}`)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>,
        );
        li = j - 1;
        continue;
      }

      const h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) {
        flush(key);
        const lvl = h[1].length;
        const cls = lvl <= 2 ? 'text-base font-bold' : 'text-sm font-semibold';
        blocks.push(<div key={`h-${key}`} className={`${cls} text-slate-900 dark:text-white mt-2 mb-1`}>{renderInline(h[2], key)}</div>);
        continue;
      }
      const ol = line.match(/^\s*(\d+)\.\s+(.*)$/);
      const ul = line.match(/^\s*[-*•]\s+(.*)$/);
      if (ol) {
        if (listType !== 'ol') flush(key);
        listType = 'ol';
        list.push(<li key={`li-${key}`} className="text-sm leading-relaxed">{renderInline(ol[2], key)}</li>);
        continue;
      }
      if (ul) {
        if (listType !== 'ul') flush(key);
        listType = 'ul';
        list.push(<li key={`li-${key}`} className="text-sm leading-relaxed">{renderInline(ul[1], key)}</li>);
        continue;
      }
      flush(key);
      blocks.push(<p key={`p-${key}`} className="text-sm leading-relaxed my-1">{renderInline(line, key)}</p>);
    }
    flush(`end-${pi}`);
  });
  return <div className="space-y-0.5">{blocks}</div>;
};
