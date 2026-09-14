import { SiteDataset } from './types';

// Bharat Consumer Products — a fictional India-based FMCG manufacturer &
// distributor, used to demo the platform in an Indian context (INR, Indian
// plants/cities, Indian vendor & product names). Procurement & inventory MIS
// mirror a multi-plant consumer-goods supply chain. Figures are illustrative.
// All monetary values are in ₹ Crore unless noted.

const CUR = 'INR';

export const bharatConsumerDataset: SiteDataset = {
  key: 'bharat-consumer',

  executive: {
    orgName: 'Bharat Consumer Products',
    sector: 'FMCG Manufacturing & Distribution',
    currency: CUR,
    headline: [
      { label: 'Dispatch (MTD)', value: '38,500 MT', delta: '+4.2%', status: 'positive', sublabel: 'vs plan 37,000 MT' },
      { label: 'Fill Rate', value: '96.2%', delta: '+0.6%', status: 'positive', sublabel: 'Primary + secondary' },
      { label: 'OTIF', value: '94.5%', delta: '-0.5%', status: 'warning', sublabel: 'Target 96%' },
      { label: 'Procurement Spend (YTD)', value: '₹1,680 Cr', delta: '+7.4%', status: 'neutral', sublabel: 'Raw materials 58%' },
      { label: 'Inventory Value', value: '₹420 Cr', delta: '-2.3%', status: 'positive', sublabel: 'FG + RM + packaging' },
      { label: 'Working Capital', value: '₹236 Cr', delta: '+1.1%', status: 'warning', sublabel: 'Tied in inventory' },
    ],
    generationTrend: [
      { period: 'Oct', actual: 35200, plan: 34000 },
      { period: 'Nov', actual: 36800, plan: 35500 },
      { period: 'Dec', actual: 39100, plan: 37000 },
      { period: 'Jan', actual: 37600, plan: 36500 },
      { period: 'Feb', actual: 34900, plan: 35000 },
      { period: 'Mar', actual: 38500, plan: 37000 },
    ],
    spendByCategory: [
      { name: 'Raw Materials', value: 975 },
      { name: 'Packaging', value: 302 },
      { name: 'Ingredients & Additives', value: 151 },
      { name: 'Logistics & Freight', value: 134 },
      { name: 'MRO & Spares', value: 68 },
      { name: 'Marketing Services', value: 50 },
    ],
    alertsSummary: { critical: 1, warning: 3, info: 2 },
  },

  procurement: {
    currency: CUR,
    kpis: [
      { label: 'Total Spend (YTD)', value: '₹1,680 Cr', raw: 1680, delta: '+7.4%', status: 'neutral' },
      { label: 'Raw Material Share', value: '58%', raw: 58, status: 'neutral', sublabel: '₹975 Cr' },
      { label: 'PO Cycle Time', value: '6.4 days', raw: 6.4, delta: '-0.3 d', status: 'positive', sublabel: 'Target 6 days' },
      { label: 'On-Time Delivery', value: '93.8%', raw: 93.8, delta: '-0.6%', status: 'warning', sublabel: 'Target 96%' },
      { label: 'Open PO Value', value: '₹214 Cr', raw: 214, status: 'neutral', sublabel: '186 open POs' },
      { label: 'Maverick Spend', value: '5.1%', raw: 5.1, delta: '-0.8%', status: 'positive', sublabel: 'Off-contract' },
    ],
    monthlySpendSeries: [
      { key: 'coal', label: 'Raw Materials' },
      { key: 'spares', label: 'Packaging' },
      { key: 'chemicals', label: 'Ingredients' },
      { key: 'fuel', label: 'Logistics' },
      { key: 'services', label: 'Marketing' },
    ],
    monthlySpend: [
      { period: 'Oct', coal: 148, spares: 46, chemicals: 24, fuel: 22, services: 9 },
      { period: 'Nov', coal: 156, spares: 51, chemicals: 25, fuel: 21, services: 8 },
      { period: 'Dec', coal: 171, spares: 54, chemicals: 27, fuel: 24, services: 10 },
      { period: 'Jan', coal: 162, spares: 49, chemicals: 26, fuel: 23, services: 9 },
      { period: 'Feb', coal: 149, spares: 44, chemicals: 23, fuel: 20, services: 8 },
      { period: 'Mar', coal: 167, spares: 52, chemicals: 26, fuel: 24, services: 9 },
    ],
    spendByCategory: [
      { name: 'Raw Materials', value: 975 },
      { name: 'Packaging', value: 302 },
      { name: 'Ingredients & Additives', value: 151 },
      { name: 'Logistics & Freight', value: 134 },
      { name: 'MRO & Spares', value: 68 },
      { name: 'Marketing Services', value: 50 },
    ],
    spendByPlant: [
      { name: 'Bhiwandi (Mumbai)', value: 402 },
      { name: 'Pune', value: 318 },
      { name: 'Ahmedabad', value: 296 },
      { name: 'Ghaziabad (Delhi NCR)', value: 274 },
      { name: 'Bengaluru', value: 232 },
      { name: 'Guwahati', value: 158 },
    ],
    topVendors: [
      { vendor: 'Ganga Agro Commodities', category: 'Raw Materials', spend: 372, onTimePct: 94, qualityPct: 97, reliability: 'High' },
      { vendor: 'Sunrise Edible Oils', category: 'Raw Materials', spend: 318, onTimePct: 91, qualityPct: 98, reliability: 'Medium' },
      { vendor: 'Annapurna Grains', category: 'Raw Materials', spend: 246, onTimePct: 95, qualityPct: 96, reliability: 'High' },
      { vendor: 'Shakti Packaging Pvt Ltd', category: 'Packaging', spend: 178, onTimePct: 92, qualityPct: 99, reliability: 'High' },
      { vendor: 'Meghna Flexipack', category: 'Packaging', spend: 124, onTimePct: 88, qualityPct: 97, reliability: 'Medium' },
      { vendor: 'Deccan Ingredients', category: 'Ingredients & Additives', spend: 96, onTimePct: 93, qualityPct: 98, reliability: 'High' },
      { vendor: 'Bharat Roadways Logistics', category: 'Logistics & Freight', spend: 134, onTimePct: 90, qualityPct: 95, reliability: 'Medium' },
      { vendor: 'Vindhya MRO Supplies', category: 'MRO & Spares', spend: 68, onTimePct: 86, qualityPct: 96, reliability: 'Medium' },
    ],
    onTimeByVendor: [
      { name: 'Ganga Agro', value: 94 },
      { name: 'Sunrise Oils', value: 91 },
      { name: 'Annapurna', value: 95 },
      { name: 'Shakti Pack', value: 92 },
      { name: 'Meghna', value: 88 },
      { name: 'Bharat Road', value: 90 },
    ],
    openPos: [
      { poNumber: '47020118', vendor: 'Sunrise Edible Oils', material: 'Refined Sunflower Oil (bulk)', plant: 'Bhiwandi (Mumbai)', value: 18.6, currency: CUR, deliveryDate: '2026-08-14', daysOverdue: 3, status: 'overdue' },
      { poNumber: '47020134', vendor: 'Shakti Packaging Pvt Ltd', material: 'BOPP Laminate Film Rolls', plant: 'Pune', value: 6.2, currency: CUR, deliveryDate: '2026-08-20', daysOverdue: 0, status: 'due_soon' },
      { poNumber: '47020151', vendor: 'Ganga Agro Commodities', material: 'Wheat (Milling Grade)', plant: 'Ghaziabad (Delhi NCR)', value: 24.1, currency: CUR, deliveryDate: '2026-08-26', daysOverdue: 0, status: 'on_track' },
      { poNumber: '47020168', vendor: 'Meghna Flexipack', material: 'Detergent Pouch Laminate', plant: 'Ahmedabad', value: 3.8, currency: CUR, deliveryDate: '2026-08-11', daysOverdue: 5, status: 'overdue' },
      { poNumber: '47020172', vendor: 'Deccan Ingredients', material: 'Vitamin & Mineral Premix', plant: 'Bengaluru', value: 4.4, currency: CUR, deliveryDate: '2026-08-22', daysOverdue: 0, status: 'due_soon' },
      { poNumber: '47020189', vendor: 'Annapurna Grains', material: 'Basmati Rice (Bulk)', plant: 'Ghaziabad (Delhi NCR)', value: 12.9, currency: CUR, deliveryDate: '2026-08-28', daysOverdue: 0, status: 'on_track' },
    ],
  },

  inventory: {
    currency: CUR,
    kpis: [
      { label: 'Total Inventory Value', value: '₹420 Cr', raw: 420, delta: '-2.3%', status: 'positive' },
      { label: 'Inventory Turnover', value: '9.4x', raw: 9.4, delta: '+0.3x', status: 'positive' },
      { label: 'Days of Supply', value: '39 days', raw: 39, status: 'neutral' },
      { label: 'Expiry Risk', value: '₹6.2 Cr', raw: 6.2, delta: '+0.4%', status: 'warning', sublabel: 'Food SKUs < 90d shelf' },
      { label: 'Excess / Obsolete', value: '₹18 Cr', raw: 18, delta: '-3.1%', status: 'positive', sublabel: 'Slow-moving' },
      { label: 'Below Safety Stock', value: '5 SKUs', raw: 5, status: 'negative', sublabel: 'At key DCs' },
    ],
    valueByCategory: [
      { name: 'Finished Goods', value: 186 },
      { name: 'Raw Materials', value: 132 },
      { name: 'Packaging', value: 58 },
      { name: 'Work-in-Progress', value: 28 },
      { name: 'MRO & Spares', value: 16 },
    ],
    agingBuckets: [
      { name: '0-30 days', value: 232 },
      { name: '30-60 days', value: 112 },
      { name: '60-90 days', value: 52 },
      { name: '90+ days', value: 24 },
    ],
    coalStockByPlant: [],
    abcXyz: [
      { cell: 'AX', count: 36, value: 148 },
      { cell: 'AY', count: 22, value: 66 },
      { cell: 'AZ', count: 11, value: 41 },
      { cell: 'BX', count: 48, value: 44 },
      { cell: 'BY', count: 57, value: 31 },
      { cell: 'BZ', count: 24, value: 18 },
      { cell: 'CX', count: 120, value: 16 },
      { cell: 'CY', count: 88, value: 10 },
      { cell: 'CZ', count: 64, value: 6 },
    ],
    items: [
      { material: 'Refined Sunflower Oil 1L', code: 'FG-OIL-SF1', category: 'Finished Goods', plant: 'Bhiwandi (Mumbai)', onHand: 182000, uom: 'CS', safetyStock: 90000, reorderPoint: 120000, daysOfSupply: 22, value: 42.5, abcClass: 'A', xyzClass: 'X', status: 'ok' },
      { material: 'Fortified Atta 10kg', code: 'FG-ATTA-10', category: 'Finished Goods', plant: 'Ghaziabad (Delhi NCR)', onHand: 46000, uom: 'BAG', safetyStock: 60000, reorderPoint: 80000, daysOfSupply: 12, value: 21.8, abcClass: 'A', xyzClass: 'Y', status: 'below_safety' },
      { material: 'Glucose Biscuits (Carton)', code: 'FG-BISC-GL', category: 'Finished Goods', plant: 'Pune', onHand: 8400, uom: 'CS', safetyStock: 15000, reorderPoint: 20000, daysOfSupply: 6, value: 3.2, abcClass: 'A', xyzClass: 'Z', status: 'below_safety' },
      { material: 'Detergent Powder 1kg', code: 'FG-DET-1K', category: 'Finished Goods', plant: 'Ahmedabad', onHand: 310000, uom: 'PKT', safetyStock: 120000, reorderPoint: 160000, daysOfSupply: 58, value: 14.6, abcClass: 'B', xyzClass: 'X', status: 'excess' },
      { material: 'Packaged Tea 500g', code: 'FG-TEA-500', category: 'Finished Goods', plant: 'Guwahati', onHand: 21000, uom: 'PKT', safetyStock: 12000, reorderPoint: 18000, daysOfSupply: 34, value: 5.9, abcClass: 'A', xyzClass: 'Y', status: 'ok' },
      { material: 'Toilet Soap (75g x144)', code: 'FG-SOAP-75', category: 'Finished Goods', plant: 'Bengaluru', onHand: 14200, uom: 'CS', safetyStock: 10000, reorderPoint: 14000, daysOfSupply: 28, value: 4.1, abcClass: 'B', xyzClass: 'X', status: 'ok' },
      { material: 'Refined Sunflower Oil (Bulk RM)', code: 'RM-OIL-BLK', category: 'Raw Materials', plant: 'Bhiwandi (Mumbai)', onHand: 1250, uom: 'MT', safetyStock: 1800, reorderPoint: 2400, daysOfSupply: 9, value: 16.2, abcClass: 'A', xyzClass: 'Y', status: 'below_safety' },
      { material: 'Wheat (Milling Grade)', code: 'RM-WHEAT', category: 'Raw Materials', plant: 'Ghaziabad (Delhi NCR)', onHand: 4200, uom: 'MT', safetyStock: 2500, reorderPoint: 3500, daysOfSupply: 41, value: 11.3, abcClass: 'A', xyzClass: 'X', status: 'ok' },
      { material: 'BOPP Laminate Film', code: 'PK-BOPP', category: 'Packaging', plant: 'Pune', onHand: 82, uom: 'MT', safetyStock: 120, reorderPoint: 160, daysOfSupply: 11, value: 2.6, abcClass: 'B', xyzClass: 'Y', status: 'below_safety' },
      { material: 'Detergent Pouch Laminate', code: 'PK-DETLAM', category: 'Packaging', plant: 'Ahmedabad', onHand: 640, uom: 'ROLL', safetyStock: 300, reorderPoint: 420, daysOfSupply: 96, value: 3.8, abcClass: 'C', xyzClass: 'X', status: 'excess' },
      { material: 'Vitamin & Mineral Premix', code: 'IN-PREMIX', category: 'Raw Materials', plant: 'Bengaluru', onHand: 28, uom: 'MT', safetyStock: 15, reorderPoint: 22, daysOfSupply: 46, value: 4.4, abcClass: 'B', xyzClass: 'Z', status: 'ok' },
      { material: 'Basmati Rice 5kg', code: 'FG-RICE-5K', category: 'Finished Goods', plant: 'Ghaziabad (Delhi NCR)', onHand: 62000, uom: 'BAG', safetyStock: 30000, reorderPoint: 42000, daysOfSupply: 44, value: 18.9, abcClass: 'A', xyzClass: 'X', status: 'ok' },
      { material: 'Hair Oil 200ml', code: 'FG-HAIR-200', category: 'Finished Goods', plant: 'Bengaluru', onHand: 96000, uom: 'BTL', safetyStock: 40000, reorderPoint: 55000, daysOfSupply: 51, value: 6.7, abcClass: 'B', xyzClass: 'Y', status: 'ok' },
    ],
  },

  alerts: [
    {
      id: 'bc-1',
      severity: 'critical',
      title: 'Edible Oil Price Spike +15% vs Budget',
      message: 'Refined sunflower oil landed cost is 15% above budget on the latest PO (Sunrise Edible Oils) due to global crude-oil rates and INR depreciation. RM stock at Bhiwandi is only 9 days.',
      category: 'Cost / Raw Material',
      recommendation: 'Advance-buy 30 days of oil against a fixed-price contract; hedge INR exposure; evaluate a second vendor (Ganga Agro) for split allocation.',
    },
    {
      id: 'bc-2',
      severity: 'warning',
      title: 'Glucose Biscuits Below Safety Stock — Pune',
      message: 'FG-BISC-GL at 8,400 cartons vs safety 15,000 (6 days of supply). Festive-season demand is running ~12% ahead of forecast.',
      category: 'Finished Goods',
      recommendation: 'Schedule an extra biscuit line shift at Pune; transfer 4,000 cartons from Bengaluru DC to cover the gap.',
    },
    {
      id: 'bc-3',
      severity: 'warning',
      title: 'BOPP Packaging Film Shortage — Pune',
      message: 'BOPP laminate at 82 MT vs safety 120 MT (11 days). Meghna Flexipack PO (47020168 equivalent) is running late; a shortage would halt snack packing lines.',
      category: 'Packaging',
      recommendation: 'Expedite the open film PO; qualify Shakti Packaging as an alternate for BOPP to de-risk single-sourcing.',
    },
    {
      id: 'bc-4',
      severity: 'warning',
      title: 'Atta Below Safety at Delhi NCR DC',
      message: 'Fortified Atta 10kg at 46,000 bags vs safety 60,000 at Ghaziabad — 12 days of cover into peak North-India demand.',
      category: 'Finished Goods',
      recommendation: 'Prioritise atta milling at Ghaziabad; pull forward wheat PO 47020151 delivery.',
    },
    {
      id: 'bc-5',
      severity: 'info',
      title: 'Excess Detergent Stock — Ahmedabad',
      message: 'Detergent Powder 1kg at 58 days of supply (₹14.6 Cr) vs 30-day target. Ties up working capital.',
      category: 'Excess / Obsolete',
      recommendation: 'Run a trade-scheme push in the West region; pause the next detergent production batch.',
    },
    {
      id: 'bc-6',
      severity: 'info',
      title: 'Tea Expiry Watch — Guwahati',
      message: 'A tea lot (₹1.1 Cr) is within 75 days of best-before. Included in the ₹6.2 Cr expiry-risk pool.',
      category: 'Expiry Risk',
      recommendation: 'Allocate the near-expiry lot to fast-moving East-region routes first (FEFO).',
    },
  ],

  aiContext: `You are advising Bharat Consumer Products, a mid-to-large India-based FMCG manufacturer & distributor (edible oil, atta, biscuits, detergents, tea, soaps, rice, hair oil). Six plants/DCs: Bhiwandi (Mumbai), Pune, Ahmedabad, Ghaziabad (Delhi NCR), Bengaluru, Guwahati. Focus on procurement & inventory MIS from SAP MM. All amounts in ₹ Crore.
KEY FACTS (illustrative):
- Dispatch MTD 38,500 MT (plan 37,000); Fill rate 96.2%; OTIF 94.5%.
- Raw materials are 58% of the ₹1,680 Cr YTD procurement spend. Key vendors: Ganga Agro Commodities, Sunrise Edible Oils, Annapurna Grains (raw); Shakti Packaging, Meghna Flexipack (packaging); Deccan Ingredients; Bharat Roadways Logistics.
- Inventory ₹420 Cr (Finished Goods ₹186 Cr, Raw Materials ₹132 Cr). Turnover 9.4x; expiry risk ₹6.2 Cr on food SKUs; 5 SKUs below safety; ₹18 Cr excess/obsolete.
- Critical open issues: edible-oil price spike +15% vs budget with only 9 days RM cover; Glucose Biscuits and Atta below safety into festive demand; BOPP packaging film shortage at Pune.
Answer as an FMCG supply-chain Chief of Staff: lead with the number/status, then the insight, then a concrete action. Use plant/city names and ₹ Crore. Consider Indian context (festive demand, monsoon logistics, FEFO for food shelf-life).`,
};
