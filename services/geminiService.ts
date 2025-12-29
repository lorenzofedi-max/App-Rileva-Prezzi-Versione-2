import { GoogleGenAI, Type } from "@google/genai";
import { AiAnalysisResult } from "../types.ts";

// Utilizziamo una funzione per ottenere l'istanza AI solo quando serve,
// garantendo che process.env sia popolato correttamente dal sistema.
const getAiInstance = () => {
  const apiKey = (window as any).process?.env?.API_KEY || "";
  return new GoogleGenAI({ apiKey });
};

export const analyzePriceTagImage = async (base64Image: string): Promise<AiAnalysisResult> => {
  try {
    const ai = getAiInstance();
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
            text: "Analizza questa etichetta di prezzo di una pianta o mazzo di fiori. Estrai in JSON: itemName (nome prodotto), price (solo numero), eanCode (codice a barre se presente)."
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
    throw new Error("Risposta vuota dall'AI");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};