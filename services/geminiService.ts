import { GoogleGenAI, Type } from "@google/genai";
import { AiAnalysisResult } from "../types.ts";

/**
 * Analizza l'immagine dell'etichetta.
 * Ottimizzato per: Velocità, Precisione Nome, EAN e Prezzo.
 */
export const analyzePriceTagImage = async (base64Image: string): Promise<AiAnalysisResult> => {
  if (!process.env.API_KEY) {
    console.error("API KEY Mancante");
    return {};
  }

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
            text: `ESTRAI:
            1. itemName: Nome pianta/fiore.
            2. price: Solo numero finale (o 0 se assente).
            3. eanCode: Numero 8/13 cifre (o "" se assente).
            
            RISPONDI SOLO IN JSON.`
          }
        ]
      },
      config: {
        // Budget ridotto per velocità istantanea mantenendo l'accuratezza OCR
        thinkingConfig: { thinkingBudget: 1024 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemName: { type: Type.STRING },
            price: { type: Type.NUMBER },
            eanCode: { type: Type.STRING }
          },
          required: ["itemName"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    if (result.eanCode) {
      result.eanCode = result.eanCode.replace(/\D/g, '');
    }
    
    return result;
  } catch (error) {
    console.error("Errore Gemini:", error);
    return {};
  }
};