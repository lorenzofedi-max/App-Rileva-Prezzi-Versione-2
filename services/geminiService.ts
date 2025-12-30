import { GoogleGenAI, Type } from "@google/genai";
import { AiAnalysisResult } from "../types.ts";

/**
 * Analizza l'immagine di un'etichetta prezzo.
 * Ottimizzato per: Velocità di risposta e Precisione OCR.
 */
export const analyzePriceTagImage = async (base64Image: string): Promise<AiAnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          },
          {
            text: `ESTRAZIONE DATI ETICHETTA BOTANICA.
            Leggi l'immagine e restituisci SOLO i dati richiesti in formato JSON.
            
            1. itemName: Nome della pianta/fiore. Sii conciso.
            2. eanCode: Codice numerico a 8 o 13 cifre. Se incerto o assente, lascia "".
            3. price: Prezzo finale numerico. Se NON presente o illeggibile, restituisci 0.

            REGOLE D'ORO:
            - NON inventare numeri. 
            - Ignora prezzi al KG, ignora percentuali di sconto isolate.
            - Focus massimo su nitidezza EAN.`
          }
        ]
      },
      config: {
        // 2048 è il bilanciamento perfetto tra velocità e analisi accurata dei dettagli
        thinkingConfig: { thinkingBudget: 2048 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemName: { type: Type.STRING },
            price: { type: Type.NUMBER },
            eanCode: { type: Type.STRING }
          },
          required: ["itemName", "price"]
        }
      }
    });

    const text = response.text;
    if (!text) return {};

    const result = JSON.parse(text) as AiAnalysisResult;
    
    // Pulizia rigorosa EAN post-scansione
    if (result.eanCode) {
      result.eanCode = result.eanCode.replace(/\D/g, '');
      if (result.eanCode.length < 7) result.eanCode = ""; // Scarta codici troppo brevi/errati
    }

    return result;
  } catch (error) {
    console.error("Errore analisi AI ottimizzata:", error);
    return {};
  }
};
