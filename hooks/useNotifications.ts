
import { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '../services/NotificationService';
import { Notification, UserRole } from '../types';

export const useNotifications = (userId: string, role?: UserRole) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(() => {
    const data = NotificationService.getUserNotifications(userId, role);
    setNotifications(data);
    setUnreadCount(NotificationService.getUnreadCount(userId, role));
  }, [userId, role]);

  useEffect(() => {
    load();

    // Listen for the custom event dispatched by NotificationService
    const handleUpdate = () => load();
    window.addEventListener('emalla_notifications_updated', handleUpdate);
    
    return () => window.removeEventListener('emalla_notifications_updated', handleUpdate);
  }, [load]);

  const markRead = (id: string) => NotificationService.markAsRead(id);
  const markAllRead = () => NotificationService.markAllAsRead(userId);
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
