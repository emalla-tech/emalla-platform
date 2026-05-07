import { Order, OrderStatus, Rider, Transaction } from '../types';
import { apiClient } from './apiClient';
import { OrderService } from './orderService';

const getStoredRiderId = () => {
  try {
    const rawUser = localStorage.getItem('emalla_user');
    const user = rawUser ? JSON.parse(rawUser) : null;
    return user?.role === 'DELIVERY' ? user.id : null;
  } catch {
    return null;
  }
};

export const RiderService = {
  getProfile: async (): Promise<Rider> => {
    const response = await apiClient.getRiderProfile();
    return response.rider;
  },

  registerApplication: async (params: {
    name: string;
    email: string;
    phone: string;
    vehicleNumber: string;
  }) => {
    const response = await apiClient.createRiderApplication(params);
    return {
      success: true,
      applicationId: response.application?.id || '',
      status: response.application?.status || 'pending',
      action: response.action || 'submitted'
    };
  },

  checkApplicationStatus: async (params: { email: string; phone: string }) => {
    const response = await apiClient.checkRiderApplicationStatus(params);
    return response.application || null;
  },

  updateProfile: async (params: {
    phone: string;
    mobileMoneyNumber?: string;
    vehicleNumber?: string;
    emergencyContact?: string;
  }): Promise<Rider> => {
    const response = await apiClient.updateRiderProfile(params);
    if (response.user) {
      localStorage.setItem('emalla_user', JSON.stringify(response.user));
    }
    return response.rider;
  },

  toggleStatus: async (isOnline: boolean) => {
    await apiClient.updateRiderStatus(isOnline);
    return true;
  },

  getAssignedDeliveries: async (): Promise<Order[]> => {
    const riderId = getStoredRiderId();
    if (!riderId) return [];
    return OrderService.getOrdersByRider(riderId);
  },

  getAvailablePool: async (): Promise<Order[]> => {
    return OrderService.getOrderPool();
  },

  updateDeliveryStatus: async (orderId: string, status: OrderStatus) => {
    await OrderService.updateOrderStatus(orderId, status);
    return true;
  },

  getEarningsSummary: async () => {
    const response = await apiClient.getRiderWallet();
    return response.summary;
  },

  getTransactions: async (): Promise<Transaction[]> => {
    const response = await apiClient.getRiderWallet();
    return response.transactions || [];
  }
};
