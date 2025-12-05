import { GoogleGenAI, Type } from "@google/genai";
import { Chapter } from "../types";

const apiKey = process.env.API_KEY || '';
// Initialize safe client - checking key presence before calls in UI
const ai = new GoogleGenAI({ apiKey });

export const generateSummary = async (content: string): Promise<string> => {
  if (!content) return "";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Please generate a concise, 2-3 sentence teaser summary for the following fiction chapter. Do not include spoilers if possible. \n\nContent:\n${content.substring(0, 10000)}`, // Limit context for speed
      config: {
        systemInstruction: "You are a professional fiction editor.",
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for speed on simple tasks
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    throw new Error("Failed to generate summary.");
  }
};

export const proofreadChapter = async (content: string): Promise<{corrected: string, notes: string}> => {
  if (!content) return { corrected: "", notes: "" };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Please act as a Beta Reader. Check the following text for grammar, spelling, and flow issues. 
      Return a JSON object with two fields: 
      1. 'corrected': The full text with corrections applied.
      2. 'notes': A brief bulleted list of the major changes or suggestions you made.
      
      Text to check:
      ${content.substring(0, 15000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            corrected: { type: Type.STRING },
            notes: { type: Type.STRING }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini Proofread Error:", error);
    throw new Error("Failed to proofread.");
  }
};