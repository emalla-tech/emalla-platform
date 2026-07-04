
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Scale, FileText, Lock, UserCheck, Gavel, Gift } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const TermsOfService: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="bg-white min-h-screen">
      {/* Header Section */}
      <section className="bg-gray-900 py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-orange-500/5 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">{t.terms.title}</h1>
          <p className="text-xl opacity-70 max-w-2xl mx-auto">
            {t.terms.subtitle}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 max-w-4xl mx-auto px-4">
        <div className="space-y-12">
          {/* Section 1 */}
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center">
                <FileText size={24} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.terms.acceptanceTitle}</h2>
              <p className="text-gray-600 leading-relaxed">
                {t.terms.acceptanceText}
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-xl flex items-center justify-center">
                <UserCheck size={24} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.terms.accountsTitle}</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {t.terms.accountsText}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-500">
                <li>{t.terms.accountsRule1}</li>
                <li>{t.terms.accountsRule2}</li>
                <li>{t.terms.accountsRule3}</li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-xl flex items-center justify-center">
                <Shield size={24} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.terms.marketplaceTitle}</h2>
              <p className="text-gray-600 leading-relaxed">
                {t.terms.marketplaceText}
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 text-purple-500 rounded-xl flex items-center justify-center">
                <Lock size={24} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.terms.paymentsTitle}</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {t.terms.paymentsText}
              </p>
              <p className="text-gray-600 leading-relaxed italic">
                {t.terms.refundText}
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
                <Scale size={24} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.terms.ipTitle}</h2>
              <p className="text-gray-600 leading-relaxed">
                {t.terms.ipText}
              </p>
            </div>
          </div>

          <div id="launch-offer" className="flex scroll-mt-28 flex-col gap-8 md:flex-row">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <Gift size={24} />
              </div>
            </div>
            <div>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Kigali First Delivery Launch Offer</h2>
              <p className="text-gray-600 leading-relaxed">
                From 4 July through 4 September 2026, an eligible customer placing their first E-Malla order
                for delivery in Gasabo, Kicukiro, or Nyarugenge may receive an automatic delivery discount of
                up to RWF 3,500. Eligibility is checked using the customer account, email address, and phone
                number. The offer is limited to one redemption per customer, is not transferable or redeemable
                for cash. E-Malla may reject duplicate, fraudulent, cancelled, or otherwise abusive claims.
              </p>
            </div>
          </div>

          {/* Section 6 */}
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-xl flex items-center justify-center">
                <Gavel size={24} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.terms.lawTitle}</h2>
              <p className="text-gray-600 leading-relaxed">
                {t.terms.lawText}
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-24 p-8 bg-gray-50 rounded-3xl border border-gray-100 text-center">
          <h3 className="text-lg font-bold mb-2">{t.terms.legalTitle}</h3>
          <p className="text-gray-500 text-sm mb-6">{t.terms.legalText}</p>
          <Link to="/contact" className="inline-flex bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all">
            {t.terms.legalButton}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default TermsOfService;
