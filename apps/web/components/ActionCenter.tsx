import React, { useState, useEffect } from 'react';
import { Alert } from '../types';
import { CheckCircle, AlertTriangle, Truck, FileText, Send, ArrowLeft, ClipboardList, MapPin, Calendar, Sparkles, Loader2, Share2, Copy, Check, Mail } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface ActionCenterProps {
  actionType: string;
  alert: Alert | null;
  onBack: () => void;
  onComplete: () => void;
}

export const ActionCenter: React.FC<ActionCenterProps> = ({ actionType, alert, onBack, onComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  // AI Draft State
  const [draft, setDraft] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  // AI Alternatives State
  const [suggestedAlternatives, setSuggestedAlternatives] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Sharing State
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    const generateInitialDraft = async () => {
      if (!alert) return;
      setIsDrafting(true);
      let prompt = "";
      
      if (actionType === 'logistics') {
        prompt = `Draft a concise, urgent instruction to a logistics carrier regarding this alert: "${alert.title}: ${alert.message}". 
        Include a clear directive to move stock to temp-controlled storage immediately. Use "Auth: Takeda Supply Command" signature.`;
      } else if (actionType === 'audit') {
        prompt = `Draft a short "Deviation Report Summary" for an internal Quality Audit based on this event: "${alert.message}". 
        Mention "Potential GMP Risk" and "Immediate Quarantine".`;
      }

      if (prompt) {
        const text = await geminiService.generateDraft(prompt);
        setDraft(text);
      }
      setIsDrafting(false);
    };

    generateInitialDraft();
  }, [actionType, alert]);

  if (!alert) return null;

  const handleExecute = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setCompleted(true);
      setTimeout(onComplete, 2000); // Auto-navigate back after success
    }, 1500);
  };

  const handleSuggestAlternatives = async () => {
    if (!alert) return;
    setIsSuggesting(true);
    try {
        const prompt = `
        **SUPPLY CHAIN MITIGATION REQUEST**
        **Context:** Alert: ${alert.title}. Message: ${alert.message}.
        
        **Task:**
        Suggest 3 alternative actions to simple acceptance of the delay.
        Focus on trade-offs between Cost and Speed.
        
        **Format:**
        Strictly use a bulleted list.
        Example:
        • Expedite Air Freight (Cost: High, Speed: Immediate) - Details...
        `;
        const text = await geminiService.generateDraft(prompt);
        setSuggestedAlternatives(text);
    } catch (e) {
        console.error(e);
    } finally {
        setIsSuggesting(false);
    }
  };

  // --- Sharing Functions ---
  const copyToClipboard = (text: string, context: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(context);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const shareViaEmail = (subject: string, body: string) => {
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleShareFullReport = () => {
    const report = `
RLAI SUPPLY CHAIN INCIDENT REPORT
--------------------------------
ALERT ID: ${alert.id}
SEVERITY: ${alert.severity.toUpperCase()}
TITLE: ${alert.title}
TIME: ${alert.time}

DETAILS:
${alert.message}

AI GENERATED ACTION DRAFT:
${draft}

${suggestedAlternatives ? `\nSTRATEGIC ALTERNATIVES:\n${suggestedAlternatives}` : ''}
    `.trim();

    copyToClipboard(report, 'full');
  };

  const renderContent = () => {
    switch (actionType) {
      case 'audit':
        return (
          <div className="space-y-6">
            <div className="bg-red-900/20 border border-red-500/30 p-5 rounded-2xl flex gap-4 backdrop-blur-md shadow-[0_0_20px_rgba(220,38,38,0.1)]">
              <div className="bg-red-500/20 p-3 rounded-full h-fit">
                <AlertTriangle className="text-red-500 flex-shrink-0" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-red-100 text-lg">Quality Event Detected</h3>
                <p className="text-sm text-red-300 mt-1">{alert.message}</p>
              </div>
            </div>

            <div className="liquid-card rounded-2xl p-8">
              <h4 className="font-bold text-white mb-6 flex items-center gap-3 text-lg">
                <ClipboardList className="text-red-500" size={24} />
                Audit Initiation Protocol <span className="text-xs bg-white/10 px-2 py-0.5 rounded ml-2 font-mono text-slate-400">GMP-2024-001</span>
              </h4>
              <div className="space-y-4 mb-8">
                <label className="flex items-center gap-3 p-4 border border-white/5 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors group">
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-red-600 rounded focus:ring-red-600 bg-slate-800 border-slate-600" />
                  <span className="text-sm text-slate-300 group-hover:text-white">Freeze inventory at Los Angeles DC (Lot #4492)</span>
                </label>
                <label className="flex items-center gap-3 p-4 border border-white/5 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors group">
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-red-600 rounded focus:ring-red-600 bg-slate-800 border-slate-600" />
                  <span className="text-sm text-slate-300 group-hover:text-white">Notify Regional Quality Manager (RQM)</span>
                </label>
              </div>
              
              {/* AI Draft Section */}
              <div className="mb-6 relative group">
                 <div className="flex justify-between items-center mb-2">
                   <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                     <Sparkles size={14} className="text-red-400" /> Deviation Report Draft
                   </label>
                   
                   <div className="flex gap-2">
                      <button 
                        onClick={() => copyToClipboard(draft, 'audit-draft')}
                        className="text-xs flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded text-slate-300 transition-colors"
                        title="Copy to Clipboard"
                      >
                        {copyFeedback === 'audit-draft' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        {copyFeedback === 'audit-draft' ? 'Copied' : 'Copy'}
                      </button>
                   </div>
                 </div>
                 
                 {isDrafting && <span className="absolute top-10 right-4 text-xs text-slate-400 flex items-center gap-1 z-10"><Loader2 size={10} className="animate-spin"/> AI writing...</span>}
                 
                 <textarea 
                   value={draft}
                   onChange={(e) => setDraft(e.target.value)}
                   className="w-full h-32 p-4 border border-white/10 rounded-xl text-sm bg-black/20 focus:bg-black/40 focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-slate-300 placeholder:text-slate-600"
                   placeholder="AI is generating draft..."
                 />
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-8 text-sm text-blue-300 flex gap-3 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <Sparkles size={18} className="mt-0.5 text-blue-400" />
                 TSCI Recommendation: Immediate quarantine prevents downstream recall risk. Financial impact estimated at $45k if contained now vs $2.1M if distributed.
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={onBack} className="px-5 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
                <button 
                  onClick={handleExecute}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center gap-2 font-bold transition-all"
                >
                  {isProcessing ? 'Initiating System Lock...' : 'Confirm Audit & Lock Inventory'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'logistics':
        return (
          <div className="space-y-6">
            <div className="bg-amber-900/20 border border-amber-500/30 p-5 rounded-2xl flex gap-4 backdrop-blur-md">
              <div className="bg-amber-500/20 p-3 rounded-full h-fit">
                 <Truck className="text-amber-500 flex-shrink-0" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-amber-100 text-lg">Logistics Intervention Required</h3>
                <p className="text-sm text-amber-200/80 mt-1">{alert.message}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="liquid-card rounded-2xl p-6">
                 <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                   <MapPin className="text-red-500" size={20} />
                   Live Tracking
                 </h4>
                 <div className="aspect-video bg-slate-900/50 rounded-xl flex items-center justify-center border border-white/5 mb-6 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950"></div>
                   <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute top-1/2 left-1/2 shadow-[0_0_10px_red]"></div>
                   <p className="text-slate-500 text-sm relative z-10 font-mono">Interactive Map Module</p>
                 </div>
                 <div className="space-y-3 text-sm">
                   <div className="flex justify-between border-b border-white/5 pb-2">
                     <span className="text-slate-400">Current Location:</span>
                     <span className="font-medium text-white">Dubai Hub (DXB)</span>
                   </div>
                   <div className="flex justify-between border-b border-white/5 pb-2">
                     <span className="text-slate-400">Temp Status:</span>
                     <span className="font-bold text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">6.8°C (Rising)</span>
                   </div>
                 </div>
              </div>

              <div className="liquid-card rounded-2xl p-6 flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-white flex items-center gap-2">
                        <Send className="text-red-500" size={20} />
                        Carrier Instruction
                    </h4>
                    
                    <div className="flex gap-2">
                       <button 
                         onClick={() => copyToClipboard(draft, 'logistics-draft')}
                         className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                         title="Copy Text"
                       >
                          {copyFeedback === 'logistics-draft' ? <Check size={16} className="text-emerald-400"/> : <Copy size={16} />}
                       </button>
                       <button 
                         onClick={() => shareViaEmail(`URGENT: Logistics Instruction - ${alert.title}`, draft)}
                         className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                         title="Open in Email"
                       >
                          <Mail size={16} />
                       </button>
                    </div>
                 </div>
                 
                 <div className="flex-1 relative">
                   {isDrafting && (
                     <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-10 backdrop-blur-sm rounded-xl">
                       <Loader2 className="animate-spin text-red-500" />
                     </div>
                   )}
                   <textarea 
                     className="w-full h-full min-h-[160px] p-4 border border-white/10 rounded-xl text-sm mb-4 bg-black/20 focus:bg-black/30 focus:ring-1 focus:ring-red-500/50 focus:outline-none text-slate-300 placeholder:text-slate-600 resize-none"
                     value={draft}
                     onChange={(e) => setDraft(e.target.value)}
                     placeholder="AI generating instruction..."
                   />
                 </div>

                 <div className="flex justify-end gap-3 pt-4">
                   <button onClick={onBack} className="px-4 py-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Ignore</button>
                   <button 
                    onClick={handleExecute}
                    disabled={isProcessing || isDrafting}
                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center gap-2 font-bold transition-all"
                   >
                     {isProcessing ? 'Transmitting...' : 'Send Instruction'}
                   </button>
                 </div>
              </div>
            </div>
          </div>
        );

      case 'planning':
        return (
          <div className="space-y-6">
            <div className="bg-blue-900/20 border border-blue-500/30 p-5 rounded-2xl flex gap-4 backdrop-blur-md">
              <div className="bg-blue-500/20 p-3 rounded-full h-fit">
                <Calendar className="text-blue-500 flex-shrink-0" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-blue-100 text-lg">Supply Plan Deviation</h3>
                <p className="text-sm text-blue-200/80 mt-1">{alert.message}</p>
              </div>
            </div>

            <div className="liquid-card rounded-2xl p-8">
              <h4 className="font-bold text-white mb-8 text-lg">Proposed Schedule Adjustment (Auto-Generated)</h4>
              
              <div className="relative border-l border-white/10 ml-4 space-y-8">
                <div className="relative pl-8">
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-slate-600 rounded-full ring-4 ring-slate-900"></div>
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-bold">Original Plan</p>
                  <p className="font-medium text-slate-500 line-through">Arrival: Oct 24th (Entyvio API)</p>
                </div>
                <div className="relative pl-8">
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-4 ring-red-500/20 shadow-[0_0_10px_red]"></div>
                  <p className="text-xs text-red-500 font-bold mb-1 uppercase tracking-wider">New Proposed Arrival</p>
                  <p className="font-bold text-white text-lg">Arrival: Oct 27th (Delayed +3 Days)</p>
                  <p className="text-sm text-slate-400 mt-2 bg-white/5 p-3 rounded-lg border border-white/5 inline-block">Impact: Safety stock drops to 12 days (Warning Level).</p>
                </div>
              </div>

              <div className="mt-10 bg-slate-900/50 border border-white/5 p-6 rounded-xl space-y-6">
                 <div className="flex justify-between items-center">
                     <div>
                       <span className="block text-base font-medium text-slate-200">Accept 3-day delay and consume safety stock?</span>
                       <span className="text-xs text-slate-500">Standard protocol for &lt; 5 day impact.</span>
                     </div>
                 </div>

                 {suggestedAlternatives && (
                    <div className="bg-black/20 p-5 rounded-xl border border-white/10 shadow-inner animate-fade-in relative group">
                        <div className="flex items-center justify-between mb-3">
                            <h5 className="flex items-center gap-2 text-sm font-bold text-blue-400">
                                <Sparkles size={14} /> AI Strategic Alternatives
                            </h5>
                            <button 
                                onClick={() => copyToClipboard(suggestedAlternatives, 'alternatives')}
                                className="text-xs text-slate-500 hover:text-white flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity"
                            >
                                {copyFeedback === 'alternatives' ? <Check size={12} className="text-emerald-400"/> : <Copy size={12} />}
                                {copyFeedback === 'alternatives' ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                            {suggestedAlternatives}
                        </p>
                    </div>
                 )}

                 <div className="flex flex-wrap justify-end gap-3 pt-2">
                   <button 
                     onClick={handleSuggestAlternatives}
                     disabled={isSuggesting}
                     className="mr-auto px-4 py-2 bg-white/5 border border-white/10 text-blue-400 hover:bg-white/10 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors hover:shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                   >
                     {isSuggesting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                     Suggest Alternatives
                   </button>
                   
                   <button onClick={onBack} className="px-5 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                   <button 
                     onClick={handleExecute}
                     disabled={isProcessing}
                     className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] text-sm font-bold shadow-lg transition-all"
                   >
                     {isProcessing ? 'Updating ERP...' : 'Confirm Update'}
                   </button>
                 </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unknown Action</div>;
    }
  };

  if (completed) {
    return (
      <div className="p-12 max-w-2xl mx-auto text-center mt-20 liquid-card rounded-3xl animate-fade-in border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <CheckCircle className="text-emerald-500" size={40} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Action Executed Successfully</h2>
        <p className="text-slate-400">The system has been updated. Returning to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in text-slate-200">
      
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <button 
            onClick={handleShareFullReport}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold hover:bg-white/10 hover:text-white transition-all text-slate-400"
        >
            {copyFeedback === 'full' ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
            {copyFeedback === 'full' ? 'Report Copied!' : 'Share Report'}
        </button>
      </div>

      <div className="flex items-center gap-4 mb-10">
         <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-xl flex items-center justify-center text-red-500 shadow-lg">
           <FileText size={24} />
         </div>
         <div>
           <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">
             {actionType === 'audit' && 'Compliance & Quality Audit'}
             {actionType === 'logistics' && 'Logistics Resolution Center'}
             {actionType === 'planning' && 'Supply Planning Adjustment'}
           </h1>
           <p className="text-sm text-slate-500 font-mono mt-1">ID: {alert.id} • STATUS: PENDING ACTION</p>
         </div>
      </div>

      {renderContent()}
    </div>
  );
};