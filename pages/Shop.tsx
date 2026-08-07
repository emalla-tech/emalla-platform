
import React, { useState, useMemo, useEffect, useRef, useDeferredValue } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { ShoppingBag, Search, Filter, Star, ChevronRight, Check, Clock, X, TrendingUp, Heart, MessageSquare } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../auth/AuthContext';
import { CustomerService } from '../services/customerService';
import { getProductPrimaryImage, handleProductImageError } from '../lib/productImages';
import { useLanguage } from '../i18n/LanguageContext';
import { Product } from '../types';

interface ShopProps {
  onAddToCart?: (item: { productId: string; quantity: number }) => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
}

const RECENT_SEARCHES_KEY = 'emalla_recent_searches';

const TRUSTED_BRANDS = [
  'HP',
  'Dell',
  'Lenovo',
  'Apple',
  'Epson',
  'Samsung',
  'Cisco',
  'TP-Link',
  'Canon',
  'Hikvision',
  'D-Link',
  'OfficePoint',
  'Brother',
  'Lightwave'
];

const PRICE_RANGES = [
  { id: 'under-50000', label: 'Under RWF 50k', min: 0, max: 50000 },
  { id: '50000-150000', label: 'RWF 50k - 150k', min: 50000, max: 150000 },
  { id: '150000-500000', label: 'RWF 150k - 500k', min: 150000, max: 500000 },
  { id: 'above-500000', label: 'Above RWF 500k', min: 500000, max: Infinity }
];

const AVAILABILITY_FILTERS = [
  { id: 'in-stock', label: 'In Stock' },
  { id: 'quote', label: 'Price on Request' },
  { id: 'hub-ready', label: 'Hub Ready' },
  { id: 'on-demand', label: 'Imported / Preorder' }
];

const normalizeFilterValue = (value: string) => value.trim().toLowerCase();

const getProductSearchBlob = (product: Product) => [
  product.name,
  product.description,
  product.specifications,
  product.merchantName,
  ...(product.tags || [])
].filter(Boolean).join(' ').toLowerCase();

const productMatchesBrand = (product: Product, brand: string) => {
  const normalizedBrand = normalizeFilterValue(brand);
  if (!normalizedBrand) return true;
  return getProductSearchBlob(product).includes(normalizedBrand);
};

const productMatchesPriceRange = (product: Product, rangeId: string) => {
  const selectedPriceRange = PRICE_RANGES.find((range) => range.id === rangeId);
  if (!selectedPriceRange) return true;
  return product.pricingType !== 'quote' && product.price >= selectedPriceRange.min && product.price <= selectedPriceRange.max;
};

const productMatchesAvailability = (product: Product, availabilityId: string) => {
  if (availabilityId === 'all') return true;
  if (availabilityId === 'in-stock') return product.stock > 0;
  if (availabilityId === 'quote') return product.pricingType === 'quote';
  if (availabilityId === 'hub-ready') return product.stock > 0 && product.fulfillmentType !== 'imported_on_demand';
  if (availabilityId === 'on-demand') return ['imported_on_demand', 'preorder'].includes(String(product.fulfillmentType));
  return true;
};

