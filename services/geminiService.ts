
import { GoogleGenAI } from "@google/genai";

// Fix: Refactored to initialize GoogleGenAI correctly and follow modern SDK usage patterns
export async function getTutorResponse(prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  try {
    // Always use named parameters for initialization and fetch key from environment
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-pro-preview for complex reasoning tasks like mechatronics tutoring
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: "Eres 'TuVir', un tutor experto en Mecatrónica de la Universitaria de Colombia. Tu objetivo es ayudar a los estudiantes con conceptos de robótica, electrónica, programación (C++, Python), y diseño mecánico. Eres amable, técnico pero claro, y fomentas el pensamiento crítico. Si el estudiante te hace una pregunta fuera de mecatrónica, redirígelo gentilmente a temas de ingeniería.",
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    });

    // Directly access the text property as per guidelines
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Lo siento, tuve un problema procesando tu consulta técnica. ¿Podrías intentar de nuevo?";
  }
}
