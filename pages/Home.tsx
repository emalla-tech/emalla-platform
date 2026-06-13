
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { ShoppingBag, ArrowRight, ShieldCheck, Truck, Zap, Store, Check, Star } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { getProductPrimaryImage, handleProductImageError } from '../lib/productImages';
import { useLanguage } from '../i18n/LanguageContext';

interface HomeProps {
  onAddToCart: (item: { productId: string; quantity: number }) => void;
}

const TRUSTED_BRANDS = [
  { name: 'HP', logo: '/brands/hp.svg' },
  { name: 'Dell', logo: '/brands/dell.svg' },
  { name: 'Lenovo', logo: '/brands/lenovo.svg', wordmark: true },
  { name: 'Apple', logo: '/brands/apple.svg' },
  { name: 'Epson', logo: '/brands/epson.svg', wordmark: true },
  { name: 'Samsung', logo: '/brands/samsung.svg', wordmark: true },
  { name: 'Cisco', logo: '/brands/cisco.svg', wordmark: true },
  { name: 'TP-Link', logo: '/brands/tplink.svg' },
  { name: 'Canon', logo: '/brands/canon.svg', wordmark: true },
  { name: 'Hikvision', logo: '/brands/hikvision.svg', wordmark: true },
  { name: 'D-Link', logo: '/brands/dlink.svg', wordmark: true },
  { name: 'OfficePoint', logo: '/brands/officepoint.svg', wordmark: true },
  { name: 'Brother', logo: '/brands/brother.svg', wordmark: true },
  { name: 'Lightwave', logo: '/brands/lightwave.svg', wordmark: true },
];

const Home: React.FC<HomeProps> = ({ onAddToCart }) => {
  const navigate = useNavigate();
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const products = useProducts();
  const { t } = useLanguage();
  const featuredProducts = [...products].sort((left, right) => Number(Boolean(right.featured)) - Number(Boolean(left.featured))).slice(0, 8);

  const handleAddToCart = (e: React.MouseEvent, productId: string, stock: number) => {
    e.stopPropagation();
    if (stock <= 0) return;
    onAddToCart({ productId, quantity: 1 });
    setAddedItems(prev => new Set(prev).add(productId));
    setTimeout(() => setAddedItems(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    }), 2000);
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[750px] flex items-center bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=1920"
            alt="Hero Background"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="bg-orange-500 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[2px] mb-8 inline-block shadow-lg">
              {t.home.heroBadge}
            </span>
            <h1 className="text-6xl md:text-8xl font-black leading-[1.05] mb-8 tracking-tight">
              {t.home.heroTitleLine1} <br/>
              <span className="text-orange-500">{t.home.heroTitleLine2}</span>
            </h1>
            <p className="text-xl text-gray-200 mb-12 leading-relaxed font-medium max-w-xl">
              {t.home.heroDescription}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/shop" 
                className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center transition-all shadow-2xl shadow-orange-500/20 active:scale-95 group"
              >
                <span>{t.home.exploreShop}</span>
                <ShoppingBag className="ml-3 group-hover:rotate-12 transition-transform" size={22} />
              </Link>
              <Link 
                to="/become-seller" 
                className="bg-white hover:bg-gray-100 text-black px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center transition-all shadow-2xl shadow-white/10 active:scale-95"
              >
                {t.home.sellOnEmalla}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Features */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { icon: <Truck className="text-orange-500" />, title: t.home.trust1Title, desc: t.home.trust1Desc },
            { icon: <ShieldCheck className="text-orange-500" />, title: t.home.trust2Title, desc: t.home.trust2Desc },
            { icon: <Zap className="text-orange-500" />, title: t.home.trust3Title, desc: t.home.trust3Desc },
            { icon: <ShoppingBag className="text-orange-500" />, title: t.home.trust4Title, desc: t.home.trust4Desc },
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

      {/* Popular Brands */}
      <section className="trusted-brands-section" aria-labelledby="trusted-brands-title">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-7">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-500 mb-2">Popular brands</p>
              <h2 id="trusted-brands-title" className="text-2xl md:text-3xl font-black text-gray-900">Explore brands shoppers know</h2>
            </div>
            <p className="max-w-md text-sm text-gray-500 font-medium md:text-right">
              Explore the marketplace by brand and discover current listings from sellers across Rwanda.
            </p>
          </div>
        </div>

        <div className="trusted-brands-marquee" aria-label="Browse products by brand">
          <div className="trusted-brands-track">
            {[...TRUSTED_BRANDS, ...TRUSTED_BRANDS].map((brand, index) => (
              <Link
                key={`${brand.name}-${index}`}
                to={`/shop?search=${encodeURIComponent(brand.name)}`}
                className="trusted-brand-card"
                aria-label={`Shop ${brand.name} products`}
                aria-hidden={index >= TRUSTED_BRANDS.length}
                tabIndex={index >= TRUSTED_BRANDS.length ? -1 : 0}
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  loading="lazy"
                  decoding="async"
                  className={`trusted-brand-logo${brand.wordmark ? ' trusted-brand-logo--wordmark' : ''}`}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold mb-2">{t.home.categoriesTitle}</h2>
            <p className="text-gray-500">{t.home.categoriesSubtitle}</p>
          </div>
          <Link to="/shop" className="text-orange-500 font-semibold flex items-center hover:underline group">
            {t.home.viewAll} <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
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
            <h2 className="text-3xl font-bold mb-4">{t.home.featuredTitle}</h2>
            <p className="text-gray-500">{t.home.featuredSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <div 
                key={product.id} 
                onClick={() => navigate(`/product/${product.id}`)}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all group border border-gray-100 cursor-pointer flex flex-col"
              >
                <div className="h-64 relative overflow-hidden bg-gray-50">
                  <img 
                    src={getProductPrimaryImage(product)} 
                    alt={product.name} 
                    onError={(event) => handleProductImageError(event, product.category)}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    {product.featured ? t.home.featured : t.home.newArrival}
                  </div>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[2px]">{t.home.featured}</p>
                    <div className="flex items-center text-yellow-400">
                       <Star size={10} fill="currentColor" />
                       <span className="text-[10px] font-black text-gray-900 ml-1">{product.rating}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-6 truncate text-lg">{product.name}</h3>
                  <div className="mt-auto space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-orange-600 font-black text-xl">RWF {product.price.toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={(e) => handleAddToCart(e, product.id, product.stock)}
                      disabled={product.stock <= 0}
                      className={`w-full py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center shadow-lg active:scale-[0.98] ${
                        product.stock <= 0
                        ? 'cursor-not-allowed bg-gray-200 text-gray-500 shadow-none'
                        : addedItems.has(product.id)
                        ? 'bg-emerald-500 text-white shadow-emerald-200' 
                        : 'bg-black text-white hover:bg-orange-600 shadow-black/10'
                      }`}
                    >
                      {product.stock <= 0 ? (
                        <>Out of Stock</>
                      ) : addedItems.has(product.id) ? (
                        <><Check size={14} className="mr-2" /> {t.home.added}</>
                      ) : (
                        <><ShoppingBag size={14} className="mr-2" /> {t.home.addToCart}</>
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
              {t.home.ctaTitleLine1} <br/><span className="text-white bg-black px-2">{t.home.ctaTitleLine2}</span>
            </h2>
            <p className="text-xl text-gray-800 mb-10 font-medium opacity-80">
              {t.home.ctaDescription}
            </p>
            <Link to="/become-seller" className="bg-black text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-800 transition-all shadow-2xl shadow-black/20 inline-block active:scale-95">
              {t.home.ctaButton}
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
