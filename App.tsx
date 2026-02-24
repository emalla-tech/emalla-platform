
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { UserRole } from './types';
import { 
  LayoutDashboard, 
  Package, 
  Wallet, 
  History, 
  Home as HomeIcon, 
  ArrowLeft, 
  User, 
  Settings,
  MapPin,
  ShoppingBag,
  Truck,
  Phone,
  Bell
} from 'lucide-react';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BecomeSeller from './pages/BecomeSeller';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import FAQ from './pages/FAQ';
import ShippingPolicy from './pages/ShippingPolicy';
import TermsOfService from './pages/TermsOfService';
import Contact from './pages/Contact';
import HowItWorks from './pages/HowItWorks';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import About from './pages/About';
import Team from './pages/Team';
import Investors from './pages/Investors';

// Payment Pages
import PaymentProcessing from './pages/Payment/PaymentProcessing';
import PaymentSuccess from './pages/Payment/PaymentSuccess';
import PaymentFailure from './pages/Payment/PaymentFailure';

// Dashboards
import AdminLayout from './admin/AdminLayout';
import DashboardOverview from './admin/pages/DashboardOverview';
import OrderManagement from './admin/pages/OrderManagement';
import MerchantDashboard from './pages/Dashboard/MerchantDashboard';
import MerchantInventory from './merchant/pages/Inventory';
import MerchantOrders from './merchant/pages/Orders';
import MerchantWallet from './merchant/pages/Wallet';
import CustomerDashboard from './customer/pages/CustomerDashboard';
import MyOrders from './customer/pages/MyOrders';
import AddressBook from './customer/pages/AddressBook';
import RiderDashboard from './delivery/pages/RiderDashboard';
import AvailableJobs from './delivery/pages/AvailableJobs';
import RiderHistory from './delivery/pages/RiderHistory';
import RiderEarnings from './delivery/pages/RiderEarnings';
import OrderTracking from './pages/Dashboard/OrderTracking';
import NotificationList from './components/notifications/NotificationList';
import { DEV_USER } from './config/devUser';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Routes>
          {/* Public Wrapper with Nav/Footer */}
          <Route element={<><Navbar cartCount={2} /><PublicOutlet /><Footer /></>}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/team" element={<Team />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/shipping" element={<ShippingPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/become-seller" element={<BecomeSeller />} />
            <Route path="/cart" element={<Cart />} />
            
            <Route path="/payment/processing" element={<PaymentProcessing />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failure" element={<PaymentFailure />} />
            <Route path="/checkout" element={<Checkout />} />
          </Route>

          {/* Direct Admin Access */}
          <Route path="/admin/*" element={
            <AdminLayout>
              <Routes>
                <Route index element={<DashboardOverview />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="notifications" element={<NotificationList userId={DEV_USER.id} role={UserRole.ADMIN} />} />
                <Route path="sellers" element={<Placeholder title="Merchants" />} />
                <Route path="*" element={<Navigate to="/admin" />} />
              </Routes>
            </AdminLayout>
          } />

          {/* Direct Seller Access */}
          <Route path="/seller/*" element={
            <div className="flex h-screen bg-gray-50">
              <MerchantSidebar />
              <div className="flex-grow p-4 md:p-8 overflow-y-auto no-scrollbar">
                <Routes>
                  <Route index element={<MerchantDashboard />} />
                  <Route path="products" element={<MerchantInventory />} />
                  <Route path="orders" element={<MerchantOrders />} />
                  <Route path="orders/:id/track" element={<OrderTracking />} />
                  <Route path="analytics" element={<MerchantWallet />} />
                  <Route path="notifications" element={<NotificationList userId="MCH-05" role={UserRole.MERCHANT} />} />
                </Routes>
              </div>
            </div>
          } />

          {/* Direct Buyer Access */}
          <Route path="/buyer/*" element={
            <div className="flex h-screen bg-gray-50">
              <CustomerSidebar />
              <div className="flex-grow p-4 md:p-8 overflow-y-auto no-scrollbar">
                <Routes>
                  <Route index element={<CustomerDashboard />} />
                  <Route path="orders" element={<MyOrders />} />
                  <Route path="orders/:id/track" element={<OrderTracking />} />
                  <Route path="settings" element={<AddressBook />} />
                  <Route path="notifications" element={<NotificationList userId={DEV_USER.id} role={UserRole.CUSTOMER} />} />
                </Routes>
              </div>
            </div>
          } />

          {/* Direct Rider Access */}
          <Route path="/rider/*" element={
            <div className="flex min-h-screen bg-gray-100 max-w-xl mx-auto border-x shadow-2xl">
              <div className="flex-grow p-4 pb-24 overflow-y-auto no-scrollbar">
                <div className="mb-6 p-4 bg-emerald-500 text-white rounded-2xl text-center md:hidden">
                   <p className="text-xs font-black uppercase tracking-widest">Rider Mobile Hub</p>
                </div>
                <Routes>
                  <Route index element={<RiderDashboard />} />
                  <Route path="available" element={<AvailableJobs />} />
                  <Route path="history" element={<RiderHistory />} />
                  <Route path="earnings" element={<RiderEarnings />} />
                  <Route path="orders/:id/track" element={<OrderTracking />} />
                  <Route path="notifications" element={<NotificationList userId="RID-001" role={UserRole.DELIVERY} />} />
                </Routes>
              </div>
              <RiderBottomNav />
            </div>
          } />

          <Route path="/dashboard/*" element={<Navigate to="/buyer" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

const PublicOutlet = () => <div className="flex-grow"><Outlet /></div>;

const Placeholder = ({ title }: { title: string }) => (
  <div className="p-10 bg-white rounded-3xl border border-gray-100 text-center">
    <h2 className="text-2xl font-black">{title}</h2>
    <p className="text-gray-400 mt-2">Section under development in Dev Mode.</p>
  </div>
);

const MerchantSidebar = () => (
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
    </nav>

    <div className="pt-8 mt-8 border-t border-gray-50 space-y-4">
      <Link 
        to="/" 
        className="flex items-center space-x-3 p-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-orange-600 transition-all shadow-xl shadow-black/10 group active:scale-95"
      >
        <HomeIcon size={18} className="group-hover:-translate-y-0.5 transition-transform" />
        <span>Back to Home</span>
      </Link>
    </div>
  </aside>
);

const CustomerSidebar = () => (
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
    </div>
  </aside>
);

const RiderBottomNav = () => {
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
    </div>
  );
};

export default App;
