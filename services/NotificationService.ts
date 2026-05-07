import { Notification, NotificationType, UserRole } from '../types';
import { apiClient } from './apiClient';

export const NotificationService = {
  async send(params: {
    userId: string;
    role: UserRole;
    title: string;
    message: string;
    type?: NotificationType;
    metadata?: any;
    channels?: ('in-app' | 'email' | 'sms')[];
  }): Promise<Notification> {
    const response = await apiClient.createNotification(params);
    window.dispatchEvent(new CustomEvent('emalla_notifications_updated'));
    return response.notification as Notification;
  },

  async sendToRole(role: UserRole, title: string, message: string, type: NotificationType = NotificationType.INFO) {
    return NotificationService.send({
      userId: `broadcast_${role}`,
      role,
      title,
      message,
      type
    });
  },

  async getUserNotifications(userId: string, role?: UserRole): Promise<Notification[]> {
    const response = await apiClient.getNotifications();
    const all = (response.notifications || []) as Notification[];
    return all.filter(
      (notification) =>
        (notification.userId === userId || notification.userId === `broadcast_${notification.role}`) &&
        (!role || notification.role === role)
    );
  },

  async getUnreadCount(userId: string, role?: UserRole): Promise<number> {
    const notifications = await NotificationService.getUserNotifications(userId, role);
    return notifications.filter((notification) => !notification.read).length;
  },

  async markAsRead(id: string) {
    await apiClient.markNotificationRead(id);
    window.dispatchEvent(new CustomEvent('emalla_notifications_updated'));
  },

  async markAllAsRead() {
    await apiClient.markAllNotificationsRead();
    window.dispatchEvent(new CustomEvent('emalla_notifications_updated'));
  },

  async deleteNotification(id: string) {
    await apiClient.deleteNotification(id);
    window.dispatchEvent(new CustomEvent('emalla_notifications_updated'));
  }
};
