
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Rocket, 
  Globe, 
  Users, 
  Loader2, 
  ArrowRight, 
  Home, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { MerchantService } from '../services/merchantService';

const BecomeSeller: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    category: 'Fashion',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await MerchantService.registerSeller(formData);
      setIsSubmitted(true);
      setFormData({ businessName: '', category: 'Fashion', phone: '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Submission failed", error);
      alert("Something went wrong. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-white px-4 py-20 animate-in fade-in duration-700">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-emerald-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto relative z-10 shadow-xl shadow-emerald-100/50">
              <CheckCircle size={56} strokeWidth={2.5} />
            </div>
            <div className="absolute -top-2 -right-2 text-orange-500 animate-bounce">
              <Sparkles size={24} />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              Application Received <br/> <span className="text-orange-500">Successfully!</span>
            </h1>
            <div className="max-w-lg mx-auto bg-gray-50 p-8 rounded-[32px] border border-gray-100">
              <p className="text-lg text-gray-600 leading-relaxed font-medium">
                Thank you for registering with <span className="text-gray-900 font-bold">E-Malla Rwanda</span>. 
                Your seller application has been received and is currently under review.
              </p>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Expected Timeline</p>
                <p className="text-gray-900 font-black text-lg mt-1">24 – 48 Hours</p>
                <p className="text-xs text-gray-400 mt-2 italic">Our team will verify your information and contact you shortly.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              to="/" 
              className="w-full sm:w-auto bg-black text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-orange-600 transition-all shadow-xl shadow-black/10 flex items-center justify-center group active:scale-95"
            >
              <Home size={20} className="mr-3" />
              Back to Home
            </Link>
            <a 
              href="https://wa.me/250788000000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-white text-gray-900 border-2 border-gray-100 px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-50 transition-all flex items-center justify-center group active:scale-95"
            >
              <MessageSquare size={20} className="mr-3 text-emerald-500" />
              Contact Support
            </a>
          </div>
          
          <div className="pt-10 opacity-40 flex items-center justify-center space-x-2">
             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
             <p className="text-[10px] font-black uppercase tracking-[4px] text-gray-500">Official Merchant Portal</p>
             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 inline-block">
            Merchant Partnerships
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 tracking-tight">Grow Your Business Online</h1>
          <p className="text-xl text-gray-500 leading-relaxed font-medium">
            E-Malla Rwanda provides the infrastructure you need to sell to customers across the country. We handle the digital store, payments, and delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
          {[
            {
              icon: <Rocket className="text-orange-500" size={40} />,
              title: "Quick Setup",
              desc: "Register your store and start listing products in less than 24 hours."
            },
            {
              icon: <Globe className="text-orange-500" size={40} />,
              title: "Nationwide Reach",
              desc: "Sell to customers in Kigali, Musanze, Rubavu, and every corner of Rwanda."
            },
            {
              icon: <Users className="text-orange-500" size={40} />,
              title: "Dedicated Support",
              desc: "Our merchant success team is here to help you optimize your sales."
            }
          ].map((item, idx) => (
            <div key={idx} className="p-10 bg-gray-50 rounded-[40px] text-center border border-transparent hover:border-orange-200 transition-all group">
              <div className="mb-8 flex justify-center group-hover:scale-110 transition-transform">{item.icon}</div>
              <h3 className="text-2xl font-black mb-4 text-gray-900">{item.title}</h3>
              <p className="text-gray-600 font-medium">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 rounded-[60px] p-8 md:p-20 text-white flex flex-col lg:flex-row items-center relative overflow-hidden">
          <div className="absolute inset-0 imigongo-bg opacity-5"></div>
          <div className="lg:w-1/2 mb-12 lg:mb-0 relative z-10">
             <h2 className="text-4xl md:text-5xl font-black mb-8 text-white leading-tight">Ready to join our <br/> <span className="text-orange-500">community?</span></h2>
             <ul className="space-y-6">
                {[
                  "Access to 100,000+ potential customers",
                  "Integrated Mobile Money & Card payments",
                  "Warehousing & Nationwide Logistics"
                ].map((text, i) => (
                  <li key={i} className="flex items-center space-x-4">
                    <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                      <CheckCircle size={14} strokeWidth={3} />
                    </div>
                    <span className="text-lg font-medium text-gray-300">{text}</span>
                  </li>
                ))}
             </ul>
          </div>
          <div className="lg:w-1/2 w-full relative z-10">
            <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl shadow-black/50">
               <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Business Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.businessName}
                      onChange={e => setFormData({...formData, businessName: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 outline-none transition-all text-black font-bold" 
                      placeholder="e.g. Inyange Fashion Ltd" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Primary Category</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 outline-none transition-all text-black font-bold appearance-none cursor-pointer"
                    >
                       <option>Fashion</option>
                       <option>Electronics</option>
                       <option>Agriculture</option>
                       <option>Crafts</option>
                       <option>Health & Beauty</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">MoMo Phone Number</label>
                    <input 
                      required
                      type="tel" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 outline-none transition-all text-black font-bold" 
                      placeholder="+250 78x xxx xxx" 
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-3 animate-spin" size={24} />
                        Processing...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ArrowRight className="ml-3" size={20} />
                      </>
                    )}
                  </button>
               </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeSeller;
