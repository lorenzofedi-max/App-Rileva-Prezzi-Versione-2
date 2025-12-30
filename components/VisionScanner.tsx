import React, { useRef, useEffect, useState } from 'react';
import { X, Check, Loader2, Hash, CheckCircle2, Sparkles, Store, Camera, AlertCircle } from 'lucide-react';
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

  // Helper per formattare il nome: Prima Maiuscola, resto minuscolo
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
          video: { facingMode: 'environment', width: { ideal: 1280 }, frameRate: { ideal: 30 } },
          audio: false
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera access failed", err);
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
        timer = window.setTimeout(scanLoop, 300);
        return;
      }

      setIsAnalyzing(true);
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 720; 
        canvas.height = 540;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.35);

        try {
          const result = await analyzePriceTagImage(base64);
          if (active && (result.itemName || result.price)) {
            // Effetto FLASH checkout
            setShowFlash(true);
            if ('vibrate' in navigator) navigator.vibrate([40, 30, 40]);
            setTimeout(() => setShowFlash(false), 150);

            // Formattazione nome
            if (result.itemName) {
              result.itemName = formatName(result.itemName);
            }

            // Ricerca fornitore
            if (result.eanCode) {
              const rule = rules.find(r => result.eanCode?.startsWith(r.root));
              if (rule) {
                setMatchedSupplier(rule.supplier);
              } else {
                setMatchedSupplier("Nuovo Fornitore");
              }
            } else {
              setMatchedSupplier(null);
            }
            
            setLastResult(result);
            setIsLocked(true);
          }
        } catch (e) {
          // Fallimento silenzioso per mantenere il loop
        }
      }

      setIsAnalyzing(false);
      if (active && !isLocked) {
        timer = window.setTimeout(scanLoop, 200); 
      }
    };

    timer = window.setTimeout(scanLoop, 500);
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
    <div className="fixed inset-0 z-[100] bg-blue-950 flex flex-col overflow-hidden">
      <div className="relative flex-1 bg-black flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover transition-all duration-300 ${isLocked ? 'blur-lg scale-110 opacity-40' : 'opacity-100'}`} 
        />
        <canvas ref={canvasRef} className="hidden" />

        {showFlash && <div className="absolute inset-0 bg-white z-[80] animate-out fade-out duration-200" />}

        {!isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <div className="w-[80%] max-w-[400px] aspect-[4/3] relative">
                <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-2xl transition-colors duration-300 ${isAnalyzing ? 'border-blue-500' : 'border-white/30'}`} />
                <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 rounded-tr-2xl transition-colors duration-300 ${isAnalyzing ? 'border-blue-500' : 'border-white/30'}`} />
                <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 rounded-bl-2xl transition-colors duration-300 ${isAnalyzing ? 'border-blue-500' : 'border-white/30'}`} />
                <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-2xl transition-colors duration-300 ${isAnalyzing ? 'border-blue-500' : 'border-white/30'}`} />
                
                {!isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-blue-950/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">
                       <Camera size={14} className="text-white/60" />
                       <span className="text-[10px] text-white/60 font-black uppercase tracking-widest">Punta l'etichetta</span>
                    </div>
                  </div>
                )}
             </div>

             {isAnalyzing && (
                <div className="absolute bottom-32 flex flex-col items-center gap-2">
                  <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-[progress_0.8s_ease-in-out_infinite]" />
                  </div>
                  <span className="text-[9px] text-white/40 font-black uppercase tracking-[0.3em]">Analisi...</span>
                </div>
             )}
          </div>
        )}

        {isLocked && lastResult && (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-[90] animate-in slide-in-from-bottom-8 duration-300">
            <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden border border-slate-100">
               <div className="p-8 text-center space-y-5">
                  <div className="text-blue-600 font-black text-[10px] uppercase tracking-[0.25em] bg-blue-50 inline-block px-5 py-2 rounded-full border border-blue-100">Checkout AI</div>
                  
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-3xl leading-tight px-2">{lastResult.itemName}</h3>
                    {lastResult.eanCode && (
                      <div className="flex items-center justify-center gap-1.5 text-slate-400 font-mono text-[11px] font-bold">
                        <Hash size={12} /> {lastResult.eanCode}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-7xl font-black text-blue-600 tracking-tighter py-1 flex items-center justify-center gap-1">
                    <span className="text-3xl text-blue-400 font-bold">€</span>
                    {lastResult.price?.toFixed(2) || '0.00'}
                  </div>

                  {matchedSupplier && (
                    <div className={`flex items-center justify-center gap-2 py-4 px-6 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2 border ${
                      matchedSupplier === "Nuovo Fornitore" 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-blue-900 text-white border-blue-800'
                    }`}>
                      {matchedSupplier === "Nuovo Fornitore" ? <AlertCircle size={18} /> : <Store size={18} className="text-blue-400" />}
                      <span className="text-[12px] font-black uppercase tracking-widest">{matchedSupplier}</span>
                    </div>
                  )}
               </div>

               <div className="p-6 bg-slate-50 flex gap-4">
                 <button onClick={handleRetry} className="flex-1 bg-white text-slate-400 h-16 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-slate-200 active:scale-95 transition-all">
                   Cancella
                 </button>
                 <button onClick={() => { onDetected(lastResult); onClose(); }} className="flex-[2] bg-blue-600 text-white h-16 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                   <Check size={24} strokeWidth={4} /> Conferma
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-24 bg-blue-950 flex items-center justify-between px-10 border-t border-white/5 shrink-0">
        <button onClick={onClose} className="w-14 h-14 bg-white/5 text-white rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-all">
          <X size={28} />
        </button>
        <div className="text-center">
          <div className="text-white/20 text-[10px] font-black uppercase tracking-[0.5em]">Fast Scan 3.0</div>
        </div>
        <div className="w-14 h-14" />
      </div>

      <style>{`
        @keyframes progress { 
          0% { transform: translateX(-100%); } 
          100% { transform: translateX(100%); } 
        }
        .animate-out.fade-out { animation: fadeOut 0.2s forwards; }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
      `}</style>
    </div>
  );
};