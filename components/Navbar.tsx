
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, Store, User, Truck } from 'lucide-react';
import { NAV_LINKS } from '../constants';
import NotificationBell from './notifications/NotificationBell';
import { DEV_USER } from '../config/devUser';

interface NavbarProps {
  cartCount: number;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

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
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-orange-500 rounded-lg group-hover:rotate-12 transition-transform shadow-lg shadow-orange-100"></div>
            <span className="text-2xl font-black text-gray-900">E-Malla <span className="font-light">Rwanda</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex space-x-6 items-center">
            {NAV_LINKS.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className="text-gray-500 hover:text-orange-500 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Icons */}
          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative group">
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border-transparent border rounded-full text-xs focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-50 w-32 focus:w-48 transition-all font-medium"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={16} />
            </form>

            <NotificationBell userId={DEV_USER.id} role={DEV_USER.role} />

            <Link to="/cart" className="relative p-2.5 bg-gray-50 hover:bg-orange-50 rounded-xl transition-all">
              <ShoppingCart className="text-gray-700" size={20} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-orange-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Quick Access Dashboards for Dev */}
            <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-xl border border-gray-100 ml-4">
               <Link to="/buyer" className="px-3 py-1.5 text-[9px] font-black uppercase tracking-tighter hover:bg-white rounded-lg transition-all">Buyer</Link>
               <Link to="/seller" className="px-3 py-1.5 text-[9px] font-black uppercase tracking-tighter hover:bg-white rounded-lg transition-all">Seller</Link>
               <Link to="/rider" className="px-3 py-1.5 text-[9px] font-black uppercase tracking-tighter hover:bg-emerald-500 hover:text-white rounded-lg transition-all">Rider</Link>
               <Link to="/admin" className="px-3 py-1.5 text-[9px] font-black uppercase tracking-tighter bg-orange-500 text-white rounded-lg shadow-sm">Admin</Link>
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
          <div className="grid grid-cols-2 gap-4">
            <Link to="/buyer" className="p-4 bg-blue-50 rounded-2xl text-xs font-black text-blue-600 text-center" onClick={() => setIsOpen(false)}>Buyer Hub</Link>
            <Link to="/seller" className="p-4 bg-orange-50 rounded-2xl text-xs font-black text-orange-600 text-center" onClick={() => setIsOpen(false)}>Seller Panel</Link>
            <Link to="/rider" className="p-4 bg-emerald-50 rounded-2xl text-xs font-black text-emerald-600 text-center" onClick={() => setIsOpen(false)}>Rider Mode</Link>
            <Link to="/admin" className="p-4 bg-gray-900 rounded-2xl text-xs font-black text-white text-center" onClick={() => setIsOpen(false)}>Admin Console</Link>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t text-center">
            {NAV_LINKS.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className="text-sm font-bold text-gray-600 hover:text-orange-500"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
