
import React from 'react';
import { Truck, MapPin, Clock, ShieldCheck, Globe, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

const ShippingPolicy: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const ordersHref = user?.role === 'CUSTOMER' ? '/buyer/orders' : '/login';

  return (
    <div className="bg-white min-h-screen">
      {/* Header Section */}
      <section className="bg-orange-500 py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">{t.shipping.title}</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            {t.shipping.subtitle}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
          <div className="group bg-gray-50 p-8 rounded-3xl border border-gray-100 text-center transition-all duration-300 hover:bg-orange-50 hover:border-orange-100 hover:shadow-lg hover:shadow-orange-100/40">
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">{t.shipping.swift}</h3>
            <p className="text-gray-600 text-sm">{t.shipping.swiftText}</p>
          </div>
          <div className="group bg-gray-50 p-8 rounded-3xl border border-gray-100 text-center transition-all duration-300 hover:bg-orange-50 hover:border-orange-100 hover:shadow-lg hover:shadow-orange-100/40">
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white">
              <Globe size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">{t.shipping.reach}</h3>
            <p className="text-gray-600 text-sm">{t.shipping.reachText}</p>
          </div>
          <div className="group bg-gray-50 p-8 rounded-3xl border border-gray-100 text-center transition-all duration-300 hover:bg-orange-50 hover:border-orange-100 hover:shadow-lg hover:shadow-orange-100/40">
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">{t.shipping.safe}</h3>
            <p className="text-gray-600 text-sm">{t.shipping.safeText}</p>
          </div>
        </div>

        <div className="space-y-16">
          {/* Section 1: Timelines */}
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
                <Truck className="mr-3 text-orange-500" /> {t.shipping.timelines}
              </h2>
              <p className="text-gray-500 text-sm">{t.shipping.timelinesText}</p>
            </div>
            <div className="md:w-2/3 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm transition-all duration-300 hover:bg-orange-50/40 hover:border-orange-100 hover:shadow-lg hover:shadow-orange-100/30">
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                  <div>
                    <h4 className="font-bold text-gray-900">{t.shipping.kigaliCity}</h4>
                    <p className="text-sm text-gray-500">{t.shipping.kigaliStandard}</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">30 Minutes - 1 Hours</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                  <div>
                    <h4 className="font-bold text-gray-900">{t.shipping.secondaryCities}</h4>
                    <p className="text-sm text-gray-500">Musanze, Huye, Rubavu, Rwamagana</p>
                  </div>
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">2 - 6 Hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900">{t.shipping.otherProvinces}</h4>
                    <p className="text-sm text-gray-500">{t.shipping.ruralRemote}</p>
                  </div>
                  <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">6 - 12 Hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Methods */}
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
                <MapPin className="mr-3 text-orange-500" /> {t.shipping.methods}
              </h2>
              <p className="text-gray-500 text-sm">{t.shipping.methodsText}</p>
            </div>
            <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="group p-6 border border-gray-100 rounded-3xl bg-gray-50/50 transition-all duration-300 hover:bg-orange-50 hover:border-orange-100 hover:shadow-lg hover:shadow-orange-100/30">
                <h4 className="font-bold text-gray-900 mb-2">{t.shipping.doorstep}</h4>
                <p className="text-sm text-gray-600">{t.shipping.doorstepText}</p>
              </div>
              <div className="group p-6 border border-gray-100 rounded-3xl bg-gray-50/50 transition-all duration-300 hover:bg-orange-50 hover:border-orange-100 hover:shadow-lg hover:shadow-orange-100/30">
                <h4 className="font-bold text-gray-900 mb-2">{t.shipping.hubPickup}</h4>
                <p className="text-sm text-gray-600">{t.shipping.hubPickupText}</p>
              </div>
            </div>
          </div>

          {/* Section 3: Shipping Rates */}
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
                <Info className="mr-3 text-orange-500" /> {t.shipping.rates}
              </h2>
              <p className="text-gray-500 text-sm">{t.shipping.ratesText}</p>
            </div>
            <div className="md:w-2/3 prose prose-orange max-w-none text-gray-600">
              <p>
                {t.shipping.rateIntro}
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-4 text-sm">
                <li><strong>{t.shipping.freeDelivery}</strong> {t.shipping.freeDeliveryText}</li>
                <li><strong>{t.shipping.baseRate}</strong> {t.shipping.baseRateText}</li>
                <li><strong>{t.shipping.upcountry}</strong> {t.shipping.upcountryText}</li>
                <li><strong>{t.shipping.heavyItems}</strong> {t.shipping.heavyItemsText}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tracking Call to Action */}
        <div className="group mt-20 bg-gray-900 rounded-3xl p-10 text-center transition-all duration-300 hover:bg-gray-950 hover:shadow-2xl hover:shadow-orange-100/10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{t.shipping.trackTitle}</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            {t.shipping.trackText}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={ordersHref}
              className="bg-orange-500 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/20"
            >
              {t.shipping.orders}
            </Link>
            <Link
              to="/contact"
              className="bg-white/10 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 hover:bg-white/20 hover:-translate-y-0.5 hover:border-white/40 border border-white/20"
            >
              {t.shipping.support}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ShippingPolicy;
