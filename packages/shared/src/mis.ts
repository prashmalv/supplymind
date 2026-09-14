// ---------------------------------------------------------------------------
// MIS (Management Information System) response contracts — Procurement &
// Inventory dashboards. Populated from per-org sample datasets today; from the
// canonical SAP MM data in Phase 5+. Shared between web and api.
// ---------------------------------------------------------------------------

export interface KpiTile {
  label: string;
  value: string;      // pre-formatted for display (e.g. "₹4,820 Cr")
  raw?: number;
  delta?: string;     // e.g. "+2.4%"
  status?: 'positive' | 'negative' | 'neutral' | 'warning';
  sublabel?: string;
}

export interface NamedValue {
  name: string;
  value: number;
}

/** An operating company / unit within an organization, and the plants (sites)
 *  it owns. Drives the Unit → Location filter hierarchy. */
export interface OrgUnit {
  key: string;        // stable id, e.g. "lpgcl"
  name: string;       // display, e.g. "LPGCL — Lalitpur"
  short: string;      // compact chip label, e.g. "LPGCL"
  plants: string[];   // plant/site names owned by this unit
}

export interface TrendPoint {
  period: string;
  [series: string]: string | number;
}

// ---- Executive overview ----

export interface ExecutiveMis {
  orgName: string;
  sector: string;
  currency: string;
  headline: KpiTile[];
  generationTrend: TrendPoint[];     // MU generated vs plan
  spendByCategory: NamedValue[];
  alertsSummary: { critical: number; warning: number; info: number };
}

// ---- Procurement MIS ----

export interface OpenPoRow {
  poNumber: string;
  vendor: string;
  material: string;
  plant: string;
  value: number;
  currency: string;
  deliveryDate: string;
  daysOverdue: number;
  status: 'on_track' | 'due_soon' | 'overdue';
}

export interface VendorScore {
  vendor: string;
  category: string;
  spend: number;
  onTimePct: number;
  qualityPct: number;
  reliability: 'High' | 'Medium' | 'Low';
  poCount?: number;
}

// ---- SOW-aligned procurement extras (all optional) ----

export interface AgingBucketRow {
  bucket: string;      // e.g. "0-7 days"
  prCount: number;
  prValue: number;
  poCount: number;
  poValue: number;
}

export interface ContractExpiry {
  contract: string;
  vendor: string;
  material?: string;
  expiryDate: string;
  daysLeft: number;
  value: number;
  window: 30 | 60 | 90;
}

export interface VendorOutstanding {
  vendor: string;
  outstanding: number;
  advance: number;
  msme?: boolean;
}

export interface BankGuarantee {
  vendor: string;
  bgNo: string;
  amount: number;
  expiryDate: string;
  status: 'open' | 'expiring' | 'expired';
}

export interface ApprovalStage {
  stage: string;
  count: number;
  amount: number;
}

export interface ProcurementMis {
  currency: string;
  kpis: KpiTile[];
  units?: OrgUnit[];                 // Unit → Location hierarchy (merged in by the service)
  monthlySpend: TrendPoint[];        // { period, <seriesKey>... }
  // Labels for the stacked monthly-spend series (per sector). Falls back to
  // generic keys if omitted.
  monthlySpendSeries?: { key: string; label: string }[];
  spendByCategory: NamedValue[];
  spendByPlant: NamedValue[];
  topVendors: VendorScore[];
  onTimeByVendor: NamedValue[];      // on-time % per key vendor
  openPos: OpenPoRow[];

  // --- SOW extras (optional) ---
  spendPeriods?: { mtd: string; qtd: string; ytd: string; budgetYtd?: string };
  budgetVsActual?: TrendPoint[];     // { period, budget, actual }
  savings?: { ytdValue: string; ytdPct: string; vsLastPurchase: string; trend: TrendPoint[] };
  prPoAging?: AgingBucketRow[];
  contractExpiry?: ContractExpiry[];
  approvalPending?: ApprovalStage[];
  emergencyProcurement?: { count: number; amount: number; note?: string };
  vendorOutstanding?: VendorOutstanding[];
  msmeOutstanding?: NamedValue[];    // 15/30/45/60/>60 day buckets
  bankGuarantees?: BankGuarantee[];
}

