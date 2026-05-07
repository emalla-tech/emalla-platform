import { apiUrl } from './apiConfig';

const postJson = async (path: string, payload: Record<string, unknown>) => {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'AI request failed');
  }

  return data;
};

export const geminiService = {
  generateDescription: async (productName: string, category: string) => {
    try {
      const data = await postJson('/ai/generate-description', {
        productName,
        category
      });
      return String(data.text || 'Unable to generate description at this time.');
    } catch (error) {
      console.error('Gemini description error:', error);
      return 'Unable to generate description at this time.';
    }
  },

  summarizeReviews: async (reviews: string[]) => {
    try {
      const data = await postJson('/ai/summarize-reviews', {
        reviews
      });
      return String(data.text || 'Review summary unavailable.');
    } catch (error) {
      console.error('Gemini summary error:', error);
      return 'Review summary unavailable.';
    }
  }
};
