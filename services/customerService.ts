
import { Order, OrderStatus, Product, User, Transaction, PaymentMethod, PaymentStatus } from '../types';

/**
 * CustomerService handles all buyer-centric data operations.
 */
export const CustomerService = {
  // --- DASHBOARD & STATS ---
  getDashboardSummary: async () => {
    return {
      totalOrders: 12,
      pendingDeliveries: 1,
      wishlistCount: 5,
      pointsBalance: 1250,
      recentOrder: {
        id: 'ORD-892',
        // Fixed: OrderStatus.OUT_FOR_DELIVERY exists after update to types.ts
        status: OrderStatus.OUT_FOR_DELIVERY,
        eta: '7:00 PM Today'
      }
    };
  },

  // --- ADDRESS BOOK ---
  getAddresses: async () => {
    return [
      { id: 'addr-1', name: 'Home', district: 'Gasabo', sector: 'Kimironko', street: 'KG 123 St, House 10', isDefault: true },
      { id: 'addr-2', name: 'Work', district: 'Nyarugenge', sector: 'Kigali City Tower', street: 'KN 2 Rd, Level 5', isDefault: false }
    ];
  },

  // --- ORDERS ---
  getMyOrders: async (): Promise<Order[]> => {
    return [
      {
        id: 'ORD-892',
        orderNumber: 'EM-2024-892',
        customerId: 'USR-01',
        customerName: 'Mugisha Jean',
        merchantId: 'MCH-05',
        merchantName: 'Inyange Fashion',
        // Added subtotal property to OrderItem
        items: [{ productId: 'p1', productName: 'Smart Watch Series 7', quantity: 1, price: 120000, subtotal: 120000 }],
        // Fixed: Use correct enum value
        status: OrderStatus.OUT_FOR_DELIVERY,
        paymentStatus: PaymentStatus.SUCCESS,
        tx_ref: 'REF-892',
        totalAmount: 123500, // Including delivery
        deliveryFee: 3500,
        // Corrected enum assignment
        paymentMethod: PaymentMethod.MOMO,
        address: 'Gasabo, Kimironko, KG 123 St',
        phone: '0788000000',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ORD-850',
        orderNumber: 'EM-2024-850',
        customerId: 'USR-01',
        customerName: 'Mugisha Jean',
        merchantId: 'MCH-12',
        merchantName: 'Kigali Tech Hub',
        // Added subtotal property to OrderItem
        items: [{ productId: 'p2', productName: 'Wireless Headphones', quantity: 1, price: 85000, subtotal: 85000 }],
        status: OrderStatus.DELIVERED,
        paymentStatus: PaymentStatus.SUCCESS,
        tx_ref: 'REF-850',
        totalAmount: 88500,
        deliveryFee: 3500,
        // Corrected enum assignment
        paymentMethod: PaymentMethod.CARD,
        address: 'Gasabo, Kimironko, KG 123 St',
        phone: '0788000000',
        createdAt: '2024-05-10T14:30:00Z',
        updatedAt: '2024-05-10T14:30:00Z'
      }
    ];
  },

  // --- WISHLIST ---
  getWishlist: async (): Promise<Product[]> => {
    return [
      { id: 'p7', name: 'Organic Arabica Coffee', price: 12000, description: '...', category: '4', image: 'https://picsum.photos/id/425/400/400', merchantId: 'MCH-咖啡', stock: 50, status: 'active', rating: 5.0, reviewsCount: 210 }
    ];
  },

  // --- REVIEWS ---
  submitReview: async (productId: string, rating: number, comment: string) => {
    console.log(`Review submitted for ${productId}: ${rating} stars - ${comment}`);
    return true;
  }
};
