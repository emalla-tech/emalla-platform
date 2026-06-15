import React, { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const WHATSAPP_URL =
  'https://wa.me/250784352174?text=Hello%20E-Malla%20Support%2C%20I%20need%20help.';
const DISMISSED_KEY = 'emalla_whatsapp_welcome_dismissed';
const WELCOME_DELAY_MS = 7000;
const VISIBLE_PATHS = new Set(['/', '/shop', '/contact', '/faq']);

const WhatsAppSupportBubble: React.FC = () => {
  const { pathname } = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(
    () => sessionStorage.getItem(DISMISSED_KEY) === 'true'
  );
  const isVisible = VISIBLE_PATHS.has(pathname) || pathname.startsWith('/product/');

  useEffect(() => {
    if (!isVisible || welcomeDismissed) {
      setShowWelcome(false);
      return;
    }

    const timer = window.setTimeout(() => setShowWelcome(true), WELCOME_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [isVisible, welcomeDismissed]);

  const dismissWelcome = () => {
    setShowWelcome(false);
    setWelcomeDismissed(true);
    sessionStorage.setItem(DISMISSED_KEY, 'true');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      className="whatsapp-support fixed bottom-[calc(7.1rem+env(safe-area-inset-bottom,0px))] left-4 z-[75] flex flex-col items-start gap-3 md:bottom-24 md:left-auto md:right-6 md:items-end"
      aria-label="WhatsApp customer support"
    >
      {showWelcome && (
        <div className="support-welcome-enter relative w-[min(19rem,calc(100vw-2rem))] rounded-[24px] border border-emerald-100 bg-white p-5 pr-11 shadow-[0_22px_60px_rgba(17,24,39,0.18)]">
          <button
            type="button"
            onClick={dismissWelcome}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close WhatsApp support welcome message"
          >
            <X size={15} />
          </button>
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-100">
              <MessageCircle size={20} fill="currentColor" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                E-Malla Support
              </p>
              <p className="text-xs font-bold text-gray-400">Usually replies quickly</p>
            </div>
          </div>
          <p className="text-sm font-black leading-relaxed text-gray-900">
            Muraho! Mukeneye ubufasha?
          </p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-gray-500">
            Our support team is ready to help with products, orders and delivery.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismissWelcome}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-black text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-600 active:scale-95"
          >
            <MessageCircle size={16} />
            Start WhatsApp Chat
          </a>
        </div>
      )}

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setShowWelcome(false)}
        className="support-bubble-enter group relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_18px_44px_rgba(16,185,129,0.38)] transition-all hover:bg-emerald-600 hover:shadow-[0_20px_48px_rgba(16,185,129,0.48)] active:scale-95"
        aria-label="Chat with E-Malla support on WhatsApp"
      >
        <MessageCircle size={23} fill="currentColor" />
        <span className="absolute -right-0.5 top-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-orange-400" aria-hidden="true" />
      </a>
    </aside>
  );
};

export default WhatsAppSupportBubble;
