
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { ShoppingBag, Search, Filter, Star, ChevronRight, Check, Clock, X, TrendingUp, Heart } from 'lucide-react';

// Mock product data covering all categories
const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Smart Watch Series 7', price: 120000, category: '1', rating: 4.8, reviews: 124, image: 'https://picsum.photos/id/175/400/400' },
  { id: 'p2', name: 'Wireless Noise Cancelling Headphones', price: 85000, category: '1', rating: 4.5, reviews: 89, image: 'https://picsum.photos/id/211/400/400' },
  { id: 'p3', name: 'Cotton Linen Summer Shirt', price: 15000, category: '2', rating: 4.2, reviews: 45, image: 'https://picsum.photos/id/338/400/400' },
  { id: 'p4', name: 'Leather Weekend Bag', price: 45000, category: '2', rating: 4.9, reviews: 32, image: 'https://picsum.photos/id/353/400/400' },
  { id: 'p5', name: 'Modern Ceramic Vase', price: 22000, category: '3', rating: 4.7, reviews: 12, image: 'https://picsum.photos/id/401/400/400' },
  { id: 'p6', name: 'Smart LED Light Bulb', price: 8000, category: '3', rating: 4.4, reviews: 67, image: 'https://picsum.photos/id/445/400/400' },
  { id: 'p7', name: 'Organic Arabica Coffee (500g)', price: 12000, category: '4', rating: 5.0, reviews: 210, image: 'https://picsum.photos/id/425/400/400' },
  { id: 'p8', name: 'Fresh Rwandan Tea Leaves', price: 5000, category: '4', rating: 4.8, reviews: 156, image: 'https://picsum.photos/id/429/400/400' },
  { id: 'p9', name: 'Moisturizing Face Cream', price: 18000, category: '5', rating: 4.3, reviews: 28, image: 'https://picsum.photos/id/449/400/400' },
  { id: 'p10', name: 'Sandalwood Fragrance Oil', price: 25000, category: '5', rating: 4.6, reviews: 19, image: 'https://picsum.photos/id/450/400/400' },
  { id: 'p11', name: 'History of Rwanda: A Journey', price: 15000, category: '6', rating: 4.9, reviews: 54, image: 'https://picsum.photos/id/460/400/400' },
  { id: 'p12', name: 'African Contemporary Art Guide', price: 35000, category: '6', rating: 4.7, reviews: 8, image: 'https://picsum.photos/id/461/400/400' },
  { id: 'p13', name: 'Ultra-slim Laptop Pro', price: 850000, category: '1', rating: 4.9, reviews: 42, image: 'https://picsum.photos/id/180/400/400' },
  { id: 'p14', name: 'Handcrafted Woven Basket', price: 12000, category: '3', rating: 5.0, reviews: 112, image: 'https://picsum.photos/id/475/400/400' },
];

interface ShopProps {
  onAddToCart?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
}

const RECENT_SEARCHES_KEY = 'emalla_recent_searches';

