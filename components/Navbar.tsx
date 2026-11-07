
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, Store, User, Truck, ChevronDown, ChevronRight, LogOut, LogIn, UserPlus, Globe, Heart, BadgePercent } from 'lucide-react';
import { CATEGORIES, PRODUCT_SUBCATEGORIES } from '../constants';
import NotificationBell from './notifications/NotificationBell';
import BrandLogo from './BrandLogo';
import { useAuth } from '../auth/AuthContext';
import { UserRole } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { CustomerService } from '../services/customerService';

interface NavbarProps {
  cartCount: number;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { language, setLanguage, t, languages } = useLanguage();
  const [wishlistCount, setWishlistCount] = useState(0);
  const languageShortLabels: Record<string, string> = {
    en: 'EN',
    rw: 'RW',
    fr: 'FR'
  };
  const featuredCategoryIds = ['25', '9', '8', '1', '10', '2', '17', '18'];
  const categoryShortLabels: Record<string, string> = {
    '1': 'Electronics',
    '2': 'Fashion',
    '8': 'Computers',
    '9': 'Phones & Tablets',
    '10': 'Appliances',
    '17': 'Construction',
    '18': 'Food & Beverages',
    '25': 'Deals'
  };
  const activeCategory = new URLSearchParams(location.search).get('category');

