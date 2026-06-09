
import { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '../services/NotificationService';
import { Notification, UserRole } from '../types';

export const useNotifications = (userId: string, role?: UserRole) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await NotificationService.getUserNotifications(userId, role);
      setNotifications(data);
      setUnreadCount(data.filter((notification) => !notification.read).length);
    } catch {
      // Keep the last successful notification state during temporary network interruptions.
    }
  }, [userId, role]);

  useEffect(() => {
    load();

    // Listen for the custom event dispatched by NotificationService
    const handleUpdate = () => {
      void load();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void load();
      }
    };
    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void load();
      }
    }, 15000);

    window.addEventListener('emalla_notifications_updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener('emalla_notifications_updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [load]);

  const markRead = (id: string) => NotificationService.markAsRead(id);
  const markAllRead = () => NotificationService.markAllAsRead();
  const remove = (id: string) => NotificationService.deleteNotification(id);

  return {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    remove,
    refresh: load
  };
};
