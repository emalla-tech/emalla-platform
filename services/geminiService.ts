
import { GoogleGenAI } from "@google/genai";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Generates a creative product description based on name and category.
   */
  generateDescription: async (productName: string, category: string) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a compelling, SEO-friendly e-commerce description for a product named "${productName}" in the category "${category}". Keep it concise and professional. Highlight features that would appeal to Rwandan customers.`,
        config: {
          temperature: 0.7,
          topP: 0.9,
        }
      });
      // The GenerateContentResponse features a text property (not a method).
      return response.text;
    } catch (error) {
      console.error("Gemini description error:", error);
      return "Unable to generate description at this time.";
    }
  },

  /**
   * Summarizes customer reviews for a quick overview.
   */
  summarizeReviews: async (reviews: string[]) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize the following customer reviews into a single paragraph highlighting the pros and cons: ${reviews.join(' | ')}`,
        config: {
          temperature: 0.5,
        }
      });
      // The GenerateContentResponse features a text property (not a method).
      return response.text;
    } catch (error) {
      console.error("Gemini summary error:", error);
      return "Review summary unavailable.";
    }
  }
};
