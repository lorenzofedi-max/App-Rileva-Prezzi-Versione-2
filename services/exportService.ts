import * as XLSX from 'xlsx';
import { PriceRecord } from "../types";

export const exportAndShareExcel = async (data: PriceRecord[], chain: string, store: string) => {
  if (!data.length) return;

  const worksheetData = data.map(row => ({
    "Data": new Date(row.timestamp).toLocaleDateString("it-IT"),
    "Catena": row.storeChain,
    "Negozio": row.storeName,
    "Tipologia": row.type,
    "Articolo": row.itemName,
    "N° Steli": row.stemsCount || "",
    "Diam. Vaso (Ø)": row.vaseDiameter || "",
    "Prezzo (€)": row.priceValue,
    "Fornitore": row.supplierName || "",
    "Codice EAN": row.eanCode || "",
    "Note": row.notes || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rilevamenti");

  const wscols = [
    { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 25 }, 
    { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 16 }, { wch: 35 }
  ];
  worksheet['!cols'] = wscols;

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Costruzione del nome file richiesto: Rilevamento_Catena_Negozio_Data.xlsx
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
  const safeChain = (chain || 'Retail').trim().replace(/\s+/g, '_');
  const safeStore = (store || 'Generico').trim().replace(/\s+/g, '_');
  const fileName = `Rilevamento_${safeChain}_${safeStore}_${dateStr}.xlsx`;

  const file = new File([blob], fileName, { type: blob.type });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Rilevamento FloraTrack - ${chain}`,
        text: `Export dati rilevati presso ${store}.`,
      });
      return; 
    } catch (error) {
      if ((error as Error).name !== 'AbortError') console.error("Errore share:", error);
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};