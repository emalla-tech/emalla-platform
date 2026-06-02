type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const isStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

export const pwaService = {
  isStandaloneMode,

  isIosInstallCandidate() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    return isIos && !isStandaloneMode();
  },

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  },

  supportsInstallPrompt(event: Event): event is BeforeInstallPromptEvent {
    return typeof (event as BeforeInstallPromptEvent).prompt === 'function';
  }
};

export type { BeforeInstallPromptEvent };
