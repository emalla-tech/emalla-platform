
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe } from 'lucide-react';
import { InquiryService } from '../services/inquiryService';
import { useLanguage } from '../i18n/LanguageContext';

const Contact: React.FC = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await InquiryService.submitContact(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to send your message right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-orange-500/5 imigongo-bg opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 inline-block">
            {t.contact.badge}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">{t.contact.titleLine1} <br/><span className="text-orange-500 font-black">{t.contact.titleLine2}</span></h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t.contact.subtitle}
          </p>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          
          {/* Contact Information Cards */}
          <div className="lg:col-span-1 space-y-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">{t.contact.details}</h2>
            
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 flex items-start space-x-6 hover:border-orange-200 transition-all group">
              <div className="p-4 bg-white text-orange-500 rounded-2xl shadow-sm group-hover:bg-orange-500 group-hover:text-white transition-all">
                <MapPin size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{t.contact.office}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Near Inkurunziza Church, Behind Bank Of Kigali Head Quater, KN 84 st Rd<br />
                  House N0.16, 1st Floor<br />
                  Kigali, Rwanda
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 flex items-start space-x-6 hover:border-orange-200 transition-all group">
              <div className="p-4 bg-white text-blue-500 rounded-2xl shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-all">
                <Phone size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{t.contact.phone}</h4>
                <a href="tel:+250785130823" className="block text-gray-500 text-sm mb-1 hover:text-orange-500 transition-colors">+250 785 130 823</a>
                <a href="tel:+250784352174" className="block text-gray-500 text-sm hover:text-orange-500 transition-colors">+250 784 352 174</a>
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 flex items-start space-x-6 hover:border-orange-200 transition-all group">
              <div className="p-4 bg-white text-emerald-500 rounded-2xl shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <Mail size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{t.contact.email}</h4>
                <a href="mailto:info@emallarwanda.com" className="block text-gray-500 text-sm mb-1 hover:text-orange-500 transition-colors">info@emallarwanda.com</a>
                <a href="mailto:support@emallarwanda.com" className="block text-gray-500 text-sm hover:text-orange-500 transition-colors">support@emallarwanda.com</a>
              </div>
            </div>

            <div className="p-8 bg-orange-50 rounded-3xl border border-orange-100">
              <div className="flex items-center space-x-3 mb-4 text-orange-600">
                <Clock size={20} />
                <h4 className="font-bold">{t.contact.hours}</h4>
              </div>
              <ul className="space-y-2 text-sm text-orange-800/70 font-medium">
                <li className="flex justify-between"><span>Mon - Fri:</span> <span>8:00 AM - 8:00 PM</span></li>
                <li className="flex justify-between"><span>Saturday:</span> <span>9:00 AM - 7:00 PM</span></li>
                <li className="flex justify-between"><span>Sunday:</span> <span>Closed</span></li>
              </ul>
            </div>

            <a
              href="https://wa.me/250784352174?text=Hello%20E-Malla%20Support%2C%20I%20need%20help."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-5 rounded-3xl border border-emerald-200 bg-emerald-500 p-7 text-white shadow-xl shadow-emerald-100 transition-all hover:-translate-y-1 hover:bg-emerald-600"
            >
              <span className="rounded-2xl bg-white/20 p-4"><MessageSquare size={24} /></span>
              <span>
                <span className="block text-xs font-black uppercase tracking-widest text-emerald-100">Instant support</span>
                <span className="mt-1 block text-lg font-black">Chat on WhatsApp</span>
              </span>
            </a>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="group bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden relative transition-all duration-300 hover:border-orange-200 hover:shadow-[0_30px_80px_rgba(251,146,60,0.14)]">
              {submitted ? (
                <div className="p-20 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Send size={32} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4">{t.contact.successTitle}</h2>
                  <p className="text-gray-500 mb-10 max-w-sm mx-auto">
                    {t.contact.successText}
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="bg-black text-white px-10 py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all"
                  >
                    {t.contact.sendAnother}
                  </button>
                </div>
              ) : (
                <div className="p-8 md:p-12 lg:p-16">
                  <div className="flex items-center space-x-4 mb-10">
                    <div className="w-12 h-1 bg-orange-500 rounded-full"></div>
                    <h2 className="text-3xl font-black text-gray-900">{t.contact.sendTitle}</h2>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.contact.fullName}</label>
                        <input 
                          required
                          type="text" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="e.g. Jean Pierre"
                          className="w-full bg-gray-50 border-2 border-transparent hover:bg-orange-50/60 focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all text-gray-900 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.contact.emailLabel}</label>
                        <input 
                          required
                          type="email" 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="jean@example.com"
                          className="w-full bg-gray-50 border-2 border-transparent hover:bg-orange-50/60 focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all text-gray-900 font-medium"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.contact.subject}</label>
                      <select 
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent hover:bg-orange-50/60 focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all text-gray-900 font-medium appearance-none"
                      >
                        <option value="">Select a topic</option>
                        <option value="merchant">Becoming a Merchant</option>
                        <option value="delivery">Delivery Inquiry</option>
                        <option value="order">Order Support</option>
                        <option value="partnership">Business Partnership</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.contact.message}</label>
                      <textarea 
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        placeholder={t.contact.message}
                        className="w-full bg-gray-50 border-2 border-transparent hover:bg-orange-50/60 focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all text-gray-900 font-medium resize-none"
                      ></textarea>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center space-x-3 hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 active:scale-95 disabled:opacity-50 group"
                    >
                      <span>{isSubmitting ? t.contact.sending : t.contact.send}</span>
                      {!isSubmitting && <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    </button>
                    {submitError && <p className="text-sm font-semibold text-red-600">{submitError}</p>}
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Global Expansion Map Visual */}
      <section className="py-20 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2 space-y-6">
              <h2 className="text-4xl font-black text-gray-900 leading-tight">{t.contact.mapTitleLine1} <br/><span className="text-orange-500">{t.contact.mapTitleLine2}</span></h2>
              <p className="text-gray-600 text-lg">
                {t.contact.mapText}
              </p>
              <div className="grid grid-cols-2 gap-6 pt-6">
                <div className="space-y-1">
                  <h4 className="text-2xl font-black text-gray-900">30+</h4>
                  <p className="text-sm font-bold text-gray-400 uppercase">{t.contact.districts}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-2xl font-black text-gray-900">24/7</h4>
                  <p className="text-sm font-bold text-gray-400 uppercase">{t.contact.support}</p>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 relative">
               <div className="aspect-video bg-white rounded-3xl border border-gray-100 shadow-2xl flex items-center justify-center relative group overflow-hidden">
                  <img src="/brand/map-operations.svg" className="w-full h-full object-cover opacity-20 grayscale group-hover:scale-105 transition-transform duration-1000" alt="E-Malla operations map" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                       <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-20"></div>
                       <div className="w-4 h-4 bg-orange-500 rounded-full relative z-10 shadow-lg shadow-orange-500/50 border-2 border-white"></div>
                    </div>
                    <div className="ml-4 bg-black text-white px-3 py-1 rounded-lg text-[10px] font-bold">Kigali HQ</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
