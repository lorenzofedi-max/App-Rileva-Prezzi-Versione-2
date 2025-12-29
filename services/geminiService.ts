import { GoogleGenAI, Type } from "@google/genai";
import { AiAnalysisResult } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePriceTagImage = async (base64Image: string): Promise<AiAnalysisResult> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: "Analizza questa etichetta di prezzo. Estrai: 1. Nome specifico prodotto (es. 'Orchidea Phalaenopsis'). 2. Prezzo (numero). 3. Codice EAN/Barcode se visibile."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
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

    if (response.text) {
      return JSON.parse(response.text) as AiAnalysisResult;
    }
    throw new Error("Nessuna risposta dall'AI");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};