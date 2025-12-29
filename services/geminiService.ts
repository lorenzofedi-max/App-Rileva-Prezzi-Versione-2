import { GoogleGenAI, Type } from "@google/genai";
import { AiAnalysisResult } from "../types.ts";

/**
 * Converte una stringa in Title Case (Prima lettera maiuscola, altre minuscole)
 */
const toTitleCase = (str: string): string => {
  if (!str) return "";
  const trimmed = str.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

export const analyzePriceTagImage = async (base64Image: string, isLive: boolean = false): Promise<AiAnalysisResult> => {
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
            text: "OCR ETICHETTA PREZZO. Estrai in JSON: itemName (Nome pianta/fiore, Title Case), price (solo numero), eanCode (13 cifre). Se mancano dati, lascia null o stringa vuota."
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
      if (parsed.itemName) parsed.itemName = toTitleCase(parsed.itemName);
      return parsed;
    }
    return {};
  } catch (error) {
    console.error("Gemini Error:", error);
    return {};
  }
};