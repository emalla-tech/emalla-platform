import React, { useEffect, useState } from 'react';
import { ArrowRight, Gift, MapPin, Truck, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  FirstOrderDeliveryPromotion,
  promotionService
} from '../../services/promotionService';

const DISMISSED_KEY = 'emalla_launch_delivery_promotion_dismissed';
const DISPLAY_DELAY_MS = 3500;

const getCountdownParts = (endAt: string) => {
  const remainingMs = Math.max(0, new Date(endAt).getTime() - Date.now());
  const totalSeconds = Math.floor(remainingMs / 1000);

  return {
    remainingMs,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  };
};

const LaunchPromotionPopup = () => {
  const { pathname } = useLocation();
  const [promotion, setPromotion] = useState<FirstOrderDeliveryPromotion | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(() => ({
    remainingMs: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  }));

  useEffect(() => {
    if (pathname !== '/' || sessionStorage.getItem(DISMISSED_KEY) === 'true') {
      setIsVisible(false);
      return;
    }

    let cancelled = false;
    let timer: number | undefined;
    promotionService.getFirstOrderDeliveryPromotion()
      .then((campaign) => {
        if (cancelled || !campaign.active) return;
        setPromotion(campaign);
        timer = window.setTimeout(() => {
          if (!cancelled) setIsVisible(true);
        }, DISPLAY_DELAY_MS);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isVisible) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        sessionStorage.setItem(DISMISSED_KEY, 'true');
        setIsVisible(false);
      }
    };

    document.body.classList.add('launch-promotion-open');
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.classList.remove('launch-promotion-open');
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible]);

  useEffect(() => {
    if (!promotion) return;

    const updateCountdown = () => {
      const nextCountdown = getCountdownParts(promotion.endAt);
      setCountdown(nextCountdown);
      if (nextCountdown.remainingMs <= 0) {
        setIsVisible(false);
      }
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [promotion]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  if (!promotion || !isVisible || pathname !== '/') return null;

  const endDate = new Date(promotion.endAt).toLocaleDateString('en-RW', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <aside
      className="launch-promotion-modal fixed inset-0 z-[130] flex items-center justify-center bg-gray-950/55 p-4 backdrop-blur-sm sm:p-5"
      aria-label="E-Malla launch offer"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={dismiss}
        aria-label="Close launch offer backdrop"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="launch-promotion-title"
        className="promotion-popup-enter relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-[22rem] overflow-y-auto rounded-[30px] bg-white shadow-[0_30px_100px_rgba(15,23,42,0.35)] sm:max-w-xl sm:rounded-[38px]"
      >
        <div className="relative overflow-hidden bg-gray-950 px-6 pb-6 pt-6 text-white sm:px-10 sm:pb-10 sm:pt-7">
          <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-orange-500/25 blur-2xl" />
          <div className="absolute -bottom-24 left-10 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-5 sm:top-5 sm:h-10 sm:w-10 sm:rounded-2xl"
            aria-label="Close launch offer"
          >
            <X size={19} />
          </button>

          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-950/30 sm:h-14 sm:w-14 sm:rounded-3xl">
            <Gift size={24} />
          </span>
          <div
            className="absolute left-1/2 top-5 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-white bg-white px-1.5 py-2 shadow-xl shadow-black/25 sm:top-7 sm:rounded-2xl sm:px-2 sm:py-2.5"
            aria-label={`${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes and ${countdown.seconds} seconds remaining`}
          >
            {[
              { label: 'D', value: countdown.days },
              { label: 'H', value: countdown.hours },
              { label: 'M', value: countdown.minutes },
              { label: 'S', value: countdown.seconds }
            ].map((item) => (
              <span key={item.label} className="min-w-8 text-center sm:min-w-9">
                <span className="block text-xs font-black tabular-nums leading-none text-gray-950 sm:text-sm">
                  {String(item.value).padStart(2, '0')}
                </span>
                <span className="mt-1 block text-[8px] font-black uppercase tracking-[0.12em] text-orange-600">
                  {item.label}
                </span>
              </span>
            ))}
          </div>
          <p className="relative mt-5 text-[9px] font-black uppercase tracking-[0.23em] text-orange-400 sm:mt-6 sm:text-[10px]">Kigali Launch Offer</p>
          <h2 id="launch-promotion-title" className="relative mt-2 max-w-md text-2xl font-black leading-tight sm:text-4xl">
            Your First Delivery Is On Us
          </h2>
          <p className="relative mt-3 max-w-md text-xs font-medium leading-6 text-gray-300 sm:mt-4 sm:text-sm sm:leading-7">
            Place your first E-Malla order and enjoy free delivery within Kigali during our limited launch campaign.
          </p>
        </div>

        <div className="space-y-4 px-6 py-5 sm:space-y-5 sm:px-10 sm:py-8">
          <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-orange-50 p-3 sm:p-4">
              <Truck size={19} className="shrink-0 text-orange-600" />
              <span className="text-xs font-black text-gray-800">First order delivery free</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-3 sm:p-4">
              <MapPin size={19} className="shrink-0 text-blue-600" />
              <span className="text-xs font-black text-gray-800">In Kigali</span>
            </div>
          </div>

          <p className="text-[11px] font-semibold leading-5 text-gray-500 sm:text-xs sm:leading-6">
            Valid through {endDate}. Applied automatically at checkout after first-order eligibility is confirmed.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/shop"
              onClick={dismiss}
              className="flex flex-1 items-center justify-center rounded-2xl bg-orange-500 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-orange-200 transition-colors hover:bg-orange-600 sm:py-4"
            >
              Shop Now <ArrowRight size={17} className="ml-2" />
            </Link>
            <Link
              to="/terms#launch-offer"
              onClick={dismiss}
              className="flex items-center justify-center rounded-2xl border border-gray-200 px-6 py-3.5 text-xs font-black text-gray-600 transition-colors hover:bg-gray-50 sm:py-4"
            >
              Offer Terms
            </Link>
          </div>
        </div>
      </section>
    </aside>
  );
};

export default LaunchPromotionPopup;
