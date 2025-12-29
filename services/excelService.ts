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
    const response = await fetch('./database.xlsx');
    
    if (!response.ok) {
      console.log('Database Excel file not found, using defaults.');
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

    const extractColumn = (key: string): string[] => {
      const list = jsonData
        .map(row => row[key])
        .filter(item => item !== undefined && item !== null && String(item).trim() !== '')
        .map(item => String(item).trim());
      return [...new Set(list)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    };

    // Extract Supplier Rules (mapping RadiceEAN to NomeFornitore)
    const supplierRules: SupplierRule[] = jsonData
      .filter(row => row['RadiceEAN'] && row['NomeFornitore'])
      .map(row => ({
        root: String(row['RadiceEAN']).trim(),
        supplier: String(row['NomeFornitore']).trim()
      }));

    // Unique rules by root
    const uniqueRules = Array.from(new Map(supplierRules.map(item => [item.root, item])).values());

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
    console.error("Error loading Excel database:", error);
    return null;
  }
};