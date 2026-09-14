import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Radio, Activity, Video, VideoOff, Camera } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { LiveServerMessage } from '@google/genai';

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

function createBlob(data: Float32Array): { data: string, mimeType: string } {
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

export const LiveVoiceAgent: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sessionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mounted = useRef(true);
  const isShuttingDown = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; if (isActive) stopSession(); };
  }, []);

  const startSession = async () => {
    try {
      if(isShuttingDown.current) return;
      setStatus('connecting');
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
          setStatus('connected');
          setIsActive(true);
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
        onMessage: async (message: LiveServerMessage) => {
          if (isShuttingDown.current || !mounted.current) return;
          const base64 = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64 && outputAudioContextRef.current) {
            const ctx = outputAudioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            try {
                const audioBuffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                source.addEventListener('ended', () => sourcesRef.current.delete(source));
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
            } catch(e) {}
          }
        },
        onError: (e) => { 
            console.error("Session Error", e); 
            setStatus('error'); 
        },
        onClose: () => { if (mounted.current && !isShuttingDown.current) { setStatus('disconnected'); setIsActive(false); } }
      });
      sessionPromiseRef.current = sessionPromise;
      sessionRef.current = await sessionPromise;
    } catch (err) { setStatus('error'); }
  };

  const startVideo = async () => {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
        streamRef.current = videoStream;
        setIsVideoEnabled(true);
        frameIntervalRef.current = window.setInterval(() => {
           if (isShuttingDown.current || !videoRef.current || !canvasRef.current) return;
           const ctx = canvasRef.current.getContext('2d');
           if (ctx) {
             canvasRef.current.width = videoRef.current.videoWidth;
             canvasRef.current.height = videoRef.current.videoHeight;
             ctx.drawImage(videoRef.current, 0, 0);
             const data = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];
             sessionPromiseRef.current?.then(s => s.sendRealtimeInput({ media: { mimeType: 'image/jpeg', data } }));
           }
        }, 500);
      }
    } catch (e) {}
  };

  const stopVideo = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    setIsVideoEnabled(false);
  };

  const stopSession = async () => {
    isShuttingDown.current = true;
    sessionRef.current?.close();
    stopVideo();
    mediaStreamSourceRef.current?.disconnect();
    scriptProcessorRef.current?.disconnect();
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    await inputAudioContextRef.current?.close();
    await outputAudioContextRef.current?.close();
    setStatus('disconnected');
    setIsActive(false);
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-8rem)] p-6">
      <div className="liquid-card text-white w-full max-w-4xl rounded-3xl p-8 text-center relative overflow-hidden flex flex-col md:flex-row gap-8 backdrop-blur-xl border-white/5">
        <div className={`flex-1 rounded-2xl bg-black/50 border border-white/10 overflow-hidden relative ${!isVideoEnabled ? 'hidden md:flex items-center justify-center' : ''}`}>
           <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : 'block'}`} />
           <canvas ref={canvasRef} className="hidden" />
           {!isVideoEnabled && <div className="text-slate-500 flex flex-col items-center"><Camera size={48} className="mb-2 opacity-50" /><p className="text-sm">Camera Disabled</p></div>}
           {isVideoEnabled && <div className="absolute top-4 right-4 bg-red-600/80 px-3 py-1 rounded-full text-xs font-bold animate-pulse">LIVE VISION</div>}
        </div>
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="mb-8"><h2 className="text-3xl font-bold mb-2">Voice + Vision AI</h2><p className="text-slate-400 font-light">Speak naturally or show logistics labels to AI.</p></div>
          <div className="flex justify-center items-center h-48 mb-8">
            {status === 'connecting' && <div className="flex flex-col items-center gap-4"><Activity className="animate-spin text-red-500" size={48} /><p className="text-xs font-mono">CONNECTING...</p></div>}
            {status === 'connected' && <div className="relative"><div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25"></div><div className="bg-gradient-to-tr from-red-600 to-purple-600 w-32 h-32 rounded-full flex items-center justify-center shadow-lg"><Radio size={48} className="text-white animate-pulse" /></div></div>}
            {(status === 'disconnected' || status === 'error') && <div className="bg-slate-800 w-32 h-32 rounded-full flex items-center justify-center border-4 border-slate-700/50"><MicOff size={32} className="text-slate-600" /></div>}
          </div>
          <div className="flex flex-col gap-4 w-64">
            <button onClick={isActive ? stopSession : startSession} className={`px-8 py-4 rounded-full font-bold text-lg transition-all ${isActive ? 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-slate-700 hover:bg-slate-600'} flex items-center justify-center gap-3`}>{isActive ? 'End Session' : 'Start Voice Mode'}</button>
            {isActive && <button onClick={isVideoEnabled ? stopVideo : startVideo} className="px-6 py-3 rounded-full font-semibold text-sm border border-white/10 bg-white/5 hover:bg-white/10">{isVideoEnabled ? 'Stop Camera' : 'Enable Camera'}</button>}
          </div>
        </div>
      </div>
    </div>
  );
};
