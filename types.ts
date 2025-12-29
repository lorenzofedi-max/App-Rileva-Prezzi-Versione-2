export type ProductType = 'Mazzo' | 'Pianta';

export interface PriceRecord {
  id: number;
  timestamp: string; // ISO string
  storeChain: string;
  storeName: string;
  type: ProductType;
  itemName: string;
  stemsCount?: number | null;
  vaseDiameter?: number | null;
  priceValue: number;
  supplierName?: string;
  eanCode?: string;
  notes?: string;
}

export interface SupplierRule {
  root: string;
  supplier: string;
}

export interface AiAnalysisResult {
  itemName?: string;
  price?: number;
  eanCode?: string;
}
