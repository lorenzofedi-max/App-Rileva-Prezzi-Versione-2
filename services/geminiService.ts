import { GoogleGenAI, Type } from "@google/genai";
import { AiAnalysisResult } from "../types.ts";

export const analyzePriceTagImage = async (base64Image: string): Promise<AiAnalysisResult> => {
  try {
    // Inizializzazione rigorosa come da documentazione
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Estrazione pulita dei dati base64
    const base64Data = base64Image.split(',')[1] || base64Image;

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
            text: "Sei un esperto di botanica e vendita al dettaglio. Analizza questa etichetta di prezzo o il cartellino di questa pianta/fiore. Estrai i seguenti dati in formato JSON: itemName (il nome della pianta o del mazzo di fiori), price (il prezzo numerico, usa il punto per i decimali), eanCode (il codice a barre EAN-13 o EAN-8 se chiaramente visibile)."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemName: { 
              type: Type.STRING,
              description: "Il nome comune o scientifico della pianta."
            },
            price: { 
              type: Type.NUMBER,
              description: "Il prezzo dell'articolo come numero decimale."
            },
            eanCode: { 
              type: Type.STRING,
              description: "Il codice EAN a 8 o 13 cifre."
            }
          },
          required: ["itemName", "price"]
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as AiAnalysisResult;
    }
    throw new Error("Nessuna risposta testuale ricevuta dal modello.");
  } catch (error) {
    console.error("Gemini Analysis Error Details:", error);
    throw error;
  }
};