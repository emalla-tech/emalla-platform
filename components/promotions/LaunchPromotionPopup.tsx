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
      className="launch-promotion-modal fixed inset-0 z-[130] flex items-end justify-center bg-gray-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
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
        className="promotion-popup-enter relative z-10 w-full max-w-xl overflow-hidden rounded-t-[38px] bg-white shadow-[0_30px_100px_rgba(15,23,42,0.35)] sm:rounded-[38px]"
      >
        <div className="relative overflow-hidden bg-gray-950 px-7 pb-8 pt-7 text-white sm:px-10 sm:pb-10">
          <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-orange-500/25 blur-2xl" />
          <div className="absolute -bottom-24 left-10 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Close launch offer"
          >
            <X size={19} />
          </button>

          <span className="relative flex h-14 w-14 items-center justify-center rounded-3xl bg-orange-500 text-white shadow-xl shadow-orange-950/30">
            <Gift size={28} />
          </span>
          <div
            className="absolute left-1/2 top-7 flex -translate-x-1/2 items-center gap-0.5 rounded-2xl border border-white bg-white px-2 py-2.5 shadow-xl shadow-black/25"
            aria-label={`${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes and ${countdown.seconds} seconds remaining`}
          >
            {[
              { label: 'D', value: countdown.days },
              { label: 'H', value: countdown.hours },
              { label: 'M', value: countdown.minutes },
              { label: 'S', value: countdown.seconds }
            ].map((item) => (
              <span key={item.label} className="min-w-9 text-center">
                <span className="block text-sm font-black tabular-nums leading-none text-gray-950">
                  {String(item.value).padStart(2, '0')}
                </span>
                <span className="mt-1 block text-[8px] font-black uppercase tracking-[0.12em] text-orange-600">
                  {item.label}
                </span>
              </span>
            ))}
          </div>
          <p className="relative mt-6 text-[10px] font-black uppercase tracking-[0.25em] text-orange-400">Kigali Launch Offer</p>
          <h2 id="launch-promotion-title" className="relative mt-2 max-w-md text-3xl font-black leading-tight sm:text-4xl">
            Your First Delivery Is On Us
          </h2>
          <p className="relative mt-4 max-w-md text-sm font-medium leading-7 text-gray-300">
            Place your first E-Malla order and enjoy free delivery within Kigali during our limited launch campaign.
          </p>
        </div>

        <div className="space-y-5 px-7 py-7 sm:px-10 sm:py-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl bg-orange-50 p-4">
              <Truck size={19} className="shrink-0 text-orange-600" />
              <span className="text-xs font-black text-gray-800">First order delivery free</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-4">
              <MapPin size={19} className="shrink-0 text-blue-600" />
              <span className="text-xs font-black text-gray-800">In Kigali</span>
            </div>
          </div>

          <p className="text-xs font-semibold leading-6 text-gray-500">
            Valid through {endDate}. Applied automatically at checkout after first-order eligibility is confirmed.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/shop"
              onClick={dismiss}
              className="flex flex-1 items-center justify-center rounded-2xl bg-orange-500 px-6 py-4 text-sm font-black text-white shadow-xl shadow-orange-200 transition-colors hover:bg-orange-600"
            >
              Shop Now <ArrowRight size={17} className="ml-2" />
            </Link>
            <Link
              to="/terms#launch-offer"
              onClick={dismiss}
              className="flex items-center justify-center rounded-2xl border border-gray-200 px-6 py-4 text-xs font-black text-gray-600 transition-colors hover:bg-gray-50"
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
