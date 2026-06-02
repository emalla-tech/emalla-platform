
import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { UserRole } from './types';
import { 
  LayoutDashboard, 
  Package, 
  Wallet, 
  History, 
  Home as HomeIcon, 
  User, 
  MapPin,
  ShoppingBag,
  Bell,
  LogOut,
  Settings,
  ChevronUp
} from 'lucide-react';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import InstallPrompt from './components/pwa/InstallPrompt';
import MobileBottomNav from './components/pwa/MobileBottomNav';
import CustomerMobileChrome from './components/pwa/CustomerMobileChrome';
import { LanguageProvider } from './i18n/LanguageContext';

import NotificationList from './components/notifications/NotificationList';
import { useCart } from './hooks/useCart';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleRoute from './auth/RoleRoute';
import { useAuth } from './auth/AuthContext';

const Home = lazy(() => import('./pages/Home'));
const BecomeSeller = lazy(() => import('./pages/BecomeSeller'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const FAQ = lazy(() => import('./pages/FAQ'));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Contact = lazy(() => import('./pages/Contact'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const About = lazy(() => import('./pages/About'));
const Team = lazy(() => import('./pages/Team'));
const Investors = lazy(() => import('./pages/Investors'));
const PaymentProcessing = lazy(() => import('./pages/Payment/PaymentProcessing'));
const PaymentSuccess = lazy(() => import('./pages/Payment/PaymentSuccess'));
const PaymentFailure = lazy(() => import('./pages/Payment/PaymentFailure'));
const PublicOrderTracking = lazy(() => import('./pages/PublicOrderTracking'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const DashboardOverview = lazy(() => import('./admin/pages/DashboardOverview'));
const OrderManagement = lazy(() => import('./admin/pages/OrderManagement'));
const ProductApprovals = lazy(() => import('./admin/pages/ProductApprovals'));
const SellerApplications = lazy(() => import('./admin/pages/SellerApplications'));
const RiderManagement = lazy(() => import('./admin/pages/RiderManagement'));
const FinanceOverview = lazy(() => import('./admin/pages/FinanceOverview'));
const AuditLogsPage = lazy(() => import('./admin/pages/AuditLogsPage'));
const AdminSecurity = lazy(() => import('./admin/pages/AdminSecurity'));
const AdminSettings = lazy(() => import('./admin/pages/AdminSettings'));
const CustomerManagement = lazy(() => import('./admin/pages/CustomerManagement'));
const InquiryManagement = lazy(() => import('./admin/pages/InquiryManagement'));
const EmailLogsPage = lazy(() => import('./admin/pages/EmailLogsPage'));
const MerchantDashboard = lazy(() => import('./pages/Dashboard/MerchantDashboard'));
const MerchantInventory = lazy(() => import('./merchant/pages/Inventory'));
const MerchantOrders = lazy(() => import('./merchant/pages/Orders'));
const MerchantWallet = lazy(() => import('./merchant/pages/Wallet'));
const MerchantSettings = lazy(() => import('./merchant/pages/Settings'));
const CustomerDashboard = lazy(() => import('./customer/pages/CustomerDashboard'));
const MyOrders = lazy(() => import('./customer/pages/MyOrders'));
const AddressBook = lazy(() => import('./customer/pages/AddressBook'));
const RiderDashboard = lazy(() => import('./delivery/pages/RiderDashboard'));
const AvailableJobs = lazy(() => import('./delivery/pages/AvailableJobs'));
const RiderHistory = lazy(() => import('./delivery/pages/RiderHistory'));
const RiderEarnings = lazy(() => import('./delivery/pages/RiderEarnings'));
const OrderTracking = lazy(() => import('./pages/Dashboard/OrderTracking'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Unauthorized = lazy(() => import('./pages/auth/Unauthorized'));
const AdminPortal = lazy(() => import('./pages/auth/AdminPortal'));
const SellerPasswordReset = lazy(() => import('./pages/auth/SellerPasswordReset'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

const RouteLoader = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const withSuspense = (node: React.ReactNode) => (
  <Suspense fallback={<RouteLoader />}>{node}</Suspense>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

const SEO_BASE_URL = 'https://www.emallarwanda.com';
const DEFAULT_SEO = {
  title: 'E-Malla Rwanda | Buy, Sell & Deliver Across Rwanda',
  description:
    'E-Malla Rwanda is a trusted digital marketplace connecting buyers, sellers and delivery partners across Rwanda.',
  keywords:
    'E-Malla Rwanda, Rwanda marketplace, buy online Rwanda, sell online Rwanda, delivery Rwanda, ecommerce Rwanda',
};

const buildSeoConfig = (pathname: string) => {
  if (pathname.startsWith('/product/')) {
    return {
      title: 'Product Details | E-Malla Rwanda',
      description: 'Explore product details, pricing and delivery options on E-Malla Rwanda.',
    };
  }

  if (pathname.startsWith('/track-order/')) {
    return {
      title: 'Track Order | E-Malla Rwanda',
      description: 'Track your E-Malla Rwanda order status and delivery progress.',
    };
  }

  const routeSeo: Record<string, { title: string; description: string }> = {
    '/': {
      title: DEFAULT_SEO.title,
      description: DEFAULT_SEO.description,
    },
    '/shop': {
      title: 'Shop Online in Rwanda | E-Malla Rwanda',
      description: 'Browse products from trusted sellers across Rwanda and order with delivery through E-Malla Rwanda.',
    },
    '/about': {
      title: 'About E-Malla Rwanda',
      description: 'Learn how E-Malla Rwanda connects buyers, sellers and delivery partners across Rwanda.',
    },
    '/team': {
      title: 'Our Team | E-Malla Rwanda',
      description: 'Meet the team building E-Malla Rwanda for merchants, customers and delivery partners.',
    },
    '/investors': {
      title: 'Investors | E-Malla Rwanda',
      description: 'Discover E-Malla Rwanda growth opportunities, vision and marketplace potential.',
    },
    '/faq': {
      title: 'FAQ | E-Malla Rwanda',
      description: 'Find answers about shopping, selling, delivery and payments on E-Malla Rwanda.',
    },
    '/shipping': {
      title: 'Shipping Policy | E-Malla Rwanda',
      description: 'Review E-Malla Rwanda shipping, delivery timelines and logistics policy.',
    },
    '/terms': {
      title: 'Terms of Service | E-Malla Rwanda',
      description: 'Read the terms and conditions for using E-Malla Rwanda services and marketplace features.',
    },
    '/contact': {
      title: 'Contact Us | E-Malla Rwanda',
      description: 'Contact E-Malla Rwanda for support, partnership opportunities and customer assistance.',
    },
    '/how-it-works': {
      title: 'How It Works | E-Malla Rwanda',
      description: 'See how buying, selling and delivery work on E-Malla Rwanda from order to doorstep.',
    },
    '/become-seller': {
      title: 'Become a Seller | E-Malla Rwanda',
      description: 'Join E-Malla Rwanda as a seller and reach customers across Rwanda through our marketplace.',
    },
    '/cart': {
      title: 'Your Cart | E-Malla Rwanda',
      description: 'Review selected items and prepare your order on E-Malla Rwanda.',
    },
    '/checkout': {
      title: 'Checkout | E-Malla Rwanda',
      description: 'Complete your E-Malla Rwanda order securely with delivery details and payment options.',
    },
    '/login': {
      title: 'Login | E-Malla Rwanda',
      description: 'Sign in to your E-Malla Rwanda account to shop, sell or manage deliveries.',
    },
    '/register': {
      title: 'Create Account | E-Malla Rwanda',
      description: 'Create your E-Malla Rwanda account to buy, sell or deliver across Rwanda.',
    },
  };

  return routeSeo[pathname] ?? {
    title: 'E-Malla Rwanda',
    description: DEFAULT_SEO.description,
  };
};

const updateMetaTag = (selector: string, attribute: 'content' | 'href', value: string, tagName = 'meta') => {
  let element = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;

  if (!element) {
    element = document.createElement(tagName) as HTMLMetaElement | HTMLLinkElement;
    if (tagName === 'meta') {
      const match = selector.match(/\[(name|property)="([^"]+)"\]/);
      if (match) {
        element.setAttribute(match[1], match[2]);
      }
    }
    if (tagName === 'link') {
      const match = selector.match(/\[rel="([^"]+)"\]/);
      if (match) {
        element.setAttribute('rel', match[1]);
      }
    }
    document.head.appendChild(element);
  }

  element.setAttribute(attribute, value);
};

const SeoMetaUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    const { title, description } = buildSeoConfig(location.pathname);
    const canonicalUrl =
      location.pathname === '/'
        ? `${SEO_BASE_URL}/`
        : `${SEO_BASE_URL}/#${location.pathname}`;

    document.title = title;
    updateMetaTag('meta[name="description"]', 'content', description);
    updateMetaTag('meta[name="keywords"]', 'content', DEFAULT_SEO.keywords);
    updateMetaTag('meta[property="og:title"]', 'content', title);
    updateMetaTag('meta[property="og:description"]', 'content', description);
    updateMetaTag('meta[property="og:url"]', 'content', canonicalUrl);
    updateMetaTag('meta[name="twitter:title"]', 'content', title);
    updateMetaTag('meta[name="twitter:description"]', 'content', description);
    updateMetaTag('link[rel="canonical"]', 'href', canonicalUrl, 'link');
  }, [location.pathname]);

  return null;
};

const BackToTop = () => {
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > 420);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gray-900 text-white shadow-2xl hover:bg-orange-500 transition-all flex items-center justify-center"
      aria-label="Back to top"
    >
      <ChevronUp size={20} />
    </button>
  );
};

const App: React.FC = () => {
  const { itemCount, addItem, detailedItems, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { user, logout } = useAuth();

  return (
    <LanguageProvider>
      <Router>
        <ScrollToTop />
        <SeoMetaUpdater />
        <BackToTop />
        <div className="min-h-screen flex flex-col app-shell">
          <InstallPrompt />
          <Routes>
          <Route path="/login" element={withSuspense(<Login />)} />
          <Route path="/forgot-password" element={withSuspense(<ForgotPassword />)} />
          <Route path="/reset-password" element={withSuspense(<ResetPassword />)} />
          <Route path="/register" element={withSuspense(<Register />)} />
          <Route path="/admin" element={withSuspense(<AdminPortal />)} />
          <Route path="/unauthorized" element={withSuspense(<Unauthorized />)} />

          {/* Public Wrapper with Nav/Footer */}
          <Route element={<><Navbar cartCount={itemCount} /><PublicOutlet /><CustomerMobileChrome cartCount={itemCount} /><Footer /></>}>
            <Route path="/" element={withSuspense(<Home onAddToCart={addItem} />)} />
            <Route path="/shop" element={withSuspense(<Shop onAddToCart={addItem} />)} />
            <Route path="/product/:id" element={withSuspense(<ProductDetails onAddToCart={addItem} />)} />
            <Route path="/about" element={withSuspense(<About />)} />
            <Route path="/team" element={withSuspense(<Team />)} />
            <Route path="/investors" element={withSuspense(<Investors />)} />
            <Route path="/faq" element={withSuspense(<FAQ />)} />
            <Route path="/shipping" element={withSuspense(<ShippingPolicy />)} />
            <Route path="/terms" element={withSuspense(<TermsOfService />)} />
            <Route path="/contact" element={withSuspense(<Contact />)} />
            <Route path="/how-it-works" element={withSuspense(<HowItWorks />)} />
            <Route path="/become-seller" element={withSuspense(<BecomeSeller />)} />
            <Route path="/payment/processing" element={withSuspense(<PaymentProcessing />)} />
            <Route path="/payment/success" element={withSuspense(<PaymentSuccess />)} />
            <Route path="/payment/failure" element={withSuspense(<PaymentFailure />)} />
            <Route path="/track-order/:id" element={withSuspense(<PublicOrderTracking />)} />
            <Route path="/checkout" element={withSuspense(<Checkout cartItems={detailedItems} subtotal={subtotal} clearCart={clearCart} />)} />
            <Route
              path="/cart"
              element={withSuspense(
                <Cart
                  cartItems={detailedItems}
                  subtotal={subtotal}
                  onUpdateQuantity={updateQuantity}
                  onRemoveItem={removeItem}
                />
              )}
            />
          </Route>

          {/* Direct Admin Access */}
          <Route path="/admin/dashboard/*" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[UserRole.ADMIN]}>
                {withSuspense(<AdminLayout>
                  <Routes>
                    <Route index element={withSuspense(<DashboardOverview />)} />
                    <Route path="orders" element={withSuspense(<OrderManagement />)} />
                    <Route path="products" element={withSuspense(<ProductApprovals />)} />
                    <Route path="notifications" element={user ? <NotificationList userId={user.id} role={UserRole.ADMIN} /> : <RouteLoader />} />
                    <Route path="sellers" element={withSuspense(<SellerApplications />)} />
                    <Route path="users" element={withSuspense(<CustomerManagement />)} />
                    <Route path="inquiries" element={withSuspense(<InquiryManagement />)} />
                    <Route path="emails" element={withSuspense(<EmailLogsPage />)} />
                    <Route path="logistics" element={withSuspense(<RiderManagement />)} />
                    <Route path="finance" element={withSuspense(<FinanceOverview />)} />
                    <Route path="logs" element={withSuspense(<AuditLogsPage />)} />
                    <Route path="security" element={withSuspense(<AdminSecurity />)} />
                    <Route path="settings" element={withSuspense(<AdminSettings />)} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" />} />
                  </Routes>
                </AdminLayout>)}
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* Direct Seller Access */}
          <Route path="/seller/*" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[UserRole.MERCHANT]}>
                  <div className="flex min-h-screen bg-gray-50">
                    <MerchantSidebar onLogout={logout} />
                    <div className="flex-grow p-4 pb-28 md:p-8 overflow-y-auto no-scrollbar">
                      <Routes>
                      <Route index element={withSuspense(<MerchantDashboard />)} />
                      <Route path="change-password" element={withSuspense(<SellerPasswordReset />)} />
                      <Route path="products" element={withSuspense(<MerchantInventory />)} />
                      <Route path="orders" element={withSuspense(<MerchantOrders />)} />
                      <Route path="orders/:id/track" element={withSuspense(<OrderTracking />)} />
                      <Route path="analytics" element={withSuspense(<MerchantWallet />)} />
                      <Route path="settings" element={withSuspense(<MerchantSettings />)} />
                        <Route path="notifications" element={user ? <NotificationList userId={user.id} role={UserRole.MERCHANT} /> : <RouteLoader />} />
                      </Routes>
                    </div>
                    <MobileBottomNav
                      accentClass="text-orange-500"
                      items={[
                        { to: '/seller', label: 'Dashboard', icon: <LayoutDashboard /> },
                        { to: '/seller/products', label: 'Products', icon: <Package /> },
                        { to: '/seller/orders', label: 'Orders', icon: <History /> },
                        { to: '/seller/settings', label: 'Account', icon: <User /> }
                      ]}
                    />
                  </div>
                </RoleRoute>
              </ProtectedRoute>
            } />

          {/* Direct Buyer Access */}
          <Route path="/buyer/*" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[UserRole.CUSTOMER]}>
                  <div className="flex min-h-screen bg-gray-50">
                    <CustomerSidebar onLogout={logout} />
                    <div className="flex-grow p-4 pb-28 md:p-8 overflow-y-auto no-scrollbar">
                      <Routes>
                      <Route index element={withSuspense(<CustomerDashboard />)} />
                      <Route path="orders" element={withSuspense(<MyOrders />)} />
                      <Route path="orders/:id/track" element={withSuspense(<OrderTracking />)} />
                      <Route path="settings" element={withSuspense(<AddressBook />)} />
                        <Route path="notifications" element={user ? <NotificationList userId={user.id} role={UserRole.CUSTOMER} /> : <RouteLoader />} />
                      </Routes>
                    </div>
                    <MobileBottomNav
                      accentClass="text-blue-600"
                      items={[
                        { to: '/', label: 'Home', icon: <HomeIcon /> },
                        { to: '/shop', label: 'Shop', icon: <ShoppingBag /> },
                        { to: '/buyer/orders', label: 'Orders', icon: <Package /> },
                        { to: '/buyer/settings', label: 'Account', icon: <User /> }
                      ]}
                    />
                  </div>
                </RoleRoute>
              </ProtectedRoute>
            } />

          {/* Direct Rider Access */}
          <Route path="/rider/*" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[UserRole.DELIVERY]}>
                <div className="flex min-h-screen bg-gray-100 max-w-xl mx-auto border-x shadow-2xl">
                    <div className="flex-grow p-4 pb-28 overflow-y-auto no-scrollbar">
                    <div className="mb-6 p-4 bg-emerald-500 text-white rounded-2xl text-center md:hidden">
                       <p className="text-xs font-black uppercase tracking-widest">Rider Mobile Hub</p>
                    </div>
                    <Routes>
                      <Route index element={withSuspense(<RiderDashboard />)} />
                      <Route path="available" element={withSuspense(<AvailableJobs />)} />
                      <Route path="history" element={withSuspense(<RiderHistory />)} />
                      <Route path="earnings" element={withSuspense(<RiderEarnings />)} />
                      <Route path="orders/:id/track" element={withSuspense(<OrderTracking />)} />
                        <Route path="notifications" element={user ? <NotificationList userId={user.id} role={UserRole.DELIVERY} /> : <RouteLoader />} />
                      </Routes>
                    </div>
                    <MobileBottomNav
                      accentClass="text-emerald-500"
                      backgroundClass="bg-white/95"
                      items={[
                        { to: '/rider', label: 'Dashboard', icon: <LayoutDashboard /> },
                        { to: '/rider/available', label: 'Deliveries', icon: <Package /> },
                        { to: '/rider/earnings', label: 'Earnings', icon: <Wallet /> },
                        { to: '/rider/notifications', label: 'Account', icon: <User /> }
                      ]}
                    />
                  </div>
                </RoleRoute>
              </ProtectedRoute>
            } />

          <Route
            path="/dashboard/*"
            element={
              !user ? <Navigate to="/login" replace /> :
              user.role === UserRole.ADMIN ? <Navigate to="/admin/dashboard" replace /> :
              user?.role === UserRole.MERCHANT ? <Navigate to="/seller" replace /> :
              user?.role === UserRole.DELIVERY ? <Navigate to="/rider" replace /> :
              <Navigate to="/buyer" replace />
            }
          />
          </Routes>
        </div>
      </Router>
    </LanguageProvider>
  );
};

