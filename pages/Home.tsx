
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { ShoppingBag, ArrowRight, ShieldCheck, Truck, Zap, Store, Check, Star, MessageSquare } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { getProductPrimaryImage, handleProductImageError } from '../lib/productImages';
import { useLanguage } from '../i18n/LanguageContext';
import { Product } from '../types';

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

const getProductTimestamp = (product: Product) => {
  const datedProduct = product as Product & { createdAt?: string; updatedAt?: string };
  const value = datedProduct.updatedAt || datedProduct.createdAt || '';
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const Home: React.FC<HomeProps> = ({ onAddToCart }) => {
  const navigate = useNavigate();
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const products = useProducts();
  const { t } = useLanguage();
  const featuredProducts = useMemo(
    () => [...products].sort((left, right) => Number(Boolean(right.featured)) - Number(Boolean(left.featured))).slice(0, 8),
    [products]
  );
  const newArrivalProducts = useMemo(
    () => [...products].sort((left, right) => getProductTimestamp(right) - getProductTimestamp(left)).slice(0, 4),
    [products]
  );
  const todaysPicks = useMemo(
    () =>
      [...products]
        .filter((product) => product.stock > 0 || product.pricingType === 'quote')
        .sort((left, right) => {
          const leftScore = Number(Boolean(left.featured)) * 4 + Number(left.rating || 0) + Math.min(Number(left.stock || 0), 10) / 10;
          const rightScore = Number(Boolean(right.featured)) * 4 + Number(right.rating || 0) + Math.min(Number(right.stock || 0), 10) / 10;
          return rightScore - leftScore;
        })
        .slice(0, 4),
    [products]
  );
  const popularInKigali = useMemo(
    () =>
      [...products]
        .filter((product) => product.stock > 0 && product.fulfillmentType !== 'imported_on_demand')
        .sort((left, right) => Number(right.rating || 0) - Number(left.rating || 0))
        .slice(0, 4),
    [products]
  );
  const heroCampaigns = useMemo(() => {
    const availableProducts = products.filter((product) => product.stock > 0 || product.pricingType === 'quote');
    const pickProductByTerms = (terms: string[], fallbackIndex: number) => {
      const matchedProduct = availableProducts.find((product) => {
        const searchable = [
          product.name,
          product.description,
          product.subcategory,
          ...(product.tags || [])
        ].join(' ').toLowerCase();

        return terms.some((term) => searchable.includes(term));
      });

      return matchedProduct || availableProducts[fallbackIndex % Math.max(availableProducts.length, 1)] || products[fallbackIndex % Math.max(products.length, 1)];
    };

    return [
      {
        eyebrow: 'Seasonal campaign',
        title: 'Back-to-school and office essentials',
        description: 'Printers, stationery, accessories and reliable work tools for students, offices and businesses.',
        href: '/shop?search=school office printer',
        product: pickProductByTerms(['school', 'office', 'printer', 'stationery', 'supplies'], 0),
        accent: 'from-orange-500 to-amber-400'
      },
      {
        eyebrow: 'Brand spotlight',
        title: 'Business tech ready for Kigali',
        description: 'Promote trusted electronics, network gear and professional devices already listed on E-Malla.',
        href: '/shop?category=1',
        product: pickProductByTerms(['laptop', 'router', 'hub', 'hp', 'tp-link', 'usb'], 1),
        accent: 'from-gray-950 to-slate-700'
      },
      {
        eyebrow: 'Partner marketing',
        title: 'Premium slots for brands and industries',
        description: 'A curated space for institutions, suppliers and brands that want visibility on E-Malla Rwanda.',
        href: '/contact',
        product: pickProductByTerms(['money', 'counter', 'business', 'machine', 'cash'], 2),
        accent: 'from-emerald-500 to-teal-400'
      }
    ];
  }, [products]);
  const hasMarketplaceProducts = products.length > 0;

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

  const renderProductCard = (product: Product, badge: string, eyebrow = t.home.featured) => (
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
          {badge}
        </div>
      </div>
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[2px]">{eyebrow}</p>
          <div className="flex items-center text-yellow-400">
             <Star size={10} fill="currentColor" />
             <span className="text-[10px] font-black text-gray-900 ml-1">{product.rating}</span>
          </div>
        </div>
        <h3 className="font-bold text-gray-900 mb-6 truncate text-lg">{product.name}</h3>
        <div className="mt-auto space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-orange-600 font-black text-xl">
              {product.pricingType === 'quote' ? 'Price on Request' : `RWF ${product.price.toLocaleString()}`}
            </span>
          </div>
          <button
            onClick={(e) => {
              if (product.pricingType === 'quote') {
                e.stopPropagation();
                navigate(`/product/${product.id}`);
                return;
              }
              handleAddToCart(e, product.id, product.stock);
            }}
            disabled={product.pricingType !== 'quote' && product.stock <= 0}
            className={`w-full py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center shadow-lg active:scale-[0.98] ${
              product.pricingType !== 'quote' && product.stock <= 0
              ? 'cursor-not-allowed bg-gray-200 text-gray-500 shadow-none'
              : addedItems.has(product.id)
              ? 'bg-emerald-500 text-white shadow-emerald-200'
              : 'bg-black text-white hover:bg-orange-600 shadow-black/10'
            }`}
          >
            {product.pricingType === 'quote' ? (
              <><MessageSquare size={14} className="mr-2" /> Request a Quote</>
            ) : product.stock <= 0 ? (
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
  );

  const marketplaceShelves = [
    {
      eyebrow: 'Just landed',
      title: 'New Arrivals',
      subtitle: 'Freshly approved products added to the E-Malla marketplace.',
      cta: 'View new arrivals',
      href: '/shop?sort=newest',
      badge: t.home.newArrival,
      cardEyebrow: 'New Arrival',
      products: newArrivalProducts
    },
    {
      eyebrow: 'Curated today',
      title: "Today's Picks",
      subtitle: 'A rotating selection of useful products worth checking today.',
      cta: "Explore today's picks",
      href: '/shop?search=today',
      badge: 'Today',
      cardEyebrow: "Today's Pick",
      products: todaysPicks
    },
    {
      eyebrow: 'E-Malla Hub Kigali',
      title: 'Popular in Kigali',
      subtitle: 'Ready-stock items that fit fast local fulfillment through our Kigali hub.',
      cta: 'Shop Kigali-ready items',
      href: '/shop?search=Kigali',
      badge: 'Kigali',
      cardEyebrow: 'Hub Ready',
      products: popularInKigali
    }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex min-h-[calc(100svh-5rem)] items-center overflow-hidden bg-gray-950 py-10 pb-28 text-white md:min-h-[780px] md:py-16 md:pb-16">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1920"
            alt="E-Malla Rwanda marketplace marketing"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.35),transparent_34%),linear-gradient(110deg,rgba(3,7,18,0.98),rgba(3,7,18,0.86)_45%,rgba(3,7,18,0.58))]" />
          <div className="absolute -bottom-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-500/20 blur-3xl" />
        </div>
        
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="max-w-2xl">
              <span className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] font-black uppercase leading-relaxed tracking-[2px] text-orange-100 shadow-lg backdrop-blur-md md:mb-8 md:px-5 md:py-2">
                <Zap className="mr-2 text-orange-300" size={14} />
                E-Malla Campaign Hub
              </span>
              <h1 className="mb-6 text-[3rem] font-black leading-[1.02] tracking-tight sm:text-6xl md:mb-8 md:text-7xl md:leading-[1.05]">
                Market products, brands and growth stories from one powerful space.
              </h1>
              <p className="mb-8 max-w-xl text-base font-semibold leading-7 text-gray-200 sm:text-lg md:mb-10 md:text-xl md:leading-relaxed">
                A professional hero section for featured products, sponsored campaigns, seasonal offers and institutional visibility across E-Malla Rwanda.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link 
                  to="/shop" 
                  className="group flex items-center justify-center rounded-2xl bg-orange-500 px-7 py-4 text-base font-black text-white shadow-2xl shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-95 sm:px-10 sm:py-5 sm:text-lg"
                >
                  <span>{t.home.exploreShop}</span>
                  <ShoppingBag className="ml-3 transition-transform group-hover:rotate-12" size={22} />
                </Link>
                <Link 
                  to="/contact" 
                  className="flex items-center justify-center rounded-2xl bg-white px-7 py-4 text-base font-black text-black shadow-2xl shadow-white/10 transition-all hover:bg-gray-100 active:scale-95 sm:px-10 sm:py-5 sm:text-lg"
                >
                  Advertise with E-Malla
                </Link>
              </div>

              <div className="mt-9 grid grid-cols-3 gap-3 max-w-xl">
                {[
                  ['43+', 'Live products'],
                  ['3', 'Campaign slots'],
                  ['RW', 'Local reach']
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md">
                    <p className="text-2xl font-black text-white">{value}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-300">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[48px] bg-orange-500/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/10 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-4 lg:rounded-[48px]">
                <div className="grid gap-3 lg:grid-cols-[1.08fr_0.92fr]">
                  <Link
                    to={heroCampaigns[0].href}
                    className="group relative min-h-[420px] overflow-hidden rounded-[30px] bg-white text-gray-950 shadow-2xl lg:rounded-[38px]"
                  >
                    {heroCampaigns[0].product ? (
                      <img
                        src={getProductPrimaryImage(heroCampaigns[0].product)}
                        alt={heroCampaigns[0].product.name}
                        onError={(event) => handleProductImageError(event, heroCampaigns[0].product?.category)}
                        loading="eager"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${heroCampaigns[0].accent}`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/55 to-transparent" />
                    <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
                      <span className="rounded-full bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-orange-600">
                        {heroCampaigns[0].eyebrow}
                      </span>
                      <span className="rounded-full bg-gray-950/80 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white">
                        Featured
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-7">
                      <h2 className="max-w-sm text-3xl font-black leading-tight sm:text-4xl">
                        {heroCampaigns[0].title}
                      </h2>
                      <p className="mt-3 max-w-sm text-sm font-semibold leading-6 text-gray-200">
                        {heroCampaigns[0].description}
                      </p>
                      <div className="mt-6 inline-flex items-center rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-xl transition-all group-hover:bg-orange-600">
                        Explore campaign
                        <ArrowRight size={17} className="ml-2 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>

                  <div className="grid gap-3">
                    {heroCampaigns.slice(1).map((campaign) => (
                      <Link
                        key={campaign.title}
                        to={campaign.href}
                        className="group grid min-h-[204px] grid-cols-[0.92fr_1.08fr] overflow-hidden rounded-[30px] bg-white text-gray-950 shadow-xl transition-transform hover:-translate-y-1"
                      >
                        <div className={`relative bg-gradient-to-br ${campaign.accent}`}>
                          {campaign.product ? (
                            <img
                              src={getProductPrimaryImage(campaign.product)}
                              alt={campaign.product.name}
                              onError={(event) => handleProductImageError(event, campaign.product?.category)}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover mix-blend-luminosity opacity-90 transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-gray-950/15" />
                        </div>
                        <div className="flex flex-col justify-center p-5">
                          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.24em] text-orange-500">{campaign.eyebrow}</p>
                          <h3 className="text-xl font-black leading-tight text-gray-950">{campaign.title}</h3>
                          <p className="mt-3 line-clamp-3 text-xs font-semibold leading-5 text-gray-500">{campaign.description}</p>
                          <span className="mt-4 inline-flex items-center text-xs font-black uppercase tracking-widest text-gray-950">
                            View
                            <ArrowRight size={14} className="ml-2 transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
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
        <div className="home-categories-marquee" aria-label="Browse product categories">
          <div className="home-categories-track">
          {[...CATEGORIES, ...CATEGORIES].map((cat, index) => (
            <Link 
              key={`${cat.id}-${index}`}
              to={`/shop?category=${cat.id}`} 
              className="home-category-card group"
              aria-hidden={index >= CATEGORIES.length}
              tabIndex={index >= CATEGORIES.length ? -1 : 0}
            >
              <div className="text-orange-500 mb-4 group-hover:scale-125 transition-transform duration-300">
                {cat.icon}
              </div>
              <span className="font-bold text-gray-700 text-sm text-center">{cat.name}</span>
            </Link>
          ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t.home.featuredTitle}</h2>
            <p className="text-gray-500">{t.home.featuredSubtitle}</p>
          </div>
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => renderProductCard(product, product.featured ? t.home.featured : t.home.newArrival))}
            </div>
          ) : (
            <div className="mx-auto max-w-5xl overflow-hidden rounded-[40px] border border-orange-100 bg-white text-left shadow-xl shadow-orange-100/50">
              <div className="grid gap-8 p-7 md:grid-cols-[1.2fr_0.8fr] md:p-10">
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-orange-500">Featured products</p>
                  <h3 className="text-3xl font-black leading-tight text-gray-950 md:text-4xl">
                    Featured products are not available right now.
                  </h3>
                  <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-gray-500">
                    Browse the shop to see the latest available listings, or contact E-Malla Rwanda if you need help finding a specific item.
                  </p>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Link to="/contact" className="rounded-2xl bg-orange-500 px-6 py-4 text-center text-sm font-black text-white shadow-xl shadow-orange-200 transition-all hover:bg-orange-600 active:scale-[0.98]">
                      Contact E-Malla
                    </Link>
                    <Link to="/shop" className="rounded-2xl bg-gray-950 px-6 py-4 text-center text-sm font-black text-white shadow-xl shadow-gray-200 transition-all hover:bg-gray-800 active:scale-[0.98]">
                      Browse Shop
                    </Link>
                  </div>
                </div>
                <div className="rounded-[32px] bg-gray-950 p-6 text-white">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-500/15 text-orange-300">
                    <ShoppingBag size={30} />
                  </div>
                  <div className="space-y-4">
                    {['Verified sellers', 'Secure product media', 'Reliable delivery readiness'].map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3 text-sm font-black">
                        <Check size={16} className="text-orange-300" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Marketplace Shelves */}
      {hasMarketplaceProducts && <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl space-y-16 px-4">
          {marketplaceShelves.map((shelf, index) => (
            shelf.products.length > 0 ? (
              <div key={shelf.title} className={`rounded-[40px] border border-gray-100 p-6 md:p-10 ${index === 1 ? 'bg-gray-950 text-white shadow-2xl shadow-gray-200' : 'bg-gray-50'}`}>
                <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className={`mb-2 text-[10px] font-black uppercase tracking-[0.28em] ${index === 1 ? 'text-orange-300' : 'text-orange-500'}`}>{shelf.eyebrow}</p>
                    <h2 className={`text-3xl font-black md:text-4xl ${index === 1 ? 'text-white' : 'text-gray-900'}`}>{shelf.title}</h2>
                    <p className={`mt-3 max-w-xl text-sm font-medium leading-6 ${index === 1 ? 'text-gray-300' : 'text-gray-500'}`}>{shelf.subtitle}</p>
                  </div>
                  <Link
                    to={shelf.href}
                    className={`inline-flex items-center rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
                      index === 1 ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-black text-white hover:bg-orange-500'
                    }`}
                  >
                    {shelf.cta}
                    <ArrowRight size={16} className="ml-2" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {shelf.products.map((product) => renderProductCard(product, shelf.badge, shelf.cardEyebrow))}
                </div>
              </div>
            ) : null
          ))}
        </div>
      </section>}

      {/* CTA Section */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="bg-yellow-400 rounded-[40px] p-10 md:p-14 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-yellow-100">
          <div className="absolute inset-0 imigongo-bg opacity-10"></div>
          <div className="relative z-10 max-w-xl text-center md:text-left">
            <p className="text-xl text-gray-800 mb-8 font-medium opacity-80">
              {t.home.ctaDescription}
            </p>
            <Link to="/become-seller" className="bg-black text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-800 transition-all shadow-2xl shadow-black/20 inline-block active:scale-95">
              {t.home.ctaButton}
            </Link>
          </div>
          <div className="mt-10 md:mt-0 md:w-1/3 flex justify-center">
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
