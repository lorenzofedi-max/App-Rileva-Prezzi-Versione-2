import React, { useState, useEffect } from 'react';
import { 
  Share2, Search, Database, BookOpen, 
  Leaf, Zap, Store, Tag, Trash2, Calendar, Edit2, XCircle, 
  MessageSquare, Eraser, History, Percent, Sparkles, Box, Soup, CheckCircle2, Hash, StickyNote
} from 'lucide-react';
import { Input } from './components/Input.tsx';
import { SupplierLookupModal } from './components/SupplierLookupModal.tsx';
import { VisionScanner } from './components/VisionScanner.tsx';
import { exportAndShareExcel } from './services/exportService.ts';
import { loadDataFromExcel } from './services/excelService.ts';
import { PriceRecord, ProductType, SupplierRule } from './types.ts';
import { 
  STORE_CHAINS, STORE_NAMES, PLANTS, CUT_FLOWERS, 
  SUPPLIERS, STEM_COUNTS, VASE_DIAMETERS, SUPPLIER_EAN_RULES 
} from './constants.ts';

const App: React.FC = () => {
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
  const [records, setRecords] = useState<PriceRecord[]>(() => {
    const saved = localStorage.getItem('floraTrackData');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [hasBackup, setHasBackup] = useState(() => !!localStorage.getItem('floraTrackBackup'));
  
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
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
  
  // Quick Flags State
  const [showScontoMenu, setShowScontoMenu] = useState(false);
  const [showRamiMenu, setShowRamiMenu] = useState(false);

  // UI State
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [filterTerm, setFilterTerm] = useState('');
  const [isSupplierMatched, setIsSupplierMatched] = useState(false);

  useEffect(() => {
    localStorage.setItem('floraTrackData', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    const initApp = async () => {
      try {
        const excelData = await loadDataFromExcel();
        if (excelData) {
          setDataLists(prev => ({
            ...prev,
            chains: excelData.chains.length ? excelData.chains : prev.chains,
            stores: excelData.stores.length ? excelData.stores : prev.stores,
            plants: excelData.plants.length ? excelData.plants : prev.plants,
            flowers: excelData.flowers.length ? excelData.flowers : prev.flowers,
            suppliers: excelData.suppliers.length ? excelData.suppliers : prev.suppliers,
            stems: excelData.stems.length ? excelData.stems : prev.stems,
            vases: excelData.vases.length ? excelData.vases : prev.vases,
          }));
          if (excelData.supplierRules.length) setSupplierRules(excelData.supplierRules);
          setIsExcelLoaded(true);
        }
      } catch (err) {
        console.error("Excel load failed:", err);
      }
    };
    initApp();
  }, []);

  const handleSupplierLookup = (currentEan: string, silent = false) => {
    if (!currentEan) {
      setIsSupplierMatched(false);
      return;
    }
    const rule = supplierRules.find(r => currentEan.startsWith(r.root));
    if (rule) {
      setSupplier(rule.supplier);
      setIsSupplierMatched(true);
      if (!silent) showNotification(`Fornitore: ${rule.supplier} ✅`);
    } else {
      setSupplier('');
      setIsSupplierMatched(false);
      if (!silent && currentEan.length >= 7) showNotification(`EAN non riconosciuto ⚠️`);
    }
  };

  const showNotification = (msg: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-xl z-[100] font-bold text-xs uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-300 border border-white/20';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  };

  const handleAiDetected = (result: any) => {
    if (result.itemName) setItemName(result.itemName);
    if (result.price) setPriceValue(result.price.toString());
    if (result.eanCode) {
      setEan(result.eanCode);
      handleSupplierLookup(result.eanCode, true);
    }
    showNotification("Dati aggiornati da AI ✨");
  };

  const resetForm = (full = false) => {
    setEditingId(null);
    setItemName(''); setPriceValue(''); setSupplier(''); setEan(''); setNotes(''); setStems(''); setVase('');
    setShowScontoMenu(false); setShowRamiMenu(false); setIsSupplierMatched(false);
    if (full) {
      setStoreChain('');
      setStoreName('');
    }
  };

  const toggleNoteFlag = (flagText: string, isRami: boolean = false) => {
    let currentNotes = notes.trim();
    if (isRami) {
      currentNotes = currentNotes.replace(new RegExp(`,?\\s*Rami\\s\\d`, 'g'), '').replace(/^,?\s*/, '').trim();
    }
    if (notes.includes(flagText) && !isRami) {
      const newNotes = notes.replace(new RegExp(`,?\\s*${flagText}`, 'g'), '').replace(/^,?\s*/, '').trim();
      setNotes(newNotes);
    } else {
      const separator = currentNotes && !currentNotes.endsWith(',') ? ', ' : '';
      setNotes(currentNotes + separator + flagText);
    }
  };

  const handleSave = () => {
    if (!storeChain || !storeName || !itemName || !priceValue) {
      showNotification("Campi incompleti ⚠️");
      return;
    }
    const priceData = {
      storeChain, storeName, type: productType, itemName,
      priceValue: parseFloat(priceValue), supplierName: supplier,
      eanCode: ean, notes, stemsCount: productType === 'Mazzo' && stems ? parseInt(stems) : null,
      vaseDiameter: productType === 'Pianta' && vase ? parseFloat(vase) : null,
    };
    if (editingId !== null) {
      setRecords(prev => prev.map(r => r.id === editingId ? { ...r, ...priceData } : r));
      showNotification("Modificato ✅");
    } else {
      const newRecord: PriceRecord = { id: Date.now(), timestamp: new Date().toISOString(), ...priceData };
      setRecords(prev => [newRecord, ...prev]);
      showNotification("Salvato ✅");
    }
    resetForm();
  };

  const handleClearAll = () => {
    if (records.length === 0) {
        resetForm(true);
        showNotification("Campi puliti ✨");
        return;
    }
    if (confirm("Iniziare una nuova sessione?")) {
      localStorage.setItem('floraTrackBackup', JSON.stringify(records));
      setHasBackup(true);
      setRecords([]);
      resetForm(true);
      showNotification("Sessione conclusa 📁");
    }
  };

  const handleExport = async () => {
    if (records.length === 0) return;
    
    // 1. Crea backup di emergenza
    localStorage.setItem('floraTrackBackup', JSON.stringify(records));
    setHasBackup(true);
    
    // 2. Avvia esportazione
    await exportAndShareExcel(records, storeChain, storeName);
    
    // 3. Svuota TUTTO (inclusi catena e negozio)
    setRecords([]);
    resetForm(true);
    
    showNotification("Esportazione completata 🚀");
  };

  const handleDeleteRecord = (id: number) => {
    if (confirm("Eliminare definitivamente questo rigo?")) {
      setRecords(prev => prev.filter(r => r.id !== id));
      showNotification("Rigo eliminato 🗑️");
    }
  };

  const handleRestoreBackup = () => {
    const backupStr = localStorage.getItem('floraTrackBackup');
    if (!backupStr) {
      showNotification("Nessun backup trovato ❌");
      return;
    }
    if (confirm("Ripristinare l'ultima sessione esportata o svuotata?")) {
      const backupData = JSON.parse(backupStr);
      setRecords(backupData);
      if (backupData.length > 0) {
        setStoreChain(backupData[0].storeChain);
        setStoreName(backupData[0].storeName);
      }
      showNotification("Dati ripristinati correttamente 🔄");
    }
  };

  const handleEditClick = (record: PriceRecord) => {
    setEditingId(record.id);
    setStoreChain(record.storeChain);
    setStoreName(record.storeName);
    setProductType(record.type);
    setItemName(record.itemName);
    setPriceValue(record.priceValue.toString());
    setSupplier(record.supplierName || '');
    setEan(record.eanCode || '');
    setNotes(record.notes || '');
    setStems(record.stemsCount?.toString() || '');
    setVase(record.vaseDiameter?.toString() || '');
    if (record.eanCode) handleSupplierLookup(record.eanCode, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredRecords = records.filter(r => 
    r.itemName.toLowerCase().includes(filterTerm.toLowerCase()) || 
    r.eanCode?.includes(filterTerm) ||
    r.supplierName?.toLowerCase().includes(filterTerm.toLowerCase()) ||
    r.storeChain.toLowerCase().includes(filterTerm.toLowerCase()) ||
    r.storeName.toLowerCase().includes(filterTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-12 bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-[1300px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Leaf size={28} strokeWidth={2.5} />
             </div>
             <div>
               <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">FloraTrack <span className="text-blue-600">AI</span></h1>
               <div className="flex items-center gap-2 mt-1.5">
                 {isExcelLoaded ? (
                   <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1.5 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    <Database size={12}/> DB Attivo
                   </span>
                 ) : (
                   <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Offline Mode</span>
                 )}
               </div>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1300px] mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-8 items-start">
          <div className="space-y-6">
            <section className="bg-white rounded-[2rem] p-6 shadow-premium border border-slate-100/60">
              <div className="flex items-center gap-3 mb-6">
                <Store className="text-blue-500" size={18} />
                <h2 className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">Punto Vendita</h2>
              </div>
              <div className="space-y-4">
                <Input label="Catena" value={storeChain} onChange={e => setStoreChain(e.target.value)} options={dataLists.chains} placeholder="Seleziona..." />
                <Input label="Negozio" value={storeName} onChange={e => setStoreName(e.target.value)} options={dataLists.stores} placeholder="Località..." />
              </div>
            </section>

            <section className={`bg-white rounded-[2rem] p-6 shadow-premium border transition-all duration-300 relative ${editingId ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-100/60'}`}>
              <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-3">
                    <Tag className="text-blue-600" size={18} />
                    <h2 className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">{editingId ? 'Modifica Prezzo' : 'Nuovo Articolo'}</h2>
                 </div>
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                   <button onClick={() => setProductType('Mazzo')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${productType === 'Mazzo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Mazzo</button>
                   <button onClick={() => setProductType('Pianta')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${productType === 'Pianta' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>Pianta</button>
                 </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Input label="Descrizione Prodotto" value={itemName} onChange={e => setItemName(e.target.value)} options={productType === 'Mazzo' ? dataLists.flowers : dataLists.plants} placeholder="Nome prodotto..." />
                  </div>
                  <button onClick={() => setIsVisionOpen(true)} className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl cursor-pointer hover:bg-blue-700 transition-all shadow-lg active:scale-95 group relative flex-shrink-0">
                    <Zap size={24} className="group-hover:scale-110 transition-transform fill-white" />
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-[8px] font-black px-1.5 py-0.5 rounded-md border-2 border-white text-slate-900">AI</div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <Input label="Prezzo (€)" type="number" step="0.01" value={priceValue} onChange={e => setPriceValue(e.target.value)} placeholder="0.00" className="font-bold" />
                   {productType === 'Pianta' ? (
                     <Input label="Ø Vaso" value={vase} onChange={e => setVase(e.target.value)} options={dataLists.vases} placeholder="cm" />
                   ) : (
                     <Input label="N. Steli" value={stems} onChange={e => setStems(e.target.value)} options={dataLists.stems} placeholder="N°" />
                   )}
                </div>

                <div className="relative">
                  <Input label="Fornitore" value={supplier} onChange={e => setSupplier(e.target.value)} options={dataLists.suppliers} placeholder="Cerca..." className={isSupplierMatched ? 'ring-1 ring-blue-500/20' : ''} />
                  {isSupplierMatched && <div className="absolute right-3 top-[34px] flex items-center gap-1.5 bg-blue-600 text-white px-2 py-0.5 rounded-lg border-2 border-white shadow-sm"><CheckCircle2 size={10} /><span className="text-[8px] font-black">MATCH</span></div>}
                </div>
                
                <div className="relative">
                  <Input label="Codice EAN" value={ean} onChange={e => { setEan(e.target.value); if(e.target.value.length >= 7) handleSupplierLookup(e.target.value); }} placeholder="Barcode..." />
                  <button onClick={() => setIsLookupOpen(true)} className="absolute right-3 top-[34px] p-2 text-slate-300 hover:text-blue-600 transition-all"><BookOpen size={20} /></button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} className="text-blue-600"/>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opzioni</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <button onClick={() => { setShowScontoMenu(!showScontoMenu); setShowRamiMenu(false); }} className={`h-10 px-4 rounded-xl text-[10px] font-bold transition-all border ${notes.includes('Sconto') ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>% SCONTO</button>
                      {showScontoMenu && (
                        <div className="absolute bottom-full left-0 mb-3 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-20 grid grid-cols-3 gap-1.5 w-44 animate-in slide-in-from-bottom-2">
                          {['20%', '30%', '40%', '50%', '33%', '13%'].map(val => (
                            <button key={val} onClick={() => { toggleNoteFlag(`Sconto ${val}`); setShowScontoMenu(false); }} className="px-2 py-2 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-700 hover:bg-blue-600 hover:text-white">{val}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <button onClick={() => { setShowRamiMenu(!showRamiMenu); setShowScontoMenu(false); }} className={`h-10 px-4 rounded-xl text-[10px] font-bold transition-all border ${notes.includes('Rami') ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>RAMI</button>
                      {showRamiMenu && (
                        <div className="absolute bottom-full left-0 mb-3 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-20 flex gap-1.5 animate-in slide-in-from-bottom-2">
                          {[1, 2, 3, 4].map(num => (
                            <button key={num} onClick={() => { toggleNoteFlag(`Rami ${num}`, true); setShowRamiMenu(false); }} className="px-3 py-2 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-700 hover:bg-indigo-600 hover:text-white">{num}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => toggleNoteFlag('Vaso Ceramica')} className={`h-10 px-4 rounded-xl text-[10px] font-bold border transition-all ${notes.includes('Ceramica') ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>CERAMICA</button>
                    <button onClick={() => toggleNoteFlag('Ciotola')} className={`h-10 px-4 rounded-xl text-[10px] font-bold border transition-all ${notes.includes('Ciotola') ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>CIOTOLA</button>
                    <button onClick={() => toggleNoteFlag('Confezione')} className={`h-10 px-4 rounded-xl text-[10px] font-bold border transition-all ${notes.includes('Confezione') ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>CONFEZIONE</button>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1"><MessageSquare size={12} className="inline mr-1"/> Note</label>
                   <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="..." className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-bold focus:border-blue-600 outline-none min-h-[80px] resize-none" />
                </div>

                <div className="space-y-6 pt-4">
                  <div className="flex gap-3">
                    {editingId && <button onClick={() => resetForm()} className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl text-xs uppercase tracking-widest">ANNULLA</button>}
                    <button onClick={handleSave} className={`flex-[2] text-white font-black py-5 rounded-2xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-widest ${editingId ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                      {editingId ? 'AGGIORNA' : 'REGISTRA PREZZO'}
                    </button>
                  </div>

                  <div className="grid grid-cols-[1.2fr_1fr] gap-3">
                    <button 
                      onClick={handleExport} 
                      disabled={records.length === 0} 
                      className="bg-blue-700 text-white rounded-2xl flex flex-col items-center justify-center gap-2 font-bold shadow-md hover:bg-blue-800 disabled:opacity-20 active:scale-95 transition-all p-4"
                    >
                      <Share2 size={24} />
                      <span className="text-[10px] uppercase tracking-widest">Esporta e Chiudi</span>
                    </button>
                    
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={handleClearAll} 
                        className="flex-1 bg-white text-slate-500 rounded-xl flex items-center justify-center gap-2 font-bold border border-slate-200 hover:text-rose-600 hover:border-rose-100 shadow-sm transition-all group active:scale-95 px-3 py-2"
                      >
                        <Eraser size={18} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[9px] uppercase tracking-widest font-black">Svuota Sessione</span>
                      </button>
                      
                      {hasBackup && (
                        <button 
                          onClick={handleRestoreBackup} 
                          className="flex-1 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center gap-2 font-bold border border-blue-200 hover:bg-blue-100 shadow-sm transition-all active:scale-95 px-3 py-2"
                        >
                          <History size={18} />
                          <span className="text-[9px] uppercase tracking-widest font-black">Recupero</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6 overflow-hidden">
            <section className="bg-white rounded-[2rem] shadow-premium border border-slate-100/60 overflow-hidden flex flex-col h-full max-h-[900px]">
               <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 gap-6">
                 <div className="font-black text-slate-900 flex items-center gap-4">
                   <div className="w-10 h-10 bg-blue-700 text-white rounded-xl flex items-center justify-center text-sm font-black">{records.length}</div>
                   <div>
                     <span className="text-sm font-black uppercase tracking-widest">Cronologia</span>
                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sessione corrente</p>
                   </div>
                 </div>
                 <div className="relative w-full sm:w-72">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                   <input type="text" placeholder="Filtra prodotti..." value={filterTerm} onChange={e => setFilterTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 text-xs border border-slate-200 bg-white rounded-xl outline-none focus:border-blue-500 font-bold" />
                 </div>
               </div>
               
               <div className="flex-1 overflow-auto custom-scrollbar">
                 {filteredRecords.length > 0 ? (
                   <table className="w-full text-left border-collapse table-auto min-w-[1200px]">
                     <thead className="bg-slate-50 sticky top-0 z-10 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4">Ora</th>
                          <th className="px-6 py-4">Prodotto</th>
                          <th className="px-6 py-4 text-center">Specifiche</th>
                          <th className="px-6 py-4 text-right">Prezzo</th>
                          <th className="px-6 py-4">Fornitore</th>
                          <th className="px-6 py-4">EAN</th>
                          <th className="px-6 py-4">Note</th>
                          <th className="px-6 py-4 text-center">Azione</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                       {filteredRecords.map((r) => (
                         <tr key={r.id} className={`transition-all ${editingId === r.id ? 'bg-blue-50/50' : 'hover:bg-slate-50/30'}`}>
                           <td className="px-6 py-6 text-[11px] font-bold text-slate-700 whitespace-nowrap">{new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                           <td className="px-6 py-6">
                             <div className="text-sm font-black text-slate-900 mb-0.5">{r.itemName}</div>
                             <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border ${r.type === 'Pianta' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{r.type}</span>
                           </td>
                           <td className="px-6 py-6 text-center whitespace-nowrap">
                              {r.type === 'Pianta' ? <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">Ø {r.vaseDiameter}</span> : <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">{r.stemsCount} Steli</span>}
                           </td>
                           <td className="px-6 py-6 text-right whitespace-nowrap">
                             <div className="text-base font-black text-blue-700">€ {r.priceValue.toFixed(2)}</div>
                           </td>
                           <td className="px-6 py-6">
                             {r.supplierName ? (
                               <div className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-sm inline-flex items-center gap-2 whitespace-nowrap">
                                 <Store size={10} className="text-blue-500" /> {r.supplierName}
                               </div>
                             ) : <span className="text-slate-300">-</span>}
                           </td>
                           <td className="px-6 py-6">
                             {r.eanCode ? <div className="font-mono text-[10px] text-slate-500 whitespace-nowrap">{r.eanCode}</div> : <span className="text-slate-300">-</span>}
                           </td>
                           <td className="px-6 py-6 max-w-[150px]">
                             {r.notes ? (
                               <div className="text-[10px] text-slate-500 font-medium italic truncate" title={r.notes}>{r.notes}</div>
                             ) : <span className="text-slate-300">-</span>}
                           </td>
                           <td className="px-6 py-6">
                             <div className="flex items-center justify-center gap-2">
                               <button onClick={() => handleEditClick(r)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"><Edit2 size={16} /></button>
                               <button onClick={() => handleDeleteRecord(r.id)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"><Trash2 size={16} /></button>
                             </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 ) : (
                   <div className="p-32 text-center text-slate-300 flex flex-col items-center gap-6">
                     <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100"><Database size={40} strokeWidth={1} /></div>
                     <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Nessun dato</span>
                   </div>
                 )}
               </div>
            </section>
          </div>
        </div>
      </main>

      {isLookupOpen && <SupplierLookupModal rules={supplierRules} onClose={() => setIsLookupOpen(false)} onSelect={(rule) => { setSupplier(rule.supplier); setEan(rule.root); setIsSupplierMatched(true); setIsLookupOpen(false); }} />}
      {isVisionOpen && <VisionScanner rules={supplierRules} onClose={() => setIsVisionOpen(false)} onDetected={handleAiDetected} />}
    </div>
  );
}

export default App;