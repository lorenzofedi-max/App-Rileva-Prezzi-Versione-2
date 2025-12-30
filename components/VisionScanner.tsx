import React, { useRef, useEffect, useState } from 'react';
import { X, Check, Hash, CheckCircle2, Store, Camera, AlertCircle } from 'lucide-react';
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
            width: { ideal: 1920 }, // Cerchiamo il massimo della risoluzione sensore
            height: { ideal: 1080 } 
          },
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
        // AUMENTO RISOLUZIONE: Fondamentale per leggere bene i barcode/ean
        canvas.width = 1280; 
        canvas.height = 960;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // AUMENTO QUALITÀ: Passiamo da 0.35 a 0.80 per ridurre artefatti di compressione
        const base64 = canvas.toDataURL('image/jpeg', 0.80);

        try {
          const result = await analyzePriceTagImage(base64);
          // Accettiamo il risultato solo se abbiamo almeno un nome verosimile
          if (active && result.itemName && result.itemName.length > 2) {
            setShowFlash(true);
            if ('vibrate' in navigator) navigator.vibrate([30, 20, 30]);
            setTimeout(() => setShowFlash(false), 100);

            result.itemName = formatName(result.itemName);

            if (result.eanCode) {
              const rule = rules.find(r => result.eanCode?.startsWith(r.root));
              setMatchedSupplier(rule ? rule.supplier : (result.eanCode.length > 7 ? "Fornitore non in DB" : null));
            } else {
              setMatchedSupplier(null);
            }
            
            setLastResult(result);
            setIsLocked(true);
          }
        } catch (e) {
          console.warn("Scan frame error, skipping...");
        }
      }

      setIsAnalyzing(false);
      if (active && !isLocked) {
        // Pausa bilanciata per non sovraccaricare la connessione ma essere pronti
        timer = window.setTimeout(scanLoop, 600); 
      }
    };

    timer = window.setTimeout(scanLoop, 1000); // Prima scansione dopo 1s per stabilizzare focus
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
          className={`w-full h-full object-cover transition-all duration-500 ${isLocked ? 'blur-2xl scale-110 opacity-30' : 'opacity-100'}`} 
        />
        <canvas ref={canvasRef} className="hidden" />

        {showFlash && <div className="absolute inset-0 bg-white z-[80] animate-out fade-out duration-150" />}

        {!isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6">
             <div className="w-full max-w-[320px] aspect-[4/3] relative">
                {/* Angoli mirino più sottili e professionali */}
                <div className={`absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 rounded-tl-3xl transition-all duration-300 ${isAnalyzing ? 'border-blue-500 scale-110' : 'border-white/40'}`} />
                <div className={`absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 rounded-tr-3xl transition-all duration-300 ${isAnalyzing ? 'border-blue-500 scale-110' : 'border-white/40'}`} />
                <div className={`absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 rounded-bl-3xl transition-all duration-300 ${isAnalyzing ? 'border-blue-500 scale-110' : 'border-white/40'}`} />
                <div className={`absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 rounded-br-3xl transition-all duration-300 ${isAnalyzing ? 'border-blue-500 scale-110' : 'border-white/40'}`} />
                
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-blue-500/5 animate-pulse rounded-3xl" />
                )}
             </div>

             <div className="mt-12 flex flex-col items-center gap-3">
               <div className={`px-5 py-2.5 rounded-2xl backdrop-blur-md border flex items-center gap-3 transition-all duration-300 ${isAnalyzing ? 'bg-blue-600/20 border-blue-400/30' : 'bg-black/40 border-white/10'}`}>
                  {isAnalyzing ? (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                      <span className="text-[11px] text-white font-black uppercase tracking-[0.2em]">Analisi in corso...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Camera size={16} className="text-white/60" />
                      <span className="text-[11px] text-white/60 font-black uppercase tracking-[0.2em]">Inquadra l'etichetta</span>
                    </div>
                  )}
               </div>
               <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest text-center px-8">Tieni il telefono fermo per risultati ottimali</p>
             </div>
          </div>
        )}

        {isLocked && lastResult && (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-[90] animate-in zoom-in-95 fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden">
               <div className="p-8 text-center">
                  <div className="mb-6">
                    <span className="bg-blue-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/20">Risultato Scansione</span>
                  </div>
                  
                  <div className="space-y-2 mb-8">
                    <h3 className="font-black text-slate-900 text-3xl tracking-tight leading-tight">{lastResult.itemName}</h3>
                    {lastResult.eanCode && (
                      <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg text-slate-500 font-mono text-[11px] font-bold">
                        <Hash size={12} /> {lastResult.eanCode}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-8">
                    {lastResult.price && lastResult.price > 0 ? (
                      <div className="text-7xl font-black text-blue-600 tracking-tighter flex items-center justify-center gap-1">
                        <span className="text-3xl text-blue-400">€</span>
                        {lastResult.price.toFixed(2)}
                      </div>
                    ) : (
                      <div className="py-4 px-8 rounded-3xl bg-rose-50 border-2 border-rose-100">
                         <span className="text-2xl font-black text-rose-600 uppercase italic tracking-tighter">SENZA PREZZO</span>
                         <p className="text-[9px] text-rose-400 font-bold mt-1 uppercase">Inserimento manuale richiesto</p>
                      </div>
                    )}
                  </div>

                  {matchedSupplier && (
                    <div className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700">
                      <Store size={18} className="text-blue-500" />
                      <span className="text-[12px] font-black uppercase tracking-widest">{matchedSupplier}</span>
                    </div>
                  )}
               </div>

               <div className="p-4 bg-slate-50 grid grid-cols-2 gap-3 border-t border-slate-100">
                 <button onClick={handleRetry} className="h-16 rounded-2xl bg-white text-slate-400 font-black text-[11px] uppercase tracking-widest border border-slate-200 active:scale-95 transition-all">
                   Riprova
                 </button>
                 <button onClick={() => { onDetected(lastResult); onClose(); }} className="h-16 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                   Conferma
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-28 bg-slate-950 flex flex-col items-center justify-center px-10 border-t border-white/5 shrink-0 gap-4">
        <div className="flex items-center justify-between w-full">
          <button onClick={onClose} className="w-14 h-14 bg-white/5 text-white rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-all">
            <X size={28} />
          </button>
          <div className="text-center">
            <div className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em]">FloraTrack <span className="text-white/40">v3.2</span></div>
          </div>
          <div className="w-14 h-14" />
        </div>
      </div>
    </div>
  );
};