import { Order, OrderStatus, UserRole } from '../types';
import { apiClient } from './apiClient';
import { NotificationService } from './NotificationService';

export const OrderService = {
  createOrder: async (data: Partial<Order>): Promise<Order> => {
    const response = await apiClient.createOrder(data);
    const order = response.order as Order;

    try {
      if (!order.customerId?.startsWith('GST-')) {
        await NotificationService.send({
          userId: order.customerId,
          role: UserRole.CUSTOMER,
          title: 'Order Placed!',
          message: `Your order ${order.orderNumber} is awaiting payment.`
        });
      }

      await NotificationService.send({
        userId: order.merchantId,
        role: UserRole.MERCHANT,
        title: 'New Incoming Order!',
        message: `Order ${order.orderNumber} has been placed for RWF ${order.totalAmount.toLocaleString()}.`
      });
    } catch {
      // Backend already creates the required notifications, so checkout should not fail here.
    }

    return order;
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
