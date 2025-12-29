import { GoogleGenAI, Type } from "@google/genai";
import { AiAnalysisResult } from "../types.ts";

/**
 * Converte una stringa in Title Case (Prima lettera maiuscola, altre minuscole)
 */
const toTitleCase = (str: string): string => {
  if (!str) return "";
  return str.trim().charAt(0).toUpperCase() + str.trim().slice(1).toLowerCase();
};

export const analyzePriceTagImage = async (base64Image: string, isLive: boolean = false): Promise<AiAnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Pulizia base64
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
            text: isLive 
              ? "ESTRAZIONE RAPIDA ETICHETTA. Trova itemName, price (solo numero), eanCode. IMPORTANTE: Restituisci itemName con la PRIMA LETTERA MAIUSCOLA e le altre minuscole (esempio: 'Begonia'). Se i dati sono incerti, restituisci JSON vuoto {}."
              : "Analizza questa etichetta botanica. Estrai itemName (Title Case: Es. 'Orchidea phalaenopsis'), price (numero), eanCode in JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemName: { type: Type.STRING },
            price: { type: Type.NUMBER },
            eanCode: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text) as AiAnalysisResult;
      // Validazione e formattazione extra lato client per sicurezza
      if (parsed.itemName) {
        parsed.itemName = toTitleCase(parsed.itemName);
      }
      
      if (!parsed.itemName && !parsed.price) return {};
      return parsed;
    }
    return {};
  } catch (error) {
    console.error("Gemini Error:", error);
    return {};
  }
};