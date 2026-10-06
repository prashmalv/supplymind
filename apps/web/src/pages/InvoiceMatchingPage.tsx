import React, { useRef, useState } from 'react';
import {
  FileCheck2, Upload, Loader2, CheckCircle2, AlertTriangle, XCircle, FileText, Pause, Check, X, Ban, ArrowRight,
} from 'lucide-react';
import { useMatchingMis } from '../lib/misApi';
import { useAuth } from '../auth/AuthProvider';
import { KpiCard, PageHeader, Loading } from '../components/mis/kit';
import { extractPdfText } from '../lib/pdf';
import { geminiService } from '../../services/geminiService';
import {
  matchInvoice, sampleToExtracted, parseExtractedInvoice, ExtractedInvoice, MatchResult, LineStatus, Verdict,
} from '../lib/invoiceMatch';

const inr = (v: number) => '₹' + Math.round(v).toLocaleString('en-IN');
const cr = (v: number) => (v >= 1e7 ? `₹${(v / 1e7).toFixed(2)} Cr` : v >= 1e5 ? `₹${(v / 1e5).toFixed(1)} L` : inr(v));

const VERDICT: Record<Verdict, { label: string; bg: string; text: string; Icon: React.FC<any> }> = {
  matched: { label: 'Matched — ready to post', bg: 'rgba(12,163,12,0.12)', text: '#0ca30c', Icon: CheckCircle2 },
  variance: { label: 'Minor variance — within tolerance', bg: 'rgba(180,83,9,0.12)', text: '#b45309', Icon: AlertTriangle },
  exception: { label: 'Exception — needs review', bg: 'rgba(208,59,59,0.12)', text: '#d03b3b', Icon: XCircle },
};
const LINE_META: Record<LineStatus, { label: string; color: string }> = {
  matched: { label: 'Matched', color: '#0ca30c' },
  variance: { label: 'Minor', color: '#b45309' },
  price_variance: { label: 'Price variance', color: '#d03b3b' },
  qty_over_grn: { label: 'Qty > GRN', color: '#d03b3b' },
  qty_over_po: { label: 'Qty > PO', color: '#d03b3b' },
  no_grn: { label: 'No GRN (GR/IR)', color: '#d03b3b' },
  no_po: { label: 'No PO', color: '#d03b3b' },
};

type Decision = { status: 'approved' | 'hold' | 'rejected'; by: string; at: string };

