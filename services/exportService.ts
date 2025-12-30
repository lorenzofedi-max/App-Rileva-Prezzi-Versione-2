import * as XLSX from 'xlsx';
import { PriceRecord } from "../types";

/**
 * Genera un file Excel dai record e tenta di condividerlo usando le API di sistema.
 * Se la condivisione non è supportata, scarica il file automaticamente.
 */
export const exportAndShareExcel = async (data: PriceRecord[], chain: string, store: string) => {
  if (!data.length) return;

  // 1. Preparazione dati per Excel
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

  // 2. Creazione Workbook e Worksheet
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rilevamenti");

  // Imposta larghezza colonne minima per leggibilità
  const wscols = [
    { wch: 12 }, // Data
    { wch: 15 }, // Catena
    { wch: 15 }, // Negozio
    { wch: 10 }, // Tipologia
    { wch: 25 }, // Articolo
    { wch: 8 },  // N° Steli
    { wch: 12 }, // Diam. Vaso
    { wch: 10 }, // Prezzo
    { wch: 20 }, // Fornitore
    { wch: 16 }, // Codice EAN
    { wch: 35 }  // Note
  ];
  worksheet['!cols'] = wscols;

  // 3. Generazione Buffer del file e Nome File dinamico
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Generazione nome file: Rilevamento_Catena_Negozio_Data.xlsx
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
  const safeChain = (chain || 'Retail').trim().replace(/\s+/g, '_');
  const safeStore = (store || 'Generico').trim().replace(/\s+/g, '_');
  const fileName = `Rilevamento_${safeChain}_${safeStore}_${dateStr}.xlsx`;

  // 4. Tentativo di Condivisione (WhatsApp, Mail, AirDrop)
  const file = new File([blob], fileName, { type: blob.type });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Rilevamento Prezzi - ${chain}`,
        text: `In allegato il file Excel con i ${data.length} rilevamenti effettuati il ${dateStr}.`,
      });
      return; 
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error("Errore durante la condivisione:", error);
      } else {
        return; 
      }
    }
  }

  // 5. Fallback: Download classico
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
