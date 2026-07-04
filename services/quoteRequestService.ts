import { ProductQuoteRequest } from '../types';
import { apiUrl } from './apiConfig';

export interface CreateQuoteRequestInput {
  productId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  quantity: number;
  message?: string;
}

export const quoteRequestService = {
  async create(input: CreateQuoteRequestInput): Promise<ProductQuoteRequest> {
    const token = localStorage.getItem('emalla_token');
    const response = await fetch(apiUrl('/quote-requests'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(input)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Unable to send your price request right now.');
    }

    return data.quoteRequest as ProductQuoteRequest;
  }
};
