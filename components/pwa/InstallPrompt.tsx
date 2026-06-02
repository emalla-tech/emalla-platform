import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { notificationPrepService } from '../../services/notificationPrepService';
import { BeforeInstallPromptEvent, pwaService } from '../../services/pwaService';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const dismissedAt = window.localStorage.getItem('emalla_pwa_prompt_dismissed_at');
    if (dismissedAt) {
      const age = Date.now() - Number(dismissedAt);
      if (Number.isFinite(age) && age < 1000 * 60 * 60 * 24 * 3) {
        setDismissed(true);
      }
    }

    setShowIosHint(pwaService.isIosInstallCandidate());

    const handleBeforeInstall = (event: Event) => {
      if (!pwaService.supportsInstallPrompt(event)) return;
      event.preventDefault();
      setDeferredPrompt(event);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  useEffect(() => {
    void notificationPrepService.syncWithServiceWorker();
  }, []);

  const hidePrompt = () => {
    setDismissed(true);
    window.localStorage.setItem('emalla_pwa_prompt_dismissed_at', String(Date.now()));
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    hidePrompt();
  };

  if (dismissed || pwaService.isStandaloneMode()) {
    return null;
  }

  if (!deferredPrompt && !showIosHint) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[95] md:left-auto md:right-6 md:max-w-sm install-banner-enter">
      <div className="rounded-[28px] border border-orange-200 bg-white/95 backdrop-blur px-5 py-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-200">
              {showIosHint && !deferredPrompt ? <Smartphone size={20} /> : <Download size={20} />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-500">Install App</p>
              <h3 className="mt-1 text-base font-black text-gray-900">Use E-Malla like a real app</h3>
              <p className="mt-1 text-sm font-medium leading-relaxed text-gray-500">
                {showIosHint && !deferredPrompt
                  ? 'On iPhone, tap Share then Add to Home Screen to install E-Malla Rwanda.'
                  : 'Install E-Malla Rwanda for faster access, smoother navigation, and app-style browsing.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={hidePrompt}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Dismiss install prompt"
          >
            <X size={16} />
          </button>
        </div>

        {deferredPrompt ? (
          <button
            type="button"
            onClick={() => void handleInstall()}
            className="mt-4 w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
          >
            Install E-Malla
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default InstallPrompt;
