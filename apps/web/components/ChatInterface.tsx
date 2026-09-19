import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Volume2, StopCircle, Image as ImageIcon, Camera, X, Mic, MicOff, FileText, Paperclip } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { Message } from '../types';
import { Markdown } from '../src/components/Markdown';
import { extractPdfText } from '../src/lib/pdf';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: "Welcome to **RLAI SupplyMind**. Ask me about coal stock, procurement spend, vendor performance or inventory risks. I can also **build a custom report for you** — combine columns from different reports, or filter a subset — and give you a **CSV / Excel to download**. Or 📎 **attach a PDF** (contract, tender, spec) and ask questions about it.\n\nTry: *\"Build an Excel of overdue POs with vendor, material and value\"* or *\"Combine each vendor's on-time % with their outstanding dues.\"*",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Image Upload State
  const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string, preview: string } | null>(null);
  // PDF / document upload state
  const [selectedPdf, setSelectedPdf] = useState<{ name: string; text: string; pages: number } | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle File Selection — image (vision) or PDF (text extraction)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      setSelectedImage(null);
      setPdfLoading(true);
      try {
        const text = await extractPdfText(file);
        setSelectedPdf({ name: file.name, text, pages: 0 });
      } catch (err) {
        console.error('pdf extract error', err);
        alert('Could not read this PDF. It may be scanned/image-only.');
      } finally {
        setPdfLoading(false);
      }
    } else {
      setSelectedPdf(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const rawBase64 = base64String.split(',')[1];
        setSelectedImage({ data: rawBase64, mimeType: file.type, preview: base64String });
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Camera Functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const rawBase64 = dataUrl.split(',')[1];
        
        setSelectedImage({
          data: rawBase64,
          mimeType: 'image/jpeg',
          preview: dataUrl
        });
        stopCamera();
      }
    }
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
      recognitionRef.current?.stop();
    };
  }, []);

  // Voice Input (Web Speech API)
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results as any[])
        .map((r: any) => r[0].transcript)
        .join('');
      setInput(transcript);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  // Handle Text-to-Speech
  const handleSpeak = async (msg: Message) => {
    if (isPlayingId === msg.id) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      setIsPlayingId(null);
      return;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }

    setIsPlayingId(msg.id);

    try {
      const base64Audio = await geminiService.generateSpeech(msg.text);
      if (!base64Audio) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlayingId(null);
      source.start(0);
      sourceNodeRef.current = source;
    } catch (e) {
      console.error("Playback error", e);
      setIsPlayingId(null);
    }
  };

  const handleSend = async (text: string = input) => {
    if ((!text.trim() && !selectedImage && !selectedPdf) || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text + (selectedPdf ? `\n\n📎 ${selectedPdf.name}` : ''),
      timestamp: new Date(),
      image: selectedImage ? { data: selectedImage.data, mimeType: selectedImage.mimeType } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const imageToSend = selectedImage;
    const pdfToSend = selectedPdf;
    setSelectedImage(null);
    setSelectedPdf(null);
    setIsLoading(true);

    // When a PDF is attached, send its extracted text as grounding context.
    const sentText = pdfToSend
      ? `${text.trim() || 'Summarize this document and pull out the key points relevant to procurement / inventory.'}\n\n--- Attached document "${pdfToSend.name}" (extracted text, may be truncated) ---\n${pdfToSend.text.slice(0, 14000)}\n--- end of document ---\nAnswer using the document above where relevant.`
      : text;

    try {
      const responseText = await geminiService.getChatResponse(messages, sentText, imageToSend ? { data: imageToSend.data, mimeType: imageToSend.mimeType } : undefined);
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const predictivePrompts = [
    "Build an Excel of overdue POs with vendor, material and value",
    "Combine each vendor's on-time % with their outstanding dues",
    "Export below-safety-stock items for Lalitpur as a report",
    "Filter contracts & bank guarantees expiring in 30 days into one report",
    "Which vendor has the highest procurement value?",
    "Chart our procurement spend by category",
    "Show approval-pending cases by stage",
    "Which critical spares may stock out in the next 30 days?",
    "Chart coal stock days for each plant",
    "Show top open POs that are overdue",
    "Which SAP MM tables power the coal stock KPI?",
    "Give me the management KPI scorecard",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] liquid-card rounded-2xl overflow-hidden m-6 relative">
      <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between backdrop-blur-sm">
        <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bot className="text-red-500" />
          Knowledge Bot
        </h2>
        <div className="flex items-center gap-2">
           <span className="text-xs font-mono text-slate-500 dark:text-slate-400">SupplyMind AI</span>
           <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full font-medium">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-5 rounded-2xl relative group shadow-lg ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-red-600 to-red-700 text-white rounded-br-none border border-red-500/30'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 rounded-bl-none pr-12 border border-slate-200 dark:border-white/10 backdrop-blur-sm'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 opacity-60 text-xs font-semibold uppercase tracking-wider">
                {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                <span>{msg.role === 'user' ? 'You' : 'RLAI'}</span>
              </div>

              {msg.image && (
                <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                   <img src={`data:${msg.image.mimeType};base64,${msg.image.data}`} alt="User Upload" className="max-w-full max-h-64 object-cover" />
                </div>
              )}

              {msg.role === 'model'
                ? <Markdown text={msg.text} />
                : <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>}

              {msg.role === 'model' && (
                <button 
                  onClick={() => handleSpeak(msg)}
                  className={`absolute bottom-2 right-2 p-1.5 rounded-full transition-colors ${
                    isPlayingId === msg.id 
                      ? 'bg-red-500/20 text-red-400 animate-pulse' 
                      : 'bg-transparent text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400'
                  }`}
                  title="Read Aloud"
                >
                  {isPlayingId === msg.id ? <StopCircle size={14} /> : <Volume2 size={14} />}
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-2xl rounded-bl-none border border-slate-200 dark:border-white/10">
              <Loader2 className="animate-spin text-red-500" size={20} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Camera Overlay */}
      {isCameraActive && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col animate-fade-in">
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
             <video 
               ref={videoRef} 
               autoPlay 
               playsInline 
               className="w-full h-full object-cover"
             />
             <div className="absolute top-4 right-4">
                <button 
                  onClick={stopCamera} 
                  className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors border border-white/20"
                >
                  <X size={24} />
                </button>
             </div>
          </div>
          <div className="h-24 bg-black/90 flex items-center justify-center gap-8 border-t border-white/10">
             <button onClick={stopCamera} className="text-white text-sm font-medium">Cancel</button>
             <button 
               onClick={capturePhoto}
               className="w-16 h-16 rounded-full bg-white border-4 border-slate-700 flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
             >
               <div className="w-12 h-12 rounded-full bg-red-600"></div>
             </button>
             <div className="w-12"></div> 
          </div>
        </div>
      )}

      {/* Image Preview Area */}
      {selectedImage && !isCameraActive && (
        <div className="px-4 py-2 border-t border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-900/50 flex items-center gap-4">
           <div className="relative group">
             <img src={selectedImage.preview} alt="Selected" className="h-20 w-20 object-cover rounded-lg border border-slate-200 dark:border-white/20 shadow-lg" />
             <button
               onClick={() => setSelectedImage(null)}
               className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
             >
               <X size={14} />
             </button>
           </div>
           <div className="text-xs text-slate-500 dark:text-slate-400">
             <p className="font-semibold text-slate-700 dark:text-slate-200">Image attached</p>
             <p>Ready to analyze with AI vision.</p>
           </div>
        </div>
      )}

      {/* PDF / document preview */}
      {(selectedPdf || pdfLoading) && !isCameraActive && (
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-900/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/15 text-red-500 flex items-center justify-center flex-shrink-0">
            {pdfLoading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
          </div>
          <div className="text-xs min-w-0 flex-1">
            {pdfLoading ? (
              <p className="font-semibold text-slate-700 dark:text-slate-200">Reading document…</p>
            ) : (
              <>
                <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{selectedPdf!.name}</p>
                <p className="text-slate-500">{selectedPdf!.text.length.toLocaleString()} characters extracted · ask a question about it</p>
              </>
            )}
          </div>
          {selectedPdf && (
            <button onClick={() => setSelectedPdf(null)} className="p-1 text-slate-400 hover:text-red-500 flex-shrink-0"><X size={16} /></button>
          )}
        </div>
      )}

      {/* Predictive Quick Prompts */}
      <div className="px-4 pb-3 pt-3 flex gap-2 overflow-x-auto scrollbar-hide border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/30">
        {predictivePrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all whitespace-nowrap shadow-sm hover:shadow-md"
          >
            <Sparkles size={10} className="text-red-400" />
            {prompt}
          </button>
        ))}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-900/30 backdrop-blur-md">
        <div className="relative flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,application/pdf,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-white/10"
            title="Attach image or PDF"
          >
            <Paperclip size={20} />
          </button>

          <button
            onClick={startCamera}
            className="p-3 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-white/10"
            title="Use Camera"
          >
            <Camera size={20} />
          </button>

          <button
            onClick={toggleVoiceInput}
            className={`p-3 rounded-xl transition-all border ${
              isListening
                ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.4)] animate-pulse'
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={isListening ? 'Stop listening' : 'Speak your question'}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={selectedImage ? "Ask about this image…" : selectedPdf ? "Ask about this document…" : "Ask, or attach an image / PDF…"}
              className="w-full pl-4 pr-12 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 transition-all resize-none max-h-32 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !selectedImage && !selectedPdf) || isLoading || pdfLoading}
              className="absolute right-2 bottom-2 p-1.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};