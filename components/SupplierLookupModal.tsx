import React, { useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import { SupplierRule } from '../types';

interface SupplierLookupModalProps {
  rules: SupplierRule[];
  onSelect: (rule: SupplierRule) => void;
  onClose: () => void;
}

export const SupplierLookupModal: React.FC<SupplierLookupModalProps> = ({ rules, onSelect, onClose }) => {
  const [term, setTerm] = useState('');

  const filtered = rules.filter(r => 
    r.supplier.toLowerCase().includes(term.toLowerCase()) || 
    r.root.includes(term)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-800">Ricerca Fornitore / EAN</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              autoFocus
              placeholder="Cerca per nome o radice EAN..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-brand-500 rounded-xl outline-none transition-all"
              value={term}
              onChange={e => setTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-gray-50 sticky top-0 text-xs uppercase text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-2">Radice</th>
                  <th className="px-4 py-2">Fornitore</th>
                  <th className="px-4 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((rule, idx) => (
                  <tr 
                    key={idx} 
                    className="hover:bg-brand-50 cursor-pointer transition-colors group"
                    onClick={() => onSelect(rule)}
                  >
                    <td className="px-4 py-3 font-mono text-sm text-brand-700">{rule.root}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{rule.supplier}</td>
                    <td className="px-4 py-3">
                      <Check size={16} className="text-brand-500 opacity-0 group-hover:opacity-100" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-gray-400 italic">
              Nessun fornitore trovato con questo criterio.
            </div>
          )}
        </div>
        
        <div className="p-3 bg-gray-50 text-center text-[10px] text-gray-400">
          Dati caricati dal database Excel
        </div>
      </div>
    </div>
  );
};