import React, { useRef, useEffect, useState } from 'react';
import { X, Check, Hash, Store, Camera, Loader2 } from 'lucide-react';
import { analyzePriceTagImage } from '../services/geminiService.ts';
import { AiAnalysisResult, SupplierRule } from '../types.ts';

interface VisionScannerProps {
  rules: SupplierRule[];
  onClose: () => void;
  onDetected: (data: AiAnalysisResult) => void;
}

export const VisionScanner: React.FC<VisionScannerProps> = ({ rules, onClose, onDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastResult, setLastResult] = useState<AiAnalysisResult | null>(null);
  const [matchedSupplier, setMatchedSupplier] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  const formatName = (name: string): string => {
    if (!name) return "";
    const trimmed = name.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment', 
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          },
          audio: false
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Accesso fotocamera fallito:", err);
      }
    };
    startCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  useEffect(() => {
    let active = true;
    let timer: number;

    const scanLoop = async () => {
      if (!active || isLocked || isAnalyzing || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState < 2) {
        timer = window.setTimeout(scanLoop, 500);
        return;
      }

      setIsAnalyzing(true);
      const canvas = canvasRef.current;
      if (canvas) {
        // Dimensioni bilanciate: 1024px è ottimo per OCR senza pesare troppo sul network
        canvas.width = 1024; 
        canvas.height = 768;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Qualità 0.6: equilibrio perfetto tra leggibilità e dimensione payload
        const base64 = canvas.toDataURL('image/jpeg', 0.6);

        try {
          const result = await analyzePriceTagImage(base64);
          
          // Se l'AI restituisce un nome, consideriamo la scansione valida
          if (active && result.itemName) {
            setShowFlash(true);
            if ('vibrate' in navigator) navigator.vibrate([30, 20]);
            setTimeout(() => setShowFlash(false), 150);

            result.itemName = formatName(result.itemName);

            if (result.eanCode) {
              const rule = rules.find(r => result.eanCode?.startsWith(r.root));
              setMatchedSupplier(rule ? rule.supplier : (result.eanCode.length > 7 ? "Fornitore Sconosciuto" : null));
            } else {
              setMatchedSupplier(null);
            }
            
            setLastResult(result);
            setIsLocked(true);
          }
        } catch (e) {
          console.error("Errore durante il ciclo di scansione:", e);
        }
      }

      setIsAnalyzing(false);
      if (active && !isLocked) {
        timer = window.setTimeout(scanLoop, 800); 
      }
    };

    timer = window.setTimeout(scanLoop, 1500); 
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isLocked, rules]);

  const handleRetry = () => {
    setLastResult(null);
    setMatchedSupplier(null);
    setIsLocked(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-hidden">
      <div className="relative flex-1 bg-black flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover transition-all duration-700 ${isLocked ? 'blur-2xl opacity-40 scale-105' : 'opacity-100'}`} 
        />
        <canvas ref={canvasRef} className="hidden" />

        {showFlash && <div className="absolute inset-0 bg-white z-[80] animate-out fade-out duration-200" />}

        {!isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6">
             <div className="w-full max-w-[300px] aspect-[1/1] relative">
                <div className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 rounded-tl-3xl transition-all duration-500 ${isAnalyzing ? 'border-blue-500 scale-110 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'border-white/30'}`} />
                <div className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 rounded-tr-3xl transition-all duration-500 ${isAnalyzing ? 'border-blue-500 scale-110 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'border-white/30'}`} />
                <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 rounded-bl-3xl transition-all duration-500 ${isAnalyzing ? 'border-blue-500 scale-110 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'border-white/30'}`} />
                <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 rounded-br-3xl transition-all duration-500 ${isAnalyzing ? 'border-blue-500 scale-110 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'border-white/30'}`} />
                
                {isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-1 bg-blue-500/20 rounded-full overflow-hidden relative">
                      <div className="absolute inset-y-0 w-1/3 bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-[scan_1.5s_ease-in-out_infinite]" />
                    </div>
                  </div>
                )}
             </div>

             <div className="mt-16 flex flex-col items-center gap-4">
               <div className={`px-6 py-3 rounded-full backdrop-blur-md border flex items-center gap-3 shadow-2xl transition-all duration-500 ${isAnalyzing ? 'bg-blue-600/30 border-blue-400/50 scale-105' : 'bg-black/60 border-white/10'}`}>
                  {isAnalyzing ? (
                    <div className="flex items-center gap-3">
                      <Loader2 size={18} className="text-blue-400 animate-spin" />
                      <span className="text-[12px] text-white font-black uppercase tracking-[0.2em]">Analisi AI...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Camera size={18} className="text-white/80" />
                      <span className="text-[12px] text-white/80 font-black uppercase tracking-[0.2em]">Inquadra Prezzo</span>
                    </div>
                  )}
               </div>
               <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest text-center px-10">Assicurati che l'etichetta sia ben illuminata</p>
             </div>
          </div>
        )}

        {isLocked && lastResult && (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-[90] animate-in zoom-in-95 duration-300">
            <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-[0_60px_120px_-20px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden border border-white/20">
               <div className="p-10 text-center">
                  <div className="mb-6">
                    <span className="bg-blue-600 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-blue-500/30">Dati Rilevati</span>
                  </div>
                  
                  <div className="space-y-3 mb-10">
                    <h3 className="font-black text-slate-900 text-4xl tracking-tight leading-tight">{lastResult.itemName}</h3>
                    {lastResult.eanCode && (
                      <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-xl text-slate-500 font-mono text-[12px] font-bold border border-slate-200">
                        <Hash size={14} /> {lastResult.eanCode}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-10">
                    {lastResult.price && lastResult.price > 0 ? (
                      <div className="text-8xl font-black text-blue-600 tracking-tighter flex items-center justify-center gap-1">
                        <span className="text-4xl text-blue-300 font-bold">€</span>
                        {lastResult.price.toFixed(2)}
                      </div>
                    ) : (
                      <div className="py-6 px-4 rounded-[2rem] bg-rose-50 border-2 border-rose-100 flex flex-col gap-1 shadow-sm">
                         <span className="text-2xl font-black text-rose-600 uppercase italic tracking-tighter">SENZA PREZZO</span>
                         <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest">Aggiungilo manualmente dopo</p>
                      </div>
                    )}
                  </div>

                  {matchedSupplier && (
                    <div className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-slate-900 text-white shadow-xl border border-white/5">
                      <Store size={20} className="text-blue-400" />
                      <span className="text-[13px] font-black uppercase tracking-widest">{matchedSupplier}</span>
                    </div>
                  )}
               </div>

               <div className="p-6 bg-slate-50 grid grid-cols-2 gap-4 border-t border-slate-100">
                 <button onClick={handleRetry} className="h-16 rounded-2xl bg-white text-slate-400 font-black text-[12px] uppercase tracking-widest border border-slate-200 active:scale-95 transition-all shadow-sm">
                   Scarta
                 </button>
                 <button onClick={() => { onDetected(lastResult); onClose(); }} className="h-16 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 active:scale-95 transition-all">
                   <Check size={24} strokeWidth={4} /> Conferma
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-28 bg-slate-950 flex flex-col items-center justify-center px-10 border-t border-white/5 shrink-0">
        <div className="flex items-center justify-between w-full">
          <button onClick={onClose} className="w-16 h-16 bg-white/5 text-white rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-all">
            <X size={32} />
          </button>
          <div className="text-center">
            <div className="text-blue-500 font-black text-[11px] uppercase tracking-[0.5em] mb-1">Vision Scan</div>
            <div className="text-white/20 text-[9px] font-bold uppercase tracking-[0.2em]">Engine v3.3 Pro</div>
          </div>
          <div className="w-16 h-16" />
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { left: -33%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};