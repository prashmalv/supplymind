import React from 'react';
import { Printer, Database } from 'lucide-react';
import { PageHeader, ExportBtn } from '../components/mis/kit';
import { printPage } from '../lib/exportData';

interface Group { key: string; title: string; note?: string; columns: string[]; rows: string[][]; }

// Dashboard element → SAP MM tables/fields. Sourced from standard SAP MM
// (EKKO/EKPO, EBAN, EKBE, RBKP/RSEG, LFA1, MARA/MARC/MARD, MBEW, MKPF/MSEG…).
const GROUPS: Group[] = [
  {
    key: 'dashboard', title: 'Dashboard KPI → SAP Source', note: 'How each KPI/section on the SupplyMind dashboards is derived from SAP ECC MM.',
    columns: ['Dashboard element', 'SAP table(s)', 'Key fields'],
    rows: [
      ['Total Procurement Spend (MTD/QTD/YTD)', 'EKPO · RSEG', 'NETWR (PO value) · WRBTR (invoiced)'],
      ['Budget vs Actual', 'EKPO + FI/CO', 'NETWR vs cost-centre / commitment budget'],
      ['Open PR & PR Aging', 'EBAN', 'BANFN · BADAT · FRGKZ (release) · MENGE'],
      ['Open PO & PO Aging', 'EKKO · EKPO · EKET', 'EBELN · BEDAT · EINDT (delivery) · LOEKZ'],
      ['Goods Receipt / Delivery ageing', 'EKBE · MSEG', "VGABE='1' (GR) · BUDAT · MENGE"],
      ['Invoice pending (MIRO)', 'RBKP · RSEG', 'BELNR · GJAHR · RMWWR · WRBTR'],
      ['Vendor performance & Top vendors', 'LFA1 · EKBE', 'LIFNR · NAME1 · GR date vs EKET.EINDT'],
      ['Contract expiry (30/60/90)', 'EKKO (outline agr.)', "BSART='MK'/'WK' · KDATB · KDATE"],
      ['Vendor outstanding & MSME', 'LFB1 · BSIK', 'Open items (accounting) · payment terms'],
      ['Procurement savings', 'EINA · EINE · EKPO', 'NETPR vs last / info-record price'],
      ['Inventory value', 'MBEW', 'SALK3 (value) · STPRS/VERPR · LBKUM'],
      ['Stock by plant / storage loc.', 'MARD · MARC', 'LABST · SPEME · INSME · WERKS · LGORT'],
      ['Coal stock days / DoS', 'MARD + MSEG (GI)', 'LABST ÷ avg daily BWART 201/261 consumption'],
      ['Inventory turnover', 'MSEG · MBEW', 'GI value (BWART) ÷ average SALK3'],
      ['Stock-out / reorder risk', 'MARC', 'MINBE (reorder) · EISBE (safety) vs MARD.LABST'],
      ['ABC / XYZ / VED / FSN', 'derived', 'consumption value · demand CV · criticality · movement freq (MSEG)'],
      ['Scrap & dead stock', 'MSEG · MARD', "BWART 551 (scrap) · no-movement ageing"],
    ],
  },
  {
    key: 'p2p', title: 'Procure-to-Pay (P2P) Tables',
    columns: ['Object', 'Table', 'Key fields'],
    rows: [
      ['Purchase Requisition (header/item)', 'EBAN / EBKN', 'BANFN · BNFPO · MATNR · MENGE · BADAT'],
      ['Purchase Order — header', 'EKKO', 'EBELN · LIFNR · BSART · BEDAT · EKORG · EKGRP · WAERS'],
      ['Purchase Order — item', 'EKPO', 'EBELN · EBELP · MATNR · WERKS · MENGE · NETPR · NETWR · LOEKZ'],
      ['PO schedule lines', 'EKET', 'EBELN · EBELP · EINDT · MENGE'],
      ['PO history (GR / IR)', 'EKBE', 'EBELN · EBELP · VGABE · BUDAT · MENGE · DMBTR · BELNR'],
      ['Invoice (MIRO) header/item', 'RBKP / RSEG', 'BELNR · GJAHR · LIFNR · WRBTR · EBELN'],
      ['Purchasing info record', 'EINA / EINE', 'INFNR · MATNR · LIFNR · NETPR'],
      ['Source list', 'EORD', 'MATNR · WERKS · LIFNR'],
      ['Conditions / pricing', 'KONV · KONP · A017', 'KNUMV · KSCHL · KBETR'],
    ],
  },
  {
    key: 'inv', title: 'Inventory & Material Movements',
    columns: ['Object', 'Table', 'Key fields'],
    rows: [
      ['Material document — header', 'MKPF', 'MBLNR · MJAHR · BUDAT · BLDAT'],
      ['Material document — item', 'MSEG', 'MBLNR · ZEILE · MATNR · WERKS · LGORT · BWART · MENGE · DMBTR'],
      ['Stock at storage location', 'MARD', 'MATNR · WERKS · LGORT · LABST · SPEME · INSME'],
      ['Plant data / MRP', 'MARC', 'MATNR · WERKS · DISMM · MINBE · EISBE · PLIFZ'],
      ['Material valuation', 'MBEW', 'MATNR · BWKEY · STPRS · VERPR · LBKUM · SALK3 · VPRSV'],
      ['Special / consignment stock', 'MSKA · MSLB · MKOL', 'sales-order / vendor-consignment stock'],
      ['Reservations', 'RESB · RKPF', 'RSNUM · MATNR · BDMNG'],
      ['Batch stock', 'MCHB · MCH1', 'MATNR · CHARG · CLABS'],
    ],
  },
  {
    key: 'master', title: 'Master Data',
    columns: ['Object', 'Table', 'Key fields'],
    rows: [
      ['Material master — general', 'MARA', 'MATNR · MTART · MATKL · MEINS'],
      ['Material description', 'MAKT', "MATNR · MAKTX (SPRAS='E')"],
      ['Vendor master (general)', 'LFA1', 'LIFNR · NAME1 · LAND1 · KTOKK'],
      ['Vendor master (company/purch.)', 'LFB1 · LFM1', 'ZTERM (terms) · EKORG data'],
      ['Material group', 'T023 · T023T', 'MATKL'],
      ['Plant', 'T001W', 'WERKS'],
      ['Storage location', 'T001L', 'WERKS · LGORT'],
      ['Purchasing org / group', 'T024E · T024', 'EKORG · EKGRP'],
      ['Company code', 'T001', 'BUKRS'],
    ],
  },
];

