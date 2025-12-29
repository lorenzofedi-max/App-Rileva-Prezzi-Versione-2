import { GoogleGenAI, Type } from "@google/genai";
import { AiAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePriceTagImage = async (base64Image: string): Promise<AiAnalysisResult> => {
  try {
    // Remove data URL prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: "Analyze this image of a shelf price tag or product label. Extract the following information: 1. The specific product name (e.g. 'Orchidea Phalaenopsis', 'Rose Bouquet'). 2. The price as a number. 3. The Barcode/EAN numbers if clearly visible. If you cannot find a field, leave it null."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemName: { type: Type.STRING, description: "Name of the plant or flower" },
            price: { type: Type.NUMBER, description: "Price value" },
            eanCode: { type: Type.STRING, description: "EAN or Barcode numbers" }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AiAnalysisResult;
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
