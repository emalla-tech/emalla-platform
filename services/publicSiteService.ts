import { apiClient } from './apiClient';

type PublicInsights = {
  metrics: {
    verifiedMerchants: number;
    totalMerchants: number;
    activeRiders: number;
    customerAccounts: number;
    successfulOrders: number;
    completedOrders: number;
    grossRevenue: number;
    averageDeliveryFee: number;
    districtsCovered: number;
    pendingSellerApplications: number;
    orderGrowth: number;
  };
};

const emptyInsights: PublicInsights = {
  metrics: {
    verifiedMerchants: 0,
    totalMerchants: 0,
    activeRiders: 0,
    customerAccounts: 0,
    successfulOrders: 0,
    completedOrders: 0,
    grossRevenue: 0,
    averageDeliveryFee: 0,
    districtsCovered: 30,
    pendingSellerApplications: 0,
    orderGrowth: 0
  }
};

export const PublicSiteService = {
  getInsights: async (): Promise<PublicInsights> => {
    try {
      const response = await apiClient.getPublicInsights();
      return response || emptyInsights;
    } catch {
      return emptyInsights;
    }
  }
};
