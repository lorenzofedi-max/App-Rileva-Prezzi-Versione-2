import React, { useRef, useEffect, useState } from 'react';
import { X, Check, Loader2, RefreshCcw, Camera, MoveDiagonal2, Hash } from 'lucide-react';
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
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'locked'>('idle');
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera error:", err);
        alert("Impossibile accedere alla fotocamera. Controlla i permessi nelle impostazioni del browser.");
        onClose();
      }
    };
    startCamera();
    return () => stream?.getTracks().forEach(track => track.stop());
  }, []);

  useEffect(() => {
    const captureLoop = async () => {
      if (!videoRef.current || !canvasRef.current || status !== 'idle') return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context && video.readyState === 4) {
        setStatus('analyzing');
        // Risoluzione ottimale per OCR EAN e testo senza sovraccaricare il payload
        canvas.width = 960;
        canvas.height = 540;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.6);

        try {
          const result = await analyzePriceTagImage(base64, true);
          if (result.itemName || result.price) {
            setLastResult(result);
            setStatus('locked');
            triggerFlash();
            if ('vibrate' in navigator) navigator.vibrate([60, 40]);
          } else {
            // Se non trova dati validi, torna subito in ascolto
            setStatus('idle');
          }
        } catch (e) {
          setStatus('idle');
        }
      }
    };

    // Polling velocizzato a 1.2 secondi per una UX "real-time"
    const interval = setInterval(captureLoop, 1200);
    return () => clearInterval(interval);
  }, [status]);

  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 100);
  };

  const handleRetry = () => {
    setLastResult(null);
    setStatus('idle');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col overflow-hidden font-sans">
      <div className="relative flex-1 bg-black flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className={`w-full h-full object-cover transition-all duration-500 ${status === 'locked' ? 'opacity-40 blur-sm' : 'opacity-90'}`} 
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {flash && <div className="absolute inset-0 bg-white z-[70] animate-out fade-out duration-200"></div>}

        <div className={`absolute inset-8 border-[3px] rounded-[2rem] pointer-events-none transition-all duration-500 z-20 ${status === 'locked' ? 'border-brand-500 opacity-0 scale-105' : 'border-white/30'}`}>
            <div className="absolute -top-1 -left-1 w-12 h-12 border-t-8 border-l-8 rounded-tl-[2rem] border-brand-500"></div>
            <div className="absolute -top-1 -right-1 w-12 h-12 border-t-8 border-r-8 rounded-tr-[2rem] border-brand-500"></div>
            <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-8 border-l-8 rounded-bl-[2rem] border-brand-500"></div>
            <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-8 border-r-8 rounded-br-[2rem] border-brand-500"></div>
        </div>

        {lastResult && (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-[80] animate-in zoom-in-95 duration-200">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-sm flex flex-col gap-6">
               <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-600 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border border-brand-100">
                    Scanner AI Pronto
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-xl leading-tight">
                      {lastResult.itemName || 'Prodotto Rilevato'}
                    </h3>
                    {lastResult.eanCode && (
                      <div className="flex items-center justify-center gap-2 text-slate-400 bg-slate-50 py-2 px-4 rounded-xl border border-slate-100">
                        <Hash size={14} className="text-slate-300" />
                        <span className="text-xs font-mono font-bold tracking-wider">{lastResult.eanCode}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-5xl font-black text-brand-600 tracking-tighter">
                    € {lastResult.price?.toFixed(2) || '?.??'}
                  </div>
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

        {status !== 'locked' && (
          <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-40 px-6 py-3 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center gap-3 shadow-2xl">
             {status === 'analyzing' ? (
               <><Loader2 size={16} className="text-brand-400 animate-spin" /> <span className="text-[10px] text-white font-black uppercase tracking-widest">Analisi...</span></>
             ) : (
               <><Camera size={16} className="text-brand-400" /> <span className="text-[10px] text-white font-black uppercase tracking-widest">Inquadra etichetta</span></>
             )}
          </div>
        )}
      </div>

      <div className="h-28 bg-slate-950 flex items-center justify-center px-10 z-50 relative">
        <button onClick={onClose} className="absolute left-8 w-14 h-14 flex items-center justify-center text-white bg-white/5 hover:bg-rose-600 rounded-2xl transition-all active:scale-90 border border-white/10">
          <X size={28} />
        </button>
        <div className="text-center">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse mx-auto mb-2 shadow-[0_0_10px_rgba(16,185,129,1)]"></div>
          <div className="text-white text-[9px] font-black uppercase tracking-[0.4em] opacity-50">
             Vision Mode Active
          </div>
        </div>
      </div>
    </div>
  );
};