
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { ShoppingBag, ArrowRight, ShieldCheck, Truck, Zap, Store, Check, Star } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [addedItems, setAddedItems] = useState<Set<number>>(new Set());

  const handleAddToCart = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setAddedItems(prev => new Set(prev).add(id));
    setTimeout(() => setAddedItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    }), 2000);
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section - Restored to match screenshot exactly */}
      <section className="relative h-[750px] flex items-center bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=1920" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="bg-orange-500 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[2px] mb-8 inline-block shadow-lg">
              WELCOME TO THE FUTURE OF SHOPPING
            </span>
            <h1 className="text-6xl md:text-8xl font-black leading-[1.05] mb-8 tracking-tight">
              Shop Local, <br/>
              <span className="text-orange-500">Deliver Fast.</span>
            </h1>
            <p className="text-xl text-gray-200 mb-12 leading-relaxed font-medium max-w-xl">
              Empowering Rwandan merchants and customers through a seamless digital ecosystem. Get anything delivered from across the nation to your doorstep.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/shop" 
                className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center transition-all shadow-2xl shadow-orange-500/20 active:scale-95 group"
              >
                <span>Explore Shop</span>
                <ShoppingBag className="ml-3 group-hover:rotate-12 transition-transform" size={22} />
              </Link>
              <Link 
                to="/become-seller" 
                className="bg-white hover:bg-gray-100 text-black px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center transition-all shadow-2xl shadow-white/10 active:scale-95"
              >
                Sell on E-Malla
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Features */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { icon: <Truck className="text-orange-500" />, title: 'Nationwide Delivery', desc: 'From Kigali to Rusizi' },
            { icon: <ShieldCheck className="text-orange-500" />, title: 'Secure Payment', desc: 'MTN MoMo, Airtel, Cards' },
            { icon: <Zap className="text-orange-500" />, title: 'Fast Service', desc: 'Same day delivery options' },
            { icon: <ShoppingBag className="text-orange-500" />, title: 'Authentic Goods', desc: 'Verified local merchants' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center space-x-4">
              <div className="p-3 bg-orange-50 rounded-full">{item.icon}</div>
              <div>
                <h4 className="font-bold text-gray-900">{item.title}</h4>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold mb-2">Popular Categories</h2>
            <p className="text-gray-500">Browse our diverse collection of items</p>
          </div>
          <Link to="/shop" className="text-orange-500 font-semibold flex items-center hover:underline group">
            View All <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {CATEGORIES.map((cat) => (
            <Link 
              key={cat.id} 
              to={`/shop?category=${cat.id}`} 
              className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-xl transition-all hover:border-orange-200 group"
            >
              <div className="text-orange-500 mb-4 group-hover:scale-125 transition-transform duration-300">
                {cat.icon}
              </div>
              <span className="font-bold text-gray-700 text-sm text-center">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-gray-500">Hand-picked items from our top verified merchants</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((id) => (
              <div 
                key={id} 
                onClick={() => navigate(`/product/p${id}`)}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all group border border-gray-100 cursor-pointer flex flex-col"
              >
                <div className="h-64 relative overflow-hidden bg-gray-50">
                  <img 
                    src={`https://picsum.photos/id/${id + 10}/400/400`} 
                    alt="Product" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">New Arrival</div>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[2px]">Featured</p>
                    <div className="flex items-center text-yellow-400">
                       <Star size={10} fill="currentColor" />
                       <span className="text-[10px] font-black text-gray-900 ml-1">4.9</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-6 truncate text-lg">Premium Product Package {id}</h3>
                  <div className="mt-auto space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-orange-600 font-black text-xl">RWF { (15000 * id).toLocaleString() }</span>
                    </div>
                    <button 
                      onClick={(e) => handleAddToCart(e, id)}
                      className={`w-full py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center shadow-lg active:scale-[0.98] ${
                        addedItems.has(id) 
                        ? 'bg-emerald-500 text-white shadow-emerald-200' 
                        : 'bg-black text-white hover:bg-orange-600 shadow-black/10'
                      }`}
                    >
                      {addedItems.has(id) ? (
                        <><Check size={14} className="mr-2" /> Added</>
                      ) : (
                        <><ShoppingBag size={14} className="mr-2" /> Add to Cart</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="bg-yellow-400 rounded-[40px] p-12 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-yellow-100">
          <div className="absolute inset-0 imigongo-bg opacity-10"></div>
          <div className="relative z-10 max-w-xl text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-6 leading-tight">
              Empowering Rwandan <br/><span className="text-white bg-black px-2">Entrepreneurs.</span>
            </h2>
            <p className="text-xl text-gray-800 mb-10 font-medium opacity-80">
              Join thousands of merchants who have expanded their reach through our platform. We handle the logistics, you focus on your craft.
            </p>
            <Link to="/become-seller" className="bg-black text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-800 transition-all shadow-2xl shadow-black/20 inline-block active:scale-95">
              Start Selling Today
            </Link>
          </div>
          <div className="mt-12 md:mt-0 md:w-1/3 flex justify-center">
             <div className="w-64 h-64 bg-black/10 rounded-full flex items-center justify-center p-8 backdrop-blur-sm border border-black/5">
                <Store size={120} className="text-black" />
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
