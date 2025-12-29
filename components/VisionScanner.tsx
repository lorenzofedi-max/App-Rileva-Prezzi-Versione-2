import React, { useRef, useEffect, useState } from 'react';
import { X, Check, Loader2, RefreshCcw, Camera, Hash, Sparkles } from 'lucide-react';
import { analyzePriceTagImage } from '../services/geminiService.ts';
import { AiAnalysisResult } from '../types.ts';

interface VisionScannerProps {
  onClose: () => void;
  onDetected: (data: AiAnalysisResult) => void;
}

export const VisionScanner: React.FC<VisionScannerProps> = ({ onClose, onDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastResult, setLastResult] = useState<AiAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('muted', 'true');
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError("Impossibile accedere alla fotocamera.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Ciclo di scansione ricorsivo per massima stabilità
  useEffect(() => {
    let active = true;
    let timerId: number;

    const scan = async () => {
      if (!active || isLocked || isAnalyzing || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      if (video.readyState !== 4) {
        timerId = window.setTimeout(scan, 500);
        return;
      }

      setIsAnalyzing(true);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Ottimizziamo la risoluzione per bilanciare velocità e leggibilità EAN
        canvas.width = 1024;
        canvas.height = 768;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.6);

        try {
          const result = await analyzePriceTagImage(base64, true);
          
          if (active && (result.itemName || result.price)) {
            setLastResult(result);
            setIsLocked(true);
            if ('vibrate' in navigator) navigator.vibrate([80, 50, 80]);
          }
        } catch (e) {
          console.error("Scan error:", e);
        }
      }

      setIsAnalyzing(false);
      if (active && !isLocked) {
        timerId = window.setTimeout(scan, 2500); // Intervallo di sicurezza tra scansioni
      }
    };

    // Primo avvio dopo un breve delay per stabilizzazione autofocus
    timerId = window.setTimeout(scan, 2000);

    return () => {
      active = false;
      window.clearTimeout(timerId);
    };
  }, [isLocked]);

  const handleRetry = () => {
    setLastResult(null);
    setIsLocked(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
      {/* Area Camera */}
      <div className="relative flex-1 bg-black flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover transition-all duration-500 ${isLocked ? 'opacity-40 blur-md' : 'opacity-100'}`} 
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Mirino e Laser */}
        {!isLocked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-white/20 rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute inset-0 border-t-4 border-l-4 border-brand-500 w-12 h-12 rounded-tl-[2rem] -m-[2px]"></div>
              <div className="absolute top-0 right-0 border-t-4 border-r-4 border-brand-500 w-12 h-12 rounded-tr-[2rem] -m-[2px]"></div>
              <div className="absolute bottom-0 left-0 border-b-4 border-l-4 border-brand-500 w-12 h-12 rounded-bl-[2rem] -m-[2px]"></div>
              <div className="absolute bottom-0 right-0 border-b-4 border-r-4 border-brand-500 w-12 h-12 rounded-br-[2rem] -m-[2px]"></div>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand-500 shadow-[0_0_15px_#10b981] animate-[scan_2.5s_linear_infinite]"></div>
            </div>
          </div>
        )}

        {/* UI Feedback Scansione */}
        {!isLocked && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3 shadow-2xl z-20">
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="text-brand-400 animate-spin" />
                <span className="text-[10px] text-white font-black uppercase tracking-widest">Analisi AI...</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
                <span className="text-[10px] text-white font-black uppercase tracking-widest">Inquadra etichetta</span>
              </>
            )}
          </div>
        )}

        {/* Scheda Risultato */}
        {isLocked && lastResult && (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-30 animate-in zoom-in-95 duration-300">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-sm flex flex-col gap-8">
               <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-600 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border border-brand-100">
                    <Sparkles size={12} /> Scanner AI Success
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-2xl leading-tight">
                      {lastResult.itemName || 'Prodotto Rilevato'}
                    </h3>
                  </div>

                  <div className="text-6xl font-black text-brand-600 tracking-tighter py-2">
                    € {lastResult.price ? lastResult.price.toFixed(2) : '--.--'}
                  </div>

                  {lastResult.eanCode && (
                    <div className="flex items-center justify-center gap-2 text-slate-400 bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-100">
                      <Hash size={14} className="text-slate-300" />
                      <span className="text-xs font-mono font-bold tracking-wider">{lastResult.eanCode}</span>
                    </div>
                  )}
               </div>

               <div className="flex flex-col gap-3">
                 <button onClick={() => { onDetected(lastResult); onClose(); }} className="w-full bg-brand-600 text-white h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-brand-500/20 active:scale-95 transition-all">
                   <Check size={24} strokeWidth={4} /> Conferma
                 </button>
                 <button onClick={handleRetry} className="w-full bg-slate-50 text-slate-500 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 active:scale-95 transition-all">
                   <RefreshCcw size={18} /> Riprova
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controlli */}
      <div className="h-28 bg-slate-950 flex items-center justify-between px-10 border-t border-white/5">
        <button onClick={onClose} className="w-14 h-14 bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 text-white rounded-2xl flex items-center justify-center transition-all active:scale-90 border border-white/10">
          <X size={28} />
        </button>
        
        <div className="text-center">
          <div className="text-white text-[9px] font-black uppercase tracking-[0.4em] opacity-40">
             Vision Intelligence
          </div>
        </div>

        <div className="w-14 h-14"></div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
};