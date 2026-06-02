
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, Store, User, Truck, ChevronDown, LogOut, LogIn, UserPlus, Globe, Heart } from 'lucide-react';
import { NAV_LINKS } from '../constants';
import NotificationBell from './notifications/NotificationBell';
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
  const [searchQuery, setSearchQuery] = useState('');
  const roleMenuRef = useRef<HTMLDivElement>(null);
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

  const navLabelMap: Record<string, string> = {
    Home: t.nav.home,
    Shop: t.nav.shop,
    'How it Works': t.nav.howItWorks,
    'Become a Seller': t.nav.becomeSeller
  };

  const isActiveLink = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group flex-shrink-0">
            <div className="w-8 h-8 bg-orange-500 rounded-lg group-hover:rotate-12 transition-transform shadow-lg shadow-orange-100"></div>
            <span className="text-2xl font-black text-gray-900 whitespace-nowrap">
              E-Malla <span className="font-light">Rwanda</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex space-x-6 items-center">
            {NAV_LINKS.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`font-bold text-xs uppercase tracking-wider transition-colors ${
                  isActiveLink(link.path) ? 'text-orange-500' : 'text-gray-500 hover:text-orange-500'
                }`}
              >
                {navLabelMap[link.name] || link.name}
              </Link>
            ))}
          </div>

          {/* Icons */}
          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative group">
              <input 
                type="text" 
                placeholder={t.nav.searchPlaceholder} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border-transparent border rounded-full text-xs focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-50 w-32 focus:w-48 transition-all font-medium"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={16} />
            </form>

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
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
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
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-900">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t p-6 space-y-6 shadow-2xl animate-in slide-in-from-top duration-300">
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

          <div className="grid grid-cols-2 gap-4 pt-6 border-t text-center">
            {NAV_LINKS.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`text-sm font-bold ${
                  isActiveLink(link.path) ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {navLabelMap[link.name] || link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
