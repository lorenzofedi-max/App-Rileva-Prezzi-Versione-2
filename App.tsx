import React, { useState, useEffect } from 'react';
import { 
  Download, ScanLine, Camera, Wand2, Search, 
  Database, BookOpen, Settings, Leaf, Flower2 
} from 'lucide-react';
import { Input } from './components/Input.tsx';
import { ScannerModal } from './components/ScannerModal.tsx';
import { SupplierLookupModal } from './components/SupplierLookupModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { analyzePriceTagImage } from './services/geminiService.ts';
import { exportToCSV } from './services/exportService.ts';
import { loadDataFromExcel } from './services/excelService.ts';
import { PriceRecord, ProductType, SupplierRule } from './types.ts';
import { 
  STORE_CHAINS, STORE_NAMES, PLANTS, CUT_FLOWERS, 
  SUPPLIERS, STEM_COUNTS, VASE_DIAMETERS, SUPPLIER_EAN_RULES 
} from './constants.ts';

const App: React.FC = () => {
  // --- Data Lists State ---
  const [dataLists, setDataLists] = useState({
    chains: STORE_CHAINS,
    stores: STORE_NAMES,
    plants: PLANTS,
    flowers: CUT_FLOWERS,
    suppliers: SUPPLIERS,
    stems: STEM_COUNTS,
    vases: VASE_DIAMETERS,
  });
  const [supplierRules, setSupplierRules] = useState<SupplierRule[]>(SUPPLIER_EAN_RULES);
  const [isExcelLoaded, setIsExcelLoaded] = useState(false);

  // --- App State ---
  const [records, setRecords] = useState<PriceRecord[]>(() => {
    const saved = localStorage.getItem('floraTrackData');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [storeChain, setStoreChain] = useState('');
  const [storeName, setStoreName] = useState('');
  const [productType, setProductType] = useState<ProductType>('Pianta');
  
  const [itemName, setItemName] = useState('');
  const [priceValue, setPriceValue] = useState('');
  const [supplier, setSupplier] = useState('');
  const [ean, setEan] = useState('');
  const [notes, setNotes] = useState('');
  const [stems, setStems] = useState('');
  const [vase, setVase] = useState('');
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filterTerm, setFilterTerm] = useState('');

  useEffect(() => {
    localStorage.setItem('floraTrackData', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    const initData = async () => {
      try {
        const excelData = await loadDataFromExcel();
        if (excelData) {
          setDataLists({
            chains: excelData.chains.length ? excelData.chains : dataLists.chains,
            stores: excelData.stores.length ? excelData.stores : dataLists.stores,
            plants: excelData.plants.length ? excelData.plants : dataLists.plants,
            flowers: excelData.flowers.length ? excelData.flowers : dataLists.flowers,
            suppliers: excelData.suppliers.length ? excelData.suppliers : dataLists.suppliers,
            stems: excelData.stems.length ? excelData.stems : dataLists.stems,
            vases: excelData.vases.length ? excelData.vases : dataLists.vases,
          });
          if (excelData.supplierRules.length) setSupplierRules(excelData.supplierRules);
          setIsExcelLoaded(true);
        }
      } catch (err) {
        console.error("Errore init data:", err);
      }
    };
    initData();
  }, []);

  const handleSupplierLookup = (currentEan: string) => {
    if (!currentEan) return;
    const rule = supplierRules.find(r => currentEan.startsWith(r.root));
    if (rule) setSupplier(rule.supplier);
  };

  const showNotification = (msg: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white px-6 py-3 rounded-full shadow-2xl z-50 font-medium backdrop-blur-md animate-bounce';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  const handleAiAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const result = await analyzePriceTagImage(base64);
          if (result.itemName) setItemName(result.itemName);
          if (result.price) setPriceValue(result.price.toString());
          if (result.eanCode) {
            setEan(result.eanCode);
            handleSupplierLookup(result.eanCode);
          }
          showNotification("Analisi AI completata ✨");
        } catch (error) {
          showNotification("Errore analisi AI. Riprova.");
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!storeChain || !storeName || !itemName || !priceValue) {
      showNotification("❌ Compila i campi obbligatori");
      return;
    }
    const newRecord: PriceRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      storeChain,
      storeName,
      type: productType,
      itemName,
      priceValue: parseFloat(priceValue),
      supplierName: supplier,
      eanCode: ean,
      notes,
      stemsCount: productType === 'Mazzo' && stems ? parseInt(stems) : null,
      vaseDiameter: productType === 'Pianta' && vase ? parseFloat(vase) : null,
    };
    setRecords(prev => [newRecord, ...prev]);
    setItemName(''); setPriceValue(''); setSupplier(''); setEan(''); setNotes(''); setStems(''); setVase('');
    showNotification("Salvato con successo! ✅");
  };

  const updateDataList = (category: string, newList: string[]) => {
    setDataLists(prev => ({ ...prev, [category]: newList }));
  };

  const filteredRecords = records.filter(r => 
    r.itemName.toLowerCase().includes(filterTerm.toLowerCase()) || 
    r.eanCode?.includes(filterTerm) ||
    r.supplierName?.toLowerCase().includes(filterTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-12 bg-gray-50 font-sans text-gray-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-brand-500/20 shadow-lg">
                <Leaf size={24} />
             </div>
             <div>
               <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">FloraTrack AI</h1>
               <div className="flex items-center gap-2 mt-1">
                 {isExcelLoaded && <span className="text-[10px] text-brand-600 font-bold flex items-center gap-1 uppercase tracking-widest bg-brand-50 px-1.5 py-0.5 rounded"><Database size={10}/> Excel Online</span>}
               </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
              <Settings size={22} />
            </button>
            <button onClick={() => exportToCSV(records, storeChain, storeName)} className="bg-brand-600 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-semibold shadow-md hover:bg-brand-700 active:scale-95 text-sm">
              <Download size={18} />
              <span className="hidden sm:inline">Esporta</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Sezione Store */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-brand-500 rounded-full"></div>
            Punto Vendita
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Catena" value={storeChain} onChange={e => setStoreChain(e.target.value)} options={dataLists.chains} placeholder="Seleziona catena..." />
            <Input label="Negozio / Città" value={storeName} onChange={e => setStoreName(e.target.value)} options={dataLists.stores} placeholder="Località..." />
          </div>
        </section>

        {/* Form Registrazione */}
        <section className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 relative overflow-hidden">
          {isAnalyzing && (
            <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-300">
              <div className="relative">
                <Wand2 className="w-12 h-12 text-brand-500 animate-pulse mb-3" />
                <div className="absolute -inset-4 bg-brand-500/10 rounded-full blur-xl animate-pulse"></div>
              </div>
              <p className="font-bold text-brand-700 animate-bounce">L'AI sta leggendo l'etichetta...</p>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
             <h2 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-brand-500 rounded-full"></div>
                Dati Articolo
             </h2>
             <div className="flex bg-gray-100 p-1 rounded-xl">
               <button onClick={() => setProductType('Mazzo')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${productType === 'Mazzo' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <Flower2 size={16} /> Mazzo
               </button>
               <button onClick={() => setProductType('Pianta')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${productType === 'Pianta' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                 <Leaf size={16} /> Pianta
               </button>
             </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
               <Input 
                  label="Nome Articolo" 
                  value={itemName} 
                  onChange={e => setItemName(e.target.value)} 
                  options={productType === 'Mazzo' ? dataLists.flowers : dataLists.plants} 
                  placeholder="Cerca o inserisci nome..." 
               />
               <label className="flex items-center justify-center w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl cursor-pointer hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm active:scale-90 group">
                  <Camera size={28} className="group-hover:rotate-12 transition-transform" />
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleAiAnalysis} />
               </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               <Input label="Prezzo (€)" type="number" step="0.01" value={priceValue} onChange={e => setPriceValue(e.target.value)} placeholder="0.00" />
               {productType === 'Pianta' ? (
                 <Input label="Vaso (Ø cm)" value={vase} onChange={e => setVase(e.target.value)} options={dataLists.vases} placeholder="es. 12" />
               ) : (
                 <Input label="N° Steli" value={stems} onChange={e => setStems(e.target.value)} options={dataLists.stems} placeholder="es. 10" />
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Fornitore" value={supplier} onChange={e => setSupplier(e.target.value)} options={dataLists.suppliers} placeholder="Cerca fornitore..." />
              <div className="relative">
                <Input label="Codice EAN" value={ean} onChange={e => { setEan(e.target.value); if(e.target.value.length >= 7) handleSupplierLookup(e.target.value); }} placeholder="Scansiona o scrivi..." />
                <div className="absolute right-2 top-[32px] flex gap-1">
                  <button onClick={() => setIsLookupOpen(true)} title="Cerca nelle regole EAN" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><BookOpen size={20} /></button>
                  <button onClick={() => setIsScannerOpen(true)} title="Apri fotocamera scanner" className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"><ScanLine size={20} /></button>
                </div>
              </div>
            </div>

            <button onClick={handleSave} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-brand-500/20 transition-all transform active:scale-[0.98] text-lg mt-4 uppercase tracking-wider">
              Registra Prezzo
            </button>
          </div>
        </section>

        {/* Storico Recenti */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 gap-4">
             <div className="font-bold text-gray-700 flex items-center gap-2">
               <div className="w-6 h-6 bg-brand-100 text-brand-600 rounded-md flex items-center justify-center text-xs">{records.length}</div>
               Record in sessione
             </div>
             <div className="relative w-full sm:w-64">
               <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
               <input type="text" placeholder="Filtra cronologia..." value={filterTerm} onChange={e => setFilterTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 transition-all" />
             </div>
           </div>
           <div className="max-h-[450px] overflow-y-auto overflow-x-auto">
             {filteredRecords.length > 0 ? (
               <table className="w-full text-left border-collapse">
                 <thead className="bg-white sticky top-0 z-10 text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-100">
                    <tr>
                      <th className="p-4 font-bold">Articolo</th>
                      <th className="p-4 font-bold">Dettagli</th>
                      <th className="p-4 font-bold text-right">Prezzo</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 text-sm">
                   {filteredRecords.map((r) => (
                     <tr key={r.id} className="hover:bg-brand-50/30 transition-colors group">
                       <td className="p-4">
                          <div className="font-bold text-gray-800">{r.itemName}</div>
                          <div className="text-[10px] text-gray-400">{r.storeChain} - {r.storeName}</div>
                       </td>
                       <td className="p-4">
                          <div className="text-gray-500 text-xs">{r.supplierName || 'Fornitore ignoto'}</div>
                          {r.type === 'Pianta' ? (
                            <div className="text-[10px] font-medium text-brand-600">Vaso Ø {r.vaseDiameter}</div>
                          ) : (
                            <div className="text-[10px] font-medium text-brand-600">{r.stemsCount} Steli</div>
                          )}
                       </td>
                       <td className="p-4 text-right">
                          <span className="font-black text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg">€{r.priceValue.toFixed(2)}</span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             ) : (
               <div className="p-12 text-center text-gray-300 italic flex flex-col items-center gap-2">
                 <Search size={32} strokeWidth={1} />
                 Nessun record trovato
               </div>
             )}
           </div>
        </section>
      </main>

      {/* Modals */}
      {isSettingsOpen && (
        <SettingsModal 
          data={dataLists} 
          onUpdate={updateDataList} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}

      {isLookupOpen && (
        <SupplierLookupModal 
          rules={supplierRules} 
          onClose={() => setIsLookupOpen(false)}
          onSelect={(rule) => { setSupplier(rule.supplier); setEan(rule.root); setIsLookupOpen(false); }}
        />
      )}

      {isScannerOpen && (
        <ScannerModal 
          onClose={() => setIsScannerOpen(false)} 
          onScanSuccess={(code) => { setEan(code); handleSupplierLookup(code); }} 
        />
      )}
    </div>
  );
}

export default App;