// ---- Inventory MIS ----

export interface StockItem {
  material: string;
  code: string;
  category: string;
  plant: string;
  onHand: number;
  uom: string;
  safetyStock: number;
  reorderPoint: number;
  daysOfSupply: number;
  value: number;
  abcClass: 'A' | 'B' | 'C';
  xyzClass: 'X' | 'Y' | 'Z';
  status: 'ok' | 'below_safety' | 'excess' | 'stockout';
}

export interface PlantCoalStock {
  plant: string;
  coalStockDays: number;
  status: 'critical' | 'low' | 'ok';
  dailyRequirementMT: number;
}

export interface ClassRow {
  cell: string;       // AX / V / F / etc.
  count: number;
  value: number;
}

export interface DeadStockItem {
  material: string;
  code: string;
  plant: string;
  value: number;
  monthsNoMovement: number;
}

export interface ScrapRow {
  material: string;
  opening: number;
  receipt: number;
  sale: number;
  closing: number;
  value: number;      // closing value
}

export interface CriticalSpare {
  material: string;
  code: string;
  plant: string;
  onHand: number;
  daysCover: number;
  stockoutRiskDays: number;
  status: 'critical' | 'watch' | 'ok';
}

export interface InventoryMis {
  currency: string;
  kpis: KpiTile[];
  units?: OrgUnit[];                 // Unit → Location hierarchy (merged in by the service)
  valueByCategory: NamedValue[];
  agingBuckets: NamedValue[];        // 0-30, 30-60, 60-90, 90+ (value)
  coalStockByPlant: PlantCoalStock[];
  abcXyz: ClassRow[];
  items: StockItem[];

  // --- SOW extras (optional) ---
  ved?: ClassRow[];                  // Vital / Essential / Desirable
  fsn?: ClassRow[];                  // Fast / Slow / Non-moving
  inventoryTrend?: TrendPoint[];     // { period, value }
  deadStock?: { totalValue: string; items: DeadStockItem[] };
  scrap?: ScrapRow[];
  criticalSpares?: CriticalSpare[];
}

export interface MisAlert {
  id: string;
  severity: 'critical' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  category: string;
  recommendation?: string;
}

// ---- Inventory / demand forecasting (SOW: forecasting, stock-out prediction,
//      safety-stock optimization, consumption forecast accuracy) ----

export interface ForecastPoint {
  period: string;
  actual?: number;                 // historical consumption
  forecast?: number;               // fitted / projected
  band?: [number, number];         // forecast confidence interval [lower, upper]
}

export interface MaterialForecast {
  material: string;
  code: string;
  category: string;
  plant: string;
  uom: string;
  method: string;                  // e.g. Holt-Winters, Croston, Moving Average
  mape: number;                    // % forecast error
  bias: number;                    // over/under-forecast
  series: ForecastPoint[];         // history + forecast horizon
  currentStock: number;
  safetyStock: number;
  recommendedSafety: number;
  reorderPoint: number;
  leadTimeDays: number;
  serviceLevel: number;            // %
  avgDemand: number;               // per month
  stockoutInDays: number | null;   // predicted days to stock-out (null = safe)
  recommendedOrderQty: number;
  status: 'stockout_risk' | 'reorder' | 'overstock' | 'ok';
}

export interface ForecastMis {
  currency: string;
  kpis: KpiTile[];
  units?: OrgUnit[];
  accuracyByCategory: NamedValue[];  // MAPE by category
  materials: MaterialForecast[];
}

// ---- Operational MIS Reports (SOW section C) ----

export interface ReportTable {
  key: string;
  name: string;
  group?: 'Procurement' | 'Inventory' | 'Vendor' | 'Management';
  description?: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface OperationalReports {
  reports: ReportTable[];
}