export const InvoiceMatchingPage: React.FC = () => {
  const { data, isLoading } = useMatchingMis();
  const { user, currentOrgId } = useAuth();
  const KEY = `sm_invmatch_${currentOrgId || 'default'}`;
  const [selected, setSelected] = useState<ExtractedInvoice | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
  });
  const fileRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <Loading />;
  if (!data) return (
    <div><PageHeader title="Invoice Matching" subtitle="3-way match: Invoice ↔ PO ↔ GRN" /><div className="liquid-card rounded-xl p-8 text-center text-slate-500">No matching data for this organization.</div></div>
  );

  const runMatch = (inv: ExtractedInvoice) => { setErr(''); setSelected(inv); setResult(matchInvoice(inv, data)); };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    setBusy(true); setErr(''); setResult(null); setSelected(null);
    try {
      const text = await extractPdfText(file);
      const prompt = `You are an invoice data extractor. From the raw invoice text below, return ONLY a JSON object (no prose) with keys: invoiceNo, vendor, poNumber, date (YYYY-MM-DD), lines (array of {material, qty, unitPrice}). Numbers must be plain (no commas, no currency symbol). If a PO number appears (e.g. "PO 45020032"), capture just the digits.\n\nINVOICE TEXT:\n${text.slice(0, 8000)}`;
      const resp = await geminiService.getChatResponse([], prompt);
      const inv = parseExtractedInvoice(resp);
      if (!inv) { setErr('Could not read invoice fields from this PDF. Try a clearer / text-based invoice, or use a sample.'); return; }
      runMatch(inv);
    } catch {
      setErr('Could not process that file.');
    } finally { setBusy(false); }
  };

  const decide = (status: Decision['status']) => {
    if (!result) return;
    const next = { ...decisions, [result.invoiceNo]: { status, by: user?.name || 'You', at: new Date().toISOString() } };
    setDecisions(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const current = result ? decisions[result.invoiceNo] : undefined;
  const th = 'py-2 px-2 font-semibold text-[10px] uppercase tracking-wider text-slate-500 whitespace-nowrap';
  const rb = 'border-b border-slate-200 dark:border-white/5 last:border-0';

  return (
    <div>
      <PageHeader title="Invoice Matching" subtitle="SAP MIRO · 3-way match — Invoice ↔ PO ↔ GRN · auto-flags price & quantity exceptions" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {data.kpis.map((t) => <KpiCard key={t.label} tile={t} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Inbox */}
        <div className="liquid-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Invoice Inbox</h3>
            <FileCheck2 size={16} className="text-red-500" />
          </div>
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={onFile} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={busy}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-red-500 rounded-lg px-3 py-2.5 mb-3 hover:shadow-[0_2px_12px_rgba(220,38,38,0.4)] disabled:opacity-60">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} {busy ? 'Reading invoice…' : 'Upload invoice PDF'}
          </button>
          <p className="text-[11px] text-slate-400 mb-2">or pick a sample invoice:</p>
          <div className="space-y-1.5">
            {data.sampleInvoices.map((s) => {
              const d = decisions[s.invoiceNo];
              const active = selected && result?.invoiceNo === s.invoiceNo;
              return (
                <button key={s.invoiceNo} onClick={() => runMatch(sampleToExtracted(s))}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${active ? 'border-red-400/60 bg-red-500/5' : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{s.invoiceNo}</span>
                    {d && <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: d.status === 'approved' ? '#0ca30c' : d.status === 'rejected' ? '#d03b3b' : '#b45309' }}>{d.status}</span>}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{s.vendor} · PO {s.poNumber}</div>
                  {s.note && <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><FileText size={10} /> {s.note}</div>}
                </button>
              );
            })}
          </div>
          {err && <p className="text-[11px] text-red-500 mt-3">{err}</p>}
        </div>

        {/* Result */}
        <div className="lg:col-span-2">
          {!result ? (
            <div className="liquid-card rounded-xl p-12 text-center h-full flex flex-col items-center justify-center">
              <FileCheck2 size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Select or upload an invoice</h3>
              <p className="text-xs text-slate-500 mt-1">It's matched against the PO and goods receipt, and exceptions are flagged automatically.</p>
            </div>
          ) : (
            <div className="liquid-card rounded-xl p-4">
              {/* header */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">{result.invoiceNo}</div>
                  <div className="text-xs text-slate-500">{result.vendor} · PO {result.poNumber} · {result.date}</div>
                </div>
                {(() => { const V = VERDICT[result.verdict]; return (
                  <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: V.bg, color: V.text }}>
                    <V.Icon size={15} /> {V.label}
                  </span>
                ); })()}
              </div>

              {/* match status chips */}
              <div className="flex flex-wrap gap-2 mb-4 text-[11px]">
                <Chip ok={result.poFound} label={result.poFound ? 'PO found' : 'PO not found'} />
                <Chip ok={result.grnFound} label={result.grnFound ? 'GRN found' : 'No goods receipt'} />
                <Chip ok={!result.vendorMismatch} label={result.vendorMismatch ? 'Vendor mismatch' : 'Vendor matches'} />
              </div>

              {/* 3-way table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10 mb-3">
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-100/80 dark:bg-white/5 text-left">
                    <th className={th}>Item</th>
                    <th className={`${th} text-right`}>Invoice</th>
                    <th className={`${th} text-right`}>PO</th>
                    <th className={`${th} text-right`}>GRN recd</th>
                    <th className={`${th} text-right`}>Price Δ</th>
                    <th className={th}>Status</th>
                  </tr></thead>
                  <tbody>
                    {result.lines.map((l, i) => {
                      const m = LINE_META[l.status];
                      return (
                        <tr key={i} className={rb}>
                          <td className="py-2 px-2">
                            <div className="text-slate-700 dark:text-slate-200 max-w-[200px] truncate">{l.material}</div>
                            <div className="text-[10px] text-slate-400">{l.note}</div>
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">{l.invQty.toLocaleString('en-IN')} × {inr(l.invPrice)}<div className="text-[10px] text-slate-400">{cr(l.invAmount)}</div></td>
                          <td className="py-2 px-2 text-right tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">{l.poQty != null ? `${l.poQty.toLocaleString('en-IN')} × ${inr(l.poPrice || 0)}` : '—'}</td>
                          <td className="py-2 px-2 text-right tabular-nums text-slate-500 dark:text-slate-400">{l.grnQty != null ? l.grnQty.toLocaleString('en-IN') : '—'}</td>
                          <td className="py-2 px-2 text-right tabular-nums" style={{ color: l.priceVarPct && Math.abs(l.priceVarPct) > 2 ? '#d03b3b' : undefined }}>{l.priceVarPct != null ? `${l.priceVarPct > 0 ? '+' : ''}${l.priceVarPct.toFixed(1)}%` : '—'}</td>
                          <td className="py-2 px-2"><span className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap" style={{ background: `${m.color}22`, color: m.color }}>{m.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 dark:border-white/10 font-semibold">
                      <td className="py-2 px-2 text-slate-700 dark:text-slate-200">Total</td>
                      <td className="py-2 px-2 text-right tabular-nums text-slate-900 dark:text-white whitespace-nowrap">{cr(result.invTotal)}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">{cr(result.poTotal)}</td>
                      <td />
                      <td className="py-2 px-2 text-right tabular-nums" style={{ color: Math.abs(result.variance) > 1 ? '#d03b3b' : '#0ca30c' }}>{result.variance > 0 ? '+' : ''}{cr(Math.abs(result.variance))}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* recommendation + actions */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ArrowRight size={13} className="text-red-500" />
                  {result.verdict === 'matched' ? 'Recommended: approve & queue for payment (post to SAP MIRO).'
                    : result.verdict === 'variance' ? 'Recommended: auto-approve within tolerance, or review.'
                    : 'Recommended: hold & route to procurement for clarification.'}
                </p>
                {current ? (
                  <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: current.status === 'approved' ? '#0ca30c' : current.status === 'rejected' ? '#d03b3b' : '#b45309' }}>
                    <Check size={14} /> {current.status.toUpperCase()} · by {current.by}
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={() => decide('approved')} className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg px-3 py-1.5"><Check size={14} /> Approve</button>
                    <button onClick={() => decide('hold')} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40 rounded-lg px-3 py-1.5 hover:bg-amber-50 dark:hover:bg-amber-500/10"><Pause size={14} /> Hold</button>
                    <button onClick={() => decide('rejected')} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/40 rounded-lg px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-500/10"><Ban size={14} /> Reject</button>
                  </div>
                )}
              </div>
              {current && (
                <button onClick={() => { const n = { ...decisions }; delete n[result.invoiceNo]; setDecisions(n); try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* */ } }}
                  className="mt-2 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 inline-flex items-center gap-1"><X size={11} /> Undo decision</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Chip: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium" style={{ background: ok ? 'rgba(12,163,12,0.12)' : 'rgba(208,59,59,0.12)', color: ok ? '#0ca30c' : '#d03b3b' }}>
    {ok ? <Check size={11} /> : <X size={11} />} {label}
  </span>
);
