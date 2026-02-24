
import React from 'react';
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

const Team: React.FC = () => {
  const departments = [
    {
      icon: <Package size={28} />,
      title: "Order Management",
      description: "Managing the lifecycle of every order from checkout to final delivery. Our team ensures that warehouse processing times remain under 2 hours.",
      email: "orders@emalla.rw"
    },
    {
      icon: <Store size={28} />,
      title: "Merchant Success",
      description: "Onboarding and supporting our 1,500+ local merchants. We provide listing assistance and business growth training for all our partners.",
      email: "merchants@emalla.rw"
    },
    {
      icon: <Truck size={28} />,
      title: "Logistics & Riders",
      description: "The engine of E-Malla. Managing a fleet of 300+ riders across 30 districts to ensure nationwide coverage and safe package handling.",
      email: "logistics@emalla.rw"
    },
    {
      icon: <CreditCard size={28} />,
      title: "Payments & Finance",
      description: "Securing your funds and processing weekly merchant payouts. We work directly with MTN and Airtel to ensure seamless MoMo transactions.",
      email: "finance@emalla.rw"
    },
    {
      icon: <Headphones size={28} />,
      title: "Customer Experience",
      description: "Dedicated to solving user inquiries 24/7. Our support specialists are trained to handle everything from tracking issues to returns.",
      email: "support@emalla.rw"
    },
    {
      icon: <ShieldCheck size={28} />,
      title: "Trust & Safety",
      description: "Verifying the authenticity of products and users. This team manages our escrow system and handles all platform dispute resolutions.",
      email: "safety@emalla.rw"
    }
  ];

  const staff = [
    {
      name: "Mugisha Eric",
      role: "Operations Director",
      department: "Management",
      avatar: "https://picsum.photos/id/64/400/400"
    },
    {
      name: "Uwase Aline",
      role: "Head of Logistics",
      department: "Supply Chain",
      avatar: "https://picsum.photos/id/65/400/400"
    },
    {
      name: "Kamanzi Paul",
      role: "Finance Lead",
      department: "Payments",
      avatar: "https://picsum.photos/id/91/400/400"
    },
    {
      name: "Mutoni Alice",
      role: "Merchant Success Manager",
      department: "Sellers",
      avatar: "https://picsum.photos/id/103/400/400"
    },
    {
      name: "Nizeyimana Jean",
      role: "Technical Ops",
      department: "Platform",
      avatar: "https://picsum.photos/id/177/400/400"
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 imigongo-bg opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 inline-block">
            Internal Operations
          </span>
          <h1 className="text-4xl md:text-7xl font-black text-white mb-8 leading-tight">
            Meet the Team Behind <br/><span className="text-orange-500">E-Malla Rwanda</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Our mission is to simplify commerce. Meet the dedicated professionals working 24/7 to ensure your products arrive safely and your payments remain secure.
          </p>
        </div>
      </section>

      {/* Operational Wings */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="flex items-center space-x-4 mb-16">
          <div className="w-12 h-1.5 bg-orange-500 rounded-full"></div>
          <h2 className="text-3xl font-black text-gray-900">Operational Departments</h2>
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
            <h2 className="text-4xl font-black text-gray-900 mb-4">Key Personnel</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Driving our platform with local expertise and global standards.</p>
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
               Interested in <br/>Our Operations?
             </h2>
             <p className="text-orange-50 text-lg opacity-90">
               For business partnerships, logistics inquiries, or government relations, please reach out to our corporate desk directly.
             </p>
          </div>
          
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
             <a href="mailto:ops@emalla.rw" className="bg-black text-white px-8 py-5 rounded-2xl font-black flex items-center justify-center space-x-3 hover:bg-gray-900 transition-all shadow-xl">
                <Mail size={20} />
                <span>Email Ops</span>
             </a>
             <a href="https://wa.me/250788000000" className="bg-white text-emerald-600 px-8 py-5 rounded-2xl font-black flex items-center justify-center space-x-3 hover:bg-gray-50 transition-all shadow-xl">
                <MessageSquare size={20} />
                <span>WhatsApp</span>
             </a>
             <a href="tel:+250788000000" className="sm:col-span-2 border-2 border-white/30 text-white px-8 py-5 rounded-2xl font-black flex items-center justify-center space-x-3 hover:bg-white/10 transition-all">
                <PhoneCall size={20} />
                <span>Corporate Hotline</span>
             </a>
          </div>
        </div>
      </section>

      {/* Trust Quote */}
      <section className="py-20 text-center px-4">
         <Globe size={48} className="mx-auto text-gray-100 mb-8" />
         <p className="max-w-2xl mx-auto text-2xl font-bold italic text-gray-400 leading-relaxed">
           "E-Malla Rwanda is built on the pillars of transparency and human connection. Behind every digital click is a professional Rwandan committed to excellence."
         </p>
         <div className="mt-8 flex justify-center items-center space-x-4">
            <div className="w-12 h-1 bg-gray-100 rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-[4px] text-gray-300">Management Council</span>
            <div className="w-12 h-1 bg-gray-100 rounded-full"></div>
         </div>
      </section>
    </div>
  );
};

export default Team;
