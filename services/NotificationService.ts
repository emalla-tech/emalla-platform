
import { Notification, NotificationType, UserRole } from '../types';

const STORAGE_KEY = 'emalla_notifications_db';

/**
 * NotificationService: The communication backbone of E-Malla.
 */
export const NotificationService = {

  _loadNotifications: (): Notification[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Corrupted notification DB", e);
      return [];
    }
  },

  _saveNotifications: (notifs: Notification[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
    // Dispatch custom event for real-time UI updates
    window.dispatchEvent(new CustomEvent('emalla_notifications_updated'));
  },

  /**
   * Sends a targeted notification to a user.
   */
  send: async (params: {
    userId: string;
    role: UserRole;
    title: string;
    message: string;
    type?: NotificationType;
    metadata?: any;
    channels?: ('in-app' | 'email' | 'sms')[];
  }): Promise<Notification> => {
    const notifications = NotificationService._loadNotifications();
    const type = params.type || NotificationType.INFO;
    const channels = params.channels || ['in-app'];

    const newNotif: Notification = {
      id: 'nt-' + Date.now() + Math.random().toString(36).substr(2, 5),
      userId: params.userId,
      role: params.role,
      title: params.title,
      message: params.message,
      type: type,
      read: false,
      createdAt: new Date().toISOString(),
      metadata: params.metadata
    };

    if (channels.includes('in-app')) {
      const updated = [newNotif, ...notifications];
      NotificationService._saveNotifications(updated);
    }

    if (channels.includes('email')) {
      NotificationService.sendEmail(params.userId, params.title, params.message);
    }

    if (channels.includes('sms')) {
      NotificationService.sendSMS(params.userId, params.message);
    }

    return newNotif;
  },

  /**
   * Send a broadcast notification to everyone in a specific role.
   */
  sendToRole: async (role: UserRole, title: string, message: string, type: NotificationType = NotificationType.INFO) => {
    // In a real app, this would query all users of this role.
    // For now, we tag it with userId: 'role_broadcast'
    await NotificationService.send({
      userId: `broadcast_${role}`,
      role,
      title,
      message,
      type
    });
  },

  getUserNotifications: (userId: string, role?: UserRole): Notification[] => {
    const all = NotificationService._loadNotifications();
    return all.filter(n => 
      (n.userId === userId || n.userId === `broadcast_${n.role}`) && 
      (!role || n.role === role)
    );
  },

  getUnreadCount: (userId: string, role?: UserRole): number => {
    return NotificationService.getUserNotifications(userId, role).filter(n => !n.read).length;
  },

  markAsRead: (id: string) => {
    const all = NotificationService._loadNotifications();
    const updated = all.map(n => n.id === id ? { ...n, read: true } : n);
    NotificationService._saveNotifications(updated);
  },

  markAllAsRead: (userId: string) => {
    const all = NotificationService._loadNotifications();
    const updated = all.map(n => n.userId === userId ? { ...n, read: true } : n);
    NotificationService._saveNotifications(updated);
  },

  deleteNotification: (id: string) => {
    const all = NotificationService._loadNotifications();
    const updated = all.filter(n => n.id !== id);
    NotificationService._saveNotifications(updated);
  },

  // --- MOCK DELIVERY CHANNELS ---

  sendEmail: (to: string, subject: string, body: string) => {
    console.log(`%c[EMAIL SERVICE] Sending to ${to}: ${subject}`, "color: #3b82f6; font-weight: bold", body);
  },

  sendSMS: (phone: string, message: string) => {
    console.log(`%c[SMS GATEWAY] Sending to ${phone}: ${message}`, "color: #10b981; font-weight: bold");
  }
};
