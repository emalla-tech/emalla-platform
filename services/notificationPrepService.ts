export type NotificationAudience = 'customer' | 'merchant' | 'rider' | 'admin';

export type NotificationChannelConfig = {
  audience: NotificationAudience;
  topics: string[];
  enabled: boolean;
};

const DEFAULT_CHANNELS: NotificationChannelConfig[] = [
  { audience: 'customer', topics: ['order_created', 'payment_confirmed', 'delivery_updates'], enabled: true },
  { audience: 'merchant', topics: ['new_order', 'payment_confirmed', 'payout_updates'], enabled: true },
  { audience: 'rider', topics: ['delivery_assigned', 'delivery_updated', 'wallet_updates'], enabled: true },
  { audience: 'admin', topics: ['seller_application', 'rider_application', 'security_alerts'], enabled: true }
];

export const notificationPrepService = {
  getChannels() {
    return DEFAULT_CHANNELS;
  },

  async requestPermission() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    return Notification.requestPermission();
  },

  async syncWithServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({
      type: 'PWA_NOTIFICATION_PREP',
      channels: DEFAULT_CHANNELS
    });
    return true;
  }
};
