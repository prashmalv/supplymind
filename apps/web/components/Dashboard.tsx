import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line, Legend, ReferenceLine, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AlertTriangle, TrendingUp, Thermometer, Activity, Pill, X, CheckCircle, ArrowRight, AlertCircle, Clock, History, Sparkles, Loader2, Info, Settings, Bell, Filter, Users, Factory, ShieldAlert, Box, ArrowUpRight, CloudLightning, BrainCircuit, MessageSquare, DollarSign, BarChart3, Package } from 'lucide-react';
import { KpiData, Alert } from '../types';
import { geminiService } from '../services/geminiService';
import { MOCK_ALERTS, MOCK_DATABASE } from '../services/mockDatabase';

const forecastData = [
  { name: 'Wk 1', demand: 4000, supply: 4200 },
  { name: 'Wk 2', demand: 4100, supply: 4100 },
  { name: 'Wk 3', demand: 4500, supply: 4000 }, 
  { name: 'Wk 4', demand: 4800, supply: 3800 },
  { name: 'Wk 5', demand: 5200, supply: 3500 },
  { name: 'Wk 6', demand: 5000, supply: 5000 }, 
];

const riskData = [
  { name: 'API Shortage', value: 75, color: '#ef4444' }, 
  { name: 'Cold Chain', value: 20, color: '#10b981' }, 
  { name: 'Reg. Hold', value: 45, color: '#f59e0b' }, 
  { name: 'Pkg Material', value: 30, color: '#3b82f6' },
];

const kpiTrends: Record<string, { day: string; value: number }[]> = {
  'Cold Chain': [
    { day: 'Mon', value: 99.8 },
    { day: 'Tue', value: 99.5 },
    { day: 'Wed', value: 99.7 },
    { day: 'Thu', value: 98.2 },
    { day: 'Fri', value: 98.9 },
    { day: 'Sat', value: 99.2 },
    { day: 'Sun', value: 99.4 },
  ],
  'Delivery': [
    { day: 'Mon', value: 94.5 },
    { day: 'Tue', value: 92.0 },
    { day: 'Wed', value: 95.8 },
    { day: 'Thu', value: 96.2 },
    { day: 'Fri', value: 93.9 },
    { day: 'Sat', value: 95.5 },
    { day: 'Sun', value: 97.0 },
  ],
  'Quality': [
    { day: 'Mon', value: 99.9 },
    { day: 'Tue', value: 100.0 },
    { day: 'Wed', value: 99.8 },
    { day: 'Thu', value: 99.5 },
    { day: 'Fri', value: 99.9 },
    { day: 'Sat', value: 100.0 },
    { day: 'Sun', value: 100.0 },
  ]
};

