import React from 'react';
import { Target, Users, Heart, Zap, ShieldCheck, Globe, ArrowRight } from 'lucide-react';
// Corrected import from react-router-dom to resolve named export issues
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-900 py-24 relative overflow-hidden">
        <div className="absolute inset-0 imigongo-bg opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 inline-block">
            Our Journey
          </span>
          <h1 className="text-4xl md:text-7xl font-black text-white mb-8 leading-tight">
            Connecting Rwanda <br/>Through <span className="text-orange-500">Digital Innovation</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            E-Malla Rwanda is more than just a marketplace. We are a digital bridge connecting the vibrant local economy to the global digital era, built by Rwandans for Rwanda.
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
              <h2 className="text-3xl font-black text-gray-900 mb-6">Our Mission</h2>
              <p className="text-orange-900/70 text-lg leading-relaxed font-medium">
                To empower Rwandan youth through employment and provide small-to-medium enterprises with a world-class platform to reach customers nationwide with ease and reliability.
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
              <h2 className="text-3xl font-black text-white mb-6">Our Vision</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                To become the heartbeat of Rwandan commerce, driving the nation's digital transformation and fostering an ecosystem where every local merchant can thrive in the 21st century.
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
              { label: 'Verified Merchants', value: '1,500+' },
              { label: 'Orders Delivered', value: '50k+' },
              { label: 'Youth Employed', value: '300+' },
              { label: 'Districts Covered', value: '30/30' }
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
          <h2 className="text-4xl font-black text-gray-900 mb-4">Values that Drive Us</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Our culture is built on the pillars of trust, innovation, and community impact.</p>
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
              <div className="aspect-[4/3] rounded-[60px] overflow-hidden border-8 border-white/5 shadow-2xl">
                 <img src="https://picsum.photos/id/10/800/600" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" alt="E-Malla team" />
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
                  <span>Contact our team</span>
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
            <h2 className="text-3xl md:text-5xl font-black text-black mb-8">Be part of the Rwandan digital revolution.</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/become-seller" className="bg-black text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-800 transition-all shadow-xl shadow-black/10">
                Join as a Merchant
              </Link>
              <Link to="/shop" className="bg-white text-black px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-50 transition-all shadow-xl shadow-black/10">
                Start Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;