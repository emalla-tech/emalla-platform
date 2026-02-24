
import { Order, OrderStatus, Rider, Transaction, PaymentMethod, PaymentStatus } from '../types';

/**
 * RiderService handles the high-velocity logistics operations for delivery agents.
 */
export const RiderService = {
  // --- RIDER PROFILE & STATUS ---
  getProfile: async (): Promise<Rider> => {
    return {
      id: 'RID-01',
      name: 'Nizeyimana Eric',
      phone: '078111222',
      status: 'available',
      vehicleNumber: 'RE 123 A',
      rating: 4.8,
      totalDeliveries: 450,
      earnings: 1200000
    };
  },

  toggleStatus: async (isOnline: boolean) => {
    console.log(`Rider status set to: ${isOnline ? 'online' : 'offline'}`);
    return true;
  },

  // --- DELIVERY OPERATIONS ---
  getAssignedDeliveries: async (): Promise<Order[]> => {
    return [
      {
        id: 'ORD-892',
        orderNumber: 'EM-2024-892',
        customerId: 'USR-01',
        customerName: 'Mugisha Jean',
        merchantId: 'MCH-05',
        merchantName: 'Inyange Fashion',
        // Added subtotal property to OrderItem
        items: [{ productId: 'p1', productName: 'Smart Watch', quantity: 1, price: 120000, subtotal: 120000 }],
        // Fixed: Use correct enum value for PROCESSING
        status: OrderStatus.PROCESSING,
        paymentStatus: PaymentStatus.SUCCESS,
        tx_ref: 'REF-892',
        totalAmount: 120000,
        deliveryFee: 1500,
        address: 'Gasabo, Kimironko, KG 123 St',
        phone: '0788000000',
        // Corrected enum assignment
        paymentMethod: PaymentMethod.MOMO,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  },

  getAvailablePool: async (): Promise<Order[]> => {
    return [
      {
        id: 'ORD-901',
        orderNumber: 'EM-2024-901',
        customerId: 'USR-55',
        customerName: 'Mutoni Alice',
        merchantId: 'MCH-10',
        merchantName: 'Kigali Grocery',
        // Added subtotal property to OrderItem
        items: [{ productId: 'p8', productName: 'Fresh Groceries', quantity: 1, price: 15000, subtotal: 15000 }],
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.SUCCESS,
        tx_ref: 'REF-901',
        totalAmount: 15000,
        deliveryFee: 1500,
        address: 'Nyarugenge, KN 2 Rd',
        phone: '0788000002',
        // Corrected enum assignment
        paymentMethod: PaymentMethod.MOMO,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  },

  updateDeliveryStatus: async (orderId: string, status: OrderStatus) => {
    console.log(`Order ${orderId} moved to ${status}`);
    return true;
  },

  // --- WALLET ---
  getEarningsSummary: async () => {
    return {
      today: 8500,
      week: 45000,
      walletBalance: 125000,
      pendingClearance: 12000
    };
  }
};
