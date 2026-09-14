import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, ChevronRight, Activity, Bell, BarChart3, Package, DollarSign, X, Loader2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { LiveServerMessage } from '@google/genai';
import { MOCK_ALERTS, MOCK_DATABASE } from '../services/mockDatabase';
import { Alert } from '../types';

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Exact documented conversion
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LandingBriefingCard: React.FC<{
  title: string;
  value: string;
  question: string;
  icon: React.ReactNode;
  colorClass: string;
  gradientClass: string;
  onClick: () => void;
}> = ({ title, value, question, icon, colorClass, gradientClass, onClick }) => (
  <button onClick={onClick} className="relative group w-72 p-6 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/10 hover:bg-slate-800/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] text-left overflow-hidden snap-center flex-shrink-0">
    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 transition-opacity group-hover:opacity-40 ${gradientClass}`}></div>
    <div className="relative z-10 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3.5 rounded-2xl bg-white/5 border border-white/5 ${colorClass}`}>{icon}</div>
        <span className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">{value}</span>
      </div>
      <div className="mt-auto">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</h3>
        <p className="text-sm font-medium text-slate-300 leading-relaxed group-hover:text-white transition-colors">{question}</p>
      </div>
      <div className="mt-5 flex items-center gap-2 text-xs font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
         <Sparkles size={14} className="animate-pulse" /> Ask RLAI Intelligence
      </div>
    </div>
  </button>
);

