
import { Alert } from "../types";

const generateHistory = (base: number, volatility: 'low' | 'high') => {
   const data = [];
   const days = 180; // 6 months
   let score = base;
   for(let i=0; i<days; i++) {
      score += (Math.random() - 0.5) * (volatility === 'high' ? 3 : 1);
      if(score > 100) score = 100;
      if(score < 60) score = 60;
      // Date: Days ago
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      data.push({
          date: date.toISOString().split('T')[0],
          displayDate: `${date.getMonth()+1}/${date.getDate()}`,
          score: Number(score.toFixed(1))
      });
   }
   return data;
};

const generateForecast = (base: number, trend: 'up' | 'down' | 'flat') => {
    const data = [];
    const days = 180; // 6 months
    let score = base;
    for(let i=0; i<days; i++) {
       const trendFactor = trend === 'up' ? 0.02 : trend === 'down' ? -0.03 : 0;
       score += (Math.random() - 0.5) + trendFactor;
       if(score > 100) score = 100;
       if(score < 60) score = 60;
       
       const date = new Date();
       date.setDate(date.getDate() + i + 1);
       data.push({
           date: date.toISOString().split('T')[0],
           displayDate: `${date.getMonth()+1}/${date.getDate()}`,
           score: Number(score.toFixed(1))
       });
    }
    return data;
};


export const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    severity: 'warning',
    title: 'Cold Chain Excursion Risk',
    message: 'Shipment #TRK-998 (Gammagard) currently at 6.8°C near Dubai hub. Approaching upper limit (8°C).',
    time: '10 mins ago',
    category: 'logistics',
    actionLabel: 'Contact Logistics'
  },
  {
    id: '2',
    severity: 'warning',
    title: 'Supplier Delay Forecast',
    message: 'Lonza API shipment for Entyvio delayed by 3 days due to weather in Visp, Switzerland.',
    time: '45 mins ago',
    category: 'planning',
    actionLabel: 'Update Plan'
  }
];

