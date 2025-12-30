import { GoogleGenAI, Type } from "@google/genai";
import { AiAnalysisResult } from "../types.ts";

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
            text: "JSON: {itemName, price(num), eanCode}"
          }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 0 },
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
    return text ? (JSON.parse(text) as AiAnalysisResult) : {};
  } catch (error) {
    console.error("Errore AI:", error);
    return {};
  }
};