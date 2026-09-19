// Per-org custom dashboard persistence (demo: localStorage). In production this
// would be a user/org-scoped table via the API. Widgets are either catalog
// widgets (rendered live from MIS data) or AI-pinned chart/report snapshots.

export interface ChartSpec {
  type?: 'bar' | 'line';
  title?: string;
  unit?: string;
  data: { name: string; value: number; color?: string }[];
}

export interface ReportSpec {
  filename?: string;
  title?: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface DashWidget {
  id: string;
  kind: 'catalog' | 'chart' | 'report';
  title: string;
  width: 'half' | 'full';
  catalogId?: string;
  chartSpec?: ChartSpec;
  reportSpec?: ReportSpec;
}

const key = (orgId: string) => `sm_dashboard_${orgId || 'default'}`;

export function loadDashboard(orgId: string): DashWidget[] {
  try {
    const raw = localStorage.getItem(key(orgId));
    if (raw) return JSON.parse(raw) as DashWidget[];
  } catch { /* ignore */ }
  // First-visit seed so the board looks alive in a demo.
  return [
    { id: 'seed-1', kind: 'catalog', catalogId: 'proc-kpis', title: 'Procurement KPIs', width: 'full' },
    { id: 'seed-2', kind: 'catalog', catalogId: 'coal-stock', title: 'Coal Stock Days by Plant', width: 'half' },
    { id: 'seed-3', kind: 'catalog', catalogId: 'spend-by-category', title: 'Spend by Category', width: 'half' },
  ];
}

export function saveDashboard(orgId: string, widgets: DashWidget[]) {
  try { localStorage.setItem(key(orgId), JSON.stringify(widgets)); } catch { /* ignore */ }
}

/** Append a widget (used by the Knowledge Bot "Pin to dashboard" action). */
export function addWidget(orgId: string, w: Omit<DashWidget, 'id'>): void {
  const list = loadDashboard(orgId);
  list.push({ ...w, id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` });
  saveDashboard(orgId, list);
}

export const uid = () => `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
