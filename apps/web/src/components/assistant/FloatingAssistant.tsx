import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Send, Mic, MicOff, Sparkles, Zap, Trash2, Loader2, MessageSquareText, CheckCircle2 } from 'lucide-react';
import { Message } from '@supplymind/shared';
import botIcon from '../../assets/assistant-bot.jpg';
import { api } from '../../lib/apiClient';
import { useAuth } from '../../auth/AuthProvider';
import { Markdown } from '../Markdown';
import { useAutomations, useCreateAutomation, useDeleteAutomation } from '../../lib/automationsApi';

interface PageCtx { name: string; queries: string[]; autos: string[]; }

const CTX: Record<string, PageCtx> = {
  '/dashboard': {
    name: 'Executive Overview',
    queries: ['Summarize the biggest risks right now', 'How are we tracking vs plan?', 'Chart procurement spend by category'],
    autos: ['Email me a daily executive briefing at 9 AM', 'Alert me when any critical exception appears'],
  },
  '/procurement': {
    name: 'Procurement MIS',
    queries: ['Which vendor has the highest purchase value?', 'List contracts expiring within 60 days', 'Show approval-pending cases by stage'],
    autos: ['Email me when a PO is overdue by 3+ days', 'Alert me when a contract expires within 30 days'],
  },
  '/inventory': {
    name: 'Inventory MIS',
    queries: ['Which critical spares may stock out in 30 days?', 'Which SAP MM tables power these KPIs?', 'Chart coal stock days by plant'],
    autos: ['Email me when any coal stock falls below 10 days', 'Alert me when a critical spare goes below safety stock'],
  },
  '/reports': {
    name: 'MIS Reports',
    queries: ['Give me the management KPI scorecard', 'Which reports show items needing action?', 'Summarize GRN & invoice pending'],
    autos: ['Email me the KPI scorecard every Monday', 'Alert me when GRN pending crosses 5 days'],
  },
  '/scenario': {
    name: 'Digital Twin',
    queries: ['What if coal supply is delayed 7 days?', 'What if input prices spike 15%?', 'Model a unit outage at Lalitpur'],
    autos: ['Email me if a modelled scenario turns critical'],
  },
};
const DEFAULT_CTX: PageCtx = {
  name: 'SupplyMind',
  queries: ['Summarize today’s supply-chain risks', 'What needs my attention now?', 'Chart spend by category'],
  autos: ['Email me a daily briefing', 'Alert me on any critical exception'],
};

const AUTO_RE = /\b(e-?mail|alert|notify|remind|ping|message)\s+me\b/i;
function looksLikeAutomation(t: string) { return AUTO_RE.test(t); }