const Shop: React.FC<ShopProps> = ({ onAddToCart }) => {
  const navigate = useNavigate();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParamsSetter] = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';
  const urlSearch = searchParams.get('search') || '';
  
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
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

  // Update local search term if URL changes
  useEffect(() => {
    setSearchTerm(urlSearch);
  }, [urlSearch]);

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(product => {
      const matchesCategory = currentCategory === 'all' || product.category === currentCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [currentCategory, searchTerm]);

  const searchSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return MOCK_PRODUCTS
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 5)
      .map(p => p.name);
  }, [searchTerm]);

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

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleAddToCart = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (onAddToCart) onAddToCart();
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

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
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
      <div className="bg-white border-b sticky top-20 z-40 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-black text-gray-900">Marketplace</h1>
          
          <div className="relative w-full md:w-[500px]" ref={searchContainerRef}>
            <div className={`relative flex items-center transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
              <Search className={`absolute left-4 transition-colors duration-300 ${isSearchFocused ? 'text-orange-500' : 'text-gray-400'}`} size={20} />
              <input 
                type="text" 
                placeholder="Search products, brands..." 
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
                        Suggestions
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
                        <span className="flex items-center"><Clock size={14} className="mr-2" /> Recent Searches</span>
                        <button onClick={clearRecentSearches} className="text-orange-500 hover:underline">Clear History</button>
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

                  {!searchTerm.trim() && recentSearches.length === 0 && (
                    <div className="p-8 text-center">
                      <Search size={32} className="mx-auto text-gray-100 mb-4" />
                      <p className="text-sm font-bold text-gray-400">Search for watches, coffee, crafts...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 sticky top-44">
              <div className="flex items-center space-x-2 mb-6">
                <Filter size={18} className="text-orange-500" />
                <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">Categories</h3>
              </div>
              <div className="space-y-2">
                <button 
                  onClick={() => handleCategoryClick('all')}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all ${currentCategory === 'all' ? 'bg-orange-500 text-white shadow-xl shadow-orange-200' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-500'}`}
                >
                  All Products
                </button>
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-between ${currentCategory === cat.id ? 'bg-orange-500 text-white shadow-xl shadow-orange-200' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-500'}`}
                  >
                    <span className="flex items-center">
                      <span className="mr-3 scale-75 opacity-70">{cat.icon}</span>
                      {cat.name}
                    </span>
                    {currentCategory !== cat.id && <ChevronRight size={14} className="opacity-30" />}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-10">
              <div className="flex flex-col gap-1">
                <p className="text-gray-500 font-medium">Found <span className="font-black text-gray-900">{filteredProducts.length}</span> results</p>
                {urlSearch && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Searching for:</span>
                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-lg text-xs font-black flex items-center">
                      {urlSearch}
                      <button onClick={() => handleSearchSubmit('')} className="ml-2 hover:text-orange-900">
                        <X size={10} />
                      </button>
                    </span>
                  </div>
                )}
              </div>
              <select className="bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-orange-500 transition-colors">
                <option>Sort: Relevant</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
              </select>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredProducts.map((product) => (
                  <div key={product.id} onClick={() => navigate(`/product/${product.id}`)} className="bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition-all group border border-gray-100 flex flex-col cursor-pointer">
                    <div className="h-72 relative overflow-hidden bg-gray-50 p-4">
                      <div className="w-full h-full rounded-[32px] overflow-hidden">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="absolute top-8 left-8 flex flex-col space-y-3">
                         <button 
                           onClick={handleToggleWishlist}
                           className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-gray-400 hover:text-red-500 shadow-xl transition-all hover:scale-110 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
                         >
                           <Heart size={18} />
                         </button>
                      </div>
                      <div className="absolute bottom-8 right-8 p-3 bg-orange-500 text-white rounded-2xl shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <ShoppingBag size={20} />
                      </div>
                    </div>
                    
                    <div className="p-8 flex-grow flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-orange-500 text-[10px] font-black uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full">
                          {CATEGORIES.find(c => c.id === product.category)?.name}
                        </span>
                        <div className="flex items-center text-yellow-400 text-xs bg-yellow-50 px-2 py-1 rounded-lg">
                          <Star size={12} fill="currentColor" />
                          <span className="ml-1 text-gray-900 font-black">{product.rating}</span>
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-6 group-hover:text-orange-600 transition-colors text-lg leading-tight line-clamp-2 h-14">{product.name}</h3>
                      <div className="mt-auto">
                        <div className="flex items-baseline space-x-2 mb-6">
                          <span className="text-2xl font-black text-gray-900">RWF {product.price.toLocaleString()}</span>
                        </div>
                        <button 
                          onClick={(e) => handleAddToCart(e, product.id)} 
                          className={`w-full py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center shadow-lg active:scale-[0.98] ${
                            addedItems.has(product.id) 
                            ? 'bg-emerald-500 text-white shadow-emerald-200' 
                            : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200'
                          }`}
                        >
                          {addedItems.has(product.id) ? (
                            <><Check size={18} className="mr-2" /> Added to Bag</>
                          ) : (
                            <><ShoppingBag size={18} className="mr-2" /> Add to Cart</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[40px] p-24 text-center border-2 border-dashed border-gray-100 shadow-sm mt-10">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300">
                  <Search size={48} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-3">No matches found</h2>
                <p className="text-gray-500 max-w-sm mx-auto font-medium">Try different keywords or check our popular categories to find what you're looking for.</p>
                <button onClick={() => { handleSearchSubmit(''); handleCategoryClick('all'); }} className="mt-10 bg-black text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-orange-600 transition-all">Clear All Filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
