// ---------------------------------------------------------------------------
// Shared domain types — single source of truth consumed by both apps/web and
// apps/api. UI-only types (e.g. the routing View enum) stay in apps/web.
// ---------------------------------------------------------------------------

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  image?: {
    data: string; // Base64
    mimeType: string;
  };
}

export interface KpiData {
  name: string;
  value: number;
  change: string; // e.g., "+5%"
  status: 'positive' | 'negative' | 'neutral';
}

export interface RiskItem {
  id: string;
  category: string;
  probability: number; // 0-100
  impact: string;
  entity: string;
}

export interface ScenarioParams {
  demandSurge: number; // Percentage — demand / load surge
  supplierDelay: number; // Days — supplier / coal delay
  portCongestion: boolean; // Logistics / rake disruption
  priceSpike?: number; // Percentage — input price spike
  plantOutage?: boolean; // A plant / unit outage
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'success';
  title: string;
  message: string;
  time: string;
  category: 'logistics' | 'planning' | 'quality';
  actionLabel?: string;
}

export interface SkuForecastAccuracy {
  sku: string;
  name: string;
  mape: number;
  bias: number;
  category: string;
  abcClass: 'A' | 'B' | 'C';
  xyzClass: 'X' | 'Y' | 'Z';
  safetyStock: number;
  currentStock: number;
  reorderPoint: number;
  avgDemand: number;
}

export interface SopPhase {
  phase: string;
  date: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  owner: string;
  notes: string;
}

export interface SafetyStockRow {
  sku: string;
  current: number;
  recommended: number;
  delta: number;
  serviceLevel: number;
  leadTime: number;
}
