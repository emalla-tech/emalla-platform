
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Store, 
  Truck, 
  DollarSign, 
  Settings, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  X, 
  Bell,
  Search,
  FileText,
  Mail,
  Shield,
  Activity
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import MobileBottomNav from '../components/pwa/MobileBottomNav';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const NAV_ITEMS = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Orders', path: '/admin/dashboard/orders', icon: <ShoppingBag size={20} /> },
    { name: 'Merchants', path: '/admin/dashboard/sellers', icon: <Store size={20} /> },
    { name: 'Products', path: '/admin/dashboard/products', icon: <FileText size={20} /> },
    { name: 'Customers', path: '/admin/dashboard/users', icon: <Users size={20} /> },
    { name: 'Team Access', path: '/admin/dashboard/staff', icon: <Shield size={20} /> },
    { name: 'Support Desk', path: '/admin/dashboard/inquiries', icon: <Mail size={20} /> },
    { name: 'Emails', path: '/admin/dashboard/emails', icon: <Mail size={20} /> },
    { name: 'Logistics', path: '/admin/dashboard/logistics', icon: <Truck size={20} /> },
    { name: 'Finance', path: '/admin/dashboard/finance', icon: <DollarSign size={20} /> },
    { name: 'Audit Logs', path: '/admin/dashboard/logs', icon: <ShieldAlert size={20} /> },
    { name: 'Monitoring', path: '/admin/dashboard/monitoring', icon: <Activity size={20} /> },
    { name: 'Security', path: '/admin/dashboard/security', icon: <Shield size={20} /> },
    { name: 'Settings', path: '/admin/dashboard/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 hidden md:flex flex-col h-full z-50`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-50">
          <Link to="/" className={`flex items-center space-x-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="w-8 h-8 bg-orange-500 rounded-lg shadow-lg shadow-orange-200"></div>
            <span className="font-black text-xl text-gray-900 tracking-tight">E-MALLA</span>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-grow py-6 px-4 space-y-2 overflow-y-auto no-scrollbar">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-xl transition-all group ${
                location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`${location.pathname === item.path ? 'text-white' : 'text-gray-400 group-hover:text-orange-500'}`}>
                {item.icon}
              </span>
              {isSidebarOpen && <span className="font-bold text-sm">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => {
              logout();
              navigate('/admin', { replace: true });
            }}
            className="w-full flex items-center space-x-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-bold text-sm">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4 max-w-lg w-full">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search orders, sellers, or products..." 
                className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-orange-50 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 md:space-x-6">
            <Link
              to="/admin/dashboard/monitoring"
              aria-label="Open system monitoring"
              className="relative p-2 text-gray-400 hover:bg-gray-50 rounded-lg"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </Link>
            <div className="flex items-center space-x-3 pl-3 md:pl-6 border-l border-gray-100">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">Admin Panel</p>
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Super User</p>
              </div>
              <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold">A</div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-grow overflow-y-auto p-4 pb-28 md:p-8 bg-gray-50/50">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
        <MobileBottomNav
          accentClass="text-gray-900"
          backgroundClass="bg-white/96"
          items={[
            { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
            { to: '/admin/dashboard/sellers', label: 'Sellers', icon: <Store /> },
            { to: '/admin/dashboard/orders', label: 'Orders', icon: <ShoppingBag /> },
            { to: '/admin/dashboard/settings', label: 'Settings', icon: <Settings /> }
          ]}
        />
      </div>
    </div>
  );
};

export default AdminLayout;