const initialKpis: KpiData[] = [
  { name: 'Cold Chain Integrity', value: 99.2, change: '+0.4%', status: 'positive' },
  { name: 'Entyvio Stock (Days)', value: 42, change: '-5 Days', status: 'neutral' },
  { name: 'Alunbrig Risk Level', value: 85, change: 'High', status: 'negative' },
  { name: 'Forecast Accuracy', value: 94, change: '+2%', status: 'positive' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Logic for Supply/Demand chart variance
    const demandEntry = payload.find((p: any) => p.name === 'Forecasted Demand');
    const supplyEntry = payload.find((p: any) => p.name === 'Projected Supply');
    let variance = null;
    let varianceLabel = '';
    
    if (demandEntry && supplyEntry) {
        const diff = supplyEntry.value - demandEntry.value;
        variance = diff;
        varianceLabel = diff < 0 ? 'Deficit' : 'Surplus';
    }

    return (
      <div className="bg-slate-900/95 border border-white/10 p-3 rounded-lg shadow-2xl backdrop-blur-xl text-xs z-50 min-w-[180px]">
        <p className="font-bold mb-2 text-slate-200 border-b border-white/10 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ backgroundColor: entry.stroke || entry.fill || entry.color }} />
              <span className="text-slate-300">{entry.name}:</span>
            </div>
            <span className="font-mono font-bold text-white">{entry.value}{entry.name === 'Quality' || entry.name === 'Cold Chain' || entry.name === 'Delivery' || entry.name === 'History' || entry.name === 'Forecast' ? '%' : ''}</span>
          </div>
        ))}

        {variance !== null && (
            <div className={`mt-2 pt-2 border-t border-white/10 flex justify-between items-center font-bold ${variance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                <span>Net {varianceLabel}:</span>
                <span>{variance > 0 ? '+' : ''}{variance}</span>
            </div>
        )}
      </div>
    );
  }
  return null;
};

// Updated KpiCard - Liquid Glass Style
const KpiCard: React.FC<{ data: KpiData; icon: React.ReactNode; onClick: () => void }> = ({ data, icon, onClick }) => (
  <div 
    onClick={onClick}
    className="relative group liquid-card p-6 rounded-2xl transition-all duration-300 hover:bg-slate-800/60 cursor-pointer overflow-hidden"
  >
    {/* Hover Glow Effect */}
    <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-600/20 blur-[60px] rounded-full group-hover:bg-red-500/30 transition-all"></div>

    <div className="relative z-10 flex items-start justify-between">
        <div>
        <p className="text-slate-400 text-sm font-medium group-hover:text-red-400 transition-colors">{data.name}</p>
        <h3 className="text-3xl font-bold text-white mt-2 tracking-tight group-hover:text-red-100 transition-colors drop-shadow-lg">
            {data.value}{typeof data.value === 'number' && data.name.includes('Integrity') ? '%' : ''}
        </h3>
        <span className={`text-xs font-bold px-2 py-1 rounded-md mt-3 inline-block border ${
            data.status === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            data.status === 'negative' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
            {data.change}
        </span>
        </div>
        <div className="p-3 bg-white/5 rounded-xl text-slate-300 border border-white/10 group-hover:border-red-500/30 group-hover:text-red-400 transition-colors shadow-lg">
        {icon}
        </div>
    </div>
  </div>
);

// Toggle Button Component for Time Ranges
const TimeToggle: React.FC<{ value: string; options: string[]; onChange: (val: string) => void }> = ({ value, options, onChange }) => (
    <div className="flex bg-black/20 rounded-lg p-1 border border-white/5">
        {options.map(opt => (
            <button
                key={opt}
                onClick={() => onChange(opt)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    value === opt 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                {opt}
            </button>
        ))}
    </div>
);

interface NudgeCardProps {
    title: string;
    value: string;
    question: string;
    icon: React.ReactNode;
    colorClass: string;
    onClick: () => void;
}

const NudgeCard: React.FC<NudgeCardProps> = ({ title, value, question, icon, colorClass, onClick }) => (
    <div onClick={onClick} className="min-w-[280px] p-4 liquid-card rounded-xl hover:bg-white/5 cursor-pointer transition-all border border-white/5 group relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`}></div>
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg bg-white/5 ${colorClass.replace('bg-', 'text-')}`}>
                    {icon}
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
            </div>
            <span className="text-lg font-bold text-white">{value}</span>
        </div>
        <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors pr-6">
            {question}
        </p>
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
            <ArrowRight size={16} className="text-slate-400" />
        </div>
    </div>
);

interface DashboardProps {
  onNavigateToAction: (actionType: string, alert: Alert) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToAction }) => {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [selectedKpi, setSelectedKpi] = useState<string>('Cold Chain');
  
  // Vendor KPI State
  const [selectedVendorId, setSelectedVendorId] = useState<string>(MOCK_DATABASE.suppliers[0].id);
  const [selectedVendorDetail, setSelectedVendorDetail] = useState<any | null>(null);
  
  // Chart Time Range States
  const [historyRange, setHistoryRange] = useState('6M');
  const [forecastRange, setForecastRange] = useState('6M');

  // Notification Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [filterConfig, setFilterConfig] = useState<{
    minSeverity: 'all' | 'critical';
    categories: Record<string, boolean>;
  }>({
    minSeverity: 'all',
    categories: {
      logistics: true,
      planning: true,
      quality: true
    }
  });
  
  const [insights, setInsights] = useState<{ [key: string]: { loading: boolean, text: string | null } }>({});
  const [activeKpiInsight, setActiveKpiInsight] = useState<{ title: string, content: string | null, loading: boolean } | null>(null);

  // Daily Briefing Metric Nudges
  const dailyMetrics = MOCK_DATABASE.dailyBriefingMetrics;

  const handleExplain = async (chartId: string, chartName: string, data: any) => {
    setInsights(prev => ({ ...prev, [chartId]: { loading: true, text: null } }));
    try {
      const text = await geminiService.explainChartInsights(chartName, data);
      setInsights(prev => ({ ...prev, [chartId]: { loading: false, text } }));
    } catch (e) {
      setInsights(prev => ({ ...prev, [chartId]: { loading: false, text: "Analysis failed." } }));
    }
  };

  const handleKpiClick = async (kpi: KpiData) => {
    setActiveKpiInsight({ title: kpi.name, content: null, loading: true });
    try {
      const text = await geminiService.explainKpiInsights(kpi.name, kpi.value, kpi.change);
      setActiveKpiInsight({ title: kpi.name, content: text, loading: false });
    } catch (e) {
      setActiveKpiInsight({ title: kpi.name, content: "Could not generate insight.", loading: false });
    }
  };

  const handleNudgeClick = async (category: string, question: string, data: any) => {
    setActiveKpiInsight({ title: category, content: null, loading: true });
    try {
        const prompt = `Executive Question: "${question}". Data: ${JSON.stringify(data)}. Provide a concise, 2-sentence executive answer.`;
        const text = await geminiService.generateDraft(prompt);
        setActiveKpiInsight({ title: category, content: text, loading: false });
    } catch(e) {
        setActiveKpiInsight({ title: category, content: "Insight unavailable.", loading: false });
    }
  };

  const closeInsight = (chartId: string) => {
     setInsights(prev => {
        const newState = { ...prev };
        delete newState[chartId];
        return newState;
     });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const newAlert: Alert = {
        id: 'new-1',
        severity: 'critical',
        title: 'CRITICAL: Inventory Drop',
        message: 'Alunbrig inventory at LAX DC dropped by 15% unexpectedly. Potential data sync error.',
        time: 'Just now',
        category: 'quality',
        actionLabel: 'Initiate Audit'
      };
      setAlerts(prev => [newAlert, ...prev]);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = (id: string) => {
    setDismissed(prev => [...prev, id]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 300);
  };

  const handleAction = (alert: Alert) => {
    let type = 'planning';
    if (alert.actionLabel?.includes('Audit')) type = 'audit';
    else if (alert.actionLabel?.includes('Logistics')) type = 'logistics';
    onNavigateToAction(type, alert);
  };

  const handleVendorClick = (vendorId: string) => {
      const vendor = MOCK_DATABASE.suppliers.find(s => s.id === vendorId);
      if (vendor) {
          setSelectedVendorDetail(vendor);
      }
  };

  const filteredAlerts = alerts.filter(a => {
    if (dismissed.includes(a.id)) return false;
    if (filterConfig.minSeverity === 'critical' && a.severity !== 'critical') return false;
    if (!filterConfig.categories[a.category]) return false;
    return true;
  });

  // Prepare Vendor Radar Data
  const selectedVendor = MOCK_DATABASE.suppliers.find(s => s.id === selectedVendorId) || MOCK_DATABASE.suppliers[0];
  const radarData = [
    { subject: 'Supply', A: selectedVendor.performance.supplyStability, fullMark: 100 },
    { subject: 'Time', A: selectedVendor.performance.onTimeDelivery, fullMark: 100 },
    { subject: 'Quality', A: selectedVendor.performance.qualityCompliance, fullMark: 100 },
  ];

  // Helper to get products for detail view
  const getVendorProducts = (vendorId: string) => {
      return MOCK_DATABASE.products.filter(p => p.supplierId === vendorId);
  };

  // Helper to slice data based on time range
  const filterChartData = (data: any[], range: string) => {
      if(!data) return [];
      const days = range === '1W' ? 7 : range === '1M' ? 30 : range === '3M' ? 90 : 180;
      return data.slice(-days);
  };

  const filterForecastData = (data: any[], range: string) => {
      if(!data) return [];
      const days = range === '1W' ? 7 : range === '1M' ? 30 : range === '3M' ? 90 : 180;
      return data.slice(0, days);
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in pb-20 relative text-slate-200">
      
      {/* --- VENDOR DETAIL OVERLAY --- */}
      {selectedVendorDetail && (
         <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-fade-in">
            <div className="max-w-7xl mx-auto p-6 md:p-12">
               {/* Header Navigation */}
               <div className="flex justify-between items-center mb-8">
                  <button 
                    onClick={() => setSelectedVendorDetail(null)}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                  >
                     <div className="p-2 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
                        <ArrowRight className="rotate-180" size={20} />
                     </div>
                     <span className="font-semibold">Back to Control Tower</span>
                  </button>
                  <div className="flex gap-3">
                     <span className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-sm font-bold flex items-center gap-2">
                        <ShieldAlert size={16} /> Risk Analysis Active
                     </span>
                  </div>
               </div>

               {/* Main Vendor Header */}
               <div className="liquid-card rounded-2xl p-8 mb-8 border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-16 -mt-16"></div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                     <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl">
                            <Factory size={40} className="text-slate-300" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white tracking-tight">{selectedVendorDetail.name}</h1>
                            <p className="text-xl text-slate-400 mt-2 flex items-center gap-2">
                               {selectedVendorDetail.location} 
                               <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                               Tier 1 Strategic Partner
                            </p>
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-8">
                        <div className="text-right">
                           <p className="text-sm text-slate-400 uppercase tracking-widest font-bold mb-1">Reliability Score</p>
                           <p className={`text-5xl font-bold ${selectedVendorDetail.reliabilityScore > 95 ? 'text-emerald-400' : 'text-blue-400'}`}>
                              {selectedVendorDetail.reliabilityScore}<span className="text-2xl text-slate-500">/100</span>
                           </p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Col: Charts */}
                  <div className="lg:col-span-2 space-y-8">
                     
                     {/* 1. Historical Performance */}
                     <div className="liquid-card rounded-2xl p-8">
                        <div className="flex justify-between items-center mb-6">
                           <div>
                              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                 <TrendingUp className="text-blue-500" /> 6-Month Performance Trend
                              </h3>
                              <p className="text-xs text-slate-400 mt-1">Historical Reliability Score</p>
                           </div>
                           <TimeToggle 
                              value={historyRange} 
                              options={['1W', '1M', '3M', '6M']} 
                              onChange={setHistoryRange} 
                           />
                        </div>
                        
                        <div className="h-64 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={filterChartData(selectedVendorDetail.history, historyRange)}>
                                 <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                 <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} minTickGap={30} />
                                 <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                 <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#94a3b8' }}
                                 />
                                 <Area 
                                    type="monotone" 
                                    dataKey="score" 
                                    name="History"
                                    stroke="#3b82f6" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorScore)" 
                                    animationDuration={500}
                                 />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     {/* 2. Predictive Forecasting (NEW) */}
                     <div className="liquid-card rounded-2xl p-8 relative overflow-hidden">
                        {/* Background subtle glow for future */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-6 relative z-10">
                           <div>
                              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                 <BrainCircuit className="text-purple-500" /> Future Reliability Forecast
                              </h3>
                              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                 AI Confidence: <span className="text-emerald-400 font-bold">94%</span>
                              </p>
                           </div>
                           <TimeToggle 
                              value={forecastRange} 
                              options={['1W', '1M', '3M', '6M']} 
                              onChange={setForecastRange} 
                           />
                        </div>
                        
                        <div className="h-64 w-full relative z-10">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={filterForecastData(selectedVendorDetail.forecast, forecastRange)}>
                                 <defs>
                                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                       <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                    </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                 <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} minTickGap={30} />
                                 <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                 <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                                    itemStyle={{ color: '#e9d5ff' }}
                                    labelStyle={{ color: '#94a3b8' }}
                                 />
                                 <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Risk Threshold', fill: '#ef4444', fontSize: 10 }} />
                                 <Area 
                                    type="monotone" 
                                    dataKey="score" 
                                    name="Forecast"
                                    stroke="#a855f7" 
                                    strokeWidth={3} 
                                    strokeDasharray="5 5"
                                    fillOpacity={1} 
                                    fill="url(#colorForecast)" 
                                    animationDuration={500}
                                 />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>

                        {/* AI Factors */}
                        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                           <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1 col-span-2">AI Forecasting Factors</div>
                           {selectedVendorDetail.forecastFactors?.map((factor: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 p-2 rounded-lg">
                                 <CloudLightning size={14} className="text-purple-400" />
                                 <span className="text-xs text-purple-200">{factor}</span>
                              </div>
                           ))}
                           {!selectedVendorDetail.forecastFactors && <span className="text-xs text-slate-500">No specific factors identified.</span>}
                        </div>
                     </div>

                  </div>

                  {/* Right Col: Risk & Info */}
                  <div className="space-y-8">
                     <div className="liquid-card rounded-2xl p-8 border-l-4 border-l-amber-500">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                           <ShieldAlert className="text-amber-500" /> Risk Analysis
                        </h3>
                        <div className="space-y-4">
                           {selectedVendorDetail.risks && selectedVendorDetail.risks.map((risk: any, i: number) => (
                              <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5">
                                 <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-slate-200 text-sm">{risk.title}</span>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                       risk.level === 'High' ? 'bg-red-500/20 text-red-400' :
                                       risk.level === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                                       'bg-blue-500/20 text-blue-400'
                                    }`}>{risk.level}</span>
                                 </div>
                                 <p className="text-xs text-slate-400 leading-relaxed">{risk.description}</p>
                              </div>
                           ))}
                           {(!selectedVendorDetail.risks || selectedVendorDetail.risks.length === 0) && (
                              <p className="text-sm text-slate-500">No specific risk factors identified.</p>
                           )}
                        </div>
                     </div>

                     <div className="liquid-card rounded-2xl p-8">
                        <h3 className="text-lg font-bold text-white mb-4">Capabilities</h3>
                        <div className="flex flex-wrap gap-2">
                           {selectedVendorDetail.capabilities.map((cap: string, i: number) => (
                              <span key={i} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-medium text-slate-300 transition-colors cursor-default">
                                 {cap}
                              </span>
                           ))}
                        </div>
                     </div>

                     <div className="liquid-card rounded-2xl p-8">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                           <Box className="text-slate-400" /> Product Portfolio
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                           {getVendorProducts(selectedVendorDetail.id).map(prod => (
                              <div key={prod.id} className="bg-slate-900/50 border border-white/5 p-4 rounded-xl hover:bg-white/5 transition-colors">
                                 <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{prod.category}</span>
                                    <span className={`text-xs font-bold ${prod.inventoryLevel < prod.safetyStock ? 'text-red-400' : 'text-emerald-400'}`}>
                                       {prod.inventoryLevel < prod.safetyStock ? 'Low Stock' : 'Healthy'}
                                    </span>
                                 </div>
                                 <h4 className="font-bold text-white text-lg">{prod.name}</h4>
                                 <div className="mt-4 flex justify-between items-end">
                                    <div>
                                       <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Inventory</p>
                                       <p className="text-xl font-mono text-slate-200">{prod.inventoryLevel.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Unit Cost</p>
                                       <p className="text-sm font-mono text-slate-300">${prod.unitCost}</p>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* KPI Insight Modal - Glass */}
      {activeKpiInsight && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="liquid-card rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="p-6 bg-gradient-to-br from-slate-900/50 to-slate-800/50">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-2 text-red-400 font-bold text-sm uppercase tracking-wide">
                   <Sparkles size={16} /> AI Executive Brief
                 </div>
                 <button 
                   onClick={() => setActiveKpiInsight(null)}
                   className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                 >
                   <X size={20} />
                 </button>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4 drop-shadow-md">{activeKpiInsight.title}</h3>
              
              <div className="min-h-[100px] text-slate-300 leading-relaxed text-sm">
                 {activeKpiInsight.loading ? (
                   <div className="flex flex-col items-center justify-center h-full py-8 text-slate-500 gap-3">
                     <Loader2 size={24} className="animate-spin text-red-500" />
                     <p className="text-xs font-medium">Analyzing global data points...</p>
                   </div>
                 ) : (
                   <p className="animate-fade-in">{activeKpiInsight.content}</p>
                 )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                <button 
                  onClick={() => setActiveKpiInsight(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Close Brief
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">Supply Watch Dashboard</h1>
          <p className="text-slate-400 mt-1">Global Oncology & GI Operations Control Tower</p>
        </div>
        <div className="text-right hidden sm:block">
           <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.2)] flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
             LIVE DATA STREAM
           </p>
        </div>
      </header>

      {/* DAILY EXECUTIVE BRIEFING (New Section) */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <MessageSquare size={14} className="text-blue-500" />
            Daily Executive Briefing
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <NudgeCard 
                title="Demand Forecast" 
                value={`${dailyMetrics.demand.mape}% MAPE`} 
                question="What is today's demand vs forecast accuracy?"
                icon={<BarChart3 size={16} />}
                colorClass="bg-blue-500"
                onClick={() => handleNudgeClick('Demand Insight', 'What is the current demand vs forecast and where are the spikes?', dailyMetrics.demand)}
            />
            <NudgeCard 
                title="Service Level" 
                value={`${dailyMetrics.service.otif}% OTIF`} 
                question="Which key customers are at risk of delay?"
                icon={<Activity size={16} />}
                colorClass="bg-emerald-500"
                onClick={() => handleNudgeClick('Service Risk', 'What is our OTIF today and are there escalations?', dailyMetrics.service)}
            />
             <NudgeCard 
                title="Inventory Health" 
                value={`$${(dailyMetrics.inventory.workingCapital / 1000000).toFixed(1)}M Cap`} 
                question="How much working capital is tied up today?"
                icon={<Package size={16} />}
                colorClass="bg-amber-500"
                onClick={() => handleNudgeClick('Inventory Capital', 'Analyze working capital and obsolescence risk.', dailyMetrics.inventory)}
            />
             <NudgeCard 
                title="Logistics Cost" 
                value={dailyMetrics.logistics.costVariance} 
                question="Are there transportation cost deviations?"
                icon={<DollarSign size={16} />}
                colorClass="bg-red-500"
                onClick={() => handleNudgeClick('Logistics Cost', 'What is the logistics cost variance today?', dailyMetrics.logistics)}
            />
        </div>
      </section>

      {/* Real-time Alerts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} className="text-red-500" /> 
            Critical Events
          </h2>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-bold border ${showSettings ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'}`}
          >
            <Settings size={14} />
            Configure Feed
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="liquid-card rounded-xl p-5 mb-6 animate-fade-in">
             <div className="flex items-center gap-2 mb-4">
                <Bell size={16} className="text-red-500" />
                <h3 className="font-bold text-white text-sm">Alert Stream Configuration</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Severity Threshold</label>
                 <div className="flex gap-2">
                   <button 
                     onClick={() => setFilterConfig(prev => ({...prev, minSeverity: 'all'}))}
                     className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all flex-1 ${filterConfig.minSeverity === 'all' ? 'bg-slate-700 text-white border-slate-600 shadow-lg' : 'bg-transparent text-slate-500 border-slate-700 hover:border-slate-500'}`}
                   >
                     All Events
                   </button>
                   <button 
                     onClick={() => setFilterConfig(prev => ({...prev, minSeverity: 'critical'}))}
                     className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all flex-1 ${filterConfig.minSeverity === 'critical' ? 'bg-red-600/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.2)]' : 'bg-transparent text-slate-500 border-slate-700 hover:border-slate-500'}`}
                   >
                     Critical Only
                   </button>
                 </div>
               </div>

               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 block">Active Channels</label>
                 <div className="flex flex-wrap gap-2">
                   {(['logistics', 'planning', 'quality'] as const).map(cat => (
                     <button
                       key={cat}
                       onClick={() => setFilterConfig(prev => ({
                         ...prev, 
                         categories: { ...prev.categories, [cat]: !prev.categories[cat] }
                       }))}
                       className={`px-3 py-1.5 border rounded-lg text-xs font-semibold capitalize transition-all flex items-center gap-2 ${
                         filterConfig.categories[cat] 
                           ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-sm' 
                           : 'bg-transparent border-slate-700 text-slate-500 hover:bg-white/5'
                       }`}
                     >
                       {filterConfig.categories[cat] ? <CheckCircle size={14} className="text-blue-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600"></div>}
                       {cat}
                     </button>
                   ))}
                 </div>
               </div>
             </div>
          </div>
        )}

        {filteredAlerts.length === 0 && (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
            <Filter size={24} className="mx-auto text-slate-600 mb-2" />
            <p className="text-slate-500 text-sm font-medium">No alerts match your current filters.</p>
            <button 
              onClick={() => setFilterConfig({ minSeverity: 'all', categories: { logistics: true, planning: true, quality: true } })}
              className="text-xs text-red-400 hover:underline mt-1"
            >
              Reset Filters
            </button>
          </div>
        )}

        {filteredAlerts.map(alert => (
          <div 
            key={alert.id} 
            className={`
              relative overflow-hidden rounded-xl border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 liquid-card hover:translate-x-1
              ${alert.severity === 'critical' ? 'border-l-4 border-l-red-500 shadow-[0_4px_20px_rgba(220,38,38,0.15)]' : 'border-l-4 border-l-amber-500'}
            `}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-full flex-shrink-0 border ${alert.severity === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                {alert.severity === 'critical' ? <AlertCircle size={22} /> : <Clock size={22} />}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                   <h3 className="font-bold text-white text-lg">
                     {alert.title}
                   </h3>
                   {alert.time === 'Just now' && (
                     <span className="animate-pulse px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white uppercase tracking-wide shadow-[0_0_10px_rgba(220,38,38,0.6)]">Live</span>
                   )}
                   <span className="text-xs text-slate-500 font-medium">{alert.time}</span>
                   <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-400 px-2 py-0.5 rounded-full border border-white/10">{alert.category}</span>
                </div>
                <p className="text-sm mt-1 text-slate-400 leading-relaxed max-w-3xl">
                  {alert.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pl-14 md:pl-0">
               {alert.actionLabel && (
                 <button 
                   onClick={() => handleAction(alert)}
                   className={`
                     text-sm font-semibold px-5 py-2.5 rounded-lg transition-all flex items-center gap-2
                     ${alert.severity === 'critical' 
                       ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-red-400/30' 
                       : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200'}
                   `}
                 >
                   {alert.actionLabel} <ArrowRight size={16} />
                 </button>
               )}
               <button 
                 onClick={() => handleDismiss(alert.id)}
                 className="p-2.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
               >
                 <X size={20} />
               </button>
            </div>
          </div>
        ))}
      </section>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {initialKpis.map((kpi, idx) => (
           <KpiCard 
            key={idx}
            data={kpi} 
            icon={idx === 0 ? <Thermometer size={24} /> : idx === 1 ? <Pill size={24} /> : idx === 2 ? <AlertTriangle size={24} /> : <TrendingUp size={24} />} 
            onClick={() => handleKpiClick(kpi)}
          />
        ))}
      </div>

      {/* Complex Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Predictive Supply vs Demand */}
        <div className="lg:col-span-2 liquid-card p-7 rounded-2xl relative group overflow-hidden">
          <div className="flex justify-between items-start mb-6 z-10 relative">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Predictive Supply Chain
                <span className="text-[10px] bg-white/10 border border-white/10 text-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">AI Model v2.5</span>
              </h2>
              <p className="text-sm text-slate-400 mt-1">6-Week Rolling Forecast • Entyvio (SubQ)</p>
            </div>
            <button 
              onClick={() => handleExplain('forecast', 'Supply vs Demand Forecast', forecastData)}
              className="flex items-center gap-2 text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-full transition-colors"
            >
              <Sparkles size={14} /> Explain Insights
            </button>
          </div>

          {/* AI Insight Overlay */}
          {insights['forecast'] && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-20 p-8 flex items-center justify-center animate-fade-in">
              <div className="max-w-lg w-full liquid-card p-6 relative rounded-xl border border-white/10 shadow-2xl">
                 <button onClick={() => closeInsight('forecast')} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>
                 <div className="flex items-center gap-3 mb-4 text-red-400">
                   {insights['forecast'].loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                   <h3 className="font-bold text-lg">AI Strategic Analysis</h3>
                 </div>
                 <div className="text-slate-300 leading-relaxed text-sm min-h-[80px]">
                   {insights['forecast'].loading ? (
                     <span className="animate-pulse text-slate-500">Analyzing supply variances and demand signals...</span>
                   ) : (
                     insights['forecast'].text
                   )}
                 </div>
              </div>
            </div>
          )}

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <ReferenceLine x="Week 3" stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Risk Onset', fill: '#ef4444', fontSize: 10 }} />
                <Area 
                  type="monotone" 
                  dataKey="demand" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorDemand)" 
                  name="Forecasted Demand" 
                  animationDuration={1500}
                />
                <Line 
                  type="monotone" 
                  dataKey="supply" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  strokeDasharray="5 5" 
                  dot={{ r: 4, strokeWidth: 2, fill: '#0f172a' }}
                  name="Projected Supply" 
                  animationDuration={1500}
                  animationBegin={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Breakdown */}
        <div className="liquid-card p-7 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Risk Radar</h2>
              <p className="text-sm text-slate-400 mt-1">Probability Impact Assessment</p>
            </div>
            <button 
              onClick={() => handleExplain('risk', 'Risk Distribution', riskData)}
              className="text-slate-500 hover:text-red-400 transition-colors"
            >
              <Info size={18} />
            </button>
          </div>

          {insights['risk'] && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-20 p-6 flex items-center justify-center animate-fade-in">
              <div className="w-full liquid-card p-5 relative rounded-xl border border-white/10 shadow-xl">
                 <button onClick={() => closeInsight('risk')} className="absolute top-2 right-2 text-slate-500 hover:text-white"><X size={16}/></button>
                 <h4 className="font-bold text-red-400 mb-2 text-sm flex items-center gap-2"><Sparkles size={14}/> Risk Analysis</h4>
                 <p className="text-xs text-slate-300 leading-relaxed">
                   {insights['risk'].loading ? 'Scanning global risk vectors...' : insights['risk'].text}
                 </p>
              </div>
            </div>
          )}

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1e293b" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={90} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24} animationDuration={1200}>
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* --- Strategic Sourcing Intelligence (NEW) --- */}
      <div className="liquid-card p-7 rounded-2xl relative">
         <div className="flex justify-between items-start mb-6">
            <div>
               <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Strategic Sourcing Intelligence
                  <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Vendor Performance</span>
               </h2>
               <p className="text-sm text-slate-400 mt-1">Real-time KPI Monitoring (Supply, Quality, Delivery)</p>
            </div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Vendor List */}
            <div className="lg:col-span-2 space-y-3">
               <div className="grid grid-cols-12 text-xs font-bold text-slate-500 uppercase tracking-wider px-4 pb-2 border-b border-white/5">
                  <div className="col-span-5">Partner</div>
                  <div className="col-span-2 text-center">Supply</div>
                  <div className="col-span-2 text-center">Time</div>
                  <div className="col-span-2 text-center">Quality</div>
                  <div className="col-span-1"></div>
               </div>
               
               {MOCK_DATABASE.suppliers.map((supplier) => (
                  <div 
                    key={supplier.id}
                    onClick={() => {
                        setSelectedVendorId(supplier.id);
                        handleVendorClick(supplier.id); // Trigger full view on click
                    }}
                    className={`grid grid-cols-12 items-center p-4 rounded-xl cursor-pointer transition-all border group ${
                       selectedVendorId === supplier.id 
                       ? 'bg-white/5 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                       : 'border-transparent hover:bg-white/5 hover:border-white/5'
                    }`}
                  >
                     <div className="col-span-5 flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${selectedVendorId === supplier.id ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                           <Factory size={16} />
                        </div>
                        <div>
                           <p className={`font-bold text-sm ${selectedVendorId === supplier.id ? 'text-white' : 'text-slate-300'} group-hover:text-blue-400 transition-colors`}>{supplier.name}</p>
                           <p className="text-xs text-slate-500">{supplier.location}</p>
                        </div>
                     </div>
                     
                     <div className="col-span-2 flex justify-center">
                        <span className={`font-mono text-sm font-bold ${supplier.performance.supplyStability > 95 ? 'text-emerald-400' : 'text-amber-400'}`}>
                           {supplier.performance.supplyStability}%
                        </span>
                     </div>
                     <div className="col-span-2 flex justify-center">
                        <span className={`font-mono text-sm font-bold ${supplier.performance.onTimeDelivery > 95 ? 'text-emerald-400' : 'text-amber-400'}`}>
                           {supplier.performance.onTimeDelivery}%
                        </span>
                     </div>
                     <div className="col-span-2 flex justify-center">
                        <span className={`font-mono text-sm font-bold ${supplier.performance.qualityCompliance > 98 ? 'text-emerald-400' : 'text-amber-400'}`}>
                           {supplier.performance.qualityCompliance}%
                        </span>
                     </div>
                     
                     <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight size={16} className="text-blue-400" />
                     </div>
                  </div>
               ))}
            </div>
            
            {/* Radar Chart for Selected Vendor */}
            <div className="flex flex-col items-center justify-center bg-slate-900/50 rounded-xl border border-white/5 p-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
               <div className="text-center mb-4 relative z-10">
                  <h3 className="font-bold text-white text-lg">{selectedVendor.name}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Performance Matrix</p>
               </div>
               
               <div className="w-full h-[250px] relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                     <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                           name={selectedVendor.name}
                           dataKey="A"
                           stroke="#3b82f6"
                           strokeWidth={3}
                           fill="#3b82f6"
                           fillOpacity={0.3}
                        />
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                           itemStyle={{ color: '#3b82f6' }}
                           labelStyle={{ display: 'none' }}
                        />
                     </RadarChart>
                  </ResponsiveContainer>
               </div>
               
               <div className="w-full mt-4 space-y-2 relative z-10">
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-400">Risk Factor</span>
                     <span className="text-white font-bold">{selectedVendor.riskFactor}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-slate-400">Reliability Score</span>
                     <span className="text-white font-bold">{selectedVendor.reliabilityScore}/100</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Historical Trend */}
      <div className="liquid-card p-7 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              KPI Trends
            </h2>
            <p className="text-sm text-slate-400 mt-1">7-Day Performance History</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/50 p-1 rounded-lg border border-white/10">
            {['Cold Chain', 'Delivery', 'Quality'].map((opt) => (
               <button
                 key={opt}
                 onClick={() => setSelectedKpi(opt)}
                 className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                   (selectedKpi === opt) 
                     ? 'bg-white/10 text-white shadow-sm border border-white/10' 
                     : 'text-slate-500 hover:text-slate-300'
                 }`}
               >
                 {opt}
               </button>
            ))}
          </div>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={kpiTrends[selectedKpi]} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                 <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#3b82f6" />
                 </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="plainline" />
              <Line 
                type="monotone" 
                dataKey="value" 
                name={selectedKpi} 
                stroke="url(#lineGradient)" 
                strokeWidth={4} 
                activeDot={{ r: 8, strokeWidth: 0, fill: '#ef4444' }} 
                dot={{r: 4, strokeWidth: 2, fill: '#0f172a', stroke: '#ef4444'}}
                animationDuration={1500}
                // Key forces re-animation on data change
                key={selectedKpi} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};