const MOVEMENT_TYPES = [
  ['101', 'Goods receipt for PO'],
  ['102', 'GR reversal'],
  ['201 / 261', 'Goods issue (cost centre / order)'],
  ['301 / 311', 'Plant / storage-location transfer'],
  ['551', 'Scrapping'],
  ['561', 'Initial stock upload'],
  ['641 / 647', 'Stock transport order (STO)'],
];

const th = 'py-2 px-3 font-semibold text-[11px] uppercase tracking-wider text-slate-500 whitespace-nowrap';
const rowBorder = 'border-b border-slate-200 dark:border-white/5 last:border-0';
const mono = 'font-mono text-[13px]';

export const SapMappingPage: React.FC = () => (
  <div>
    <PageHeader
      title="SAP MM Data Mapping"
      subtitle="How every dashboard, report & KPI maps to SAP ECC 6.0 (EHP8) MM tables & fields"
      right={
        <button onClick={printPage} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5">
          <Printer size={14} /> Print / PDF
        </button>
      }
    />

    <div className="flex items-start gap-2 mb-5 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-xs text-slate-600 dark:text-slate-300">
      <Database size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
      <span>This mapping lets SAP MM / FICO teams co-relate the analytics with source tables. Data is read via scheduled extracts / OData — <strong>no change to SAP standard transactions</strong>. Field names follow standard SAP MM.</span>
    </div>

    <div className="grid grid-cols-1 gap-4">
      {GROUPS.map((g) => (
        <div key={g.key} className="liquid-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{g.title}</h3>
            <ExportBtn filename={`sap-mapping-${g.key}`} columns={g.columns} rows={g.rows} />
          </div>
          {g.note && <p className="text-xs text-slate-500 mb-3">{g.note}</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className={`text-left ${rowBorder}`}>{g.columns.map((c) => <th key={c} className={th}>{c}</th>)}</tr></thead>
              <tbody>
                {g.rows.map((r, ri) => (
                  <tr key={ri} className={`${rowBorder} hover:bg-slate-100/60 dark:hover:bg-white/[0.02]`}>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-200">{r[0]}</td>
                    <td className={`py-2 px-3 text-blue-700 dark:text-sky-300 ${mono}`}>{r[1]}</td>
                    <td className={`py-2 px-3 text-slate-500 dark:text-slate-400 ${mono}`}>{r[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="liquid-card rounded-2xl p-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Common Movement Types (BWART)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {MOVEMENT_TYPES.map(([code, desc]) => (
            <div key={code} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
              <span className={`${mono} text-sm font-semibold text-blue-700 dark:text-sky-300`}>{code}</span>
              <span className="text-xs text-slate-600 dark:text-slate-300">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
