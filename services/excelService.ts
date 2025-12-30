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
    // Cache-busting per assicurarci di caricare sempre l'ultima versione del database
    const timestamp = Date.now();
    const response = await fetch(`./database.xlsx?t=${timestamp}`);
    
    if (!response.ok) {
      console.warn(`Database Excel non trovato (Status: ${response.status}). Verranno usati i dati predefiniti.`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    if (!workbook.SheetNames.length) {
      console.error('File Excel senza fogli validi.');
      return null;
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData.length) {
      console.warn('Database Excel vuoto.');
      return null;
    }

    const extractColumn = (key: string): string[] => {
      return [...new Set(jsonData
        .map(row => row[key])
        .filter(val => val !== undefined && val !== null && String(val).trim() !== '')
        .map(val => String(val).trim())
      )].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    };

    // Estrazione regole EAN -> Fornitore
    const supplierRules: SupplierRule[] = jsonData
      .filter(row => row['RadiceEAN'] && row['NomeFornitore'])
      .map(row => ({
        root: String(row['RadiceEAN']).trim(),
        supplier: String(row['NomeFornitore']).trim()
      }));

    // Rimozione duplicati radice
    const uniqueRules = Array.from(
      new Map(supplierRules.map(item => [item.root, item])).values()
    );

    console.log(`Database Excel caricato: ${jsonData.length} righe, ${uniqueRules.length} regole EAN.`);

    return {
      chains: extractColumn('Catene'),
      stores: extractColumn('Negozi'),
      plants: extractColumn('Piante'),
      flowers: extractColumn('Fiori'),
      suppliers: extractColumn('NomeFornitore'),
      stems: extractColumn('Steli'),
      vases: extractColumn('Vasi'),
      supplierRules: uniqueRules
    };

  } catch (error) {
    console.error("Errore critico excelService:", error);
    return null;
  }
};