  useEffect(() => {
    const loadWishlistCount = async () => {
      if (user?.role !== UserRole.CUSTOMER) {
        setWishlistCount(0);
        return;
      }

      const ids = await CustomerService.getWishlistProductIds().catch(() => []);
      setWishlistCount(ids.length);
    };

    loadWishlistCount();
  }, [user, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setIsRoleMenuOpen(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsCategoryMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.classList.toggle('mobile-menu-open', isOpen);

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsRoleMenuOpen(false);
        setIsCategoryMenuOpen(false);
      }
    };

    if (isOpen || isRoleMenuOpen || isCategoryMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.classList.remove('mobile-menu-open');
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isCategoryMenuOpen, isOpen, isRoleMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center gap-3 lg:gap-5">
          {/* Primary brand: the country name reveals without replacing the accessible label. */}
          <Link
            to="/"
            aria-label="E-Malla Rwanda home"
            title="E-Malla Rwanda"
            className="group flex-shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
          >
            <BrandLogo revealCountry showTagline />
          </Link>

          <form onSubmit={handleSearch} className="relative mx-auto hidden min-w-0 max-w-3xl flex-1 md:block">
            <label htmlFor="desktop-marketplace-search" className="sr-only">
              {t.nav.searchPlaceholder}
            </label>
            <input
              id="desktop-marketplace-search"
              type="search"
              placeholder={t.nav.searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-5 pr-14 text-sm font-semibold text-gray-900 outline-none transition-all placeholder:font-medium placeholder:text-gray-400 hover:border-gray-300 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
            <button
              type="submit"
              aria-label="Search marketplace"
              className="absolute right-1.5 top-1.5 flex h-9 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
            >
              <Search size={18} strokeWidth={2.4} />
            </button>
          </form>

          {/* Icons */}
          <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex lg:gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
              <Globe size={14} className="text-gray-400" />
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as typeof language)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none"
                aria-label="Select language"
              >
                {Object.entries(languages).map(([code, label]) => (
                  <option key={code} value={code} title={label}>
                    {languageShortLabels[code] || code.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {user && <NotificationBell userId={user.id} role={user.role} />}

            {user?.role === UserRole.CUSTOMER && (
              <Link to="/buyer/wishlist" className="relative p-2.5 bg-gray-50 hover:bg-red-50 rounded-xl transition-all" aria-label="Open wishlist">
                <Heart className="text-gray-700" size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg border-2 border-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            <Link to="/cart" className="relative p-2.5 bg-gray-50 hover:bg-orange-50 rounded-xl transition-all">
              <ShoppingCart className="text-gray-700" size={20} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-orange-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="relative ml-2" ref={roleMenuRef}>
              <button
                type="button"
                onClick={() => setIsRoleMenuOpen((current) => !current)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-orange-50 border border-gray-100 rounded-xl transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center">
                  <User size={14} />
                </div>
                <span className="hidden text-[10px] font-black uppercase tracking-widest text-gray-500 xl:inline">
                  {t.nav.workspaces}
                </span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isRoleMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isRoleMenuOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white border border-gray-100 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {user ? t.nav.switchWorkspace : t.nav.accessWorkspace}
                  </p>
                  <div className="space-y-2">
                    {!user && (
                      <>
                        <Link
                          to="/login"
                          onClick={() => setIsRoleMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all group"
                        >
                          <span className="flex items-center gap-2 text-sm font-bold text-gray-700">
                            <LogIn size={16} /> {t.nav.login}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-gray-900 text-white">
                            Secure
                          </span>
                        </Link>

                        <Link
                          to="/register"
                          onClick={() => setIsRoleMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-orange-50 transition-all group"
                        >
                          <span className="flex items-center gap-2 text-sm font-bold text-gray-700 group-hover:text-orange-700">
                            <UserPlus size={16} /> {t.nav.createAccount}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-orange-500 text-white">
                            New
                          </span>
                        </Link>
                      </>
                    )}

                    <Link
                      to={user ? '/buyer' : '/login?next=%2Fbuyer'}
                      onClick={() => setIsRoleMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-all group"
                    >
                      <span className="flex items-center gap-2 text-sm font-bold text-gray-700 group-hover:text-blue-700">
                        <User size={16} /> {t.nav.buyerHub}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                        user?.role === UserRole.CUSTOMER ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {user?.role === UserRole.CUSTOMER ? 'Active' : user ? 'Open' : 'Login'}
                      </span>
                    </Link>

                    <Link
                      to={user ? '/seller' : '/login?next=%2Fseller'}
                      onClick={() => setIsRoleMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-orange-50 transition-all group"
                    >
                      <span className="flex items-center gap-2 text-sm font-bold text-gray-700 group-hover:text-orange-700">
                        <Store size={16} /> {t.nav.sellerHub}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                        user?.role === UserRole.MERCHANT ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {user?.role === UserRole.MERCHANT ? 'Active' : user ? 'Open' : 'Login'}
                      </span>
                    </Link>

                    <Link
                      to={user ? '/rider' : '/login?next=%2Frider'}
                      onClick={() => setIsRoleMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-emerald-50 transition-all group"
                    >
                      <span className="flex items-center gap-2 text-sm font-bold text-gray-700 group-hover:text-emerald-700">
                        <Truck size={16} /> {t.nav.riderHub}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                        user?.role === UserRole.DELIVERY ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {user?.role === UserRole.DELIVERY ? 'Active' : user ? 'Open' : 'Login'}
                      </span>
                    </Link>

                    {user?.role === UserRole.ADMIN && (
                      <Link
                        to="/admin"
                        onClick={() => setIsRoleMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-100 transition-all group"
                      >
                        <span className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <User size={16} /> {t.nav.adminConsole}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-gray-900 text-white">
                          Active
                        </span>
                      </Link>
                    )}

                    {user && (
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setIsRoleMenuOpen(false);
                          navigate('/login');
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-red-50 transition-all group text-red-500"
                      >
                        <span className="flex items-center gap-2 text-sm font-bold">
                          <LogOut size={16} /> {t.nav.logout}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-red-100 text-red-600">
                          Secure
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setIsOpen((current) => !current)}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-900 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden border-t border-white/10 bg-[#111827] text-white shadow-sm md:block">
        <div className="mx-auto flex h-11 max-w-[1600px] items-stretch px-0 sm:px-6 lg:px-8">
          <div ref={categoryMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsCategoryMenuOpen((current) => !current)}
              aria-expanded={isCategoryMenuOpen}
              aria-controls="marketplace-category-menu"
              className="flex h-11 items-center gap-2 bg-orange-500 px-4 text-xs font-black uppercase tracking-[0.08em] transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-orange-200 sm:rounded-t-lg sm:px-5"
            >
              <Menu size={18} />
              <span>All Categories</span>
              <ChevronDown size={14} className={`transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCategoryMenuOpen && (
              <div
                id="marketplace-category-menu"
                className="absolute left-2 top-full z-[70] mt-2 w-[calc(100vw-1rem)] max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl sm:left-0 sm:w-[min(92vw,64rem)]"
              >
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-4">
                  <div>
                    <p className="text-sm font-black text-gray-900">Explore all marketplace categories</p>
                    <p className="mt-0.5 text-xs font-medium text-gray-500">Find products and services from verified E-Malla sellers.</p>
                  </div>
                  <Link
                    to="/shop"
                    onClick={() => setIsCategoryMenuOpen(false)}
                    className="hidden items-center gap-1 text-xs font-black text-orange-600 hover:text-orange-700 sm:flex"
                  >
                    View all <ChevronRight size={15} />
                  </Link>
                </div>
                <div className="grid max-h-[68vh] grid-cols-1 gap-x-6 gap-y-1 overflow-y-auto p-3 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
                  {CATEGORIES.map((category) => (
                    <div key={category.id} className="rounded-xl p-2 transition-colors hover:bg-orange-50/70">
                      <Link
                        to={`/shop?category=${category.id}`}
                        onClick={() => setIsCategoryMenuOpen(false)}
                        className="flex items-center gap-3 text-sm font-extrabold text-gray-800 hover:text-orange-600"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 [&>svg]:h-4 [&>svg]:w-4">
                          {category.icon}
                        </span>
                        <span className="leading-tight">{category.name}</span>
                      </Link>
                      <div className="ml-12 mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
                        {(PRODUCT_SUBCATEGORIES[category.id] || []).slice(0, 3).map((subcategory) => (
                          <Link
                            key={subcategory}
                            to={`/shop?category=${category.id}&search=${encodeURIComponent(subcategory)}`}
                            onClick={() => setIsCategoryMenuOpen(false)}
                            className="text-[11px] font-medium text-gray-500 hover:text-orange-600"
                          >
                            {subcategory}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featuredCategoryIds.map((categoryId) => {
              const category = CATEGORIES.find((entry) => entry.id === categoryId);
              if (!category) return null;
              const isActive = location.pathname === '/shop' && activeCategory === categoryId;

              return (
                <Link
                  key={categoryId}
                  to={`/shop?category=${categoryId}`}
                  className={`flex h-11 shrink-0 items-center border-b-2 px-3 text-xs font-bold whitespace-nowrap transition-colors sm:px-4 ${
                    isActive
                      ? 'border-orange-400 bg-white/10 text-orange-300'
                      : 'border-transparent text-gray-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {categoryShortLabels[categoryId] || category.name}
                </Link>
              );
            })}
          </div>

          <Link
            to="/shop?category=25"
            className="hidden h-11 shrink-0 items-center gap-2 border-l border-white/10 bg-orange-500/10 px-5 text-xs font-black text-orange-300 transition-colors hover:bg-orange-500 hover:text-white xl:flex"
          >
            <BadgePercent size={16} /> Featured offers <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="mobile-navigation-panel fixed inset-x-0 bottom-0 top-20 z-[55] overflow-y-auto overscroll-contain border-t border-gray-100 bg-white px-6 py-7 shadow-2xl md:hidden"
        >
          <div className="mx-auto w-full max-w-lg space-y-6">
          <form onSubmit={handleSearch} className="relative">
            <label htmlFor="mobile-marketplace-search" className="sr-only">
              {t.nav.searchPlaceholder}
            </label>
            <input
              id="mobile-marketplace-search"
              type="search"
              placeholder={t.nav.searchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-5 pr-16 text-sm font-semibold text-gray-900 outline-none transition-all placeholder:font-medium placeholder:text-gray-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-100"
              autoFocus
            />
            <button
              type="submit"
              aria-label="Search marketplace"
              className="absolute right-1.5 top-1.5 flex h-11 w-12 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
            >
              <Search size={20} strokeWidth={2.4} />
            </button>
          </form>

          <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 text-gray-500">
              <Globe size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Language</span>
            </div>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as typeof language)}
              className="bg-transparent text-sm font-bold text-gray-700 outline-none"
              aria-label="Select language"
            >
              {Object.entries(languages).map(([code, label]) => (
                <option key={code} value={code} title={label}>
                  {languageShortLabels[code] || code.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {!user && (
              <>
                <Link to="/login" className="p-4 bg-gray-100 rounded-2xl text-xs font-black text-gray-700 text-center" onClick={() => setIsOpen(false)}>{t.nav.login}</Link>
                <Link to="/register" className="p-4 bg-orange-50 rounded-2xl text-xs font-black text-orange-600 text-center" onClick={() => setIsOpen(false)}>{t.nav.createAccount}</Link>
              </>
            )}
            <Link to={user ? '/buyer' : '/login?next=%2Fbuyer'} className="p-4 bg-blue-50 rounded-2xl text-xs font-black text-blue-600 text-center" onClick={() => setIsOpen(false)}>{t.nav.buyerHub}</Link>
            {user?.role === UserRole.CUSTOMER && (
              <Link to="/buyer/wishlist" className="p-4 bg-red-50 rounded-2xl text-xs font-black text-red-600 text-center" onClick={() => setIsOpen(false)}>
                Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ''}
              </Link>
            )}
            <Link to={user ? '/seller' : '/login?next=%2Fseller'} className="p-4 bg-orange-50 rounded-2xl text-xs font-black text-orange-600 text-center" onClick={() => setIsOpen(false)}>{t.nav.sellerHub}</Link>
            <Link to={user ? '/rider' : '/login?next=%2Frider'} className="p-4 bg-emerald-50 rounded-2xl text-xs font-black text-emerald-600 text-center" onClick={() => setIsOpen(false)}>{t.nav.riderHub}</Link>
            {user?.role === UserRole.ADMIN && (
              <Link to="/admin" className="p-4 bg-gray-900 rounded-2xl text-xs font-black text-white text-center" onClick={() => setIsOpen(false)}>{t.nav.adminConsole}</Link>
            )}
            {user && (
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                  navigate('/login');
                }}
                className="p-4 bg-red-50 rounded-2xl text-xs font-black text-red-600 text-center"
              >
                {t.nav.logout}
              </button>
            )}
          </div>

          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
