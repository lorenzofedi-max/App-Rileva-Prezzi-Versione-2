import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  data: {
    chains: string[];
    stores: string[];
    plants: string[];
    flowers: string[];
    suppliers: string[];
  };
  onUpdate: (category: string, newList: string[]) => void;
}

type CategoryKey = 'chains' | 'stores' | 'plants' | 'flowers' | 'suppliers';

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'chains', label: 'Catene' },
  { key: 'stores', label: 'Negozi' },
  { key: 'plants', label: 'Piante' },
  { key: 'flowers', label: 'Fiori' },
  { key: 'suppliers', label: 'Fornitori' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, data, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<CategoryKey>('chains');
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (!newItem.trim()) return;
    const currentList = data[activeTab];
    if (!currentList.includes(newItem.trim())) {
      const updatedList = [...currentList, newItem.trim()].sort();
      onUpdate(activeTab, updatedList);
    }
    setNewItem('');
  };

  const handleDelete = (itemToDelete: string) => {
    const updatedList = data[activeTab].filter(item => item !== itemToDelete);
    onUpdate(activeTab, updatedList);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <div className="w-full max-w-2xl h-[80vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden relative m-4">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Gestione Dati</h2>
          <button onClick={onClose} className="p-2 bg-white rounded-full hover:bg-gray-200 transition">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === cat.key 
                  ? 'border-b-2 border-brand-500 text-brand-600 bg-brand-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 sticky top-0 z-10">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder={`Aggiungi a ${CATEGORIES.find(c => c.key === activeTab)?.label}...`}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
              <button 
                onClick={handleAdd}
                className="bg-brand-600 text-white p-2 rounded-lg hover:bg-brand-700 transition"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
            {data[activeTab].map((item) => (
              <div key={item} className="p-3 flex justify-between items-center group hover:bg-gray-50 transition">
                <span className="text-gray-700">{item}</span>
                <button 
                  onClick={() => handleDelete(item)}
                  className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all px-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {data[activeTab].length === 0 && (
              <div className="p-8 text-center text-gray-400 italic">
                Nessun elemento in questa lista.
              </div>
            )}
          </div>
        </div>
        
        <div className="p-3 bg-gray-100 text-xs text-center text-gray-500">
           Le modifiche vengono salvate automaticamente.
        </div>
      </div>
    </div>
  );
};