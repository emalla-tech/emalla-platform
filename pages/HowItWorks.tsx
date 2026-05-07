import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  Store, 
  Package, 
  TrendingUp, 
  UserPlus, 
  Zap,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
// Corrected import from react-router-dom to resolve named export issues
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const HowItWorks: React.FC = () => {
  const { t } = useLanguage();
  const [activeRole, setActiveRole] = useState<'customer' | 'merchant' | 'delivery'>('customer');
  const getStartedPath =
    activeRole === 'merchant'
      ? '/become-seller'
      : activeRole === 'delivery'
        ? '/register?role=rider'
        : '/shop';

  const content = {
    customer: {
      title: "Seamless Shopping for You",
      subtitle: "Discover products from across Rwanda and get them delivered to your doorstep in hours.",
      steps: [
        {
          icon: <Search className="text-orange-500" size={32} />,
          title: "Browse & Discover",
          desc: "Explore thousands of authentic products from local Rwandan merchants in categories like Fashion, Electronics, and Home Decor."
        },
        {
          icon: <ShoppingBag className="text-orange-500" size={32} />,
          title: "Order & Checkout",
          desc: "Add items to your cart and proceed to our secure checkout. Review your delivery address and choose your preferred shipping method."
        },
        {
          icon: <CreditCard className="text-orange-500" size={32} />,
          title: "Secure Payment",
          desc: "Pay easily using MTN Mobile Money, Airtel Money, or your Bank Card. Your funds are held safely until you receive your order."
        },
        {
          icon: <Truck className="text-orange-500" size={32} />,
          title: "Fast Delivery",
          desc: "Track your order in real-time as our logistics partners bring it to you. Most Kigali deliveries happen within 1 hour!"
        }
      ]
    },
    merchant: {
      title: "Empower Your Business",
      subtitle: "Take your local store nationwide with our integrated e-commerce and logistics infrastructure.",
      steps: [
        {
          icon: <UserPlus className="text-orange-500" size={32} />,
          title: "Register as a Seller",
          desc: "Sign up with your business details and get verified by our success team within 12-24 hours."
        },
        {
          icon: <Store className="text-orange-500" size={32} />,
          title: "List Your Products",
          desc: "Upload high-quality photos and descriptions. Our AI assistant can help you write compelling product overviews."
        },
        {
          icon: <Package className="text-orange-500" size={32} />,
          title: "Manage Orders",
          desc: "Receive notifications for new orders. Pack your items and prepare them for pickup by our delivery agents."
        },
        {
          icon: <TrendingUp className="text-orange-500" size={32} />,
          title: "Grow & Get Paid",
          desc: "Access sales analytics to improve your business. Receive weekly payouts directly to your MoMo or bank account."
        }
      ]
    },
    delivery: {
      title: "Join the Logistics Force",
      subtitle: "Earn competitive income by helping connect Rwandan merchants and customers.",
      steps: [
        {
          icon: <Zap className="text-orange-500" size={32} />,
          title: "Sign Up to Deliver",
          desc: "Join our delivery network as an independent rider or logistics partner. Get trained on our service standards."
        },
        {
          icon: <Package className="text-orange-500" size={32} />,
          title: "Accept Shipments",
          desc: "Use the delivery app to accept nearby order pickups from verified E-Malla merchants."
        },
        {
          icon: <Truck className="text-orange-500" size={32} />,
          title: "Safe Transport",
          desc: "Follow optimized routes to deliver packages safely and professionally to the customer's location."
        },
        {
          icon: <CheckCircle className="text-orange-500" size={32} />,
          title: "Earn Daily",
          desc: "Track your earnings in real-time and enjoy a flexible schedule while supporting the local economy."
        }
      ]
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-900 py-24 relative overflow-hidden text-center">
        <div className="absolute inset-0 imigongo-bg opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <span className="text-orange-500 font-black tracking-widest uppercase text-xs mb-4 inline-block">
            {t.howItWorks.badge}
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            {t.howItWorks.title}
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            {t.howItWorks.subtitle}
          </p>
        </div>
      </section>

      {/* Role Selection Tabs */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-4 mb-20">
          {[
            { id: 'customer', name: t.howItWorks.forCustomers, icon: <ShoppingBag size={18} /> },
            { id: 'merchant', name: t.howItWorks.forMerchants, icon: <Store size={18} /> },
            { id: 'delivery', name: t.howItWorks.forDelivery, icon: <Truck size={18} /> }
          ].map((role) => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id as any)}
              className={`flex items-center space-x-3 px-8 py-4 rounded-2xl font-black text-sm transition-all ${
                activeRole === role.id 
                ? 'bg-orange-500 text-white shadow-xl shadow-orange-200 -translate-y-1' 
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {role.icon}
              <span>{role.name}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-24 animate-in fade-in duration-700">
          <div className="space-y-8">
            <div className="inline-flex items-center space-x-2 text-orange-500 bg-orange-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
              <CheckCircle size={14} />
              <span>{t.howItWorks.guide}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
              {content[activeRole].title}
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              {content[activeRole].subtitle}
            </p>
            
            <div className="space-y-10 pt-6">
              {content[activeRole].steps.map((step, idx) => (
                <div key={idx} className="flex space-x-6 group">
                  <div className="flex-shrink-0 relative">
                    <div className="w-14 h-14 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:border-orange-500 transition-all">
                      {step.icon}
                    </div>
                    {idx !== content[activeRole].steps.length - 1 && (
                      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-gray-100"></div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h4>
                    <p className="text-gray-500 leading-relaxed text-sm">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
             <div className="aspect-[4/5] bg-gray-50 rounded-[60px] overflow-hidden border-8 border-white shadow-2xl relative group">
                <img 
                  src={activeRole === 'customer' ? '/brand/how-customer.svg' : activeRole === 'merchant' ? '/brand/how-merchant.svg' : '/brand/how-delivery.svg'} 
                  alt="Process illustration" 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10 text-white">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-1 bg-orange-500 rounded-full"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Fast Fact</span>
                  </div>
                  <p className="text-xl font-bold leading-tight italic">
                    {activeRole === 'customer' 
                      ? "98% of our customers in Kigali receive their orders the same day." 
                      : activeRole === 'merchant'
                      ? "Average merchants increase their reach by 400% in the first month."
                      : "Top delivery partners earn up to RWF 450,000 per month."}
                  </p>
                </div>
             </div>
             
             {/* Floating Badge */}
             <div className="absolute -top-10 -right-10 bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 hidden md:block animate-bounce-slow">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Efficiency</p>
                    <p className="text-lg font-bold text-gray-900">100% Digital</p>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-orange-500 rounded-[40px] p-12 md:p-20 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
           <div className="absolute inset-0 imigongo-bg opacity-10"></div>
           <div className="relative z-10 max-w-xl text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
                {t.howItWorks.ready}
              </h2>
              <p className="text-orange-100 text-lg mb-10">
                {t.howItWorks.readyText}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                 <Link to={getStartedPath} className="bg-black text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-900 transition-all flex items-center justify-center">
                   {t.howItWorks.getStarted} <ArrowRight size={20} className="ml-3" />
                 </Link>
                 <Link to="/contact" className="bg-white/20 backdrop-blur-md text-white border border-white/20 px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/30 transition-all flex items-center justify-center">
                   {t.howItWorks.speak}
                 </Link>
              </div>
           </div>
           
           <div className="mt-16 md:mt-0 relative z-10 hidden md:block">
              <div className="w-80 h-80 bg-white/10 rounded-full border border-white/20 flex items-center justify-center animate-pulse">
                 <Zap size={140} className="text-white" />
              </div>
           </div>
        </div>
      </section>

      {/* Global Style Inject for slow bounce */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default HowItWorks;
