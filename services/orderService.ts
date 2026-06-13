import { Order, OrderStatus } from '../types';
import { apiClient } from './apiClient';

export const OrderService = {
  createOrder: async (data: Partial<Order>): Promise<Order> => {
    const response = await apiClient.createOrder(data);
    // The order endpoint persists customer and merchant notifications atomically.
    return response.order as Order;
  },

  getAllOrders: async (): Promise<Order[]> => {
    const response = await apiClient.getOrders();
    return response.orders || [];
  },

  getOrderPool: async (): Promise<Order[]> => {
    const response = await apiClient.getOrderPool();
    return response.orders || [];
  },

  getOrdersByMerchant: async (merchantId: string): Promise<Order[]> => {
    const orders = await OrderService.getAllOrders();
    return orders.filter((order) => order.merchantId === merchantId);
  },

  getOrdersByRider: async (riderId: string): Promise<Order[]> => {
    const orders = await OrderService.getAllOrders();
    return orders.filter((order) => order.riderId === riderId);
  },

  getOrdersByCustomer: async (customerId: string): Promise<Order[]> => {
    const orders = await OrderService.getAllOrders();
    return orders.filter((order) => order.customerId === customerId);
  },

  updateOrderStatus: async (orderId: string, nextStatus: OrderStatus): Promise<boolean> => {
    await apiClient.updateOrderStatus(orderId, nextStatus);
    return true;
  },

  confirmReceived: async (orderId: string, options?: { email?: string; phone?: string }): Promise<Order> => {
    const response = await apiClient.confirmOrderReceived(orderId, options);
    return response.order as Order;
  },

  assignRider: async (orderId: string, riderId: string, riderName: string): Promise<boolean> => {
    await apiClient.assignRider(orderId, riderId, riderName);
    return true;
  },

  cancelOrder: async (orderId: string, options?: { email?: string; phone?: string }): Promise<boolean> => {
    await apiClient.cancelOrder(orderId, options);
    return true;
  },

  getOrderById: async (id: string, options?: { email?: string; phone?: string }) => {
    try {
      const response = await apiClient.getOrder(id, options);
      return response.order as Order;
    } catch {
      return null;
    }
  }
};
