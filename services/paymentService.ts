
import { PaymentMethod, PaymentStatus } from '../types';

/**
 * PaymentService communicates with the E-Malla Backend API 
 * which interacts with Flutterwave.
 */
export const PaymentService = {
  /**
   * Initializes a transaction on the server and returns the Flutterwave redirect URL.
   */
  initializePayment: async (orderData: {
    orderId: string;
    amount: number;
    customerEmail: string;
    customerName: string;
    method: PaymentMethod;
  }) => {
    try {
      // In production: const response = await fetch('/api/payments/initiate', { ... })
      // For demo, we simulate the backend response with a Flutterwave-style payload
      console.log("Initializing payment for order:", orderData.orderId);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // We return a mock redirect URL that would normally point to Flutterwave
      return {
        status: 'success',
        link: 'https://checkout.flutterwave.com/v3/hosted/pay/mock-tx-' + Date.now(),
        tx_ref: `EMALLA-TX-${orderData.orderId}-${Date.now()}`
      };
    } catch (error) {
      console.error("Payment initialization failed", error);
      throw error;
    }
  },

  /**
   * Verifies payment status with the backend.
   * NEVER verify on the frontend directly with Flutterwave for security.
   */
  verifyPayment: async (tx_ref: string) => {
    try {
      // Simulate backend verification logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mocking a successful verification
      return {
        status: PaymentStatus.SUCCESS,
        amount: 208500,
        currency: 'RWF',
        id: 'FLW-MOCK-9912'
      };
    } catch (error) {
      return { status: PaymentStatus.FAILED };
    }
  }
};
