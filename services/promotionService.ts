import { apiUrl } from './apiConfig';

export interface FirstOrderDeliveryPromotion {
  code: string;
  title: string;
  startAt: string;
  endAt: string;
  maxDiscount: number;
  eligibleDistricts: string[];
  active: boolean;
}

export interface DeliveryPromotionPreview extends FirstOrderDeliveryPromotion {
  eligible: boolean;
  reason: string;
  baseDeliveryFee: number;
  discount: number;
  deliveryFee: number;
}

const request = async (path: string, init?: RequestInit) => {
  const token = localStorage.getItem('emalla_token');
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Promotion service is currently unavailable.');
  }
  return data;
};

export const promotionService = {
  async getFirstOrderDeliveryPromotion(): Promise<FirstOrderDeliveryPromotion> {
    const data = await request('/promotions/first-order-delivery');
    return data.promotion as FirstOrderDeliveryPromotion;
  },

  async previewFirstOrderDelivery(input: {
    subtotal: number;
    email: string;
    phone: string;
    district: string;
    address?: string;
  }): Promise<DeliveryPromotionPreview> {
    const data = await request('/promotions/first-order-delivery/preview', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    return data.preview as DeliveryPromotionPreview;
  }
};