export const MOCK_DATABASE = {
  // EXECUTIVE BRIEFING METRICS (New)
  dailyBriefingMetrics: {
    demand: {
      mape: 12.5, // Mean Absolute Percentage Error
      bias: '+5.2%', // Positive bias means over-forecasting
      atRiskSkus: ['PROD-B', 'PROD-E'],
      insight: "Demand shifting for Oncology segment (+8% vs forecast)."
    },
    supply: {
      constraints: ["API Shortage (Takeda Hikari)", "Glass Vial Supply (Vetter)"],
      capacityUtilization: 92, // High
      supplierDelayImpact: "Moderate"
    },
    inventory: {
      coverageWeeks: 4.2,
      slowMovingValue: 1200000, // $1.2M
      expiryRiskValue: 45000, // $45k
      workingCapital: 14500000 // $14.5M tied up
    },
    service: {
      otif: 94.2, // On Time In Full
      fillRate: 96.5,
      delayedOrders: 3,
      customerEscalations: 1
    },
    production: {
      yield: 98.5,
      downtimeMinutes: 0,
      wipLevel: "Optimal"
    },
    logistics: {
      costVariance: "+2.1%", // Over budget
      activeShipments: 65,
      portCongestionRisk: "Los Angeles (High)"
    }
  },

  products: [
    {
      id: "PROD-A",
      name: "Product A (Entyvio SubQ)",
      category: "Gastroenterology",
      description: "Biologic for Ulcerative Colitis and Crohn's Disease. Requires strictly controlled cold chain (2-8°C).",
      supplierId: "SUP-1",
      inventoryLevel: 12500,
      safetyStock: 5000,
      unitCost: 450,
      leadTimeDays: 45,
      historicalDemand: [4200, 4300, 4500, 4100, 4600, 4800]
    },
    {
      id: "PROD-B",
      name: "Product B (Alunbrig)",
      category: "Oncology",
      description: "Tyrosine kinase inhibitor for ALK+ NSCLC. Solid oral dosage form.",
      supplierId: "SUP-2",
      inventoryLevel: 3200, // Low stock
      safetyStock: 4000,
      unitCost: 850,
      leadTimeDays: 30,
      historicalDemand: [2800, 2900, 3100, 3300, 3400, 3500]
    },
    {
      id: "PROD-C",
      name: "Product C (Gammagard Liquid)",
      category: "Plasma-Derived",
      description: "Immune Globulin Infusion (Human) 10%. Critical for primary immunodeficiency.",
      supplierId: "SUP-3",
      inventoryLevel: 18000,
      safetyStock: 10000,
      unitCost: 320,
      leadTimeDays: 60,
      historicalDemand: [9000, 9200, 8900, 9500, 9300, 9100]
    },
    {
      id: "PROD-D",
      name: "Product D (Takhzyro)",
      category: "Rare Disease",
      description: "Monoclonal antibody for HAE attacks. Subcutaneous injection.",
      supplierId: "SUP-4",
      inventoryLevel: 5600,
      safetyStock: 2000,
      unitCost: 2100,
      leadTimeDays: 90,
      historicalDemand: [1200, 1300, 1250, 1400, 1500, 1600]
    },
    {
      id: "PROD-E",
      name: "Product E (Vyvanse)",
      category: "Neuroscience",
      description: "CNS stimulant. Controlled substance requiring secure transport logic.",
      supplierId: "SUP-5",
      inventoryLevel: 50000,
      safetyStock: 25000,
      unitCost: 15,
      leadTimeDays: 14,
      historicalDemand: [45000, 46000, 44000, 47000, 48000, 49000]
    }
  ],
  suppliers: [
    {
      id: "SUP-1",
      name: "Supplier 1 (Lonza Visp)",
      location: "Switzerland",
      reliabilityScore: 98,
      riskFactor: "Low",
      capabilities: ["Biologics Drug Substance", "Cold Chain Packing"],
      performance: {
        supplyStability: 98,
        onTimeDelivery: 96,
        qualityCompliance: 99
      },
      history: generateHistory(98, 'low'),
      forecast: generateForecast(98, 'flat'),
      forecastFactors: ["Stable Alpine Weather", "Capacity Expansion Live"],
      risks: [
        { title: "Raw Material Dependency", level: "Low", description: "Primary source for specialized buffers." },
        { title: "Currency Fluctuation", level: "Medium", description: "Exposure to CHF/USD exchange rates." }
      ]
    },
    {
      id: "SUP-2",
      name: "Supplier 2 (Takeda Hikari)",
      location: "Japan",
      reliabilityScore: 92,
      riskFactor: "Medium (Production Delay)",
      capabilities: ["Small Molecule Manufacturing", "Packaging"],
      performance: {
        supplyStability: 92,
        onTimeDelivery: 88,
        qualityCompliance: 99
      },
      history: generateHistory(92, 'high'),
      forecast: generateForecast(91, 'down'),
      forecastFactors: ["Typhoon Season Approach", "Labor Holiday Schedule"],
      risks: [
        { title: "Typhoon Season Impact", level: "High", description: "Annual weather patterns affect shipping routes." },
        { title: "Capacity Constraints", level: "Medium", description: "Operating at 95% line capacity." }
      ]
    },
    {
      id: "SUP-3",
      name: "Supplier 3 (Baxter)",
      location: "USA (Los Angeles)",
      reliabilityScore: 99,
      riskFactor: "Low",
      capabilities: ["Plasma Fractionation", "Fill/Finish"],
      performance: {
        supplyStability: 97,
        onTimeDelivery: 99,
        qualityCompliance: 98
      },
      history: generateHistory(97, 'low'),
      forecast: generateForecast(98, 'up'),
      forecastFactors: ["New Logistics Partner", "Low Demand Period"],
      risks: [
        { title: "Labor Negotiations", level: "Low", description: "Union contract renewal in Q4." }
      ]
    },
    {
      id: "SUP-4",
      name: "Supplier 4 (Vetter Pharma)",
      location: "Germany",
      reliabilityScore: 96,
      riskFactor: "Low",
      capabilities: ["Aseptic Filling", "Syringe Assembly"],
      performance: {
        supplyStability: 95,
        onTimeDelivery: 94,
        qualityCompliance: 99
      },
      history: generateHistory(95, 'low'),
      forecast: generateForecast(95, 'flat'),
      forecastFactors: ["Consistent Energy Prices", "Stable Output"],
      risks: [
        { title: "Energy Costs", level: "Medium", description: "Rising natural gas prices in EU region." },
        { title: "Logistics Congestion", level: "Low", description: "Frankfurt hub occasional delays." }
      ]
    },
    {
      id: "SUP-5",
      name: "Supplier 5 (Patheon)",
      location: "Italy",
      reliabilityScore: 95,
      riskFactor: "Medium (Logistics Strike Risk)",
      capabilities: ["Solid Dose Manufacturing", "Controlled Substance Handling"],
      performance: {
        supplyStability: 90,
        onTimeDelivery: 85,
        qualityCompliance: 96
      },
      history: generateHistory(90, 'high'),
      forecast: generateForecast(88, 'down'),
      forecastFactors: ["Planned Transport Strikes", "Regulatory Audit Prep"],
      risks: [
        { title: "Regional Logistics Strikes", level: "High", description: "Transport sector strikes frequent in Q3." },
        { title: "Regulatory Audit", level: "Medium", description: "Upcoming FDA inspection scheduled." }
      ]
    }
  ],
  fleet: [
    { id: "TRK-998", vehicleType: "Refrigerated Truck (2-8°C)", currentRoute: "Dubai Hub -> Riyadh Distribution Center", status: "In Transit", cargo: "Gammagard", eta: "4 Hours" },
    { id: "TRK-104", vehicleType: "Standard Freight", currentRoute: "Los Angeles DC -> San Diego Regional", status: "Loading", cargo: "Empty", eta: "N/A" },
    { id: "TRK-402", vehicleType: "Refrigerated Van", currentRoute: "Hikari Plant -> Narita Airport", status: "Delayed", cargo: "Entyvio API", eta: "2 Hours Late" }
  ],
  // Historical data for "last week" queries
  deliveryLogs: [
    { id: "LOG-1001", date: "2024-05-10", status: "On Time", origin: "Lonza Visp", destination: "Frankfurt Hub" },
    { id: "LOG-1002", date: "2024-05-11", status: "Delayed (Weather)", origin: "Takeda Hikari", destination: "Dubai Hub" },
    { id: "LOG-1003", date: "2024-05-12", status: "On Time", origin: "Baxter LA", destination: "San Diego DC" },
    { id: "LOG-1004", date: "2024-05-13", status: "On Time", origin: "Patheon Italy", destination: "Paris DC" },
    { id: "LOG-1005", date: "2024-05-13", status: "Late (Customs)", origin: "Vetter Pharma", destination: "London Hub" },
    { id: "LOG-1006", date: "2024-05-14", status: "On Time", origin: "Lonza Visp", destination: "Frankfurt Hub" },
    { id: "LOG-1007", date: "2024-05-15", status: "Delayed (Mechanical)", origin: "Dubai Hub", destination: "Riyadh DC" }
  ],

  // --- DEMAND FORECASTING DATA ---
  forecastAccuracy: {
    // Weekly MAPE trend over last 12 weeks
    weeklyMape: [
      { week: 'W-12', mape: 14.2, bias: 3.1 },
      { week: 'W-11', mape: 13.8, bias: 2.8 },
      { week: 'W-10', mape: 15.1, bias: 4.2 },
      { week: 'W-9',  mape: 13.0, bias: 2.1 },
      { week: 'W-8',  mape: 12.8, bias: 1.9 },
      { week: 'W-7',  mape: 11.9, bias: 1.5 },
      { week: 'W-6',  mape: 13.5, bias: 3.0 },
      { week: 'W-5',  mape: 14.0, bias: 4.5 },
      { week: 'W-4',  mape: 12.1, bias: 2.2 },
      { week: 'W-3',  mape: 11.8, bias: 1.8 },
      { week: 'W-2',  mape: 12.9, bias: 3.5 },
      { week: 'W-1',  mape: 12.5, bias: 5.2 },
    ],
    // SKU-level forecast accuracy
    skuAccuracy: [
      { sku: 'PROD-A', name: 'Entyvio SubQ', mape: 8.2,  bias: 1.1,  category: 'Gastro',     abcClass: 'A', xyzClass: 'X', safetyStock: 5000,  currentStock: 12500, reorderPoint: 7000,  avgDemand: 4500 },
      { sku: 'PROD-B', name: 'Alunbrig',     mape: 18.5, bias: 8.3,  category: 'Oncology',   abcClass: 'A', xyzClass: 'Z', safetyStock: 4000,  currentStock: 3200,  reorderPoint: 5500,  avgDemand: 3200 },
      { sku: 'PROD-C', name: 'Gammagard',    mape: 9.1,  bias: 0.8,  category: 'Plasma',     abcClass: 'A', xyzClass: 'X', safetyStock: 10000, currentStock: 18000, reorderPoint: 13000, avgDemand: 9200 },
      { sku: 'PROD-D', name: 'Takhzyro',     mape: 14.7, bias: 3.2,  category: 'Rare Dis.',  abcClass: 'B', xyzClass: 'Y', safetyStock: 2000,  currentStock: 5600,  reorderPoint: 3000,  avgDemand: 1400 },
      { sku: 'PROD-E', name: 'Vyvanse',      mape: 11.3, bias: 2.0,  category: 'CNS',        abcClass: 'C', xyzClass: 'X', safetyStock: 25000, currentStock: 50000, reorderPoint: 30000, avgDemand: 47000 },
    ],
    // Forecast vs Actual demand data (last 6 months)
    demandAlignment: [
      { month: 'Oct', forecast: 68000, actual: 71200, accuracy: 95.5 },
      { month: 'Nov', forecast: 70000, actual: 73100, accuracy: 95.8 },
      { month: 'Dec', forecast: 72500, actual: 68900, accuracy: 95.0 },
      { month: 'Jan', forecast: 71000, actual: 74500, accuracy: 95.3 },
      { month: 'Feb', forecast: 73000, actual: 78200, accuracy: 93.4 },
      { month: 'Mar', forecast: 75000, actual: 81000, accuracy: 92.6 },
    ],
  },

  // ABC/XYZ Product Classification Matrix
  abcXyzMatrix: {
    // [abcClass][xyzClass] = products
    AX: ['PROD-A', 'PROD-C'], // High value, stable — systematic replenishment
    AY: [],                    // High value, variable — safety stock buffers
    AZ: ['PROD-B'],            // High value, erratic — min-max policy
    BX: [],                    // Medium value, stable
    BY: ['PROD-D'],            // Medium value, variable — safety stock + review
    BZ: [],                    // Medium value, erratic
    CX: ['PROD-E'],            // Low value, stable — automated reorder
    CY: [],
    CZ: [],
    insights: {
      AX: "Systematic MRP replenishment. Optimize safety stock to 95% service level.",
      AZ: "CRITICAL: PROD-B needs min-max policy. Current demand is erratic — increase safety stock to 6,000 units.",
      BY: "PROD-D (Takhzyro): Apply time-phased safety stock. Consider Kanban for hospital accounts.",
      CX: "PROD-E (Vyvanse): Automate via VMI with Patheon. Reduce manual planner involvement."
    }
  },

  // S&OP Calendar (current cycle)
  sopCalendar: [
    { phase: 'Demand Review',     date: 'Mon, Mar 4',  status: 'completed', owner: 'Commercial',  notes: 'Oncology demand revised +8%' },
    { phase: 'Supply Review',     date: 'Wed, Mar 6',  status: 'in_progress', owner: 'Operations', notes: 'Lonza API delay impact being assessed' },
    { phase: 'Pre-S&OP',          date: 'Fri, Mar 8',  status: 'upcoming', owner: 'Planning',    notes: 'Gap analysis & scenario options' },
    { phase: 'Executive S&OP',    date: 'Mon, Mar 11', status: 'upcoming', owner: 'Leadership',  notes: 'Decision on Alunbrig emergency order' },
    { phase: 'Plan Execution',    date: 'Tue, Mar 12', status: 'upcoming', owner: 'All Teams',   notes: 'Approved actions deployed to ERP' },
  ],

  // Safety Stock Optimization
  safetyStockAnalysis: [
    { sku: 'PROD-A', current: 5000,  recommended: 4800,  delta: -200,   serviceLevel: 97.5, leadTime: 45 },
    { sku: 'PROD-B', current: 4000,  recommended: 5800,  delta: +1800,  serviceLevel: 99.0, leadTime: 30 },
    { sku: 'PROD-C', current: 10000, recommended: 9200,  delta: -800,   serviceLevel: 98.0, leadTime: 60 },
    { sku: 'PROD-D', current: 2000,  recommended: 2400,  delta: +400,   serviceLevel: 96.0, leadTime: 90 },
    { sku: 'PROD-E', current: 25000, recommended: 22000, delta: -3000,  serviceLevel: 95.0, leadTime: 14 },
  ],
};