interface LandingPageProps {
  onNavigateToDashboard: () => void;
  onNavigateToAction: (actionType: string, alert: Alert) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToDashboard, onNavigateToAction }) => {
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'processing'>('idle');
  const [activeInsight, setActiveInsight] = useState<{ title: string; content: string | null; loading: boolean } | null>(null);
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sessionRef = useRef<any>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const mounted = useRef(true);
  const isShuttingDown = useRef(false);
  const dailyMetrics = MOCK_DATABASE.dailyBriefingMetrics;

  const handleBriefingClick = async (category: string, question: string, data: any) => {
    setActiveInsight({ title: category, content: null, loading: true });
    try {
      const text = await geminiService.generateDraft(`Question: ${question}. Data: ${JSON.stringify(data)}. Give a 2-sentence executive answer.`);
      setActiveInsight({ title: category, content: text, loading: false });
    } catch(e) {
      setActiveInsight({ title: category, content: "Insight unavailable.", loading: false });
    }
  };

  useEffect(() => {
    mounted.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let time = 0;
    const draw = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let baseColor = status === 'listening' ? '16, 185, 129' : status === 'speaking' ? '239, 68, 68' : '255, 255, 255';
      let amp = status === 'listening' ? 40 : status === 'speaking' ? 60 : 20;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${baseColor}, ${0.5 - i * 0.1})`;
        ctx.lineWidth = 2;
        for (let x = 0; x < canvas.width; x++) {
          const y = canvas.height / 2 + Math.sin(x * 0.01 + time + i * 2) * amp * Math.sin(x / canvas.width * Math.PI);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      time += 0.05;
      animationRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { mounted.current = false; cancelAnimationFrame(animationRef.current); };
  }, [status]);

  const toggleVoice = async () => isListening ? stopSession() : startSession();

  const startSession = async () => {
    try {
      if (isShuttingDown.current) return;
      setStatus('connecting');
      setIsListening(true);
      isShuttingDown.current = false;
      
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();
      
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      const sessionPromise = geminiService.connectLiveSession({
        onOpen: () => {
          if (!mounted.current || isShuttingDown.current) return;
          setStatus('listening');
          mediaStreamSourceRef.current = inputCtx.createMediaStreamSource(audioStream);
          scriptProcessorRef.current = inputCtx.createScriptProcessor(4096, 1, 1);
          scriptProcessorRef.current.onaudioprocess = (e) => {
             if (isShuttingDown.current) return;
             const pcmBlob = createBlob(e.inputBuffer.getChannelData(0));
             sessionPromiseRef.current?.then(s => s.sendRealtimeInput({ media: pcmBlob }));
          };
          mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
          scriptProcessorRef.current.connect(inputCtx.destination);
        },
        onMessage: async (msg) => {
           if (isShuttingDown.current || !mounted.current) return;
           const base64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
           if (base64 && outputAudioContextRef.current) {
             setStatus('speaking');
             const ctx = outputAudioContextRef.current;
             nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
             try {
               const audioBuffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
               const source = ctx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputNode);
               source.onended = () => { if (mounted.current) setStatus('listening'); sourcesRef.current.delete(source); };
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               sourcesRef.current.add(source);
             } catch(e) {}
           }
        },
        onError: (e) => {
            console.error("Live Session Error:", e);
            setStatus('idle');
            setIsListening(false);
        },
        onClose: () => { if(mounted.current) { setStatus('idle'); setIsListening(false); } }
      });
      sessionPromiseRef.current = sessionPromise;
      sessionRef.current = await sessionPromise;
    } catch (e) { 
        console.error("Failed to start session:", e);
        stopSession(); 
    }
  };

  const stopSession = async () => {
    isShuttingDown.current = true;
    sessionRef.current?.close();
    mediaStreamSourceRef.current?.disconnect();
    scriptProcessorRef.current?.disconnect();
    sourcesRef.current.forEach(s => { try { s.stop() } catch(e){} });
    await inputAudioContextRef.current?.close();
    await outputAudioContextRef.current?.close();
    setStatus('idle');
    setIsListening(false);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] text-white flex flex-col items-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600 rounded-full filter blur-[150px] opacity-20 animate-pulse"></div>
         <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600 rounded-full filter blur-[120px] opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="z-10 w-full max-w-6xl flex flex-col items-center flex-1 space-y-8 mt-4">
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500 drop-shadow-2xl">Supply Intelligence</h1>
          <p className="text-slate-400 text-lg font-light tracking-wide">Autonomous Logistics Commander</p>
        </div>

        <div className="w-full overflow-x-auto pb-6 pt-2 scrollbar-hide snap-x">
             <div className="flex justify-center gap-6 min-w-max px-4">
                 <LandingBriefingCard 
                    title="Demand Forecast" 
                    value={`${dailyMetrics.demand.mape}% MAPE`} 
                    question="What is today's demand vs forecast accuracy?"
                    icon={<BarChart3 size={24} />}
                    colorClass="text-blue-400"
                    gradientClass="bg-blue-500"
                    onClick={() => handleBriefingClick('Demand Insight', 'What is the current demand vs forecast?', dailyMetrics.demand)}
                />
                <LandingBriefingCard 
                    title="Service Level" 
                    value={`${dailyMetrics.service.otif}% OTIF`} 
                    question="Which key customers are at risk of delay?"
                    icon={<Activity size={24} />}
                    colorClass="text-emerald-400"
                    gradientClass="bg-emerald-500"
                    onClick={() => handleBriefingClick('Service Risk', 'What is our OTIF today?', dailyMetrics.service)}
                />
                <LandingBriefingCard 
                    title="Inventory Health" 
                    value={`$${(dailyMetrics.inventory.workingCapital / 1000000).toFixed(1)}M`} 
                    question="How much working capital is tied up today?"
                    icon={<Package size={24} />}
                    colorClass="text-amber-400"
                    gradientClass="bg-amber-500"
                    onClick={() => handleBriefingClick('Inventory Capital', 'Analyze working capital risk.', dailyMetrics.inventory)}
                />
                <LandingBriefingCard 
                    title="Logistics Cost" 
                    value={dailyMetrics.logistics.costVariance} 
                    question="Are there transportation cost deviations?"
                    icon={<DollarSign size={24} />}
                    colorClass="text-red-400"
                    gradientClass="bg-red-500"
                    onClick={() => handleBriefingClick('Logistics Cost', 'What is the logistics cost variance today?', dailyMetrics.logistics)}
                />
             </div>
        </div>

        <div className="relative w-full h-64 md:h-72 flex items-center justify-center">
            <div className={`absolute w-32 h-32 rounded-full blur-2xl transition-all duration-500 ${status === 'speaking' ? 'bg-red-500 scale-150 opacity-50' : status === 'listening' ? 'bg-emerald-500 scale-125 opacity-40' : 'bg-white scale-100 opacity-20'}`}></div>
            <div className={`absolute w-28 h-28 rounded-full border border-white/20 backdrop-blur-md flex items-center justify-center z-10 ${status === 'speaking' ? 'border-red-500/50 bg-red-500/10' : status === 'listening' ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
                 {status === 'speaking' ? <Activity className="text-red-400 animate-pulse" size={40} /> : status === 'listening' ? <Mic className="text-emerald-400 animate-pulse" size={40} /> : <Sparkles className="text-slate-300" size={32} />}
            </div>
            <canvas ref={canvasRef} className="w-full h-full absolute inset-0 pointer-events-none opacity-50" />
        </div>
        
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
           <button onClick={toggleVoice} className={`p-6 rounded-full transition-all duration-500 shadow-2xl hover:scale-105 ${isListening ? 'bg-red-600 ring-4 ring-red-500/20 shadow-lg' : 'bg-slate-700 border border-white/10'}`}>
             {isListening ? <MicOff size={32} /> : <Mic size={32} />}
           </button>
           <p className="text-sm font-bold tracking-widest uppercase">{status === 'listening' ? <span className="text-emerald-400 animate-pulse">Listening...</span> : status === 'speaking' ? <span className="text-red-400 animate-pulse">AI Speaking...</span> : 'Tap microphone to start'}</p>
        </div>
      </div>

      <div className="z-10 w-full max-w-5xl mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         <div className="md:col-span-2 lg:col-span-3 mb-2 flex items-center justify-between border-b border-white/5 pb-2">
           <span className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2"><Bell size={14} className="text-red-500" /> Active Events</span>
           <button onClick={onNavigateToDashboard} className="text-xs text-blue-400 hover:text-white transition-colors flex items-center gap-1 font-bold">Dashboard <ChevronRight size={14} /></button>
         </div>
         {MOCK_ALERTS.map(alert => (
           <div key={alert.id} onClick={() => onNavigateToAction(alert.category, alert)} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-4 rounded-xl hover:bg-slate-800/60 transition-all cursor-pointer group shadow-lg">
             <div className="flex items-start gap-3">
               <div className={`mt-1.5 w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`}></div>
               <div><h3 className="font-semibold text-sm text-slate-200 group-hover:text-white">{alert.title}</h3><p className="text-xs text-slate-500 mt-1 line-clamp-2">{alert.message}</p></div>
             </div>
           </div>
         ))}
      </div>

      {activeInsight && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="liquid-card rounded-3xl max-w-lg w-full p-8 border border-white/10 shadow-2xl">
              <div className="flex justify-between items-start mb-6"><h3 className="text-2xl font-bold">{activeInsight.title}</h3><button onClick={() => setActiveInsight(null)}><X size={20}/></button></div>
              <div className="min-h-[120px]">{activeInsight.loading ? <div className="flex flex-col items-center justify-center py-10 gap-4"><Loader2 size={32} className="animate-spin text-blue-500" /><p className="text-sm">Synthesizing data...</p></div> : <div className="bg-white/5 p-4 rounded-xl border border-white/5">{activeInsight.content}</div>}</div>
              <div className="mt-8 flex justify-end"><button onClick={() => setActiveInsight(null)} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
