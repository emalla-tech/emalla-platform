
import React from 'react';
import { Shield, Scale, FileText, Lock, UserCheck, Gavel } from 'lucide-react';

const TermsOfService: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Header Section */}
      <section className="bg-gray-900 py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-orange-500/5 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">Terms of Service</h1>
          <p className="text-xl opacity-70 max-w-2xl mx-auto">
            Last Updated: May 20, 2026. Please read these terms carefully before using the E-Malla platform.
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing or using E-Malla Rwanda (the "Platform"), you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the Platform. We reserve the right to modify these terms at any time, and your continued use signifies acceptance of those changes.
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. User Accounts</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-500">
                <li>Users must be at least 18 years old.</li>
                <li>Information provided must be accurate and up-to-date.</li>
                <li>One person/entity per account is standard.</li>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Marketplace Rules</h2>
              <p className="text-gray-600 leading-relaxed">
                E-Malla acts as a marketplace that facilitates transactions between Merchants and Customers. While we strive for quality, the primary responsibility for product quality and description accuracy lies with the Merchant. We reserve the right to remove any listing that violates our community standards or Rwandan law.
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Payments and Refunds</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Payments are processed through secure gateways (Mobile Money, Cards). E-Malla holds funds in escrow until delivery confirmation to protect both parties.
              </p>
              <p className="text-gray-600 leading-relaxed italic">
                Refunds are governed by our Refund & Return Policy, generally allowing returns within 7 days for defective or misrepresented items.
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">
                All content on the Platform, including logos, designs, and text, is the property of E-Malla Rwanda or its content suppliers and is protected by intellectual property laws. You may not use our branding without express written permission.
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Governing Law</h2>
              <p className="text-gray-600 leading-relaxed">
                These terms are governed by and construed in accordance with the laws of the Republic of Rwanda. Any disputes arising from these terms or the use of the platform shall be subject to the exclusive jurisdiction of the courts in Kigali, Rwanda.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-24 p-8 bg-gray-50 rounded-3xl border border-gray-100 text-center">
          <h3 className="text-lg font-bold mb-2">Have questions about our terms?</h3>
          <p className="text-gray-500 text-sm mb-6">Our legal team is available to clarify any points mentioned above.</p>
          <button className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all">
            Contact Legal Dept
          </button>
        </div>
      </section>
    </div>
  );
};

export default TermsOfService;
