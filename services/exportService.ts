import { PriceRecord } from "../types";

export const exportToCSV = (data: PriceRecord[], chain: string, store: string) => {
  if (!data.length) return;

  const headers = [
    "Data", "Catena", "Negozio", "Tipologia", "Articolo", 
    "N° Steli", "Vaso", "Prezzo", "Fornitore", "EAN", "Note"
  ];

  const csvRows = [headers.join(";")];

  for (const row of data) {
    const values = [
      new Date(row.timestamp).toLocaleDateString("it-IT"),
      row.storeChain,
      row.storeName,
      row.type,
      row.itemName,
      row.stemsCount || "",
      row.vaseDiameter || "",
      row.priceValue.toFixed(2).replace('.', ','),
      row.supplierName || "",
      row.eanCode ? `="${row.eanCode}"` : "", // Force Excel to treat as string
      (row.notes || "").replace(/;/g, ",") // Escape semicolons
    ];
    // Escape quotes and wrap in quotes
    const escapedValues = values.map(v => `"${String(v).replace(/"/g, '""')}"`);
    csvRows.push(escapedValues.join(";"));
  }

  const csvString = csvRows.join("\n");
  // Add BOM for Excel UTF-8 compatibility
  const blob = new Blob(["\ufeff" + csvString], { type: "text/csv;charset=utf-8;" });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  const safeChain = chain.replace(/\s+/g, '_') || 'Chain';
  const safeStore = store.replace(/\s+/g, '_') || 'Store';
  
  link.setAttribute("href", url);
  link.setAttribute("download", `Rilevamento_${safeChain}_${safeStore}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
