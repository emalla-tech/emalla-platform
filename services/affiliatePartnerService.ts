import { apiClient } from './apiClient';

export type AffiliatePartnerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  itemCount: number;
  commissionAmount: number;
  commissionStatus: 'pending_review' | 'eligible' | 'paid' | 'not_applicable';
  createdAt: string;
  updatedAt: string;
};

export type AffiliatePartnerDashboard = {
  affiliate: {
    name: string;
    email: string;
    phone: string;
    partnerType: string;
    channel: string;
    code: string;
    referralLink: string;
    shopReferralLink: string;
    status: string;
    approvedAt: string;
  };
  summary: {
    commissionRate: number;
    attributedOrders: number;
    eligibleOrders: number;
    pendingOrders: number;
    attributedRevenue: number;
    eligibleCommission: number;
    pendingCommission: number;
    paidCommission: number;
  };
  orders: AffiliatePartnerOrder[];
};

export const AffiliatePartnerService = {
  getDashboard: async (params: { email: string; code: string }): Promise<AffiliatePartnerDashboard> => {
    const response = await apiClient.getAffiliateDashboard(params);
    return response.dashboard;
  }
};
