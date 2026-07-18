import { apiClient } from './apiClient';

export const InquiryService = {
  submitContact: async (params: { name: string; email: string; subject: string; message: string }) => {
    return apiClient.submitContactForm(params);
  },

  submitInvestorInquiry: async (params: { name: string; email: string; company: string; message: string }) => {
    return apiClient.submitInvestorInquiry(params);
  },

  submitAffiliateApplication: async (params: {
    name: string;
    email: string;
    phone: string;
    partnerType: string;
    preferredCode?: string;
    channel: string;
    audienceSize?: string;
    message: string;
    referralLinkPreview?: string;
  }) => {
    return apiClient.submitAffiliateApplication(params);
  }
};
