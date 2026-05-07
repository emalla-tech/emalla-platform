
import { Order, OrderStatus, Product, Merchant, Transaction, PaymentMethod, PaymentStatus } from '../types';
import { ProductService } from './productService';
import { apiClient } from './apiClient';
import { OrderService } from './orderService';

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem('emalla_user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

const getCurrentMerchantIdentity = () => {
  const user = getStoredUser();

  if (user?.role === 'MERCHANT') {
    return {
      id: user.id,
      name: user.name
    };
  }

  return null;
};

/**
 * MerchantService handles all seller-specific business logic.
 */
export const MerchantService = {
  // --- AUTH & PROFILE ---
  getProfile: async (): Promise<Merchant> => {
    const merchant = getStoredUser();
    const identity = getCurrentMerchantIdentity();
    if (!identity) {
      throw new Error('Merchant account not available.');
    }
    const orders = await OrderService.getOrdersByMerchant(identity.id);
    const wallet = await apiClient.getMerchantWallet();
    const successfulOrders = orders.filter((order) => order.paymentStatus === PaymentStatus.SUCCESS);
    const totalSales = wallet.wallet?.netRevenue ?? successfulOrders.reduce((sum, order) => sum + Math.max(order.totalAmount - order.deliveryFee, 0), 0);

    return {
      id: identity.id,
      businessName: merchant?.name || identity.name,
      email: merchant?.email || '',
      phone: merchant?.phone || '',
      status: merchant?.status || 'active',
      commissionRate: wallet.wallet?.averageCommissionRate || 0,
      totalSales,
      grossSales: wallet.wallet?.grossSales || totalSales,
      commissionAmount: wallet.wallet?.commissionAmount || 0,
      balance: wallet.wallet?.currentBalance || 0,
      joinedAt: merchant?.createdAt || new Date().toISOString(),
      documentsVerified: merchant?.status === 'active',
      supportEmail: merchant?.storeSettings?.supportEmail || merchant?.email || '',
      logoUrl: merchant?.storeSettings?.storeLogoUrl || '',
      coverUrl: merchant?.storeSettings?.storeCoverUrl || ''
    };
  },

  /**
   * Submits a new merchant application to the system.
   */
  registerSeller: async (data: {
    businessName: string;
    category: string;
    email: string;
    phone: string;
    logoUrl?: string;
    supportingDocumentUrl?: string;
  }) => {
    const response = await apiClient.createSellerApplication(data);
    return {
      success: true,
      applicationId: response.application?.id || '',
      status: response.application?.status || 'pending',
      action: response.action || 'submitted'
    };
  },

  checkSellerApplicationStatus: async (data: { email: string; phone: string }) => {
    const response = await apiClient.checkSellerApplicationStatus(data);
    return response.application || null;
  },

  updateSettings: async (data: any) => {
    const response = await apiClient.updateMerchantSettings(data);
    const current = getStoredUser();
    if (current && response.user) {
      localStorage.setItem('emalla_user', JSON.stringify(response.user));
    }
    return response.settings || {};
  },

  getSettings: async () => {
    const response = await apiClient.getMerchantSettings();
    return response.settings || {};
  },

  // --- INVENTORY ---
  getProducts: async (): Promise<Product[]> => {
    const merchant = getCurrentMerchantIdentity();
    if (!merchant) return [];
    const products = await ProductService.getProducts();
    return products.filter((product) => product.merchantId === merchant.id);
  },

  saveProduct: async (productData: Partial<Product>) => {
    const merchant = getCurrentMerchantIdentity();
    if (!merchant) {
      throw new Error('Merchant account not available.');
    }
    return ProductService.saveProduct({
      ...productData,
      merchantId: merchant.id,
      merchantName: merchant.name
    });
  },

  updateProduct: async (productId: string, updates: Partial<Product>) => {
    return ProductService.updateProduct(productId, updates);
  },

  deleteProduct: async (productId: string) => {
    return ProductService.deleteProduct(productId);
  },

  // --- ORDERS & FULFILLMENT ---
  getOrders: async (): Promise<Order[]> => {
    const merchant = getCurrentMerchantIdentity();
    if (!merchant) return [];
    return OrderService.getOrdersByMerchant(merchant.id);
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    await OrderService.updateOrderStatus(orderId, status);
    return true;
  },

  // --- FINANCIALS ---
  getWalletBalance: async () => {
    const response = await apiClient.getMerchantWallet();
    return response.wallet;
  },

  getTransactions: async (): Promise<Transaction[]> => {
    const response = await apiClient.getMerchantWallet();
    return response.transactions || [];
  },

  requestPayout: async (amount: number) => {
    await apiClient.requestMerchantPayout(amount);
    return true;
  }
};
