
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-8 group">
              <div className="w-8 h-8 bg-orange-500 rounded-lg group-hover:rotate-12 transition-transform shadow-lg shadow-orange-500/20"></div>
              <span className="text-2xl font-black text-white">E-Malla <span className="font-light opacity-70">Rwanda</span></span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xs">
              Empowering local commerce across the Land of a Thousand Hills. Fast delivery, secure payments, and authentic Rwandan products.
            </p>
            <div className="flex space-x-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all text-gray-400">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Marketplace Column */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-[3px] text-orange-500 mb-8">Marketplace</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li><Link to="/shop" className="hover:text-white transition-colors flex items-center group">
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                All Products
              </Link></li>
              <li><Link to="/shop?category=1" className="hover:text-white transition-colors flex items-center group">
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                Electronics
              </Link></li>
              <li><Link to="/shop?category=2" className="hover:text-white transition-colors flex items-center group">
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                Fashion & Style
              </Link></li>
              <li><Link to="/become-seller" className="hover:text-white transition-colors flex items-center group text-orange-400">
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                Sell on E-Malla
              </Link></li>
            </ul>
          </div>

          {/* Help & Support Column */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-[3px] text-orange-500 mb-8">Help & Support</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li><Link to="/faq" className="hover:text-white transition-colors flex items-center group">
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                FAQs
              </Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-colors flex items-center group">
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                Shipping Policy
              </Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors flex items-center group">
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                Contact Us
              </Link></li>
              <li><Link to="/how-it-works" className="hover:text-white transition-colors flex items-center group">
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                How It Works
              </Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-[3px] text-orange-500 mb-8">Company</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li><Link to="/about" className="hover:text-white transition-colors flex items-center group">
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                About E-Malla
              </Link></li>
              <li><Link to="/investors" className="hover:text-white transition-colors flex items-center group">
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                Investor Relations
              </Link></li>
              <li><Link to="/team" className="hover:text-white transition-colors flex items-center group">
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                Operations Team
              </Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors flex items-center group">
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                Terms of Service
              </Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-8 text-gray-500 text-xs font-bold uppercase tracking-widest">
            <div className="flex items-center space-x-2">
              <MapPin size={14} className="text-orange-500" />
              <span>Kigali, Rwanda</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone size={14} className="text-orange-500" />
              <span>+250 788 000 000</span>
            </div>
          </div>
          
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-[3px]">
            &copy; {new Date().getFullYear()} E-Malla Rwanda. Digital Hub for Local Trade.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
