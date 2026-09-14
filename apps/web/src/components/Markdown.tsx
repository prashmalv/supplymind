import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { getCategorical, getChrome } from '../lib/viz';
import { useTheme } from '../theme/ThemeProvider';
import { DarkTooltip } from './mis/kit';

interface ChartSpec {
  type?: 'bar' | 'line';
  title?: string;
  unit?: string;
  data: { name: string; value: number; color?: string }[];
}

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
      {spec.title && <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">{spec.title}</div>}
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
 *  ```chart fenced blocks as inline Recharts charts. */
export const Markdown: React.FC<{ text: string }> = ({ text }) => {
  const blocks: React.ReactNode[] = [];
  // Split out ```chart ... ``` fenced blocks first.
  const parts = text.split(/```chart\s*([\s\S]*?)```/g);
  parts.forEach((part, pi) => {
    if (pi % 2 === 1) {
      // chart JSON
      try {
        const spec: ChartSpec = JSON.parse(part.trim());
        if (spec && Array.isArray(spec.data)) blocks.push(<MdChart key={`chart-${pi}`} spec={spec} />);
      } catch {
        /* ignore malformed chart */
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
        blocks.push(
          <div key={`tbl-${key}`} className="my-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">
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