const PublicOutlet = () => <div className="flex-grow page-transition pb-24 md:pb-0"><Outlet /></div>;

const MerchantSidebar = ({ onLogout }: { onLogout: () => void }) => (
  <aside className="w-72 bg-white border-r p-8 hidden md:flex flex-col shrink-0 h-full">
    <div className="flex items-center space-x-3 mb-12">
      <div className="w-10 h-10 bg-orange-500 rounded-2xl shadow-lg shadow-orange-100 flex items-center justify-center text-white text-lg">
        <HomeIcon size={20} />
      </div>
      <div>
        <h2 className="font-black text-lg text-gray-900 leading-none">Seller Hub</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">E-Malla Rwanda</p>
      </div>
    </div>
    
    <nav className="flex-grow space-y-1">
      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[3px] mb-4 ml-4">Main Menu</p>
      <Link to="/seller" className="flex items-center space-x-3 p-4 hover:bg-orange-50 rounded-2xl font-bold text-gray-600 hover:text-orange-600 transition-all group">
        <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
        <span>Overview</span>
      </Link>
      <Link to="/seller/products" className="flex items-center space-x-3 p-4 hover:bg-orange-50 rounded-2xl font-bold text-gray-600 hover:text-orange-600 transition-all group">
        <Package size={20} className="group-hover:scale-110 transition-transform" />
        <span>Inventory</span>
      </Link>
      <Link to="/seller/orders" className="flex items-center space-x-3 p-4 hover:bg-orange-50 rounded-2xl font-bold text-gray-600 hover:text-orange-600 transition-all group">
        <History size={20} className="group-hover:scale-110 transition-transform" />
        <span>Orders</span>
      </Link>
      <Link to="/seller/notifications" className="flex items-center space-x-3 p-4 hover:bg-orange-50 rounded-2xl font-bold text-gray-600 hover:text-orange-600 transition-all group">
        <Bell size={20} className="group-hover:scale-110 transition-transform" />
        <span>Alerts</span>
      </Link>
      <Link to="/seller/analytics" className="flex items-center space-x-3 p-4 hover:bg-orange-50 rounded-2xl font-bold text-gray-600 hover:text-orange-600 transition-all group">
        <Wallet size={20} className="group-hover:scale-110 transition-transform" />
        <span>Wallet</span>
      </Link>
      <Link to="/seller/settings" className="flex items-center space-x-3 p-4 hover:bg-orange-50 rounded-2xl font-bold text-gray-600 hover:text-orange-600 transition-all group">
        <Settings size={20} className="group-hover:scale-110 transition-transform" />
        <span>Settings</span>
      </Link>
    </nav>

    <div className="pt-8 mt-8 border-t border-gray-50 space-y-4">
      <Link 
        to="/" 
        className="flex items-center space-x-3 p-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-orange-600 transition-all shadow-xl shadow-black/10 group active:scale-95"
      >
        <HomeIcon size={18} className="group-hover:-translate-y-0.5 transition-transform" />
        <span>Back to Home</span>
      </Link>
      <Link
        to="/login"
        onClick={onLogout}
        className="flex items-center space-x-3 p-4 border border-red-100 text-red-500 rounded-2xl font-black text-sm hover:bg-red-50 transition-all group active:scale-95"
      >
        <LogOut size={18} />
        <span>Logout</span>
      </Link>
    </div>
  </aside>
);

