
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const Footer: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const socialLinks = [
    { icon: Facebook, to: '/about', label: t.footer.about },
    { icon: Twitter, to: '/how-it-works', label: t.footer.howItWorks },
    { icon: Instagram, to: '/shop', label: t.footer.allProducts },
    { icon: Linkedin, to: '/investors', label: t.footer.investors }
  ];

  const isActiveLink = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const linkClass = (path: string, accent = false) =>
    `${isActiveLink(path) ? 'text-white' : accent ? 'text-orange-400 hover:text-white' : 'hover:text-white'} transition-colors flex items-center group`;

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
              {t.footer.tagline}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map(({ icon: Icon, to, label }) => (
                <Link key={to} to={to} aria-label={label} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all text-gray-400">
                  <Icon size={18} />
                </Link>
              ))}
            </div>
          </div>

          {/* Marketplace Column */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-[3px] text-orange-500 mb-8">{t.footer.marketplace}</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li><Link to="/shop" className={linkClass('/shop')}>
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                {t.footer.allProducts}
              </Link></li>
              <li><Link to="/shop?category=1" className={linkClass('/shop')}>
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                {t.footer.electronics}
              </Link></li>
              <li><Link to="/shop?category=2" className={linkClass('/shop')}>
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                {t.footer.fashion}
              </Link></li>
              <li><Link to="/become-seller" className={linkClass('/become-seller', true)}>
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                {t.footer.sellOnEmalla}
              </Link></li>
            </ul>
          </div>

          {/* Help & Support Column */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-[3px] text-orange-500 mb-8">{t.footer.helpSupport}</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li><Link to="/faq" className={linkClass('/faq')}>
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                {t.footer.faqs}
              </Link></li>
              <li><Link to="/shipping" className={linkClass('/shipping')}>
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                {t.footer.shippingPolicy}
              </Link></li>
              <li><Link to="/contact" className={linkClass('/contact')}>
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                {t.footer.contactUs}
              </Link></li>
              <li><Link to="/how-it-works" className={linkClass('/how-it-works')}>
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                {t.footer.howItWorks}
              </Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-[3px] text-orange-500 mb-8">{t.footer.company}</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              <li><Link to="/about" className={linkClass('/about')}>
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                {t.footer.about}
              </Link></li>
              <li><Link to="/investors" className={linkClass('/investors')}>
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                {t.footer.investors}
              </Link></li>
              <li><Link to="/team" className={linkClass('/team')}>
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                {t.footer.team}
              </Link></li>
              <li><Link to="/terms" className={linkClass('/terms')}>
                <ArrowRight size={12} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-orange-500" />
                {t.footer.terms}
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
              <span>+250 784352174</span>
            </div>
          </div>
          
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-[3px]">
            &copy; {new Date().getFullYear()} E-Malla Rwanda. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
