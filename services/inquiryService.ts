import { apiClient } from './apiClient';

export const InquiryService = {
  submitContact: async (params: { name: string; email: string; subject: string; message: string }) => {
    return apiClient.submitContactForm(params);
  },

  submitInvestorInquiry: async (params: { name: string; email: string; company: string; message: string }) => {
    return apiClient.submitInvestorInquiry(params);
  }
};
