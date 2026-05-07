import { User, UserRole } from '../types';
import { apiClient } from './apiClient';

export const authService = {
  login: async (email: string, password: string) => apiClient.login(email, password),

  register: async (params: { name: string; email: string; password: string; role: UserRole }) =>
    apiClient.register(params),

  verifyToken: async (token: string): Promise<User> => {
    const response = await apiClient.verifyToken(token);
    return response.user;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<User> => {
    const response = await apiClient.changePassword(currentPassword, newPassword);
    return response.user;
  },

  requestPasswordReset: async (email: string) => {
    return apiClient.requestPasswordReset(email);
  },

  resetPassword: async (token: string, password: string): Promise<User> => {
    const response = await apiClient.resetPassword(token, password);
    return response.user;
  },

  getSessions: async () => {
    const response = await apiClient.getSessions();
    return response.sessions || [];
  },

  logoutCurrentSession: async () => {
    return apiClient.logoutCurrentSession();
  },

  logoutAllSessions: async () => {
    return apiClient.logoutAllSessions();
  }
};
