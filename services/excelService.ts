import * as XLSX from 'xlsx';
import { SupplierRule } from '../types';

export interface AppDataLists {
  chains: string[];
  stores: string[];
  plants: string[];
  flowers: string[];
  suppliers: string[];
  stems: string[];
  vases: string[];
  supplierRules: SupplierRule[];
}

export const loadDataFromExcel = async (): Promise<AppDataLists | null> => {
  try {
    // Cerchiamo il file database.xlsx nella root
    const response = await fetch('./database.xlsx', { cache: 'no-cache' });
    
    if (!response.ok) {
      console.warn('File database.xlsx non trovato sul server. Caricamento defaults...');
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    if (!workbook.SheetNames.length) return null;

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData.length) return null;

    const extractColumn = (key: string): string[] => {
      const list = jsonData
        .map(row => row[key])
        .filter(item => item !== undefined && item !== null && String(item).trim() !== '')
        .map(item => String(item).trim());
      
      // Rimuove duplicati e ordina alfabeticamente/numericamente
      return [...new Set(list)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    };

    // Estrae le regole Fornitore (RadiceEAN -> NomeFornitore)
    const supplierRules: SupplierRule[] = jsonData
      .filter(row => row['RadiceEAN'] && row['NomeFornitore'])
      .map(row => ({
        root: String(row['RadiceEAN']).trim(),
        supplier: String(row['NomeFornitore']).trim()
      }));

    // Rende uniche le regole per radice
    const uniqueRulesMap = new Map();
    supplierRules.forEach(rule => uniqueRulesMap.set(rule.root, rule));
    const uniqueRules = Array.from(uniqueRulesMap.values());

    return {
      chains: extractColumn('Catene'),
      stores: extractColumn('Negozi'),
      plants: extractColumn('Piante'),
      flowers: extractColumn('Fiori'),
      suppliers: extractColumn('Fornitori'),
      stems: extractColumn('Steli'),
      vases: extractColumn('Vasi'),
      supplierRules: uniqueRules
    };

  } catch (error) {
    console.error("Errore critico durante il caricamento dell'Excel:", error);
    return null;
  }
};