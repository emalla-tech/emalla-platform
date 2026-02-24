
import { Order, OrderStatus, Product, User, Merchant, Rider, Transaction, PaymentMethod, PaymentStatus } from '../types';

/**
 * AdminService handles all platform management logic.
 */
export const AdminService = {
  // --- ANALYTICS ---
  getDashboardStats: async () => {
    return {
      totalSales: 45200000, // RWF
      totalOrders: 1240,
      activeUsers: 8500,
      pendingOrders: 42,
      pendingSellers: 12,
      revenueGrowth: 15.4,
      salesGrowth: 8.2
    };
  },

  // --- ORDER MANAGEMENT ---
  getOrders: async (filters?: any): Promise<Order[]> => {
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
        deliveryFee: 0,
        address: 'Kigali, Gasabo, KG 123 St',
        phone: '0788000000',
        paymentMethod: PaymentMethod.MOMO,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'ORD-893',
        orderNumber: 'EM-2024-893',
        customerId: 'USR-02',
        customerName: 'Uwase Aline',
        merchantId: 'MCH-12',
        merchantName: 'Kigali Tech Hub',
        // Added subtotal property to OrderItem
        items: [{ productId: 'p2', productName: 'Headphones', quantity: 1, price: 85000, subtotal: 85000 }],
        // Fixed: Use correct enum value for PENDING
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        tx_ref: 'REF-893',
        totalAmount: 85000,
        deliveryFee: 0,
        address: 'Huye, Taba, Street 4',
        phone: '0788000001',
        paymentMethod: PaymentMethod.CARD,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    console.log(`Updating ${orderId} to ${status}`);
    return true;
  },

  assignRider: async (orderId: string, riderId: string) => {
    console.log(`Assigning rider ${riderId} to order ${orderId}`);
    return true;
  },

  // --- SELLER MANAGEMENT ---
  getSellers: async (): Promise<Merchant[]> => {
    return [
      {
        id: 'MCH-05',
        businessName: 'Inyange Fashion',
        email: 'contact@inyange.rw',
        phone: '0788123456',
        status: 'active',
        commissionRate: 10,
        totalSales: 12500000,
        balance: 450000,
        joinedAt: '2023-10-12',
        documentsVerified: true
      },
      {
        id: 'MCH-06',
        businessName: 'Kigali Crafts',
        email: 'info@kigalicrafts.rw',
        phone: '0788654321',
        status: 'pending',
        commissionRate: 12,
        totalSales: 0,
        balance: 0,
        joinedAt: '2024-05-15',
        documentsVerified: false
      }
    ];
  },

  approveSeller: async (sellerId: string) => {
    console.log(`Seller ${sellerId} approved.`);
    return true;
  },

  // --- LOGISTICS ---
  getRiders: async (): Promise<Rider[]> => {
    return [
      { id: 'RID-01', name: 'Nizeyimana Eric', phone: '078111222', status: 'available', vehicleNumber: 'RE 123 A', rating: 4.8, totalDeliveries: 450, earnings: 1200000 },
      { id: 'RID-02', name: 'Kamanzi Paul', phone: '078333444', status: 'busy', vehicleNumber: 'RA 987 B', rating: 4.5, totalDeliveries: 312, earnings: 850000 }
    ];
  },

  // --- PRODUCT MANAGEMENT ---
  getProducts: async (): Promise<Product[]> => {
    return [
      { id: 'p1', name: 'Smart Watch Series 7', price: 120000, description: '...', category: 'Electronics', image: 'https://picsum.photos/id/175/400/400', merchantId: 'MCH-05', merchantName: 'Inyange Fashion', stock: 15, status: 'active', rating: 4.8, reviewsCount: 124 },
      { id: 'p14', name: 'Woven Basket', price: 12000, description: '...', category: 'Home', image: 'https://picsum.photos/id/475/400/400', merchantId: 'MCH-06', merchantName: 'Kigali Crafts', stock: 5, status: 'pending', rating: 5.0, reviewsCount: 12 }
    ];
  }
};