const CustomerSidebar = ({ onLogout }: { onLogout: () => void }) => (
  <aside className="w-72 bg-white border-r p-8 hidden md:flex flex-col shrink-0 h-full">
    <div className="flex items-center space-x-3 mb-12">
      <div className="w-10 h-10 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center text-white">
        <User size={20} />
      </div>
      <div>
        <h2 className="font-black text-lg text-gray-900 leading-none">Buyer Hub</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">E-Malla Rwanda</p>
      </div>
    </div>
    
    <nav className="flex-grow space-y-1">
      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[3px] mb-4 ml-4">Account Menu</p>
      <Link to="/buyer" className="flex items-center space-x-3 p-4 hover:bg-blue-50 rounded-2xl font-bold text-gray-600 hover:text-blue-600 transition-all group">
        <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
        <span>My Dashboard</span>
      </Link>
      <Link to="/buyer/orders" className="flex items-center space-x-3 p-4 hover:bg-blue-50 rounded-2xl font-bold text-gray-600 hover:text-blue-600 transition-all group">
        <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
        <span>My Orders</span>
      </Link>
      <Link to="/buyer/notifications" className="flex items-center space-x-3 p-4 hover:bg-blue-50 rounded-2xl font-bold text-gray-600 hover:text-blue-600 transition-all group">
        <Bell size={20} className="group-hover:scale-110 transition-transform" />
        <span>Inbox</span>
      </Link>
      <Link to="/buyer/settings" className="flex items-center space-x-3 p-4 hover:bg-blue-50 rounded-2xl font-bold text-gray-600 hover:text-blue-600 transition-all group">
        <MapPin size={20} className="group-hover:scale-110 transition-transform" />
        <span>Addresses</span>
      </Link>
    </nav>

    <div className="pt-8 mt-8 border-t border-gray-50 space-y-4">
      <Link 
        to="/" 
        className="flex items-center space-x-3 p-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-orange-600 transition-all shadow-xl shadow-black/10 group active:scale-95"
      >
        <HomeIcon size={18} className="group-hover:-translate-y-0.5 transition-transform" />
        <span>Back to Shop</span>
      </Link>
      <Link
        to="/login"
        onClick={onLogout}
        className="flex items-center space-x-3 p-4 border border-red-100 text-red-500 rounded-2xl font-black text-sm hover:bg-red-50 transition-all group active:scale-95"
      >
        <LogOut size={18} />
        <span>Logout</span>
      </Link>
    </div>
  </aside>
);

export default App;
