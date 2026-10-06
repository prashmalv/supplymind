import { MatchingMis, SampleInvoice } from '@supplymind/shared';

export interface ExtractedLine { material: string; code?: string; qty: number; unitPrice: number; }
export interface ExtractedInvoice { invoiceNo: string; vendor: string; poNumber: string; date: string; lines: ExtractedLine[]; }

export type LineStatus = 'matched' | 'variance' | 'price_variance' | 'qty_over_grn' | 'qty_over_po' | 'no_grn' | 'no_po';
export type Verdict = 'matched' | 'variance' | 'exception';

export interface LineResult {
  material: string;
  invQty: number; invPrice: number; invAmount: number;
  poQty: number | null; poPrice: number | null;
  grnQty: number | null;
  priceVarPct: number | null;
  status: LineStatus;
  note: string;
}
export interface MatchResult {
  invoiceNo: string; vendor: string; poNumber: string; date: string;
  verdict: Verdict;
  vendorMismatch: boolean;
  poFound: boolean; grnFound: boolean;
  lines: LineResult[];
  invTotal: number; poTotal: number; variance: number;
}

const PRICE_TOL = 2; // % tolerance for an auto price match
const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const sampleToExtracted = (s: SampleInvoice): ExtractedInvoice => ({
  invoiceNo: s.invoiceNo, vendor: s.vendor, poNumber: s.poNumber, date: s.date,
  lines: s.lines.map((l) => ({ material: l.material, code: l.code, qty: l.qty, unitPrice: l.unitPrice })),
});

const LINE_SEVERITY: LineStatus[] = ['no_po', 'no_grn', 'qty_over_grn', 'qty_over_po', 'price_variance'];

export function matchInvoice(inv: ExtractedInvoice, data: MatchingMis): MatchResult {
  const po = data.purchaseOrders.find((p) => norm(p.poNumber) === norm(inv.poNumber));
  const grn = data.goodsReceipts.find((g) => norm(g.poNumber) === norm(inv.poNumber));
  const vendorMismatch = !!po && norm(po.vendor) !== norm(inv.vendor) && !norm(po.vendor).includes(norm(inv.vendor)) && !norm(inv.vendor).includes(norm(po.vendor));

  const lines: LineResult[] = inv.lines.map((il) => {
    const invAmount = il.qty * il.unitPrice;
    const poLine = po?.lines.find((pl) => (il.code && pl.code === il.code) || norm(pl.material).includes(norm(il.material)) || norm(il.material).includes(norm(pl.material)));
    if (!po || !poLine) {
      return { material: il.material, invQty: il.qty, invPrice: il.unitPrice, invAmount, poQty: null, poPrice: null, grnQty: null, priceVarPct: null, status: 'no_po', note: 'No matching PO line found' };
    }
    const grnLine = grn?.lines.find((gl) => gl.code === poLine.code);
    const grnQty = grn ? (grnLine?.receivedQty ?? 0) : null;
    const priceVarPct = poLine.unitPrice ? ((il.unitPrice - poLine.unitPrice) / poLine.unitPrice) * 100 : 0;

    let status: LineStatus;
    let note: string;
    if (grnQty === null) { status = 'no_grn'; note = 'Invoice received before goods receipt (GR/IR)'; }
    else if (il.qty > grnQty) { status = 'qty_over_grn'; note = `Billed ${il.qty} but only ${grnQty} received`; }
    else if (il.qty > poLine.orderedQty) { status = 'qty_over_po'; note = `Billed qty exceeds PO (${poLine.orderedQty})`; }
    else if (Math.abs(priceVarPct) > PRICE_TOL) { status = 'price_variance'; note = `Unit price ${priceVarPct > 0 ? '+' : ''}${priceVarPct.toFixed(1)}% vs PO`; }
    else if (Math.abs(priceVarPct) > 0.001 || il.qty !== poLine.orderedQty) { status = 'variance'; note = 'Minor variance within tolerance'; }
    else { status = 'matched'; note = 'Matches PO & GRN'; }

    return { material: il.material, invQty: il.qty, invPrice: il.unitPrice, invAmount, poQty: poLine.orderedQty, poPrice: poLine.unitPrice, grnQty, priceVarPct, status, note };
  });

  const invTotal = lines.reduce((s, l) => s + l.invAmount, 0);
  const poTotal = lines.reduce((s, l) => s + (l.poPrice != null && l.poQty != null ? l.poQty * l.poPrice : 0), 0);

  let verdict: Verdict = 'matched';
  if (vendorMismatch || lines.some((l) => LINE_SEVERITY.includes(l.status))) verdict = 'exception';
  else if (lines.some((l) => l.status === 'variance')) verdict = 'variance';

  return { invoiceNo: inv.invoiceNo, vendor: inv.vendor, poNumber: inv.poNumber, date: inv.date, verdict, vendorMismatch, poFound: !!po, grnFound: !!grn, lines, invTotal, poTotal, variance: invTotal - poTotal };
}

/** Pull the first JSON object out of a model response (handles ```json fences). */
export function parseExtractedInvoice(text: string): ExtractedInvoice | null {
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = fenced ? fenced[1] : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const o = JSON.parse(raw.trim());
    if (!o || !Array.isArray(o.lines)) return null;
    return {
      invoiceNo: String(o.invoiceNo ?? o.invoice_no ?? 'N/A'),
      vendor: String(o.vendor ?? ''),
      poNumber: String(o.poNumber ?? o.po ?? o.po_number ?? ''),
      date: String(o.date ?? ''),
      lines: o.lines.map((l: any) => ({ material: String(l.material ?? l.description ?? ''), code: l.code, qty: Number(l.qty ?? l.quantity ?? 0), unitPrice: Number(l.unitPrice ?? l.unit_price ?? l.rate ?? 0) })),
    };
  } catch { return null; }
}
