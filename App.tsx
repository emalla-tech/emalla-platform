
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
        <BackToTop />
        <div className="min-h-screen flex flex-col">
          <Routes>
          <Route path="/login" element={withSuspense(<Login />)} />
          <Route path="/forgot-password" element={withSuspense(<ForgotPassword />)} />
          <Route path="/reset-password" element={withSuspense(<ResetPassword />)} />
          <Route path="/register" element={withSuspense(<Register />)} />
          <Route path="/admin" element={withSuspense(<AdminPortal />)} />
          <Route path="/unauthorized" element={withSuspense(<Unauthorized />)} />

          {/* Public Wrapper with Nav/Footer */}
          <Route element={<><Navbar cartCount={itemCount} /><PublicOutlet /><Footer /></>}>
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
                <div className="flex h-screen bg-gray-50">
                  <MerchantSidebar onLogout={logout} />
                  <div className="flex-grow p-4 md:p-8 overflow-y-auto no-scrollbar">
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
                </div>
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* Direct Buyer Access */}
          <Route path="/buyer/*" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[UserRole.CUSTOMER]}>
                <div className="flex h-screen bg-gray-50">
                  <CustomerSidebar onLogout={logout} />
                  <div className="flex-grow p-4 md:p-8 overflow-y-auto no-scrollbar">
                    <Routes>
                      <Route index element={withSuspense(<CustomerDashboard />)} />
                      <Route path="orders" element={withSuspense(<MyOrders />)} />
                      <Route path="orders/:id/track" element={withSuspense(<OrderTracking />)} />
                      <Route path="settings" element={withSuspense(<AddressBook />)} />
                      <Route path="notifications" element={user ? <NotificationList userId={user.id} role={UserRole.CUSTOMER} /> : <RouteLoader />} />
                    </Routes>
                  </div>
                </div>
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* Direct Rider Access */}
          <Route path="/rider/*" element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={[UserRole.DELIVERY]}>
                <div className="flex min-h-screen bg-gray-100 max-w-xl mx-auto border-x shadow-2xl">
                  <div className="flex-grow p-4 pb-24 overflow-y-auto no-scrollbar">
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
                  <RiderBottomNav onLogout={logout} />
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

const PublicOutlet = () => <div className="flex-grow"><Outlet /></div>;

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

const RiderBottomNav = ({ onLogout }: { onLogout: () => void }) => {
  const NavItem = ({ to, icon, label }: any) => (
    <Link to={to} className="flex flex-col items-center space-y-1 group">
      <div className="p-1 rounded-lg group-active:scale-90 transition-transform">
        {React.cloneElement(icon, { 
          className: `transition-colors ${window.location.hash.includes(to) ? 'text-orange-500' : 'text-gray-400'}` 
        })}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest ${window.location.hash.includes(to) ? 'text-orange-500' : 'text-gray-400'}`}>
        {label}
      </span>
    </Link>
  );

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl bg-white border-t p-4 flex justify-around items-center z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
      <NavItem to="/rider/available" icon={<Package size={22} />} label="Pool" />
      <NavItem to="/rider/notifications" icon={<Bell size={22} />} label="Alerts" />
      <div className="relative -top-6">
        <Link to="/rider" className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-200 border-4 border-white active:scale-90 transition-transform">
           <LayoutDashboard size={24} />
        </Link>
      </div>
      <NavItem to="/rider/history" icon={<History size={22} />} label="Log" />
      <NavItem to="/rider/earnings" icon={<Wallet size={22} />} label="Wallet" />
      <button onClick={onLogout} className="flex flex-col items-center space-y-1 group">
        <div className="p-1 rounded-lg group-active:scale-90 transition-transform">
          <LogOut size={22} className="text-red-500" />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-red-500">
          Logout
        </span>
      </button>
    </div>
  );
};

export default App;
