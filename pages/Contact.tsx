
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe } from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-orange-500/5 imigongo-bg opacity-20"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 inline-block">
            Get In Touch
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">We're Here to Support <br/><span className="text-orange-500 font-black">Your Growth</span></h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Have questions about selling, shipping, or partnerships? Our local team in Kigali is ready to assist you.
          </p>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          
          {/* Contact Information Cards */}
          <div className="lg:col-span-1 space-y-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Contact Details</h2>
            
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 flex items-start space-x-6 hover:border-orange-200 transition-all group">
              <div className="p-4 bg-white text-orange-500 rounded-2xl shadow-sm group-hover:bg-orange-500 group-hover:text-white transition-all">
                <MapPin size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Our Office</h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  KN 2 Rd, Downtown Kigali<br />
                  Chic Building, 3rd Floor<br />
                  Kigali, Rwanda
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 flex items-start space-x-6 hover:border-orange-200 transition-all group">
              <div className="p-4 bg-white text-blue-500 rounded-2xl shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-all">
                <Phone size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Phone Support</h4>
                <p className="text-gray-500 text-sm mb-1">+250 784352174</p>
                <p className="text-gray-500 text-sm">+250 784352174</p>
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 flex items-start space-x-6 hover:border-orange-200 transition-all group">
              <div className="p-4 bg-white text-emerald-500 rounded-2xl shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <Mail size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Email Us</h4>
                <p className="text-gray-500 text-sm mb-1">info@emallarwanda.com</p>
                <p className="text-gray-500 text-sm">support@emallarwanda.com</p>
              </div>
            </div>

            <div className="p-8 bg-orange-50 rounded-3xl border border-orange-100">
              <div className="flex items-center space-x-3 mb-4 text-orange-600">
                <Clock size={20} />
                <h4 className="font-bold">Business Hours</h4>
              </div>
              <ul className="space-y-2 text-sm text-orange-800/70 font-medium">
                <li className="flex justify-between"><span>Mon - Fri:</span> <span>8:00 AM - 6:00 PM</span></li>
                <li className="flex justify-between"><span>Saturday:</span> <span>9:00 AM - 4:00 PM</span></li>
                <li className="flex justify-between"><span>Sunday:</span> <span>Closed</span></li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden relative">
              {submitted ? (
                <div className="p-20 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Send size={32} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4">Message Sent!</h2>
                  <p className="text-gray-500 mb-10 max-w-sm mx-auto">
                    Murakoze! We've received your inquiry. Our team will get back to you within 24 hours.
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="bg-black text-white px-10 py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <div className="p-8 md:p-12 lg:p-16">
                  <div className="flex items-center space-x-4 mb-10">
                    <div className="w-12 h-1 bg-orange-500 rounded-full"></div>
                    <h2 className="text-3xl font-black text-gray-900">Send a Message</h2>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input 
                          required
                          type="text" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="e.g. Jean Pierre"
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all text-gray-900 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                        <input 
                          required
                          type="email" 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="jean@example.com"
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all text-gray-900 font-medium"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                      <select 
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all text-gray-900 font-medium appearance-none"
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
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Message</label>
                      <textarea 
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        placeholder="How can we help you today?"
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all text-gray-900 font-medium resize-none"
                      ></textarea>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center space-x-3 hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 active:scale-95 disabled:opacity-50 group"
                    >
                      <span>{isSubmitting ? 'Transmitting...' : 'Send Message'}</span>
                      {!isSubmitting && <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    </button>
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
              <h2 className="text-4xl font-black text-gray-900 leading-tight">Serving Every District <br/><span className="text-orange-500">of Rwanda</span></h2>
              <p className="text-gray-600 text-lg">
                With operational hubs in Kigali, Musanze, Huye, and Rubavu, we've built the most reliable logistics network in the country. Our support team is distributed to ensure we understand the local context of every merchant.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-6">
                <div className="space-y-1">
                  <h4 className="text-2xl font-black text-gray-900">30+</h4>
                  <p className="text-sm font-bold text-gray-400 uppercase">Districts Covered</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-2xl font-black text-gray-900">24/7</h4>
                  <p className="text-sm font-bold text-gray-400 uppercase">Digital Support</p>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 relative">
               <div className="aspect-video bg-white rounded-3xl border border-gray-100 shadow-2xl flex items-center justify-center relative group overflow-hidden">
                  <img src="https://picsum.photos/id/10/800/450" className="w-full h-full object-cover opacity-20 grayscale group-hover:scale-105 transition-transform duration-1000" alt="Map visual" />
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
