
import React, { useEffect, useState } from 'react';
import { 
  Package, 
  Store, 
  Truck, 
  CreditCard, 
  Headphones, 
  ShieldCheck, 
  Mail, 
  MessageSquare, 
  PhoneCall,
  Globe
} from 'lucide-react';
import TeamCard from '../components/team/TeamCard';
import TeamMember from '../components/team/TeamMember';
import { PublicSiteService } from '../services/publicSiteService';
import { useLanguage } from '../i18n/LanguageContext';

const Team: React.FC = () => {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState({
    successfulOrders: 0,
    verifiedMerchants: 0,
    activeRiders: 0
  });

  useEffect(() => {
    const load = async () => {
      const insights = await PublicSiteService.getInsights();
      setMetrics({
        successfulOrders: insights.metrics.successfulOrders,
        verifiedMerchants: insights.metrics.verifiedMerchants,
        activeRiders: insights.metrics.activeRiders
      });
    };

    load();
  }, []);

  const departments = [
    {
      icon: <Package size={28} />,
      title: t.team.orderManagement,
      description: `Managing the lifecycle of ${metrics.successfulOrders} successful orders from checkout to final delivery across the platform.`,
      email: "orders@emalla.rw"
    },
    {
      icon: <Store size={28} />,
      title: t.team.merchantSuccess,
      description: `Onboarding and supporting ${metrics.verifiedMerchants} verified merchants with listing assistance and growth support.`,
      email: "merchants@emalla.rw"
    },
    {
      icon: <Truck size={28} />,
      title: t.team.logisticsRiders,
      description: `The engine of E-Malla. Coordinating ${metrics.activeRiders} active riders for safe package handling and delivery operations.`,
      email: "logistics@emalla.rw"
    },
    {
      icon: <CreditCard size={28} />,
      title: t.team.paymentsFinance,
      description: "Securing your funds and processing weekly merchant payouts. We work directly with MTN and Airtel to ensure seamless MoMo transactions.",
      email: "finance@emalla.rw"
    },
    {
      icon: <Headphones size={28} />,
      title: t.team.customerExperience,
      description: "Dedicated to solving user inquiries 24/7. Our support specialists are trained to handle everything from tracking issues to returns.",
      email: "support@emalla.rw"
    },
    {
      icon: <ShieldCheck size={28} />,
      title: t.team.trustSafety,
      description: "Verifying the authenticity of products and users. This team manages our escrow system and handles all platform dispute resolutions.",
      email: "safety@emalla.rw"
    }
  ];

  const staff = [
    {
      name: "Mugisha Eric",
      role: "Operations Director",
      department: "Management",
      avatar: "/brand/portrait-1.svg"
    },
    {
      name: "Uwase Aline",
      role: "Head of Logistics",
      department: "Supply Chain",
      avatar: "/brand/portrait-2.svg"
    },
    {
      name: "Kamanzi Paul",
      role: "Finance Lead",
      department: "Payments",
      avatar: "/brand/portrait-3.svg"
    },
    {
      name: "Mutoni Alice",
      role: "Merchant Success Manager",
      department: "Sellers",
      avatar: "/brand/portrait-4.svg"
    },
    {
      name: "Nizeyimana Jean",
      role: "Technical Ops",
      department: "Platform",
      avatar: "/brand/portrait-5.svg"
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 imigongo-bg opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 inline-block">
            {t.team.badge}
          </span>
          <h1 className="text-4xl md:text-7xl font-black text-white mb-8 leading-tight">
            {t.team.titleLine1} <br/><span className="text-orange-500">{t.team.titleLine2}</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {t.team.subtitle}
          </p>
        </div>
      </section>

      {/* Operational Wings */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="flex items-center space-x-4 mb-16">
          <div className="w-12 h-1.5 bg-orange-500 rounded-full"></div>
          <h2 className="text-3xl font-black text-gray-900">{t.team.departments}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {departments.map((dept, i) => (
            <TeamCard key={i} {...dept} />
          ))}
        </div>
      </section>

      {/* Leadership & Staff */}
      <section className="py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-gray-900 mb-4">{t.team.personnel}</h2>
            <p className="text-gray-500 max-w-lg mx-auto">{t.team.personnelText}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12">
            {staff.map((member, i) => (
              <TeamMember key={i} {...member} />
            ))}
          </div>
        </div>
      </section>

      {/* Direct Contact for Partners */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="bg-orange-500 rounded-[60px] p-12 md:p-20 text-white relative overflow-hidden flex flex-col lg:flex-row items-center justify-between shadow-2xl shadow-orange-100">
          <div className="absolute inset-0 imigongo-bg opacity-10"></div>
          <div className="relative z-10 max-w-xl text-center lg:text-left mb-12 lg:mb-0">
             <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
               {t.team.operationsTitle}
             </h2>
             <p className="text-orange-50 text-lg opacity-90">
               {t.team.operationsText}
             </p>
          </div>
          
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
             <a href="mailto:ops@emalla.rw" className="bg-black text-white px-8 py-5 rounded-2xl font-black flex items-center justify-center space-x-3 hover:bg-gray-900 transition-all shadow-xl">
                <Mail size={20} />
                <span>{t.team.emailOps}</span>
             </a>
             <a href="https://wa.me/250784352174" className="bg-white text-emerald-600 px-8 py-5 rounded-2xl font-black flex items-center justify-center space-x-3 hover:bg-gray-50 transition-all shadow-xl">
                <MessageSquare size={20} />
                <span>{t.team.whatsapp}</span>
             </a>
             <a href="tel:+250784352174" className="sm:col-span-2 border-2 border-white/30 text-white px-8 py-5 rounded-2xl font-black flex items-center justify-center space-x-3 hover:bg-white/10 transition-all">
                <PhoneCall size={20} />
                <span>{t.team.hotline}</span>
             </a>
          </div>
        </div>
      </section>

      {/* Trust Quote */}
      <section className="py-20 text-center px-4">
         <Globe size={48} className="mx-auto text-gray-100 mb-8" />
         <p className="max-w-2xl mx-auto text-2xl font-bold italic text-gray-400 leading-relaxed">
           "{t.team.quote}"
         </p>
         <div className="mt-8 flex justify-center items-center space-x-4">
            <div className="w-12 h-1 bg-gray-100 rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-[4px] text-gray-300">{t.team.council}</span>
            <div className="w-12 h-1 bg-gray-100 rounded-full"></div>
         </div>
      </section>
    </div>
  );
};

export default Team;
