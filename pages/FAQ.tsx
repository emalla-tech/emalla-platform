
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronUp, Search, MessageCircle, Phone, Mail } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button 
        className="w-full py-6 flex justify-between items-center text-left focus:outline-none group"
        onClick={onClick}
      >
        <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-orange-500' : 'text-gray-900 group-hover:text-orange-500'}`}>
          {question}
        </span>
        <div className={`p-2 rounded-full transition-all ${isOpen ? 'bg-orange-500 text-white rotate-180' : 'bg-gray-50 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500'}`}>
          <ChevronDown size={20} />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
        <p className="text-gray-600 leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
};

const FAQ: React.FC = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'customer' | 'merchant'>('general');

  const faqs = {
    general: [
      {
        question: "What is E-Malla Rwanda?",
        answer: "E-Malla Rwanda is a leading e-commerce and logistics platform designed to connect local merchants with customers across the nation. We provide an integrated digital marketplace, secure payment systems, and nationwide delivery services."
      },
      {
        question: "Where do you deliver?",
        answer: "We deliver to all corners of Rwanda! From downtown Kigali to the borders of Rubavu, Rusizi, and Nyagatare. Our logistics network ensures that even rural areas have access to quality products."
      },
      {
        question: "Is E-Malla Rwanda secure?",
        answer: "Yes, security is our top priority. We use industry-standard encryption for all transactions and work with trusted payment partners like MTN Mobile Money and Airtel Money to ensure your data and funds are safe."
      }
    ],
    customer: [
      {
        question: "How do I track my order?",
        answer: "Once your order is confirmed, you can track its progress in real-time through your Customer Dashboard under the 'My Orders' section. You'll also receive SMS notifications at every major step (Picked, In Transit, Delivered)."
      },
      {
        question: "What payment methods are accepted?",
        answer: "We accept MTN Mobile Money, Airtel Money, and all major Debit/Credit cards (Visa, Mastercard). We are also working on integrating more local payment solutions."
      },
      {
        question: "What is your return policy?",
        answer: "We offer a 7-day return policy for most items. If you're not satisfied with your purchase or the item is defective, you can initiate a return through your dashboard, and our team will handle the pickup."
      }
    ],
    merchant: [
      {
        question: "How do I become a seller?",
        answer: "You can sign up by clicking 'Become a Seller' on our homepage. After submitting your business details, our merchant success team will review your application and guide you through the onboarding process within 24-48 hours."
      },
      {
        question: "What are the fees for selling on E-Malla?",
        answer: "E-Malla operates on a commission-based model. We only charge a small percentage of each successful sale. There are no hidden monthly fees for standard merchant accounts. Detailed commission structures are provided during onboarding."
      },
      {
        question: "How and when do I get paid?",
        answer: "Merchant payouts are processed weekly. Earnings from completed and delivered orders are transferred directly to your registered Mobile Money or bank account every Tuesday."
      }
    ]
  };

  const filteredFaqs = faqs[activeTab].filter(item => 
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-900 text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-orange-500/10 skew-x-12 transform translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block">
            {t.faq.badge}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6">{t.faq.title}</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
            {t.faq.subtitle}
          </p>
          
          <div className="max-w-xl mx-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" size={22} />
            <input 
              type="text" 
              placeholder={t.faq.searchPlaceholder} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white text-gray-900 rounded-2xl shadow-2xl focus:ring-4 focus:ring-orange-500/20 outline-none transition-all text-lg"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 max-w-4xl mx-auto px-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {[
            { id: 'general', name: t.faq.general },
            { id: 'customer', name: t.faq.customer },
            { id: 'merchant', name: t.faq.merchant }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setOpenIndex(0); }}
              className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12">
          {filteredFaqs.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {filteredFaqs.map((item, index) => (
                <FAQItem 
                  key={index}
                  question={item.question}
                  answer={item.answer}
                  isOpen={openIndex === index}
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t.faq.noResults}</h3>
              <p className="text-gray-500">{t.faq.noResultsText}</p>
            </div>
          )}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{t.faq.stillQuestions}</h2>
            <p className="text-gray-500">{t.faq.stillQuestionsText}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center group hover:border-orange-200 transition-all">
              <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <MessageCircle size={28} />
              </div>
              <h4 className="text-xl font-bold mb-2">{t.faq.liveChat}</h4>
              <p className="text-gray-500 text-sm mb-6">{t.faq.liveChatText}</p>
              <Link to="/contact" className="text-orange-500 font-bold hover:underline">{t.faq.startChat}</Link>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center group hover:border-orange-200 transition-all">
              <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-500 group-hover:text-white transition-all">
                <Phone size={28} />
              </div>
              <h4 className="text-xl font-bold mb-2">{t.faq.callUs}</h4>
              <p className="text-gray-500 text-sm mb-6">{t.faq.callText}</p>
              <a href="tel:+250784352174" className="text-blue-500 font-bold hover:underline">+250 784352174</a>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center group hover:border-orange-200 transition-all">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <Mail size={28} />
              </div>
              <h4 className="text-xl font-bold mb-2">{t.faq.emailSupport}</h4>
              <p className="text-gray-500 text-sm mb-6">{t.faq.emailText}</p>
              <a href="mailto:support@emallarwanda.com" className="text-emerald-500 font-bold hover:underline">support@emallarwanda.com</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