export const FloatingAssistant: React.FC = () => {
  const { pathname } = useLocation();
  const { currentOrgId, user } = useAuth();
  const ctx = CTX[pathname] || DEFAULT_CTX;

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'chat' | 'autos'>('chat');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const storeKey = `sm_assist_${currentOrgId || 'x'}`;
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return [{ id: 'w', role: 'model', text: 'Hi — I’m your **SupplyMind assistant**. Ask me anything about this dashboard, or set up an alert like *"email me when coal stock falls below 10 days"*.', timestamp: new Date() }];
  });

  const autos = useAutomations();
  const createAuto = useCreateAutomation();
  const delAuto = useDeleteAutomation();

  useEffect(() => {
    try { localStorage.setItem(storeKey, JSON.stringify(messages.slice(-30))); } catch { /* ignore */ }
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, storeKey]);

  const push = (m: Message) => setMessages((p) => [...p, m]);

  const send = async (text: string = input) => {
    const t = text.trim();
    if (!t || loading) return;
    setInput('');
    push({ id: Date.now().toString(), role: 'user', text: t, timestamp: new Date() });

    // Automation intent → create an automation instead of a chat answer.
    if (looksLikeAutomation(t)) {
      setLoading(true);
      try {
        const created = await createAuto.mutateAsync({
          title: t.length > 60 ? t.slice(0, 57) + '…' : t,
          condition: t,
          action: 'email',
        });
        push({
          id: Date.now() + '_a', role: 'model', timestamp: new Date(),
          text: `✅ **Automation created.** I’ll email **${created.target || user?.email || 'you'}** when:\n\n> ${t}\n\nYou can see and manage it under the **Automations** tab.`,
        });
      } catch {
        push({ id: Date.now() + '_e', role: 'model', text: 'I couldn’t save that automation. Please try again.', timestamp: new Date() });
      } finally { setLoading(false); }
      return;
    }

    setLoading(true);
    try {
      const history = messages.filter((m) => m.id !== 'w').slice(-10).map((m) => ({ role: m.role, text: m.text }));
      const { text: reply } = await api.post<{ text: string }>('/ai/chat', {
        history,
        message: `${t}\n\n(Context: I'm viewing the ${ctx.name} dashboard.)`,
      });
      push({ id: Date.now() + '_r', role: 'model', text: reply, timestamp: new Date() });
    } catch {
      push({ id: Date.now() + '_er', role: 'model', text: 'Sorry, I couldn’t reach the assistant just now.', timestamp: new Date() });
    } finally { setLoading(false); }
  };

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Voice input needs Chrome.'); return; }
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = true; r.lang = 'en-IN';
    recogRef.current = r;
    r.onstart = () => setListening(true);
    r.onresult = (e: any) => setInput(Array.from(e.results as any[]).map((x: any) => x[0].transcript).join(''));
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
  };

  const clearChat = () => setMessages([{ id: 'w', role: 'model', text: 'Chat cleared. How can I help with the **' + ctx.name + '** dashboard?', timestamp: new Date() }]);

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full bg-white overflow-hidden shadow-[0_8px_30px_rgba(37,99,235,0.4)] ring-2 ring-red-500/60 hover:scale-105 transition-transform"
          title="Ask the SupplyMind assistant"
        >
          <img src={botIcon} alt="SupplyMind assistant" className="w-full h-full object-cover" />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#020617] animate-pulse" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-[60] w-[min(94vw,400px)] h-[min(82vh,620px)] flex flex-col liquid-card rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/40">
            <div className="w-8 h-8 rounded-lg bg-white overflow-hidden flex-shrink-0 ring-1 ring-slate-200 dark:ring-white/10"><img src={botIcon} alt="Assistant" className="w-full h-full object-cover" /></div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">SupplyMind Assistant</div>
              <div className="text-[11px] text-slate-500 truncate">{ctx.name} · voice + chat</div>
            </div>
            <button onClick={clearChat} title="Clear chat" className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md"><Trash2 size={15} /></button>
            <button onClick={() => setOpen(false)} title="Close" className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md"><X size={17} /></button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-3 pt-2 border-b border-slate-200 dark:border-white/10">
            {([['chat', 'Chat', MessageSquareText], ['autos', 'Automations', Zap]] as const).map(([k, label, Icon]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-t-lg border-b-2 -mb-px transition-colors ${tab === k ? 'border-red-500 text-slate-900 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <Icon size={13} /> {label}
                {k === 'autos' && (autos.data?.length ?? 0) > 0 && <span className="ml-0.5 text-[10px] bg-red-500/15 text-red-600 dark:text-red-400 rounded-full px-1.5">{autos.data!.length}</span>}
              </button>
            ))}
          </div>

          {tab === 'chat' ? (
            <>
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[88%] px-3 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-gradient-to-br from-red-600 to-red-700 text-white rounded-br-sm' : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 rounded-bl-sm border border-slate-200 dark:border-white/10'}`}>
                      {m.role === 'model' ? <Markdown text={m.text} /> : <span className="whitespace-pre-wrap">{m.text}</span>}
                    </div>
                  </div>
                ))}
                {loading && <div className="flex justify-start"><div className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"><Loader2 size={16} className="animate-spin text-red-500" /></div></div>}
                <div ref={endRef} />
              </div>

              {/* Chips */}
              <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide border-t border-slate-200 dark:border-white/10 pt-2">
                {ctx.queries.map((q) => (
                  <button key={q} onClick={() => send(q)} disabled={loading} className="flex items-center gap-1 text-[11px] whitespace-nowrap bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10">
                    <Sparkles size={9} className="text-red-400" />{q}
                  </button>
                ))}
                {ctx.autos.map((q) => (
                  <button key={q} onClick={() => send(q)} disabled={loading} className="flex items-center gap-1 text-[11px] whitespace-nowrap bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full hover:bg-amber-500/20">
                    <Zap size={9} />{q}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-slate-200 dark:border-white/10 flex items-end gap-2">
                <button onClick={toggleVoice} title="Speak" className={`p-2.5 rounded-xl border ${listening ? 'bg-red-500/20 border-red-500/50 text-red-500 animate-pulse' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
                  {listening ? <MicOff size={17} /> : <Mic size={17} />}
                </button>
                <textarea
                  value={input} onChange={(e) => setInput(e.target.value)} rows={1}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={`Ask about ${ctx.name}…`}
                  className="flex-1 resize-none max-h-24 px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500/40"
                />
                <button onClick={() => send()} disabled={!input.trim() || loading} className="p-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white disabled:opacity-50"><Send size={16} /></button>
              </div>
            </>
          ) : (
            /* Automations tab */
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <p className="text-xs text-slate-500 mb-3">Rules the assistant watches for you. When a condition is met, you get an email at <span className="font-medium text-slate-700 dark:text-slate-300">{user?.email}</span>.</p>
              {(autos.data?.length ?? 0) === 0 && (
                <div className="text-center text-slate-400 py-10 text-sm">
                  No automations yet.<br />Try a chip like <span className="text-amber-600 dark:text-amber-400">"{ctx.autos[0]}"</span> in Chat.
                </div>
              )}
              <div className="space-y-2">
                {autos.data?.map((a) => (
                  <div key={a.id} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10">
                    <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-slate-800 dark:text-slate-200 leading-snug">{a.condition}</div>
                      <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">{a.action} · {a.target}</div>
                    </div>
                    <button onClick={() => delAuto.mutate(a.id)} title="Delete" className="p-1 text-slate-400 hover:text-red-500 flex-shrink-0"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10">
                <p className="text-[11px] text-slate-500 mb-2">Quick add:</p>
                <div className="flex flex-wrap gap-1.5">
                  {ctx.autos.map((q) => (
                    <button key={q} onClick={() => { setTab('chat'); send(q); }} className="flex items-center gap-1 text-[11px] bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full hover:bg-amber-500/20">
                      <Zap size={9} />{q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
