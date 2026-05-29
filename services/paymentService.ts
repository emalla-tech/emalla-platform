import { PaymentMethod, PaymentVerificationResult } from '../types';
import { apiClient } from './apiClient';

export const PaymentService = {
  initializePayment: async (orderData: {
    orderId: string;
    amount: number;
    customerEmail: string;
    customerName: string;
    method: PaymentMethod;
  }) => {
    return apiClient.initiatePayment(orderData);
  },

  verifyPayment: async (tx_ref: string, options?: { orderId?: string; email?: string }): Promise<PaymentVerificationResult> => {
    return apiClient.verifyPayment(tx_ref, options);
  }
};
