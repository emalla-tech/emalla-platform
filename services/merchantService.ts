
import { Order, OrderStatus, Product, Merchant, Transaction, PaymentMethod, PaymentStatus } from '../types';

// In-memory store for the demo session
let SESSION_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Smart Watch Series 7', price: 120000, description: 'Experience the next level of connectivity.', category: '1', image: 'https://picsum.photos/id/175/400/400', images: ['https://picsum.photos/id/175/800/800', 'https://picsum.photos/id/176/800/800'], merchantId: 'MCH-05', stock: 15, status: 'active', rating: 4.8, reviewsCount: 124 },
  { id: 'p2', name: 'Premium Denim Jacket', price: 45000, description: 'Timeless style for every season.', category: '2', image: 'https://picsum.photos/id/338/400/400', images: ['https://picsum.photos/id/338/800/800', 'https://picsum.photos/id/339/800/800'], merchantId: 'MCH-05', stock: 3, status: 'active', rating: 4.5, reviewsCount: 42 },
];

/**
 * MerchantService handles all seller-specific business logic.
 */
export const MerchantService = {
  // --- AUTH & PROFILE ---
  getProfile: async (): Promise<Merchant> => {
    return {
      id: 'MCH-05',
      businessName: 'Inyange Fashion',
      email: 'contact@inyange.rw',
      phone: '0788123456',
      status: 'active',
      // Fixed: commissionRate added to Merchant type in types.ts
      commissionRate: 10,
      totalSales: 12500000,
      balance: 450000,
      joinedAt: '2023-10-12',
      documentsVerified: true
    };
  },

  /**
   * Submits a new merchant application to the system.
   */
  registerSeller: async (data: { businessName: string, category: string, phone: string }) => {
    console.log("Saving seller application to database...", data);
    
    // Simulate API network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real app, we would also trigger a transactional email here via the backend
    return {
      success: true,
      applicationId: 'APP-' + Math.floor(Math.random() * 100000),
      status: 'pending'
    };
  },

  updateSettings: async (data: any) => {
    console.log("Updating store settings", data);
    return true;
  },

  // --- INVENTORY ---
  getProducts: async (): Promise<Product[]> => {
    return [...SESSION_PRODUCTS];
  },

  saveProduct: async (productData: Partial<Product>) => {
    const newProduct: Product = {
      id: 'p' + (SESSION_PRODUCTS.length + 1) + Math.floor(Math.random() * 100),
      name: productData.name || 'Unnamed Product',
      price: productData.price || 0,
      description: productData.description || '',
      category: productData.category || '1',
      image: productData.image || 'https://picsum.photos/id/20/800/800',
      images: productData.images || [],
      merchantId: 'MCH-05',
      stock: productData.stock || 0,
      status: 'active',
      rating: 0,
      reviewsCount: 0
    };
    
    SESSION_PRODUCTS = [newProduct, ...SESSION_PRODUCTS];
    return newProduct;
  },

  // --- ORDERS & FULFILLMENT ---
  getOrders: async (): Promise<Order[]> => {
    return [
      {
        id: 'ORD-2024-001',
        orderNumber: 'EM-2024-001',
        customerId: 'USR-99',
        customerName: 'Mugisha Eric',
        merchantId: 'MCH-05',
        merchantName: 'Inyange Fashion',
        // Added subtotal property to OrderItem
        items: [{ productId: 'p1', productName: 'Smart Watch', quantity: 1, price: 120000, subtotal: 120000 }],
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.SUCCESS,
        tx_ref: 'REF-001',
        totalAmount: 120000,
        deliveryFee: 0,
        address: 'Kigali, Gasabo, KG 11 St',
        phone: '0788000000',
        paymentMethod: PaymentMethod.MOMO,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    console.log(`Order ${orderId} status changed to ${status}`);
    return true;
  },

  // --- FINANCIALS ---
  getWalletBalance: async () => {
    return {
      currentBalance: 450000,
      pendingPayouts: 120000,
      totalWithdrawn: 2800000
    };
  },

  getTransactions: async (): Promise<Transaction[]> => {
    return [
      { id: 'TXN-001', orderId: 'ORD-2024-001', amount: 108000, type: 'payment', status: 'success', method: 'Sale Proceeds (90%)', tx_ref: 'TXREF-001', timestamp: new Date().toISOString() },
      { id: 'TXN-002', orderId: 'N/A', amount: 200000, type: 'payout', status: 'pending', method: 'MTN MoMo Transfer', tx_ref: 'TXREF-002', timestamp: new Date().toISOString() }
    ];
  },

  requestPayout: async (amount: number) => {
    console.log(`Payout requested: RWF ${amount}`);
    return true;
  }
};
