import { Order, OrderStatus, Product, Merchant, Rider, RiderApplication } from '../types';
import { apiClient } from './apiClient';
import { OrderService } from './orderService';

type DashboardStatsResponse = {
  stats: {
    totalSales: number;
    totalOrders: number;
    activeUsers: number;
    pendingOrders: number;
    pendingSellers: number;
    suspiciousSessions: number;
    revenueGrowth: number;
    salesGrowth: number;
    systemLoad: number;
  };
  chart: Array<{ name: string; revenue: number; orders: number }>;
  audit: Array<{
    id: string;
    event: string;
    actor: string;
    status: string;
    time: string;
    category?: string;
    metadata?: Record<string, unknown>;
  }>;
};

type AdminSettingsResponse = {
  settings: {
    preferences?: Record<string, boolean>;
    categoryCommissionRates?: Record<string, number>;
    updatedAt?: string;
    updatedBy?: string;
  };
};

type AdminFinanceResponse = {
  overview: {
    grossRevenue: number;
    onlineRevenue: number;
    pendingCodValue: number;
    deliveryFeesCollected: number;
    totalCommissionEarned: number;
    merchantNetRevenue: number;
    platformNetRevenue: number;
    completedPayouts: number;
    pendingPayouts: number;
    successfulOrders: number;
  };
  categoryCommission: Array<{
    categoryId: string;
    categoryName: string;
    rate: number;
    grossSales: number;
    commissionEarned: number;
    merchantNet: number;
    successfulOrders: number;
  }>;
  paymentBreakdown: Array<{
    label: string;
    method: string;
    count: number;
    value: number;
  }>;
  payoutSummary: {
    totalRequests: number;
    completedCount: number;
    pendingCount: number;
    rejectedCount: number;
  };
};

type AdminPayout = {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  method: string;
  tx_ref: string;
  timestamp: string;
  merchantName: string;
  merchantEmail: string;
  payoutMethod: string;
  payoutDestination: string;
};

type AdminEmailLog = {
  id: string;
  to: string | string[];
  subject: string;
  template?: string;
  body?: string;
  html?: string;
  sentAt: string;
  status: 'queued' | 'logged' | 'sent' | 'failed' | 'skipped';
  provider?: string;
  providerMessageId?: string | null;
  error?: string | null;
  note?: string | null;
};

type AdminEmailStatus = {
  provider: string;
  liveDeliveryReady: boolean;
  fromEmail: string;
  fromName: string;
  adminAlertEmail: string;
  issues: string[];
};

type AdminSession = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
  createdAt: string;
  lastSeenAt: string;
  userAgent?: string;
  isSuspicious: boolean;
  reasons: string[];
};

/**
 * AdminService handles platform management APIs.
 */
export const AdminService = {
  getDashboardStats: async (): Promise<DashboardStatsResponse> => {
    const response = await apiClient.getAdminStats();
    return {
      stats: response.stats,
      chart: response.chart || [],
      audit: response.audit || []
    };
  },

  getSettings: async (): Promise<AdminSettingsResponse['settings']> => {
    const response = await apiClient.getAdminSettings();
    return response.settings || {};
  },

  getFinanceSummary: async (): Promise<AdminFinanceResponse> => {
    return apiClient.getAdminFinance();
  },

  getPayouts: async (): Promise<AdminPayout[]> => {
    const response = await apiClient.getAdminPayouts();
    return response.payouts || [];
  },

  updatePayoutStatus: async (payoutId: string, status: 'success' | 'failed') => {
    const response = await apiClient.updateAdminPayoutStatus(payoutId, status);
    return response.payout;
  },

  updateSettings: async (params: { preferences?: Record<string, boolean>; categoryCommissionRates?: Record<string, number> }) => {
    const response = await apiClient.updateAdminSettings(params);
    return response.settings || {};
  },

  getOrders: async (): Promise<Order[]> => {
    return OrderService.getAllOrders();
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    await OrderService.updateOrderStatus(orderId, status);
    return true;
  },

  assignRider: async (orderId: string, riderId: string, riderName: string) => {
    await OrderService.assignRider(orderId, riderId, riderName);
    return true;
  },

  getSellers: async (): Promise<Merchant[]> => {
    const response = await apiClient.getAdminSellers();
    return response.sellers || [];
  },

  getUsers: async (status: string = 'all'): Promise<any[]> => {
    const response = await apiClient.getAdminUsers(status);
    return response.users || [];
  },

  getInquiries: async (type: string = 'all'): Promise<any[]> => {
    const response = await apiClient.getAdminInquiries(type);
    return response.inquiries || [];
  },

  getEmailLogs: async (status: string = 'all'): Promise<AdminEmailLog[]> => {
    const response = await apiClient.getAdminEmailLogs(status);
    return response.emailLogs || [];
  },

  getMonitoring: async () => {
    return apiClient.getAdminMonitoring();
  },

  getEmailStatus: async (): Promise<AdminEmailStatus> => {
    const response = await apiClient.getAdminEmailStatus();
    return response.email;
  },

  updateInquiryStatus: async (inquiryId: string, status: 'new' | 'replied' | 'resolved') => {
    const response = await apiClient.updateAdminInquiryStatus(inquiryId, status);
    return response.inquiry;
  },

  updateInquiry: async (
    inquiryId: string,
    params: { status?: 'new' | 'replied' | 'resolved'; internalNotes?: string; responseMessage?: string; assignToSelf?: boolean }
  ) => {
    const response = await apiClient.updateAdminInquiry(inquiryId, params);
    return response.inquiry;
  },

  approveSeller: async (sellerId: string) => {
    await apiClient.updateAdminSellerStatus(sellerId, 'active');
    return true;
  },

  getRiders: async (status: string = 'all'): Promise<any[]> => {
    const response = await apiClient.getAdminRiders(status);
    return response.riders || [];
  },

  getRiderApplications: async (status: string = 'all'): Promise<RiderApplication[]> => {
    const response = await apiClient.getAdminRiderApplications(status);
    return response.applications || [];
  },

  approveRiderApplication: async (applicationId: string) => {
    const response = await apiClient.approveAdminRiderApplication(applicationId);
    return response.application;
  },

  rejectRiderApplication: async (applicationId: string, reason: string) => {
    const response = await apiClient.rejectAdminRiderApplication(applicationId, reason);
    return response.application;
  },

  updateRiderStatus: async (riderId: string, status: 'active' | 'offline' | 'suspended') => {
    await apiClient.updateAdminRiderStatus(riderId, status);
    return true;
  },

  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.getAdminProducts();
    return response.products || [];
  },

  getSessions: async (role: string = 'all', suspiciousOnly: boolean = false): Promise<AdminSession[]> => {
    const response = await apiClient.getAdminSessions(role, suspiciousOnly);
    return response.sessions || [];
  },

  revokeSession: async (sessionId: string) => {
    return apiClient.revokeAdminSession(sessionId);
  },

  revokeUserSessions: async (userId: string) => {
    return apiClient.revokeAdminUserSessions(userId);
  }
};
