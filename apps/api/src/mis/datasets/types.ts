import { ExecutiveMis, ProcurementMis, InventoryMis, MisAlert, ReportTable, ForecastMis, OrgUnit } from '@supplymind/shared';

/** A complete per-organization sample dataset used to drive the demo MIS. */
export interface SiteDataset {
  key: string;
  /** Operating companies / units and the plants they own (Unit → Location). */
  units?: OrgUnit[];
  executive: ExecutiveMis;
  procurement: ProcurementMis;
  inventory: InventoryMis;
  alerts: MisAlert[];
  /** Operational MIS report tables (SOW section C). */
  reports?: ReportTable[];
  /** Inventory / demand forecasting. */
  forecast?: ForecastMis;
  /** Concise sector briefing used to ground the conversational AI. */
  aiContext: string;
}
