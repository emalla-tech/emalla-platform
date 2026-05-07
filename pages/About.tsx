import React, { useEffect, useState } from 'react';
import { Target, Users, Heart, Zap, ShieldCheck, Globe, ArrowRight } from 'lucide-react';
// Corrected import from react-router-dom to resolve named export issues
import { Link } from 'react-router-dom';
import { PublicSiteService } from '../services/publicSiteService';
import { useLanguage } from '../i18n/LanguageContext';

const About: React.FC = () => {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState({
    verifiedMerchants: 0,
    completedOrders: 0,
    activeRiders: 0,
    districtsCovered: 30
  });

  useEffect(() => {
    const load = async () => {
      const insights = await PublicSiteService.getInsights();
      setMetrics({
        verifiedMerchants: insights.metrics.verifiedMerchants,
        completedOrders: insights.metrics.completedOrders,
        activeRiders: insights.metrics.activeRiders,
        districtsCovered: insights.metrics.districtsCovered
      });
    };

    load();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 imigongo-bg opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 inline-block">
            {t.about.badge}
          </span>
          <h1 className="text-4xl md:text-7xl font-black text-white mb-8 leading-tight">
            {t.about.titleLine1} <br/><span className="text-orange-500">{t.about.titleLine2}</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            {t.about.subtitle}
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
          <div className="bg-orange-50 p-12 rounded-[40px] border border-orange-100 relative group overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
               <Target size={200} className="text-orange-600" />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm mb-8">
                <Target size={32} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-6">{t.about.mission}</h2>
              <p className="text-orange-900/70 text-lg leading-relaxed font-medium">
                {t.about.missionText}
              </p>
            </div>
          </div>

          <div className="bg-black p-12 rounded-[40px] border border-gray-800 relative group overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-700 text-white">
               <Globe size={200} />
            </div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-orange-500 shadow-sm mb-8 border border-white/10">
                <Globe size={32} />
              </div>
              <h2 className="text-3xl font-black text-white mb-6">{t.about.vision}</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                {t.about.visionText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50 border-y">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: t.about.stats1, value: `${metrics.verifiedMerchants}` },
              { label: t.about.stats2, value: `${metrics.completedOrders}` },
              { label: t.about.stats3, value: `${metrics.activeRiders}` },
              { label: t.about.stats4, value: `${metrics.districtsCovered}/30` }
            ].map((stat, idx) => (
              <div key={idx} className="text-center p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
                <p className="text-4xl font-black text-gray-900 mb-2">{stat.value}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black text-gray-900 mb-4">{t.about.valuesTitle}</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">{t.about.valuesSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { 
              icon: <Heart className="text-red-500" />, 
              title: "Youth First", 
              desc: "We prioritize creating job opportunities for the energetic youth of Rwanda." 
            },
            { 
              icon: <Zap className="text-orange-500" />, 
              title: "Innovation", 
              desc: "We leverage cutting-edge technology to simplify logistics and commerce." 
            },
            { 
              icon: <ShieldCheck className="text-emerald-500" />, 
              title: "Trust", 
              desc: "Security and transparency are at the heart of every transaction we facilitate." 
            },
            { 
              icon: <Users className="text-blue-500" />, 
              title: "Ubuntu", 
              desc: "We believe in the power of community and mutual success for all our partners." 
            }
          ].map((value, idx) => (
            <div key={idx} className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl transition-all group hover:-translate-y-1">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {value.icon}
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full imigongo-bg opacity-5 -skew-x-12"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
              <div className="group aspect-[4/3] rounded-[60px] overflow-hidden border-8 border-white/5 shadow-2xl bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.14),_transparent_35%),linear-gradient(145deg,_rgba(31,41,55,0.98),_rgba(17,24,39,0.96))] p-5 md:p-7 transition-all duration-500 hover:shadow-[0_30px_80px_rgba(251,146,60,0.18)]">
                <div className="w-full h-full rounded-[42px] border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 md:p-6 flex flex-col justify-between transition-all duration-500 group-hover:bg-white/[0.07] group-hover:border-orange-300/20">
                  <div className="grid grid-cols-1 sm:grid-cols-[1.2fr,1fr] gap-3 md:gap-4">
                    <div className="rounded-[28px] bg-white/[0.06] border border-white/10 p-4 md:p-5 min-w-0 transition-all duration-500 group-hover:bg-white/[0.1]">
                      <p className="text-white font-black text-xl md:text-2xl leading-tight break-words">E-Malla Rwanda</p>
                      <p className="text-white/70 text-[11px] md:text-xs font-bold uppercase tracking-wide mt-3 leading-relaxed">
                        Marketplace • Logistics • Payments
                      </p>
                    </div>
                    <div className="rounded-[28px] bg-white/95 text-gray-800 border border-white/70 p-4 md:p-5 min-w-0 transition-all duration-500 group-hover:bg-orange-50 group-hover:border-orange-200">
                      <p className="text-sm md:text-base font-black leading-snug break-words">
                        Nationwide digital commerce
                      </p>
                      <p className="text-[11px] md:text-xs text-gray-500 font-semibold mt-3 leading-relaxed break-words">
                        Real platform operations, real seller growth, real customer trust.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[28px] bg-white border border-white/80 p-4 md:p-6 shadow-xl shadow-black/10 transition-all duration-500 group-hover:bg-orange-50/95 group-hover:border-orange-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 break-words">Trusted merchants</p>
                        <p className="text-[11px] text-gray-500 font-semibold mt-2 leading-relaxed break-words">
                          Verified catalog and approvals
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 break-words">Fast fulfillment</p>
                        <p className="text-[11px] text-gray-500 font-semibold mt-2 leading-relaxed break-words">
                          Admin, seller, buyer, rider in sync
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-gray-900 break-words">Secure payments</p>
                        <p className="text-[11px] text-gray-500 font-semibold mt-2 leading-relaxed break-words">
                          MoMo, Airtel, bank, COD
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 space-y-8">
              <h2 className="text-4xl font-black text-white leading-tight">Born from a vision of <span className="text-orange-500">Shared Prosperity</span></h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Founded in Kigali, E-Malla was born out of a simple observation: Rwandan merchants had amazing products, but limited ways to reach the digital customer. We saw an opportunity to not just build a store, but a comprehensive infrastructure.
              </p>
              <p className="text-gray-400 text-lg leading-relaxed">
                Today, we operate a nationwide network that ensures an artisan in Musanze can sell their craft to a customer in Cyangugu as easily as a local transaction. We handle the complexity of payments, warehousing, and last-mile delivery.
              </p>
              <div className="pt-4">
                <Link to="/contact" className="inline-flex items-center space-x-3 text-orange-500 font-bold hover:text-orange-400 transition-colors">
                  <span>{t.about.contactTeam}</span>
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="bg-yellow-400 rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-black mb-8">{t.about.ctaTitle}</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/become-seller" className="bg-black text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-800 transition-all shadow-xl shadow-black/10">
                {t.about.ctaMerchant}
              </Link>
              <Link to="/shop" className="bg-white text-black px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-50 transition-all shadow-xl shadow-black/10">
                {t.about.ctaShop}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
