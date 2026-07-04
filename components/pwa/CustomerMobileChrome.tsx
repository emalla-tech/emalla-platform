import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Package, User, ShoppingCart } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: <Home /> },
  { to: '/shop', label: 'Shop', icon: <ShoppingBag /> },
  { to: '/buyer/orders', label: 'Orders', icon: <Package /> },
  { to: '/buyer/settings', label: 'Account', icon: <User /> }
];

const HIDDEN_PATTERNS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/checkout',
  '/admin',
  '/seller',
  '/rider',
  '/buyer',
  '/payment/processing',
  '/payment/success',
  '/payment/failure'
];

const FLOATING_CART_PATHS = ['/', '/shop'];

interface CustomerMobileChromeProps {
  cartCount: number;
}

const CustomerMobileChrome: React.FC<CustomerMobileChromeProps> = ({ cartCount }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const hideChrome = HIDDEN_PATTERNS.some((pattern) =>
    pathname === pattern || pathname.startsWith(`${pattern}/`)
  );

  if (hideChrome) {
    return null;
  }

  const showFloatingCart =
    FLOATING_CART_PATHS.includes(pathname) || pathname.startsWith('/product/');

  const isActive = (to: string) => pathname === to || (to !== '/' && pathname.startsWith(`${to}/`));

  return (
    <>
      {showFloatingCart && (
        <Link
          to="/cart"
          aria-label={`Open shopping cart${cartCount > 0 ? ` with ${cartCount} item${cartCount === 1 ? '' : 's'}` : ''}`}
          className="floating-cart fixed bottom-[calc(7.1rem+env(safe-area-inset-bottom,0px))] right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_18px_40px_rgba(249,115,22,0.38)] transition-all active:scale-95 md:hidden"
        >
          <ShoppingCart size={22} />
          <span className="sr-only">Cart</span>
          {cartCount > 0 && (
            <span
              key={cartCount}
              className="animate-cart-badge absolute -right-1 -top-1 flex min-h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-gray-900 px-1.5 text-[10px] font-black text-white"
            >
              {cartCount}
            </span>
          )}
        </Link>
      )}

      <nav className="mobile-bottom-nav md:hidden" aria-label="Customer navigation">
        <div className="mobile-bottom-nav__inner">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`mobile-bottom-nav__item ${active ? 'mobile-bottom-nav__item--active' : ''}`}
              >
                <span className={`mobile-bottom-nav__icon ${active ? 'text-orange-500' : 'text-gray-400'}`}>
                  {React.cloneElement(item.icon, { size: 20, strokeWidth: active ? 2.4 : 2 })}
                </span>
                <span className={`mobile-bottom-nav__label ${active ? 'text-orange-500' : 'text-gray-400'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default CustomerMobileChrome;
