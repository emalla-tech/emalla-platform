import React, { useEffect, useState } from 'react';
import { Cookie, Settings2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'emalla_cookie_consent_v1';

type ConsentChoice = 'necessary' | 'all';

const CookieConsent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(() => !localStorage.getItem(CONSENT_KEY));
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const openPreferences = () => {
      setShowDetails(true);
      setIsOpen(true);
    };
    window.addEventListener('emalla:open-cookie-preferences', openPreferences);
    return () => window.removeEventListener('emalla:open-cookie-preferences', openPreferences);
  }, []);

  const saveChoice = (choice: ConsentChoice) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice, updatedAt: new Date().toISOString() }));
    setIsOpen(false);
    setShowDetails(false);
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-[100] mx-auto max-w-3xl rounded-3xl border border-orange-100 bg-white p-5 shadow-[0_24px_80px_rgba(17,24,39,0.24)] md:bottom-6 md:p-6" aria-label="Cookie and privacy preferences">
      <button type="button" onClick={() => setIsOpen(false)} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-gray-950" aria-label="Close cookie preferences">
        <X size={15} />
      </button>
      <div className="flex gap-4 pr-8">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white"><Cookie size={21} /></span>
        <div>
          <h2 className="font-black text-gray-950">Your privacy choices</h2>
          <p className="mt-1 text-xs font-medium leading-5 text-gray-600 md:text-sm">E-Malla uses necessary browser storage to keep the platform secure and functional. Optional preferences help us prepare for future experience improvements.</p>
        </div>
      </div>
      {showDetails && (
        <div className="mt-4 grid gap-2 rounded-2xl bg-gray-50 p-4 text-xs font-semibold leading-5 text-gray-600">
          <p><strong className="text-gray-950">Necessary:</strong> authentication, cart, language, security and consent preferences. Always active.</p>
          <p><strong className="text-gray-950">Optional:</strong> future analytics and experience improvements. No advertising cookies are enabled by this control.</p>
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => saveChoice('all')} className="rounded-xl bg-orange-500 px-5 py-3 text-xs font-black text-white hover:bg-orange-600">Accept All</button>
        <button type="button" onClick={() => saveChoice('necessary')} className="rounded-xl bg-gray-950 px-5 py-3 text-xs font-black text-white hover:bg-gray-800">Necessary Only</button>
        <button type="button" onClick={() => setShowDetails(value => !value)} className="inline-flex items-center gap-2 px-2 py-3 text-xs font-black text-gray-600 hover:text-orange-600"><Settings2 size={15} /> Preferences</button>
        <Link to="/privacy" className="ml-auto text-xs font-black text-orange-600 hover:underline">Privacy Policy</Link>
      </div>
    </aside>
  );
};

export default CookieConsent;
