import { SupportTicket, SupportTicketType } from '../types';
import { apiClient } from './apiClient';

export const SupportService = {
  getTickets: async (): Promise<SupportTicket[]> => {
    const response = await apiClient.getSupportTickets();
    return response.tickets || [];
  },

  createTicket: async (params: {
    type: SupportTicketType;
    subject: string;
    message: string;
    reason?: string;
    orderId?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }): Promise<SupportTicket> => {
    const response = await apiClient.createSupportTicket(params);
    return response.ticket as SupportTicket;
  }
};
