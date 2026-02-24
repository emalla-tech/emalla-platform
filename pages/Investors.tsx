
import React, { useState } from 'react';
import { 
  Users, 
  Globe, 
  TrendingUp, 
  Zap, 
  FileText, 
  Download, 
  ShieldCheck, 
  ChevronRight, 
  Mail,
  Building,
  Target,
  BarChart3,
  Rocket
} from 'lucide-react';
import StatCard from '../components/investor/StatCard';
import MetricCard from '../components/investor/MetricCard';
import TeamMember from '../components/investor/TeamMember';

const Investors: React.FC = () => {
  const [formState, setFormState] = useState({ name: '', email: '', company: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-900 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 imigongo-bg opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-orange-500/10 text-orange-500 px-4 py-1.5 rounded-full mb-8">
            <Rocket size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Series A Fundraising Active</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-white mb-8 leading-tight max-w-5xl mx-auto">
            Building Rwanda's Largest <br/>
            <span className="text-orange-500">Digital Marketplace</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-12">
            Connecting 14 million people through a unified digital commerce and logistics infrastructure. E-Malla is the heartbeat of modern Rwandan trade.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto bg-orange-500 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center">
              Download Pitch Deck <Download size={20} className="ml-3" />
            </button>
            <a href="#contact" className="w-full sm:w-auto bg-white/10 text-white border border-white/20 px-10 py-5 rounded-2xl font-black text-lg hover:bg-white/20 transition-all">
              Contact Desk
            </a>
          </div>
        </div>
      </section>

      {/* Corporate About */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="flex items-center space-x-3 text-orange-500">
               <div className="w-12 h-0.5 bg-orange-500"></div>
               <span className="text-xs font-black uppercase tracking-widest">The Opportunity</span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 leading-tight">
              A Scalable Solution for a Rapidly Digitalizing Nation.
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              E-Malla Rwanda solves the critical "last-mile" logistics and trust gap in East African commerce. By integrating secure escrow payments with a distributed rider network, we provide local merchants with the infrastructure they need to compete in the global digital era.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-4">
               <div>
                  <h4 className="text-3xl font-black text-gray-900">30/30</h4>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Districts Covered</p>
               </div>
               <div>
                  <h4 className="text-3xl font-black text-gray-900">2hr</h4>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Avg. Delivery</p>
               </div>
            </div>
          </div>
          <div className="relative">
             <div className="aspect-video bg-gray-50 rounded-[40px] overflow-hidden border border-gray-100 shadow-2xl">
                <img src="https://picsum.photos/id/160/800/450" className="w-full h-full object-cover grayscale opacity-80" alt="Marketplace demo" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-2xl animate-pulse cursor-pointer">
                      <BarChart3 size={32} />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Market Opportunity Cards */}
      <section className="py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Total Addressable Market</h2>
            <p className="text-gray-500">Capturing value across a high-growth regional hub.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard 
              label="Population" 
              value="14M+" 
              subtext="A young, tech-savvy population with median age of 19." 
              icon={<Users size={24} />} 
            />
            <StatCard 
              label="Internet Growth" 
              value="62%" 
              subtext="Annual growth in broadband and mobile connectivity." 
              icon={<Globe size={24} />} 
            />
            <StatCard 
              label="eCommerce" 
              value="$1.2B" 
              subtext="Projected market size for digital trade in Rwanda by 2027." 
              icon={<TrendingUp size={24} />} 
            />
            <StatCard 
              label="Financial Access" 
              value="90%" 
              subtext="Penetration of Mobile Money (MoMo) nationwide." 
              icon={<Zap size={24} />} 
            />
          </div>
        </div>
      </section>

      {/* Traction Metrics */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="bg-gray-900 rounded-[60px] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute inset-0 imigongo-bg opacity-5"></div>
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             <MetricCard value="1.5" suffix="k+" label="Onboarded Merchants" />
             <MetricCard value="50" suffix="k+" label="Successful Deliveries" />
             <MetricCard value="120" suffix="%" label="Quarterly Revenue Growth" />
          </div>
        </div>
      </section>

      {/* Business Model */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
           <div className="text-center mb-20">
             <h2 className="text-4xl font-black text-gray-900 mb-4">A Multi-Stream Revenue Model</h2>
             <p className="text-gray-500 max-w-xl mx-auto">Diversified income channels ensuring high-margin sustainability.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             {[
               { title: "Marketplace Commissions", desc: "We capture 8-12% of every transaction facilitated through the platform, scaling directly with GMV growth.", icon: <ShieldCheck className="text-orange-500" /> },
               { title: "Logistics Fulfillment", desc: "Tiered delivery fees based on weight and distance, powered by our proprietary route-optimization tech.", icon: <Zap className="text-orange-500" /> },
               { title: "Merchant Pro Subscriptions", desc: "Monthly recurring revenue (SaaS model) for advanced inventory tools, CRM, and analytics dashboards.", icon: <Building className="text-orange-500" /> },
               { title: "Targeted Ad-Tech", desc: "High-margin revenue from featured product placement and data-driven merchant advertising.", icon: <Target className="text-orange-500" /> },
             ].map((item, i) => (
               <div key={i} className="flex space-x-6 p-8 bg-white rounded-3xl border border-gray-100 hover:shadow-lg transition-all">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* Executive Team */}
      <section className="py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Executive Leadership</h2>
            <p className="text-gray-500">Domain experts in logistics, fintech, and regional trade.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TeamMember 
              image="https://picsum.photos/id/64/400/400" 
              name="Jean Pierre Habimana" 
              role="CEO & Founder" 
              bio="12+ years in logistics management across East Africa. Former director at Rwanda Supply Chain Council."
              linkedin="#"
            />
            <TeamMember 
              image="https://picsum.photos/id/65/400/400" 
              name="Sarah Mutoni" 
              role="Chief Operations Officer" 
              bio="Fintech specialist with background in mobile banking integrations at leading Pan-African banks."
              linkedin="#"
            />
            <TeamMember 
              image="https://picsum.photos/id/91/400/400" 
              name="Eric Mugisha" 
              role="Chief Technical Officer" 
              bio="Full-stack architect with expertise in scalable cloud infrastructures and high-velocity marketplace logic."
              linkedin="#"
            />
          </div>
        </div>
      </section>

      {/* Documents Download */}
      <section className="py-24 max-w-7xl mx-auto px-4">
         <div className="bg-gray-900 rounded-[50px] p-12 md:p-20 text-white relative overflow-hidden flex flex-col lg:flex-row items-center justify-between">
            <div className="absolute inset-0 bg-orange-500 opacity-5 -skew-x-12 transform translate-x-1/2"></div>
            <div className="relative z-10 max-w-xl mb-12 lg:mb-0">
               <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">Investor Access Center</h2>
               <p className="text-gray-400 text-lg">Secure access to our detailed financial roadmap, market analysis, and legal frameworks.</p>
            </div>
            
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
               <button className="bg-white/10 hover:bg-white/20 p-6 rounded-3xl flex items-center space-x-4 border border-white/10 transition-all group">
                  <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                    <FileText size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black">Series A Deck</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">PDF • 12MB</p>
                  </div>
               </button>
               <button className="bg-white/10 hover:bg-white/20 p-6 rounded-3xl flex items-center space-x-4 border border-white/10 transition-all group">
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white">
                    <BarChart3 size={24} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black">Financial Model</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">XLSX • 4MB</p>
                  </div>
               </button>
            </div>
         </div>
      </section>

      {/* Inquiry Form */}
      <section id="contact" className="py-24 max-w-3xl mx-auto px-4">
         <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Investor Inquiries</h2>
            <p className="text-gray-500">Reach out to our relations desk for strategic partnership or funding inquiries.</p>
         </div>

         {submitted ? (
            <div className="bg-emerald-50 p-12 rounded-[40px] text-center border border-emerald-100 animate-in fade-in zoom-in duration-500">
               <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                  <ShieldCheck size={40} />
               </div>
               <h3 className="text-2xl font-black text-gray-900 mb-2">Message Transmitted</h3>
               <p className="text-gray-500 font-medium">Our IR team will verify your credentials and respond within 24 business hours.</p>
            </div>
         ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                     <input required type="text" className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-900 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professional Email</label>
                     <input required type="email" className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-900 transition-all" />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Firm / Organization</label>
                  <input required type="text" className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-900 transition-all" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message</label>
                  <textarea rows={5} className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-900 transition-all resize-none"></textarea>
               </div>
               <button type="submit" className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg hover:bg-gray-900 transition-all shadow-xl flex items-center justify-center space-x-3 group">
                  <span>Send Formal Inquiry</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
               </button>
            </form>
         )}
      </section>

      {/* Footer Quote */}
      <section className="py-20 bg-gray-900 text-center px-4 overflow-hidden relative">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
         <p className="max-w-4xl mx-auto text-2xl md:text-3xl font-bold italic text-gray-400 leading-relaxed">
           "Our vision is to make commerce borderless within Rwanda, creating a future where every local artisan has the same reach as a global conglomerate."
         </p>
         <div className="mt-10 flex justify-center items-center space-x-4">
            <div className="w-12 h-0.5 bg-gray-800"></div>
            <span className="text-[10px] font-black uppercase tracking-[4px] text-gray-500">Board of Directors</span>
            <div className="w-12 h-0.5 bg-gray-800"></div>
         </div>
      </section>
    </div>
  );
};

export default Investors;
