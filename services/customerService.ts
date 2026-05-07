import { Address, Order, OrderStatus, Product, ProductReview } from '../types';
import { OrderService } from './orderService';
import { apiClient } from './apiClient';
import { ProductService } from './productService';

/**
 * CustomerService handles all buyer-centric data operations.
 */
export const CustomerService = {
  getDashboardSummary: async () => {
    const rawUser = localStorage.getItem('emalla_user');
    const user = rawUser ? JSON.parse(rawUser) : null;
    const liveOrders = user ? await OrderService.getOrdersByCustomer(user.id) : [];
    const activeOrders = liveOrders.filter(
      (order) => ![OrderStatus.CANCELLED, OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(order.status)
    );
    const mostRecent = liveOrders[0];
    const successfulOrders = liveOrders.filter((order) => order.paymentStatus === 'SUCCESS');
    const pointsBalance = successfulOrders.reduce(
      (sum, order) => sum + Math.floor((order.totalAmount || 0) / 1000),
      0
    );
    const getEta = () => {
      if (!mostRecent) return 'No active delivery';
      if ([OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(mostRecent.status)) return 'Delivered';
      if (mostRecent.status === OrderStatus.ON_THE_WAY) return 'En route';
      if (mostRecent.status === OrderStatus.PREPARING) return 'Preparing order';
      if (mostRecent.status === OrderStatus.PENDING_PAYMENT) return 'Waiting for payment';
      return 'Processing';
    };

    return {
      totalOrders: liveOrders.length,
      pendingDeliveries: activeOrders.length,
      wishlistCount: (await apiClient.getWishlist()).wishlist?.length || 0,
      pointsBalance,
      recentOrder: {
        id: mostRecent?.id || '',
        orderNumber: mostRecent?.orderNumber || 'No recent order',
        status: mostRecent?.status || null,
        eta: getEta()
      }
    };
  },

  getAddresses: async (): Promise<Address[]> => {
    const response = await apiClient.getAddresses();
    return response.addresses || [];
  },

  saveAddress: async (address: { name: string; district: string; sector: string; street: string }) => {
    const response = await apiClient.createAddress(address);
    return response.address as Address;
  },

  updateAddress: async (addressId: string, address: { name: string; district: string; sector: string; street: string }) => {
    const response = await apiClient.updateAddress(addressId, address);
    return response.address as Address;
  },

  deleteAddress: async (addressId: string) => {
    await apiClient.deleteAddress(addressId);
    return true;
  },

  setDefaultAddress: async (addressId: string) => {
    await apiClient.setDefaultAddress(addressId);
    return true;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const rawUser = localStorage.getItem('emalla_user');
    const user = rawUser ? JSON.parse(rawUser) : null;
    return user ? OrderService.getOrdersByCustomer(user.id) : [];
  },

  getWishlist: async (): Promise<Product[]> => {
    const [wishlistResponse, products] = await Promise.all([
      apiClient.getWishlist(),
      ProductService.getProducts()
    ]);
    const wishlistItems = wishlistResponse.wishlist || [];
    const productIds = new Set(wishlistItems.map((entry: { productId: string }) => entry.productId));
    return products.filter((product) => productIds.has(product.id));
  },

  toggleWishlist: async (productId: string, isWishlisted: boolean) => {
    if (isWishlisted) {
      await apiClient.removeFromWishlist(productId);
    } else {
      await apiClient.addToWishlist(productId);
    }
    return true;
  },

  getWishlistProductIds: async (): Promise<string[]> => {
    const response = await apiClient.getWishlist();
    return (response.wishlist || []).map((entry: { productId: string }) => entry.productId);
  },

  getProductReviews: async (productId: string): Promise<ProductReview[]> => {
    const response = await apiClient.getProductReviews(productId);
    return response.reviews || [];
  },

  submitReview: async (productId: string, rating: number, comment: string) => {
    const response = await apiClient.submitProductReview(productId, rating, comment);
    return response.review as ProductReview;
  }
};
