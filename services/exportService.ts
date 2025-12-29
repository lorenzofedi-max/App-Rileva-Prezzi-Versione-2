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
    "Ora": new Date(row.timestamp).toLocaleTimeString("it-IT", { hour: '2-digit', minute: '2-digit' }),
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
    { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, 
    { wch: 25 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, 
    { wch: 15 }, { wch: 30 }
  ];
  worksheet['!cols'] = wscols;

  // 3. Generazione Buffer del file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeChain = chain.replace(/\s+/g, '_') || 'Retail';
  const fileName = `FloraTrack_${safeChain}_${dateStr}.xlsx`;

  // 4. Tentativo di Condivisione (WhatsApp, Mail, AirDrop)
  const file = new File([blob], fileName, { type: blob.type });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Rilevamento Prezzi - ${chain}`,
        text: `In allegato il file Excel con i ${data.length} rilevamenti effettuati il ${dateStr}.`,
      });
      return; // Condivisione riuscita
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error("Errore durante la condivisione:", error);
      } else {
        return; // L'utente ha annullato la condivisione
      }
    }
  }

  // 5. Fallback: Download classico se Share API non disponibile
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};