import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, ScanLine, Camera, Wand2, Search, Database, BookOpen } from 'lucide-react';
import { Input } from './components/Input.tsx';
import { ScannerModal } from './components/ScannerModal.tsx';
import { SupplierLookupModal } from './components/SupplierLookupModal.tsx';
import { analyzePriceTagImage } from './services/geminiService.ts';
import { exportToCSV } from './services/exportService.ts';
import { loadDataFromExcel } from './services/excelService.ts';
import { PriceRecord, ProductType, SupplierRule } from './types.ts';
import { 
  STORE_CHAINS, STORE_NAMES, PLANTS, CUT_FLOWERS, 
  SUPPLIERS, STEM_COUNTS, VASE_DIAMETERS, SUPPLIER_EAN_RULES 
} from './constants.ts';

const App: React.FC = () => {
  // --- Data State ---
  const [chainsList, setChainsList] = useState(STORE_CHAINS);
  const [storesList, setStoresList] = useState(STORE_NAMES);
  const [plantsList, setPlantsList] = useState(PLANTS);
  const [flowersList, setFlowersList] = useState(CUT_FLOWERS);
  const [suppliersList, setSuppliersList] = useState(SUPPLIERS);
  const [stemsList, setStemsList] = useState(STEM_COUNTS);
  const [vasesList, setVasesList] = useState(VASE_DIAMETERS);
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
          if (excelData.chains.length) setChainsList(excelData.chains);
          if (excelData.stores.length) setStoresList(excelData.stores);
          if (excelData.plants.length) setPlantsList(excelData.plants);
          if (excelData.flowers.length) setFlowersList(excelData.flowers);
          if (excelData.suppliers.length) setSuppliersList(excelData.suppliers);
          if (excelData.stems.length) setStemsList(excelData.stems);
          if (excelData.vases.length) setVasesList(excelData.vases);
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
    toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
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
          showNotification("Analisi completata!");
        } catch (error) {
          showNotification("Errore analisi AI.");
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
      showNotification("Campi obbligatori mancanti");
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
    showNotification("Salvato!");
  };

  const filteredRecords = records.filter(r => 
    r.itemName.toLowerCase().includes(filterTerm.toLowerCase()) || 
    r.eanCode?.includes(filterTerm) ||
    r.supplierName?.toLowerCase().includes(filterTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-12 bg-gray-50 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">F</div>
             <div>
               <h1 className="text-xl font-bold text-gray-800 leading-none">FloraTrack AI</h1>
               {isExcelLoaded && <span className="text-[10px] text-brand-600 font-bold flex items-center gap-1 uppercase tracking-wider"><Database size={10}/> Excel Online</span>}
             </div>
          </div>
          <button onClick={() => exportToCSV(records, storeChain, storeName)} className="text-brand-600 hover:bg-brand-50 p-2 rounded-lg transition-colors flex items-center gap-2 font-medium">
            <Download size={20} />
            <span className="hidden sm:inline">Esporta</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-gray-500 font-semibold text-xs uppercase tracking-wider mb-4">Punto Vendita</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Catena" value={storeChain} onChange={e => setStoreChain(e.target.value)} options={chainsList} />
            <Input label="Negozio / Città" value={storeName} onChange={e => setStoreName(e.target.value)} options={storesList} />
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 relative overflow-hidden">
          {isAnalyzing && (
            <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
              <Wand2 className="w-12 h-12 text-brand-500 animate-spin mb-3" />
              <p className="font-semibold text-brand-700">Analisi AI in corso...</p>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
             <h2 className="text-gray-500 font-semibold text-xs uppercase tracking-wider">Registrazione</h2>
             <div className="flex bg-gray-100 p-1 rounded-lg">
               <button onClick={() => setProductType('Mazzo')} className={`px-4 py-1.5 rounded-md text-sm font-medium ${productType === 'Mazzo' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}>💐 Mazzo</button>
               <button onClick={() => setProductType('Pianta')} className={`px-4 py-1.5 rounded-md text-sm font-medium ${productType === 'Pianta' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}>🪴 Pianta</button>
             </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
               <Input label="Articolo" value={itemName} onChange={e => setItemName(e.target.value)} options={productType === 'Mazzo' ? flowersList : plantsList} placeholder="Nome prodotto" />
               <label className="flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors border border-indigo-200">
                  <Camera size={24} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAiAnalysis} />
               </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               <Input label="Prezzo (€)" type="number" step="0.01" value={priceValue} onChange={e => setPriceValue(e.target.value)} placeholder="0.00" />
               {productType === 'Pianta' ? (
                 <Input label="Vaso (Ø cm)" value={vase} onChange={e => setVase(e.target.value)} options={vasesList} />
               ) : (
                 <Input label="N° Steli" value={stems} onChange={e => setStems(e.target.value)} options={stemsList} />
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Fornitore" value={supplier} onChange={e => setSupplier(e.target.value)} options={suppliersList} />
              <div className="relative">
                <Input label="EAN / Barcode" value={ean} onChange={e => { setEan(e.target.value); if(e.target.value.length >= 7) handleSupplierLookup(e.target.value); }} />
                <div className="absolute right-2 top-[32px] flex gap-1">
                  <button onClick={() => setIsLookupOpen(true)} className="p-1.5 text-gray-400 hover:text-indigo-600"><BookOpen size={20} /></button>
                  <button onClick={() => setIsScannerOpen(true)} className="p-1.5 text-gray-400 hover:text-brand-600"><ScanLine size={20} /></button>
                </div>
              </div>
            </div>

            <button onClick={handleSave} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-[0.98]">
              Registra Prezzo
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
             <div className="font-bold text-gray-700">{records.length} Record Salvati</div>
             <div className="relative w-48">
               <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
               <input type="text" placeholder="Filtra..." value={filterTerm} onChange={e => setFilterTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand-500" />
             </div>
           </div>
           <div className="max-h-[400px] overflow-y-auto">
             <table className="w-full text-left">
               <tbody className="divide-y divide-gray-100 text-sm">
                 {filteredRecords.map((r) => (
                   <tr key={r.id} className="hover:bg-gray-50">
                     <td className="p-4 font-semibold">{r.itemName}</td>
                     <td className="p-4 text-gray-500">{r.supplierName}</td>
                     <td className="p-4 text-right font-bold text-brand-700">€{r.priceValue.toFixed(2)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </section>
      </main>

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