const Shop: React.FC<ShopProps> = ({ onAddToCart }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const products = useProducts();
  const [searchParams, setSearchParamsSetter] = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';
  const urlSearch = searchParams.get('search') || '';
  const currentBrand = searchParams.get('brand') || 'all';
  const currentPriceRange = searchParams.get('price') || 'all';
  const currentAvailability = searchParams.get('availability') || 'all';
  const currentSize = searchParams.get('size') || 'all';
  const currentColor = searchParams.get('color') || 'all';
  
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadWishlist = async () => {
      if (user?.role !== 'CUSTOMER') {
        setWishlistIds(new Set());
        return;
      }

      const productIds = await CustomerService.getWishlistProductIds();
      setWishlistIds(new Set(productIds));
    };

    loadWishlist();
  }, [user]);

  // Update local search term if URL changes
  useEffect(() => {
    setSearchTerm(urlSearch);
  }, [urlSearch]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = currentCategory === 'all' || product.category === currentCategory;
      const searchableText = [
        product.name,
        product.description,
        product.specifications,
        product.merchantName,
        CATEGORIES.find((category) => category.id === product.category)?.name,
        ...(product.tags || [])
      ].join(' ').toLowerCase();
      const matchesSearch = searchableText.includes(deferredSearchTerm.toLowerCase());

      const matchesBrand = currentBrand === 'all' || productMatchesBrand(product, currentBrand);
      const matchesPrice = productMatchesPriceRange(product, currentPriceRange);
      const matchesAvailability = productMatchesAvailability(product, currentAvailability);
      const matchesSize = currentSize === 'all' || (product.variants?.sizes || []).some((size) => normalizeFilterValue(size) === normalizeFilterValue(currentSize));
      const matchesColor = currentColor === 'all' || (product.variants?.colors || []).some((color) => normalizeFilterValue(color.name) === normalizeFilterValue(currentColor));

      return matchesCategory && matchesSearch && matchesBrand && matchesPrice && matchesAvailability && matchesSize && matchesColor;
    });
  }, [currentAvailability, currentBrand, currentCategory, currentColor, currentPriceRange, currentSize, products, deferredSearchTerm]);

  const availableBrands = useMemo(() => {
    return TRUSTED_BRANDS.filter((brand) => products.some((product) => productMatchesBrand(product, brand)));
  }, [products]);

  const availableSizes = useMemo(() => {
    return Array.from(new Set(products.flatMap((product) => product.variants?.sizes || []))).sort();
  }, [products]);

  const availableColors = useMemo(() => {
    return Array.from(new Set(products.flatMap((product) => (product.variants?.colors || []).map((color) => color.name)))).sort();
  }, [products]);

  const activeFilterCount = [
    currentCategory !== 'all',
    Boolean(urlSearch),
    currentBrand !== 'all',
    currentPriceRange !== 'all',
    currentAvailability !== 'all',
    currentSize !== 'all',
    currentColor !== 'all'
  ].filter(Boolean).length;

  const selectedCategoryLabel = currentCategory === 'all'
    ? ''
    : CATEGORIES.find((category) => category.id === currentCategory)?.name || currentCategory;
  const selectedPriceLabel = PRICE_RANGES.find((range) => range.id === currentPriceRange)?.label || '';
  const selectedAvailabilityLabel = AVAILABILITY_FILTERS.find((filter) => filter.id === currentAvailability)?.label || '';

  const categoryFilterOptions = useMemo(() => [
    { id: 'all', label: t.shop.allProducts, count: products.length, icon: null },
    ...CATEGORIES.map((category) => ({
      id: category.id,
      label: category.name,
      count: products.filter((product) => product.category === category.id).length,
      icon: category.icon
    }))
  ], [products, t.shop.allProducts]);

  const brandFilterOptions = useMemo(() => availableBrands.map((brand) => ({
    id: brand,
    label: brand,
    count: products.filter((product) => productMatchesBrand(product, brand)).length
  })), [availableBrands, products]);

  const priceFilterOptions = useMemo(() => PRICE_RANGES.map((range) => ({
    ...range,
    count: products.filter((product) => productMatchesPriceRange(product, range.id)).length
  })), [products]);

  const availabilityFilterOptions = useMemo(() => AVAILABILITY_FILTERS.map((filter) => ({
    ...filter,
    count: products.filter((product) => productMatchesAvailability(product, filter.id)).length
  })), [products]);

  const sizeFilterOptions = useMemo(() => availableSizes.map((size) => ({
    id: size,
    label: size,
    count: products.filter((product) => (product.variants?.sizes || []).some((productSize) => normalizeFilterValue(productSize) === normalizeFilterValue(size))).length
  })), [availableSizes, products]);

  const colorFilterOptions = useMemo(() => availableColors.map((color) => ({
    id: color,
    label: color,
    count: products.filter((product) => (product.variants?.colors || []).some((productColor) => normalizeFilterValue(productColor.name) === normalizeFilterValue(color))).length
  })), [availableColors, products]);

  const searchSuggestions = useMemo(() => {
    if (!deferredSearchTerm.trim()) return [];
    return products
      .filter((p) => [p.name, p.description, ...(p.tags || [])].join(' ').toLowerCase().includes(deferredSearchTerm.toLowerCase()))
      .slice(0, 5)
      .map(p => p.name);
  }, [products, deferredSearchTerm]);

  const categorySuggestions = useMemo(() => {
    return CATEGORIES.slice(0, 6);
  }, []);

  const trendingProducts = useMemo(() => {
    return [...products]
      .sort((left, right) => (Number(Boolean(right.featured)) + right.rating) - (Number(Boolean(left.featured)) + left.rating))
      .slice(0, 4);
  }, [products]);

  const addToRecentSearches = (term: string) => {
    if (!term.trim()) return;
    const newHistory = [term, ...recentSearches.filter(s => s !== term)].slice(0, 6);
    setRecentSearches(newHistory);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newHistory));
  };

  const handleSearchSubmit = (term: string) => {
    setSearchTerm(term);
    addToRecentSearches(term);
    setIsSearchFocused(false);
    
    const newParams = new URLSearchParams(searchParams);
    if (term) {
      newParams.set('search', term);
    } else {
      newParams.delete('search');
    }
    setSearchParamsSetter(newParams);
  };

  const handleCategoryClick = (categoryId: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (categoryId === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', categoryId);
    }
    setSearchParamsSetter(newParams);
  };

  const handleFilterClick = (key: 'brand' | 'price' | 'availability' | 'size' | 'color', value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParamsSetter(newParams);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSearchParamsSetter(new URLSearchParams());
  };

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleAddToCart = (e: React.MouseEvent, productId: string, stock: number) => {
    e.stopPropagation();
    if (stock <= 0) return;
    if (onAddToCart) onAddToCart({ productId, quantity: 1 });
    setAddedItems(prev => new Set(prev).add(productId));
    
    const rect = e.currentTarget.getBoundingClientRect();
    const newParticle = { id: Date.now(), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    setParticles(prev => [...prev, newParticle]);
    
    setTimeout(() => setParticles(prev => prev.filter(p => p.id !== newParticle.id)), 800);
    setTimeout(() => setAddedItems(prev => { 
      const next = new Set(prev); 
      next.delete(productId); 
      return next; 
    }), 2000);
  };

  const handleToggleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (user?.role !== 'CUSTOMER') {
      navigate('/login');
      return;
    }

    const isWishlisted = wishlistIds.has(productId);
    await CustomerService.toggleWishlist(productId, isWishlisted);
    setWishlistIds((current) => {
      const next = new Set(current);
      if (isWishlisted) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const renderFilterOption = (
    option: { id: string; label: string; count: number; icon?: React.ReactNode },
    active: boolean,
    onClick: () => void,
    mode: 'radio' | 'checkbox' = 'radio'
  ) => (
    <button
      type="button"
      key={option.id}
      onClick={onClick}
      disabled={option.count === 0 && !active}
      className={`group flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition-all ${
        active
          ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-100'
          : option.count === 0
          ? 'cursor-not-allowed text-gray-300'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center border transition-colors ${
            mode === 'checkbox' ? 'rounded-[5px]' : 'rounded-full'
          } ${active ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-300 bg-white group-hover:border-orange-300'}`}
        >
          {active && (mode === 'checkbox' ? <Check size={11} strokeWidth={4} /> : <span className="h-1.5 w-1.5 rounded-full bg-white" />)}
        </span>
        {option.icon && <span className="scale-75 opacity-70">{option.icon}</span>}
        <span className="truncate text-sm font-semibold">{option.label}</span>
      </span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${active ? 'bg-white text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
        {option.count}
      </span>
    </button>
  );

  const renderFilterSection = (title: string, children: React.ReactNode, subtitle?: string) => (
    <section className="border-t border-gray-100 pt-5 first:border-t-0 first:pt-0">
      <div className="mb-3">
        <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-900">{title}</h4>
        {subtitle && <p className="mt-1 text-xs font-medium leading-5 text-gray-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  );

  return (
    <div className="bg-gray-50 min-h-screen pb-28 md:pb-20">
      <style>{`
        @keyframes flyToCart {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(calc(100vw - var(--start-x) - 100px), calc(-var(--start-y) + 20px)) scale(0.2); opacity: 0; }
        }
        .cart-particle { position: fixed; pointer-events: none; z-index: 9999; animation: flyToCart 0.8s cubic-bezier(0.165, 0.84, 0.44, 1) forwards; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Flying Particles */}
      {particles.map(p => (
        <div key={p.id} className="cart-particle bg-orange-500 text-white p-2 rounded-full shadow-lg" style={{ left: p.x, top: p.y, '--start-x': `${p.x}px`, '--start-y': `${p.y}px` } as any}>
          <ShoppingBag size={16} />
        </div>
      ))}

      {/* Header / Search Area */}
      <div className="bg-white border-b sticky top-20 z-40 py-4 md:py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1560px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-black text-gray-900">{t.shop.title}</h1>
          
          <div className="relative w-full md:w-[500px]" ref={searchContainerRef}>
            <div className={`relative flex items-center transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
              <Search className={`absolute left-4 transition-colors duration-300 ${isSearchFocused ? 'text-orange-500' : 'text-gray-400'}`} size={20} />
              <input 
                type="text" 
                placeholder="Search products, shops, categories..."
                value={searchTerm}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(searchTerm)}
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-transparent rounded-[24px] focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-50/5 outline-none font-bold text-gray-900 shadow-sm transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => handleSearchSubmit('')}
                  className="absolute right-4 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Search Dropdown */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-[32px] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-2">
                  {searchTerm.trim() && searchSuggestions.length > 0 && (
                    <div className="mb-4">
                      <div className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                        <TrendingUp size={14} className="mr-2" />
                        {t.shop.suggestions}
                      </div>
                      <div className="space-y-1">
                        {searchSuggestions.map((s, i) => (
                          <button 
                            key={i}
                            onClick={() => handleSearchSubmit(s)}
                            className="w-full text-left px-4 py-3 hover:bg-orange-50 rounded-2xl flex items-center group transition-colors"
                          >
                            <span className="text-gray-900 font-bold group-hover:text-orange-600">{s}</span>
                            <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 text-orange-500 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {recentSearches.length > 0 && (
                    <div>
                      <div className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between items-center">
                        <span className="flex items-center"><Clock size={14} className="mr-2" /> {t.shop.recentSearches}</span>
                        <button onClick={clearRecentSearches} className="text-orange-500 hover:underline">{t.shop.clearHistory}</button>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((s, i) => (
                          <button 
                            key={i}
                            onClick={() => handleSearchSubmit(s)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-2xl flex items-center group transition-colors"
                          >
                            <span className="text-gray-600 font-medium group-hover:text-gray-900">{s}</span>
                            <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!searchTerm.trim() && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <div className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                        <TrendingUp size={14} className="mr-2" />
                        Trending Products
                      </div>
                      <div className="space-y-2 px-4 pb-3">
                        {trendingProducts.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => {
                              setIsSearchFocused(false);
                              navigate(`/product/${product.id}`);
                            }}
                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-gray-50"
                          >
                            <img
                              src={getProductPrimaryImage(product)}
                              onError={(event) => handleProductImageError(event, product.category)}
                              alt={product.name}
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-gray-900">{product.name}</p>
                              <p className="text-xs font-bold text-orange-500">
                                {product.pricingType === 'quote' ? 'Price on Request' : `RWF ${product.price.toLocaleString()}`}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                        <Filter size={14} className="mr-2" />
                        Popular Categories
                      </div>
                      <div className="flex flex-wrap gap-2 px-4 pb-2">
                        {categorySuggestions.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => {
                              handleCategoryClick(category.id);
                              setIsSearchFocused(false);
                            }}
                            className="rounded-full bg-gray-50 px-3 py-2 text-xs font-black text-gray-600 transition-colors hover:bg-orange-50 hover:text-orange-600"
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!searchTerm.trim() && recentSearches.length === 0 && (
                    <div className="p-8 text-center">
                      <Search size={32} className="mx-auto text-gray-100 mb-4" />
                      <p className="text-sm font-bold text-gray-400">Recent searches and category suggestions will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col lg:flex-row gap-6 xl:gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm lg:sticky lg:top-44">
              <div className="border-b border-gray-100 bg-gray-950 px-5 py-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">Refine Results</p>
                    <h3 className="mt-1 text-xl font-black tracking-tight">Shop smarter</h3>
                    <p className="mt-1 text-xs font-semibold text-white/55">{filteredProducts.length} matching products</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Filter size={18} />
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-gray-950 transition-all hover:bg-orange-100"
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              <div className="max-h-none space-y-6 p-5 lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto">
                {renderFilterSection(
                  t.shop.categories,
                  <div className="space-y-1.5">
                    {categoryFilterOptions.map((option) =>
                      renderFilterOption(
                        option,
                        currentCategory === option.id,
                        () => handleCategoryClick(option.id)
                      )
                    )}
                  </div>,
                  'Browse by department'
                )}

                {brandFilterOptions.length > 0 && renderFilterSection(
                  'Brand',
                  <div className="space-y-1.5">
                    {renderFilterOption(
                      { id: 'all', label: 'All brands', count: products.length },
                      currentBrand === 'all',
                      () => handleFilterClick('brand', 'all')
                    )}
                    {brandFilterOptions.map((option) =>
                      renderFilterOption(
                        option,
                        currentBrand === option.id,
                        () => handleFilterClick('brand', option.id),
                        'checkbox'
                      )
                    )}
                  </div>,
                  'Trusted names and product makers'
                )}

                {renderFilterSection(
                  'Price',
                  <div className="space-y-1.5">
                    {renderFilterOption(
                      { id: 'all', label: 'Any price', count: products.length },
                      currentPriceRange === 'all',
                      () => handleFilterClick('price', 'all')
                    )}
                    {priceFilterOptions.map((option) =>
                      renderFilterOption(
                        option,
                        currentPriceRange === option.id,
                        () => handleFilterClick('price', option.id)
                      )
                    )}
                  </div>,
                  'Filter fixed-price products'
                )}

                {renderFilterSection(
                  'Availability',
                  <div className="space-y-1.5">
                    {renderFilterOption(
                      { id: 'all', label: 'All availability', count: products.length },
                      currentAvailability === 'all',
                      () => handleFilterClick('availability', 'all')
                    )}
                    {availabilityFilterOptions.map((option) =>
                      renderFilterOption(
                        option,
                        currentAvailability === option.id,
                        () => handleFilterClick('availability', option.id),
                        'checkbox'
                      )
                    )}
                  </div>,
                  'Stock, quotes, and fulfillment'
                )}

                {sizeFilterOptions.length > 0 && renderFilterSection(
                  'Size',
                  <div className="space-y-1.5">
                    {renderFilterOption(
                      { id: 'all', label: 'All sizes', count: products.length },
                      currentSize === 'all',
                      () => handleFilterClick('size', 'all')
                    )}
                    {sizeFilterOptions.map((option) =>
                      renderFilterOption(
                        option,
                        currentSize === option.id,
                        () => handleFilterClick('size', option.id),
                        'checkbox'
                      )
                    )}
                  </div>
                )}

                {colorFilterOptions.length > 0 && renderFilterSection(
                  'Color',
                  <div className="space-y-1.5">
                    {renderFilterOption(
                      { id: 'all', label: 'All colors', count: products.length },
                      currentColor === 'all',
                      () => handleFilterClick('color', 'all')
                    )}
                    {colorFilterOptions.map((option) =>
                      renderFilterOption(
                        option,
                        currentColor === option.id,
                        () => handleFilterClick('color', option.id),
                        'checkbox'
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-10">
              <div className="flex flex-col gap-1">
                <p className="text-gray-500 font-medium">{t.shop.found} <span className="font-black text-gray-900">{filteredProducts.length}</span> {t.shop.results}</p>
                {urlSearch && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t.shop.searchingFor}</span>
                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-lg text-xs font-black flex items-center">
                      {urlSearch}
                      <button onClick={() => handleSearchSubmit('')} className="ml-2 hover:text-orange-900">
                        <X size={10} />
                      </button>
                    </span>
                  </div>
                )}
                {activeFilterCount > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedCategoryLabel && (
                      <button onClick={() => handleCategoryClick('all')} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-gray-600 shadow-sm ring-1 ring-gray-100 transition-colors hover:text-orange-600">
                        Category: {selectedCategoryLabel} <X size={10} className="ml-1 inline" />
                      </button>
                    )}
                    {currentBrand !== 'all' && (
                      <button onClick={() => handleFilterClick('brand', 'all')} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-gray-600 shadow-sm ring-1 ring-gray-100 transition-colors hover:text-orange-600">
                        Brand: {currentBrand} <X size={10} className="ml-1 inline" />
                      </button>
                    )}
                    {selectedPriceLabel && (
                      <button onClick={() => handleFilterClick('price', 'all')} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-gray-600 shadow-sm ring-1 ring-gray-100 transition-colors hover:text-orange-600">
                        Price: {selectedPriceLabel} <X size={10} className="ml-1 inline" />
                      </button>
                    )}
                    {selectedAvailabilityLabel && (
                      <button onClick={() => handleFilterClick('availability', 'all')} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-gray-600 shadow-sm ring-1 ring-gray-100 transition-colors hover:text-orange-600">
                        {selectedAvailabilityLabel} <X size={10} className="ml-1 inline" />
                      </button>
                    )}
                    {currentSize !== 'all' && (
                      <button onClick={() => handleFilterClick('size', 'all')} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-gray-600 shadow-sm ring-1 ring-gray-100 transition-colors hover:text-orange-600">
                        Size: {currentSize} <X size={10} className="ml-1 inline" />
                      </button>
                    )}
                    {currentColor !== 'all' && (
                      <button onClick={() => handleFilterClick('color', 'all')} className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-gray-600 shadow-sm ring-1 ring-gray-100 transition-colors hover:text-orange-600">
                        Color: {currentColor} <X size={10} className="ml-1 inline" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <select className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-orange-500 transition-colors">
                <option>{t.shop.sortRelevant}</option>
                <option>{t.shop.sortLowHigh}</option>
                <option>{t.shop.sortHighLow}</option>
                <option>{t.shop.sortNewest}</option>
              </select>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredProducts.map((product) => (
                  <article key={product.id} className="bg-white rounded-[28px] overflow-hidden shadow-sm hover:shadow-xl transition-all group border border-gray-100 flex flex-col">
                    <div className="h-44 sm:h-52 relative overflow-hidden bg-gray-50 p-3">
                      <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`} className="block w-full h-full rounded-[22px] overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">
                        <img
                          src={getProductPrimaryImage(product)}
                          alt={product.name}
                          onError={(event) => handleProductImageError(event, product.category)}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </Link>
                      <div className="absolute top-5 left-5 flex flex-col space-y-3">
                         <button 
                           onClick={(e) => handleToggleWishlist(e, product.id)}
                           aria-label={wishlistIds.has(product.id) ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                           className={`p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl transition-all hover:scale-110 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 ${
                             wishlistIds.has(product.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                           }`}
                         >
                           <Heart size={18} className={wishlistIds.has(product.id) ? 'fill-red-500' : ''} />
                         </button>
                      </div>
                      <div className="absolute bottom-5 right-5 p-2.5 bg-orange-500 text-white rounded-2xl shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <ShoppingBag size={18} />
                      </div>
                    </div>
                    
                    <div className="p-4 sm:p-5 flex-grow flex flex-col">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="truncate text-orange-500 text-[9px] font-black uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded-full">
                          {CATEGORIES.find(c => c.id === product.category)?.name}
                        </span>
                        <div className="flex shrink-0 items-center text-yellow-400 text-[11px] bg-yellow-50 px-2 py-1 rounded-lg">
                          <Star size={12} fill="currentColor" />
                          <span className="ml-1 text-gray-900 font-black">{product.rating}</span>
                        </div>
                      </div>
                      <h3 className="mb-4 min-h-12 text-sm sm:text-[15px] font-bold leading-tight text-gray-900 transition-colors group-hover:text-orange-600">
                        <Link to={`/product/${product.id}`} className="line-clamp-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">
                          {product.name}
                        </Link>
                      </h3>
                      <div className="mt-auto">
                        <div className="flex items-baseline space-x-2 mb-4">
                          <span className="text-base sm:text-lg font-black text-gray-900">
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
                          className={`w-full py-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center shadow-lg active:scale-[0.98] ${
                            product.pricingType !== 'quote' && product.stock <= 0
                            ? 'cursor-not-allowed bg-gray-200 text-gray-500 shadow-none'
                            : addedItems.has(product.id)
                            ? 'bg-emerald-500 text-white shadow-emerald-200' 
                            : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200'
                          }`}
                        >
                          {product.pricingType === 'quote' ? (
                            <><MessageSquare size={18} className="mr-2" /> Request a Quote</>
                          ) : product.stock <= 0 ? (
                            <>Out of Stock</>
                          ) : addedItems.has(product.id) ? (
                            <><Check size={18} className="mr-2" /> Added to Bag</>
                          ) : (
                            <><ShoppingBag size={18} className="mr-2" /> Add to Cart</>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[40px] p-24 text-center border-2 border-dashed border-gray-100 shadow-sm mt-10">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300">
                  <Search size={48} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-3">No matches found</h2>
                <p className="text-gray-500 max-w-sm mx-auto font-medium">Try different keywords or check our popular categories to find what you're looking for.</p>
                <button onClick={clearAllFilters} className="mt-10 bg-black text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-orange-600 transition-all">Clear All Filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
