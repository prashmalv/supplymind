import { SiteDataset } from './types';

// Bajaj Energy Ltd + Lalitpur Power Generation Co (LPGCL) — India's largest
// private thermal generator in UP. ~2,430 MW: Lalitpur 3x660 MW supercritical +
// five 90 MW plants (Barkhera, Maqsoodapur, Khambarkhera, Kundarkhi, Utraula).
// Sample MIS data models SAP MM procurement & inventory for a coal power fleet:
// coal is the dominant spend; coal-stock-days is the critical inventory KPI.
// All monetary values are in ₹ Crore unless noted. Illustrative, not actuals.

const CUR = 'INR';

export const bajajEnergyDataset: SiteDataset = {
  key: 'bajaj-energy',

  executive: {
    orgName: 'Bajaj Energy',
    sector: 'Thermal Power Generation',
    currency: CUR,
    headline: [
      { label: 'Net Generation (MTD)', value: '1,284 MU', delta: '+3.1%', status: 'positive', sublabel: 'vs plan 1,245 MU' },
      { label: 'Fleet PLF', value: '64.8%', delta: '-1.2%', status: 'warning', sublabel: 'Plant Load Factor' },
      { label: 'Coal Stock (weighted)', value: '11.5 days', delta: '-2.4 d', status: 'warning', sublabel: 'CEA norm ≥ 12 days' },
      { label: 'Procurement Spend (YTD)', value: '₹4,820 Cr', delta: '+6.8%', status: 'neutral', sublabel: 'Coal 82% of spend' },
      { label: 'Inventory Value', value: '₹1,240 Cr', delta: '-1.9%', status: 'positive', sublabel: 'Coal ₹820 Cr + Spares ₹420 Cr' },
      { label: 'Coal Rake OTIF', value: '91.4%', delta: '-0.9%', status: 'warning', sublabel: 'Target 95%' },
    ],
    generationTrend: [
      { period: 'Aug', actual: 1180, plan: 1210 },
      { period: 'Sep', actual: 1225, plan: 1220 },
      { period: 'Oct', actual: 1310, plan: 1280 },
      { period: 'Nov', actual: 1260, plan: 1250 },
      { period: 'Dec', actual: 1290, plan: 1270 },
      { period: 'Jan', actual: 1340, plan: 1300 },
      { period: 'Feb', actual: 1215, plan: 1240 },
      { period: 'Mar', actual: 1284, plan: 1245 },
    ],
    spendByCategory: [
      { name: 'Coal', value: 3950 },
      { name: 'O&M Spares', value: 385 },
      { name: 'Chemicals', value: 195 },
      { name: 'Fuel Oil (LDO/HFO)', value: 145 },
      { name: 'Services / AMC', value: 145 },
    ],
    alertsSummary: { critical: 1, warning: 3, info: 2 },
  },

  procurement: {
    currency: CUR,
    kpis: [
      { label: 'Total Spend (YTD)', value: '₹4,820 Cr', raw: 4820, delta: '+6.8%', status: 'neutral' },
      { label: 'Coal Spend Share', value: '82%', raw: 82, status: 'neutral', sublabel: '₹3,950 Cr' },
      { label: 'PO Cycle Time', value: '9.2 days', raw: 9.2, delta: '+0.7 d', status: 'warning', sublabel: 'Target 7 days' },
      { label: 'Coal Rake OTIF', value: '91.4%', raw: 91.4, delta: '-0.9%', status: 'warning', sublabel: 'Target 95%' },
      { label: 'Open PO Value', value: '₹612 Cr', raw: 612, status: 'neutral', sublabel: '148 open POs' },
      { label: 'Maverick Spend', value: '6.3%', raw: 6.3, delta: '-1.1%', status: 'positive', sublabel: 'Off-contract' },
    ],
    monthlySpendSeries: [
      { key: 'coal', label: 'Coal' },
      { key: 'spares', label: 'O&M Spares' },
      { key: 'chemicals', label: 'Chemicals' },
      { key: 'fuel', label: 'Fuel Oil' },
      { key: 'services', label: 'Services' },
    ],
    monthlySpend: [
      { period: 'Oct', coal: 352, spares: 34, chemicals: 18, fuel: 13, services: 12 },
      { period: 'Nov', coal: 338, spares: 41, chemicals: 16, fuel: 11, services: 14 },
      { period: 'Dec', coal: 361, spares: 29, chemicals: 17, fuel: 15, services: 11 },
      { period: 'Jan', coal: 372, spares: 45, chemicals: 19, fuel: 14, services: 13 },
      { period: 'Feb', coal: 331, spares: 33, chemicals: 15, fuel: 12, services: 16 },
      { period: 'Mar', coal: 348, spares: 38, chemicals: 18, fuel: 14, services: 12 },
    ],
    spendByCategory: [
      { name: 'Coal', value: 3950 },
      { name: 'O&M Spares', value: 385 },
      { name: 'Chemicals', value: 195 },
      { name: 'Fuel Oil', value: 145 },
      { name: 'Services / AMC', value: 145 },
    ],
    spendByPlant: [
      { name: 'Lalitpur (1980 MW)', value: 3180 },
      { name: 'Barkhera', value: 340 },
      { name: 'Maqsoodapur', value: 335 },
      { name: 'Khambarkhera', value: 330 },
      { name: 'Kundarkhi', value: 320 },
      { name: 'Utraula', value: 315 },
    ],
    topVendors: [
      { vendor: 'Northern Coalfields Ltd (NCL)', category: 'Coal', spend: 1850, onTimePct: 92, qualityPct: 98, reliability: 'High', poCount: 214 },
      { vendor: 'Central Coalfields Ltd (CCL)', category: 'Coal', spend: 980, onTimePct: 94, qualityPct: 97, reliability: 'High', poCount: 138 },
      { vendor: 'South Eastern Coalfields (SECL)', category: 'Coal', spend: 640, onTimePct: 89, qualityPct: 96, reliability: 'Medium', poCount: 92 },
      { vendor: 'Adani Enterprises (Imported Coal)', category: 'Coal', spend: 480, onTimePct: 96, qualityPct: 95, reliability: 'High', poCount: 41 },
      { vendor: 'BHEL', category: 'O&M Spares', spend: 210, onTimePct: 87, qualityPct: 99, reliability: 'Medium', poCount: 186 },
      { vendor: 'Indian Oil (Fuel Oil)', category: 'Fuel Oil', spend: 145, onTimePct: 97, qualityPct: 99, reliability: 'High', poCount: 58 },
      { vendor: 'Thermax', category: 'Chemicals', spend: 95, onTimePct: 93, qualityPct: 98, reliability: 'High', poCount: 74 },
      { vendor: 'Ion Exchange India', category: 'Chemicals', spend: 78, onTimePct: 91, qualityPct: 97, reliability: 'Medium', poCount: 63 },
    ],
    onTimeByVendor: [
      { name: 'NCL', value: 92 },
      { name: 'CCL', value: 94 },
      { name: 'SECL', value: 89 },
      { name: 'Adani', value: 96 },
      { name: 'BHEL', value: 87 },
      { name: 'Thermax', value: 93 },
    ],
    openPos: [
      { poNumber: '45010023', vendor: 'Northern Coalfields Ltd', material: 'Steam Coal G11 (rakes)', plant: 'Lalitpur', value: 118.5, currency: CUR, deliveryDate: '2026-03-20', daysOverdue: 3, status: 'overdue' },
      { poNumber: '45010041', vendor: 'BHEL', material: 'Boiler Feed Pump Cartridge', plant: 'Lalitpur', value: 6.8, currency: CUR, deliveryDate: '2026-03-28', daysOverdue: 0, status: 'due_soon' },
      { poNumber: '45010055', vendor: 'Adani Enterprises', material: 'Imported Coal (5000 GAR)', plant: 'Lalitpur', value: 84.2, currency: CUR, deliveryDate: '2026-04-05', daysOverdue: 0, status: 'on_track' },
      { poNumber: '45010078', vendor: 'Siemens Energy', material: 'Turbine Blade Set (Stage-3)', plant: 'Lalitpur', value: 12.4, currency: CUR, deliveryDate: '2026-03-15', daysOverdue: 8, status: 'overdue' },
      { poNumber: '45010090', vendor: 'Ion Exchange India', material: 'Cation/Anion Resin (DM Plant)', plant: 'Barkhera', value: 2.1, currency: CUR, deliveryDate: '2026-03-30', daysOverdue: 0, status: 'due_soon' },
      { poNumber: '45010112', vendor: 'Central Coalfields Ltd', material: 'Steam Coal G12 (rakes)', plant: 'Maqsoodapur', value: 21.6, currency: CUR, deliveryDate: '2026-04-02', daysOverdue: 0, status: 'on_track' },
      { poNumber: '45010134', vendor: 'Thermax', material: 'FGD Limestone Slurry Dosing', plant: 'Lalitpur', value: 4.9, currency: CUR, deliveryDate: '2026-03-18', daysOverdue: 5, status: 'overdue' },
    ],

    // --- SOW: Procurement Summary extras (₹ Crore unless noted) ---
    spendPeriods: { mtd: '₹430 Cr', qtd: '₹1,300 Cr', ytd: '₹4,820 Cr', budgetYtd: '₹4,650 Cr' },
    budgetVsActual: [
      { period: 'Oct', budget: 430, actual: 429 },
      { period: 'Nov', budget: 425, actual: 420 },
      { period: 'Dec', budget: 415, actual: 433 },
      { period: 'Jan', budget: 420, actual: 463 },
      { period: 'Feb', budget: 415, actual: 407 },
      { period: 'Mar', budget: 420, actual: 430 },
    ],
    savings: {
      ytdValue: '₹86 Cr',
      ytdPct: '1.8%',
      vsLastPurchase: '+₹12 Cr',
      trend: [
        { period: 'Oct', savings: 12 },
        { period: 'Nov', savings: 14 },
        { period: 'Dec', savings: 11 },
        { period: 'Jan', savings: 18 },
        { period: 'Feb', savings: 15 },
        { period: 'Mar', savings: 16 },
      ],
    },
    prPoAging: [
      { bucket: '0-7 days', prCount: 84, prValue: 62, poCount: 61, poValue: 148 },
      { bucket: '8-15 days', prCount: 46, prValue: 41, poCount: 38, poValue: 96 },
      { bucket: '16-30 days', prCount: 29, prValue: 33, poCount: 27, poValue: 71 },
      { bucket: '30+ days', prCount: 17, prValue: 28, poCount: 22, poValue: 297 },
    ],
    contractExpiry: [
      { contract: 'RC/NCL/COAL/24', vendor: 'Northern Coalfields Ltd', material: 'Steam Coal (linkage)', expiryDate: '2026-04-08', daysLeft: 24, value: 1850, window: 30 },
      { contract: 'AMC/BHEL/BOILER', vendor: 'BHEL', material: 'Boiler O&M AMC', expiryDate: '2026-04-22', daysLeft: 38, value: 62, window: 60 },
      { contract: 'RC/IOCL/HFO', vendor: 'Indian Oil', material: 'HFO / LDO supply', expiryDate: '2026-05-05', daysLeft: 51, value: 145, window: 60 },
      { contract: 'AMC/SIEMENS/TG', vendor: 'Siemens Energy', material: 'Turbine AMC', expiryDate: '2026-06-01', daysLeft: 78, value: 48, window: 90 },
      { contract: 'RC/THERMAX/CHEM', vendor: 'Thermax', material: 'FGD & DM chemicals', expiryDate: '2026-06-10', daysLeft: 87, value: 95, window: 90 },
    ],
    approvalPending: [
      { stage: 'PR Approval', count: 34, amount: 58 },
      { stage: 'RFQ / Sourcing', count: 21, amount: 96 },
      { stage: 'Technical Evaluation', count: 14, amount: 132 },
      { stage: 'Commercial / Nego', count: 11, amount: 88 },
      { stage: 'PO Release', count: 9, amount: 74 },
    ],
    emergencyProcurement: { count: 18, amount: 46, note: 'MTD emergency/spot cases (mostly coal & critical spares)' },
    vendorOutstanding: [
      { vendor: 'Northern Coalfields Ltd', outstanding: 214, advance: 0 },
      { vendor: 'Central Coalfields Ltd', outstanding: 96, advance: 0 },
      { vendor: 'BHEL', outstanding: 34, advance: 12, msme: false },
      { vendor: 'Thermax', outstanding: 18, advance: 4 },
      { vendor: 'Vindhya Engineering Works', outstanding: 6.4, advance: 1.2, msme: true },
      { vendor: 'Bundelkhand Fabricators', outstanding: 3.1, advance: 0.6, msme: true },
    ],
    msmeOutstanding: [
      { name: '0-15 days', value: 4.2 },
      { name: '15-30 days', value: 3.1 },
      { name: '30-45 days', value: 1.8 },
      { name: '45-60 days', value: 0.9 },
      { name: '> 60 days', value: 0.6 },
    ],
    bankGuarantees: [
      { vendor: 'BHEL', bgNo: 'BG/BHEL/2291', amount: 24, expiryDate: '2026-04-18', status: 'expiring' },
      { vendor: 'Siemens Energy', bgNo: 'BG/SIE/1187', amount: 18, expiryDate: '2026-07-30', status: 'open' },
      { vendor: 'Thermax', bgNo: 'BG/THX/3340', amount: 9.5, expiryDate: '2026-03-28', status: 'expiring' },
      { vendor: 'Adani Enterprises', bgNo: 'BG/ADE/5521', amount: 42, expiryDate: '2026-09-12', status: 'open' },
      { vendor: 'L&T Construction', bgNo: 'BG/LNT/0092', amount: 15, expiryDate: '2026-03-10', status: 'expired' },
    ],
  },

  inventory: {
    currency: CUR,
    kpis: [
      { label: 'Total Inventory Value', value: '₹1,240 Cr', raw: 1240, delta: '-1.9%', status: 'positive' },
      { label: 'Coal Stock (weighted)', value: '11.5 days', raw: 11.5, delta: '-2.4 d', status: 'warning', sublabel: 'CEA norm ≥ 12 days' },
      { label: 'Spares Turnover', value: '3.8x', raw: 3.8, delta: '+0.2x', status: 'positive' },
      { label: 'Days of Supply (Spares)', value: '96 days', raw: 96, status: 'neutral' },
      { label: 'Excess / Obsolete', value: '₹58 Cr', raw: 58, delta: '-4.0%', status: 'positive', sublabel: 'Non-moving > 1 yr' },
      { label: 'Below Safety Stock', value: '7 items', raw: 7, status: 'negative', sublabel: 'Critical spares' },
    ],
    valueByCategory: [
      { name: 'Coal Stock', value: 820 },
      { name: 'Boiler Spares', value: 118 },
      { name: 'Turbine Spares', value: 96 },
      { name: 'Chemicals', value: 64 },
      { name: 'Electrical / C&I', value: 58 },
      { name: 'Fuel Oil', value: 42 },
      { name: 'Consumables', value: 42 },
    ],
    // Aging of non-coal inventory (₹420 Cr spares + consumables)
    agingBuckets: [
      { name: '0-30 days', value: 150 },
      { name: '30-60 days', value: 120 },
      { name: '60-90 days', value: 92 },
      { name: '90+ days', value: 58 },
    ],
    coalStockByPlant: [
      { plant: 'Lalitpur', coalStockDays: 8, status: 'critical', dailyRequirementMT: 26000 },
      { plant: 'Barkhera', coalStockDays: 14, status: 'ok', dailyRequirementMT: 2600 },
      { plant: 'Maqsoodapur', coalStockDays: 12, status: 'low', dailyRequirementMT: 2600 },
      { plant: 'Khambarkhera', coalStockDays: 16, status: 'ok', dailyRequirementMT: 2600 },
      { plant: 'Kundarkhi', coalStockDays: 11, status: 'low', dailyRequirementMT: 2600 },
      { plant: 'Utraula', coalStockDays: 18, status: 'ok', dailyRequirementMT: 2600 },
    ],
    abcXyz: [
      { cell: 'AX', count: 42, value: 186 },
      { cell: 'AY', count: 18, value: 74 },
      { cell: 'AZ', count: 9, value: 61 },
      { cell: 'BX', count: 55, value: 48 },
      { cell: 'BY', count: 63, value: 37 },
      { cell: 'BZ', count: 28, value: 22 },
      { cell: 'CX', count: 140, value: 18 },
      { cell: 'CY', count: 96, value: 11 },
      { cell: 'CZ', count: 74, value: 8 },
    ],
    items: [
      { material: 'Steam Coal G11', code: 'COAL-G11', category: 'Coal', plant: 'Lalitpur', onHand: 208000, uom: 'MT', safetyStock: 312000, reorderPoint: 390000, daysOfSupply: 8, value: 520, abcClass: 'A', xyzClass: 'X', status: 'below_safety' },
      { material: 'Boiler Feed Pump Cartridge', code: 'BFP-CART-660', category: 'Boiler Spares', plant: 'Lalitpur', onHand: 1, uom: 'NO', safetyStock: 2, reorderPoint: 2, daysOfSupply: 15, value: 6.8, abcClass: 'A', xyzClass: 'Z', status: 'below_safety' },
      { material: 'Superheater Coil Assy', code: 'SH-COIL-01', category: 'Boiler Spares', plant: 'Lalitpur', onHand: 6, uom: 'NO', safetyStock: 4, reorderPoint: 5, daysOfSupply: 120, value: 14.2, abcClass: 'A', xyzClass: 'Y', status: 'ok' },
      { material: 'Turbine Blade Stage-3', code: 'TB-BLADE-S3', category: 'Turbine Spares', plant: 'Lalitpur', onHand: 0, uom: 'SET', safetyStock: 1, reorderPoint: 1, daysOfSupply: 0, value: 0, abcClass: 'A', xyzClass: 'Z', status: 'stockout' },
      { material: 'Coal Mill Grinding Roll', code: 'MILL-ROLL-XRP', category: 'Boiler Spares', plant: 'Lalitpur', onHand: 12, uom: 'NO', safetyStock: 6, reorderPoint: 8, daysOfSupply: 95, value: 9.6, abcClass: 'A', xyzClass: 'X', status: 'ok' },
      { material: 'ID Fan Bearing', code: 'IDFAN-BRG', category: 'Electrical / C&I', plant: 'Barkhera', onHand: 3, uom: 'NO', safetyStock: 4, reorderPoint: 4, daysOfSupply: 40, value: 1.1, abcClass: 'B', xyzClass: 'Y', status: 'below_safety' },
      { material: 'ESP Collecting Electrode', code: 'ESP-ELEC', category: 'Electrical / C&I', plant: 'Barkhera', onHand: 480, uom: 'NO', safetyStock: 200, reorderPoint: 300, daysOfSupply: 260, value: 3.4, abcClass: 'C', xyzClass: 'X', status: 'excess' },
      { material: 'Cation Exchange Resin', code: 'RESIN-CAT', category: 'Chemicals', plant: 'Barkhera', onHand: 2, uom: 'M3', safetyStock: 3, reorderPoint: 4, daysOfSupply: 22, value: 0.8, abcClass: 'B', xyzClass: 'Y', status: 'below_safety' },
      { material: 'Hydrochloric Acid (30%)', code: 'CHEM-HCL', category: 'Chemicals', plant: 'Maqsoodapur', onHand: 42, uom: 'MT', safetyStock: 20, reorderPoint: 30, daysOfSupply: 55, value: 0.6, abcClass: 'C', xyzClass: 'X', status: 'ok' },
      { material: 'FGD Limestone', code: 'FGD-LIME', category: 'Chemicals', plant: 'Lalitpur', onHand: 5800, uom: 'MT', safetyStock: 4000, reorderPoint: 6000, daysOfSupply: 12, value: 4.9, abcClass: 'B', xyzClass: 'X', status: 'below_safety' },
      { material: 'Turbine Lube Oil ISO-46', code: 'LUBE-TB46', category: 'Consumables', plant: 'Lalitpur', onHand: 38, uom: 'KL', safetyStock: 15, reorderPoint: 25, daysOfSupply: 140, value: 1.9, abcClass: 'B', xyzClass: 'X', status: 'ok' },
      { material: 'HFO (Heavy Fuel Oil)', code: 'FUEL-HFO', category: 'Fuel Oil', plant: 'Lalitpur', onHand: 1250, uom: 'KL', safetyStock: 600, reorderPoint: 900, daysOfSupply: 45, value: 8.4, abcClass: 'B', xyzClass: 'Y', status: 'ok' },
      { material: 'HT Motor Winding Set', code: 'HTM-WIND', category: 'Electrical / C&I', plant: 'Kundarkhi', onHand: 1, uom: 'SET', safetyStock: 1, reorderPoint: 2, daysOfSupply: 60, value: 2.2, abcClass: 'A', xyzClass: 'Z', status: 'below_safety' },
      { material: 'Ammonia (SCR NOx)', code: 'CHEM-NH3', category: 'Chemicals', plant: 'Lalitpur', onHand: 34, uom: 'MT', safetyStock: 20, reorderPoint: 28, daysOfSupply: 70, value: 0.9, abcClass: 'C', xyzClass: 'X', status: 'ok' },
    ],

    // --- SOW: Inventory analysis extras ---
    ved: [
      { cell: 'V', count: 168, value: 214 },  // Vital
      { cell: 'E', count: 342, value: 132 },  // Essential
      { cell: 'D', count: 296, value: 74 },   // Desirable
    ],
    fsn: [
      { cell: 'F', count: 214, value: 168 },  // Fast-moving
      { cell: 'S', count: 386, value: 194 },  // Slow-moving
      { cell: 'N', count: 206, value: 58 },   // Non-moving
    ],
    inventoryTrend: [
      { period: 'Oct', value: 1288 },
      { period: 'Nov', value: 1262 },
      { period: 'Dec', value: 1305 },
      { period: 'Jan', value: 1271 },
      { period: 'Feb', value: 1256 },
      { period: 'Mar', value: 1240 },
    ],
    deadStock: {
      totalValue: '₹58 Cr',
      items: [
        { material: 'ESP Collecting Electrode', code: 'ESP-ELEC', plant: 'Barkhera', value: 3.4, monthsNoMovement: 14 },
        { material: 'Obsolete Mill Liner (Old XRP)', code: 'MILL-LNR-OLD', plant: 'Lalitpur', value: 6.2, monthsNoMovement: 22 },
        { material: 'Spare Rotor Assembly (Unit-1 legacy)', code: 'ROT-U1-LEG', plant: 'Kundarkhi', value: 9.8, monthsNoMovement: 31 },
        { material: 'CHP Idler Rollers (superseded)', code: 'CHP-IDL-SS', plant: 'Maqsoodapur', value: 2.1, monthsNoMovement: 18 },
        { material: 'Redundant HT Breaker', code: 'HT-BRK-RED', plant: 'Utraula', value: 4.6, monthsNoMovement: 27 },
      ],
    },
    scrap: [
      { material: 'Scrap Steel / Structural', opening: 1240, receipt: 320, sale: 410, closing: 1150, value: 4.6 },
      { material: 'Used Refractory', opening: 86, receipt: 24, sale: 18, closing: 92, value: 0.4 },
      { material: 'Ash-handling Worn Pipes', opening: 210, receipt: 64, sale: 88, closing: 186, value: 1.1 },
      { material: 'Spent Ion-Exchange Resin', opening: 12, receipt: 6, sale: 4, closing: 14, value: 0.2 },
    ],
    criticalSpares: [
      { material: 'Turbine Blade Stage-3', code: 'TB-BLADE-S3', plant: 'Lalitpur', onHand: 0, daysCover: 0, stockoutRiskDays: 0, status: 'critical' },
      { material: 'Boiler Feed Pump Cartridge', code: 'BFP-CART-660', plant: 'Lalitpur', onHand: 1, daysCover: 15, stockoutRiskDays: 15, status: 'critical' },
      { material: 'HT Motor Winding Set', code: 'HTM-WIND', plant: 'Kundarkhi', onHand: 1, daysCover: 60, stockoutRiskDays: 60, status: 'watch' },
      { material: 'ID Fan Bearing', code: 'IDFAN-BRG', plant: 'Barkhera', onHand: 3, daysCover: 40, stockoutRiskDays: 40, status: 'watch' },
      { material: 'Superheater Coil Assy', code: 'SH-COIL-01', plant: 'Lalitpur', onHand: 6, daysCover: 120, stockoutRiskDays: 120, status: 'ok' },
    ],
  },

  alerts: [
    {
      id: 'be-1',
      severity: 'critical',
      title: 'Coal Stock Below CEA Critical Norm — Lalitpur',
      message: 'Lalitpur (1980 MW) coal stock at 8 days vs the CEA norm of ≥12 days. At current burn (26,000 MT/day) and NCL rake supply short by ~4 rakes/day, stock reaches critical (<5 days) in ~6 days.',
      category: 'Coal Supply',
      recommendation: 'Escalate rake indent with NCL; divert 2 imported-coal parcels (Adani) and blend at 10% to preserve stock. Consider e-auction spot procurement.',
    },
    {
      id: 'be-2',
      severity: 'warning',
      title: 'Boiler Feed Pump Cartridge Below Safety Stock',
      message: 'BFP cartridge (BFP-CART-660) at 1 vs safety stock of 2 at Lalitpur. BHEL lead time is 45 days — a BFP failure would force a unit de-load.',
      category: 'Critical Spares',
      recommendation: 'Raise an emergency PO to BHEL and check sister-plant / OEM refurbished-exchange availability to bridge the lead time.',
    },
    {
      id: 'be-3',
      severity: 'warning',
      title: 'Imported Coal Price Variance +12% vs Budget',
      message: 'Adani imported coal (5000 GAR) landed cost is 12% above budget on the latest PO due to freight and FX movement.',
      category: 'Cost',
      recommendation: 'Re-optimize the domestic:imported blend ratio; renegotiate freight; validate against updated ECL/e-auction landed cost.',
    },
    {
      id: 'be-4',
      severity: 'warning',
      title: 'Turbine Blade Stage-3 Stock-out — Lalitpur',
      message: 'TB-BLADE-S3 is at zero stock (safety 1 set). A single-set Siemens PO (45010078) is 8 days overdue.',
      category: 'Critical Spares',
      recommendation: 'Expedite Siemens PO 45010078; confirm ETA and secure a loaner set from OEM depot for the upcoming overhaul window.',
    },
    {
      id: 'be-5',
      severity: 'info',
      title: 'Excess ESP Electrode Inventory — Barkhera',
      message: 'ESP collecting electrodes at 480 vs safety 200 (260 days of supply). ₹3.4 Cr of slow-moving stock.',
      category: 'Excess / Obsolete',
      recommendation: 'Redistribute surplus to Maqsoodapur/Kundarkhi and pause further indents for two quarters.',
    },
    {
      id: 'be-6',
      severity: 'success',
      title: 'Coal Mill Grinding Rolls — Fleet Coverage Restored',
      message: 'Grinding rolls (MILL-ROLL-XRP) delivered; all six plants now above reorder point ahead of the pre-monsoon overhaul.',
      category: 'Replenishment',
    },
  ],

  reports: [
    {
      key: 'open-pr-aging', name: 'Open PR Aging', group: 'Procurement',
      description: 'Purchase requisitions pending conversion to PO, by age.',
      columns: ['PR No', 'Material', 'Plant', 'Value (₹ Cr)', 'Age (days)', 'Buyer'],
      rows: [
        ['10045521', 'Steam Coal G11 (rake)', 'Lalitpur', 24.1, 32, 'A. Verma'],
        ['10045538', 'Boiler Feed Pump Cartridge', 'Lalitpur', 6.8, 21, 'S. Rao'],
        ['10045544', 'ID Fan Bearing', 'Barkhera', 1.1, 18, 'P. Singh'],
        ['10045560', 'Cation/Anion Resin', 'Maqsoodapur', 2.1, 12, 'A. Verma'],
        ['10045573', 'FGD Limestone', 'Lalitpur', 4.9, 9, 'R. Nair'],
      ],
    },
    {
      key: 'open-po-aging', name: 'Open PO Aging', group: 'Procurement',
      description: 'Released POs pending delivery / GRN, by age.',
      columns: ['PO No', 'Vendor', 'Material', 'Value (₹ Cr)', 'Delivery Due', 'Days Overdue'],
      rows: [
        ['45010023', 'Northern Coalfields Ltd', 'Steam Coal G11', 118.5, '2026-03-20', 3],
        ['45010078', 'Siemens Energy', 'Turbine Blade Stage-3', 12.4, '2026-03-15', 8],
        ['45010134', 'Thermax', 'FGD Limestone Dosing', 4.9, '2026-03-18', 5],
        ['45010041', 'BHEL', 'BFP Cartridge', 6.8, '2026-03-28', 0],
      ],
    },
    {
      key: 'po-expediting', name: 'PO Expediting (7/15/30 Days)', group: 'Procurement',
      description: 'POs requiring expediting by delivery window.',
      columns: ['Window', 'PO Count', 'Value (₹ Cr)', 'Critical Items'],
      rows: [
        ['Due in 7 days', 14, 168, 'Coal rakes, BFP cartridge'],
        ['Due in 15 days', 22, 94, 'Turbine blade, resin'],
        ['Due in 30 days', 31, 132, 'Mill rolls, HFO'],
      ],
    },
    {
      key: 'critical-shortage', name: 'Critical Material Shortage Report', group: 'Inventory',
      description: 'Vital/critical materials below safety with stock-out risk.',
      columns: ['Material', 'Code', 'Plant', 'On-hand', 'Days Cover', 'Status'],
      rows: [
        ['Turbine Blade Stage-3', 'TB-BLADE-S3', 'Lalitpur', 0, 0, 'Stock-out'],
        ['BFP Cartridge', 'BFP-CART-660', 'Lalitpur', 1, 15, 'Critical'],
        ['HT Motor Winding Set', 'HTM-WIND', 'Kundarkhi', 1, 60, 'Watch'],
        ['ID Fan Bearing', 'IDFAN-BRG', 'Barkhera', 3, 40, 'Watch'],
      ],
    },
    {
      key: 'grn-pending', name: 'GRN Pending Report', group: 'Procurement',
      description: 'Goods received but GRN not yet posted in SAP MM.',
      columns: ['PO No', 'Vendor', 'Material', 'Qty', 'Received On', 'Pending (days)'],
      rows: [
        ['45009980', 'Central Coalfields Ltd', 'Steam Coal G12', '3 rakes', '2026-03-14', 4],
        ['45010002', 'Indian Oil', 'HFO', '120 KL', '2026-03-16', 2],
        ['45010060', 'BHEL', 'Mill Grinding Roll', '4 NO', '2026-03-15', 3],
      ],
    },
    {
      key: 'invoice-pending', name: 'Invoice Pending Report', group: 'Procurement',
      description: 'GRN done, vendor invoice not yet booked (MIRO pending).',
      columns: ['Vendor', 'PO No', 'Amount (₹ Cr)', 'GRN Date', 'Pending (days)'],
      rows: [
        ['Northern Coalfields Ltd', '45009900', 62.4, '2026-03-10', 8],
        ['Thermax', '45009945', 4.2, '2026-03-12', 6],
        ['Adani Enterprises', '45009971', 38.1, '2026-03-13', 5],
      ],
    },
    {
      key: 'vendor-delay', name: 'Vendor Delivery Delay Report', group: 'Vendor',
      description: 'Vendors with recurring delivery delays (rolling 90 days).',
      columns: ['Vendor', 'On-time %', 'Avg Delay (days)', 'Delayed POs', 'Impact'],
      rows: [
        ['BHEL', 87, 6.2, 24, 'Spares / overhaul risk'],
        ['South Eastern Coalfields', 89, 2.1, 18, 'Coal stock pressure'],
        ['Siemens Energy', 90, 8.0, 6, 'Turbine spare stock-out'],
      ],
    },
    {
      key: 'savings-report', name: 'Procurement Savings Report', group: 'Management',
      description: 'Realized savings vs budget and vs last purchase price.',
      columns: ['Category', 'Baseline (₹ Cr)', 'Negotiated (₹ Cr)', 'Savings (₹ Cr)', 'Savings %'],
      rows: [
        ['Coal (e-auction blend)', 3990, 3950, 40, '1.0%'],
        ['O&M Spares', 410, 385, 25, '6.1%'],
        ['Chemicals', 208, 195, 13, '6.3%'],
        ['Fuel Oil', 153, 145, 8, '5.2%'],
      ],
    },
    {
      key: 'cycle-time', name: 'Procurement Cycle Time Analysis', group: 'Management',
      description: 'Average PR→PO→GR cycle time by category.',
      columns: ['Category', 'PR→PO (days)', 'PO→GR (days)', 'Total (days)', 'Target'],
      rows: [
        ['Coal', 3.1, 4.8, 7.9, 7.0],
        ['O&M Spares', 6.4, 18.2, 24.6, 20.0],
        ['Chemicals', 4.2, 9.1, 13.3, 12.0],
      ],
    },
    {
      key: 'inv-turnover', name: 'Inventory Turnover Analysis', group: 'Inventory',
      description: 'Turnover and working capital by inventory nature.',
      columns: ['Nature', 'Avg Inventory (₹ Cr)', 'Consumption (₹ Cr)', 'Turnover', 'Days Held'],
      rows: [
        ['Coal', 810, 3950, '4.9x', 75],
        ['Boiler Spares', 116, 210, '1.8x', 202],
        ['Turbine Spares', 94, 88, '0.9x', 390],
        ['Chemicals', 62, 195, '3.1x', 116],
      ],
    },
    {
      key: 'kpi-scorecard', name: 'Management KPI Scorecard', group: 'Management',
      description: 'Consolidated procurement & inventory KPI scorecard.',
      columns: ['KPI', 'Actual', 'Target', 'Status'],
      rows: [
        ['Coal Rake OTIF', '91.4%', '95%', 'Below'],
        ['PO Cycle Time', '9.2 days', '7 days', 'Below'],
        ['Procurement Savings', '₹86 Cr', '₹75 Cr', 'Above'],
        ['Inventory Turnover', '3.8x', '4.0x', 'Below'],
        ['Excess/Obsolete', '₹58 Cr', '< ₹60 Cr', 'On Track'],
        ['Emergency Procurement', '18 cases', '< 15', 'Above'],
      ],
    },
  ],

  forecast: {
    currency: CUR,
    kpis: [
      { label: 'Forecast Accuracy', value: '91.1%', raw: 91.1, delta: '+1.4%', status: 'positive', sublabel: 'avg 8.9% MAPE' },
      { label: 'Stock-out Risk', value: '3 items', raw: 3, status: 'negative', sublabel: 'next 30 days' },
      { label: 'Reorder Now', value: '4 items', raw: 4, status: 'warning', sublabel: 'below reorder point' },
      { label: 'Overstock', value: '₹1.9 Cr', raw: 1.9, status: 'warning', sublabel: '1 slow-moving SKU' },
      { label: 'Forecast Horizon', value: '4 months', raw: 4, status: 'neutral' },
      { label: 'Safety-stock Opportunity', value: '₹4.8 Cr', raw: 4.8, status: 'positive', sublabel: 'optimization' },
    ],
    accuracyByCategory: [
      { name: 'Coal', value: 6.1 },
      { name: 'Consumables', value: 7.2 },
      { name: 'Chemicals', value: 9.5 },
      { name: 'Boiler Spares', value: 12.4 },
      { name: 'Turbine Spares', value: 15.1 },
    ],
    materials: [
      {
        material: 'Steam Coal G11', code: 'COAL-G11', category: 'Coal', plant: 'Lalitpur', uom: 'MT',
        method: 'Holt-Winters (seasonal)', mape: 6.1, bias: -1.2,
        currentStock: 208000, safetyStock: 312000, recommendedSafety: 360000, reorderPoint: 390000,
        leadTimeDays: 5, serviceLevel: 95, avgDemand: 782000, stockoutInDays: 8, recommendedOrderQty: 520000, status: 'stockout_risk',
        series: [
          { period: 'Aug', actual: 742000 }, { period: 'Sep', actual: 758000 }, { period: 'Oct', actual: 795000 },
          { period: 'Nov', actual: 770000 }, { period: 'Dec', actual: 812000 }, { period: 'Jan', actual: 838000 },
          { period: 'Feb', actual: 761000 }, { period: 'Mar', actual: 784000, forecast: 784000 },
          { period: 'Apr', forecast: 812000, band: [770000, 854000] }, { period: 'May', forecast: 861000, band: [808000, 914000] },
          { period: 'Jun', forecast: 845000, band: [788000, 902000] }, { period: 'Jul', forecast: 820000, band: [758000, 882000] },
        ],
      },
      {
        material: 'FGD Limestone', code: 'FGD-LIME', category: 'Chemicals', plant: 'Lalitpur', uom: 'MT',
        method: 'Holt-Winters', mape: 8.2, bias: 0.6,
        currentStock: 5800, safetyStock: 4000, recommendedSafety: 5000, reorderPoint: 6000,
        leadTimeDays: 20, serviceLevel: 95, avgDemand: 4600, stockoutInDays: 12, recommendedOrderQty: 8000, status: 'reorder',
        series: [
          { period: 'Aug', actual: 4200 }, { period: 'Sep', actual: 4350 }, { period: 'Oct', actual: 4700 },
          { period: 'Nov', actual: 4500 }, { period: 'Dec', actual: 4820 }, { period: 'Jan', actual: 4980 },
          { period: 'Feb', actual: 4410 }, { period: 'Mar', actual: 4620, forecast: 4620 },
          { period: 'Apr', forecast: 4780, band: [4400, 5160] }, { period: 'May', forecast: 5020, band: [4560, 5480] },
          { period: 'Jun', forecast: 4900, band: [4430, 5370] }, { period: 'Jul', forecast: 4750, band: [4260, 5240] },
        ],
      },
      {
        material: 'Boiler Feed Pump Cartridge', code: 'BFP-CART-660', category: 'Boiler Spares', plant: 'Lalitpur', uom: 'NO',
        method: 'Croston (intermittent)', mape: 22.0, bias: 0.1,
        currentStock: 1, safetyStock: 2, recommendedSafety: 2, reorderPoint: 2,
        leadTimeDays: 45, serviceLevel: 98, avgDemand: 0.5, stockoutInDays: 15, recommendedOrderQty: 2, status: 'stockout_risk',
        series: [
          { period: 'Aug', actual: 0 }, { period: 'Sep', actual: 1 }, { period: 'Oct', actual: 0 },
          { period: 'Nov', actual: 1 }, { period: 'Dec', actual: 0 }, { period: 'Jan', actual: 1 },
          { period: 'Feb', actual: 0 }, { period: 'Mar', actual: 1, forecast: 1 },
          { period: 'Apr', forecast: 0.6, band: [0, 2] }, { period: 'May', forecast: 0.6, band: [0, 2] },
          { period: 'Jun', forecast: 0.6, band: [0, 2] }, { period: 'Jul', forecast: 0.6, band: [0, 2] },
        ],
      },
      {
        material: 'Coal Mill Grinding Roll', code: 'MILL-ROLL-XRP', category: 'Boiler Spares', plant: 'Lalitpur', uom: 'NO',
        method: 'Moving Average', mape: 12.4, bias: -0.4,
        currentStock: 12, safetyStock: 6, recommendedSafety: 7, reorderPoint: 8,
        leadTimeDays: 60, serviceLevel: 95, avgDemand: 3.4, stockoutInDays: null, recommendedOrderQty: 0, status: 'ok',
        series: [
          { period: 'Aug', actual: 3 }, { period: 'Sep', actual: 4 }, { period: 'Oct', actual: 3 },
          { period: 'Nov', actual: 4 }, { period: 'Dec', actual: 2 }, { period: 'Jan', actual: 5 },
          { period: 'Feb', actual: 3 }, { period: 'Mar', actual: 4, forecast: 4 },
          { period: 'Apr', forecast: 3.4, band: [2, 5] }, { period: 'May', forecast: 3.6, band: [2, 5] },
          { period: 'Jun', forecast: 3.4, band: [2, 5] }, { period: 'Jul', forecast: 3.5, band: [2, 5] },
        ],
      },
      {
        material: 'Turbine Lube Oil ISO-46', code: 'LUBE-TB46', category: 'Consumables', plant: 'Lalitpur', uom: 'KL',
        method: 'Moving Average', mape: 7.2, bias: 0.3,
        currentStock: 38, safetyStock: 15, recommendedSafety: 12, reorderPoint: 25,
        leadTimeDays: 30, serviceLevel: 90, avgDemand: 8, stockoutInDays: null, recommendedOrderQty: 0, status: 'overstock',
        series: [
          { period: 'Aug', actual: 8 }, { period: 'Sep', actual: 7 }, { period: 'Oct', actual: 9 },
          { period: 'Nov', actual: 8 }, { period: 'Dec', actual: 7 }, { period: 'Jan', actual: 9 },
          { period: 'Feb', actual: 8 }, { period: 'Mar', actual: 8, forecast: 8 },
          { period: 'Apr', forecast: 8, band: [6, 10] }, { period: 'May', forecast: 8, band: [6, 10] },
          { period: 'Jun', forecast: 8, band: [6, 10] }, { period: 'Jul', forecast: 8, band: [6, 10] },
        ],
      },
      {
        material: 'Cation Exchange Resin', code: 'RESIN-CAT', category: 'Chemicals', plant: 'Barkhera', uom: 'M3',
        method: 'Croston (intermittent)', mape: 14.0, bias: -0.2,
        currentStock: 2, safetyStock: 3, recommendedSafety: 3, reorderPoint: 4,
        leadTimeDays: 30, serviceLevel: 95, avgDemand: 0.9, stockoutInDays: 22, recommendedOrderQty: 3, status: 'reorder',
        series: [
          { period: 'Aug', actual: 1 }, { period: 'Sep', actual: 0 }, { period: 'Oct', actual: 1 },
          { period: 'Nov', actual: 1 }, { period: 'Dec', actual: 1 }, { period: 'Jan', actual: 0 },
          { period: 'Feb', actual: 1 }, { period: 'Mar', actual: 1, forecast: 1 },
          { period: 'Apr', forecast: 0.9, band: [0, 2] }, { period: 'May', forecast: 0.9, band: [0, 2] },
          { period: 'Jun', forecast: 0.9, band: [0, 2] }, { period: 'Jul', forecast: 0.9, band: [0, 2] },
        ],
      },
    ],
  },

  aiContext: `You are advising Bajaj Energy (with Lalitpur Power Generation Co / LPGCL), India's largest private-sector thermal generator in Uttar Pradesh — ~2,430 MW: Lalitpur 3x660 MW supercritical plus five 90 MW plants (Barkhera, Maqsoodapur, Khambarkhera, Kundarkhi, Utraula). Focus on coal-based procurement & inventory MIS from SAP MM.
KEY FACTS (illustrative):
- Generation MTD 1,284 MU (plan 1,245); Fleet PLF 64.8%.
- Procurement spend: MTD ₹430 Cr, QTD ₹1,300 Cr, YTD ₹4,820 Cr vs budget ₹4,650 Cr (2.5% over). Coal is 82% of spend. Coal vendors: NCL, CCL, SECL (domestic linkage/e-auction) and Adani (imported).
- Top 5 vendors by value: NCL ₹1,850 Cr / 214 POs, CCL ₹980 Cr / 138, SECL ₹640 Cr / 92, Adani ₹480 Cr / 41, BHEL ₹210 Cr / 186. Highest procurement value = NCL. Savings YTD ₹86 Cr (1.8%).
- Open PR/PO aging: 30+ day bucket has 17 PRs (₹28 Cr) and 22 POs (₹297 Cr). Approval pending 89 cases across stages. Emergency procurement 18 cases ₹46 Cr MTD.
- Contracts expiring: NCL coal RC in 24 days (₹1,850 Cr); BHEL boiler AMC 38 days; IOCL HFO 51 days; Siemens TG AMC 78 days; Thermax chem 87 days. MSME outstanding ₹10.6 Cr. BGs: BHEL ₹24 Cr & Thermax ₹9.5 Cr expiring.
- Inventory analysis: VED 168 Vital (₹214 Cr); FSN 206 Non-moving (₹58 Cr); dead/non-moving ₹58 Cr; inventory trend falling ₹1,288→₹1,240 Cr.
- Coal stock (weighted) 11.5 days vs CEA norm ≥12; Lalitpur critically low at 8 days with NCL rakes short ~4/day.
- Inventory ₹1,240 Cr (Coal ₹820 Cr + Spares ₹420 Cr). Spares turnover 3.8x, 7 critical spares below safety, ₹58 Cr excess/obsolete.
- Key spares from BHEL, Siemens; chemicals from Thermax, Ion Exchange; fuel oil from Indian Oil.
- Critical open issues: BFP cartridge below safety (BHEL 45-day lead), Turbine Stage-3 blade stock-out (Siemens PO overdue), imported coal +12% vs budget.
- SAP MM SOURCES (answer table/field mapping questions): Procurement — EKKO/EKPO (PO header/item: EBELN, NETWR, WERKS), EBAN (PR), EKET (delivery EINDT), EKBE (GR/PO history, VGABE), RBKP/RSEG (invoice/MIRO), LFA1 (vendor). Inventory — MARD (stock by storage location: LABST unrestricted, SPEME blocked, INSME QI), MARC (MRP: MINBE reorder point, EISBE safety stock), MBEW (valuation: SALK3 value, STPRS/VERPR price), MKPF/MSEG (material movements by movement type BWART: 101 GR, 201/261 GI, 551 scrap), MARA/MAKT (material master). Turnover/DoS derive from MSEG goods issues vs MBEW.
When asked to list, tabulate, or compare data (POs, vendors, materials, aging, contracts, stock), prefer a concise markdown table. When asked to visualize/chart/trend, add a chart block. Otherwise lead with the number/status, then the insight, then a concrete action. Answer as a power-sector supply-chain Chief of Staff. Use plant names and coal-stock-days framing. Amounts in ₹ Crore (or ₹ Lakh where specified).`,
};
