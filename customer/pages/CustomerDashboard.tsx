
import React, { useEffect, useMemo, useState } from 'react';
import { 
  ShoppingBag, Truck, Heart,
  ChevronRight, ArrowRight, Package, 
  Clock, Zap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CustomerService } from '../../services/customerService';
import { useAuth } from '../../auth/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import { getProductPrimaryImage, handleProductImageError } from '../../lib/productImages';

const getCardColors = (color: 'orange' | 'blue' | 'red' | 'emerald') => {
  const colors = {
    orange: 'bg-orange-50 text-orange-500',
    blue: 'bg-blue-50 text-blue-500',
    red: 'bg-red-50 text-red-500',
    emerald: 'bg-emerald-50 text-emerald-500'
  };

  return colors[color];
};

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const products = useProducts();
  const recommendedProducts = useMemo(() => products.slice(0, 2), [products]);

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const nextSummary = await CustomerService.getDashboardSummary();
        setSummary(nextSummary);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load buyer dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 text-center shadow-sm">
        <h2 className="text-xl font-black text-gray-900">Buyer dashboard unavailable</h2>
        <p className="text-sm text-gray-500 mt-2">{error || 'We could not load your buyer dashboard right now.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Mwaramutse, {user?.name || 'Customer'}!</h1>
          <p className="text-gray-500 text-sm">Welcome to your E-Malla account.</p>
        </div>
        <Link to="/shop" className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-orange-200 hover:bg-orange-600 transition-all flex items-center">
          Shop Now <ArrowRight size={16} className="ml-2" />
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="My Orders" value={summary.totalOrders} icon={<ShoppingBag size={20} />} color="orange" />
        <StatCard label="Pending" value={summary.pendingDeliveries} icon={<Truck size={20} />} color="blue" />
        <StatCard label="Wishlist" value={summary.wishlistCount} icon={<Heart size={20} />} color="red" />
        <StatCard label="MoMo Points" value={summary.pointsBalance} icon={<Zap size={20} />} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Order Tracking Widget */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full blur-[80px] opacity-10 -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Current Order: {summary.recentOrder.orderNumber}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                    {summary.recentOrder.status ? String(summary.recentOrder.status).replaceAll('_', ' ') : 'NO ACTIVE ORDER'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => summary.recentOrder.id && navigate(`/buyer/orders/${summary.recentOrder.id}/track`)}
                className="text-orange-500 font-black text-xs uppercase tracking-widest hover:underline"
                disabled={!summary.recentOrder.id}
              >
                Track Live
              </button>
            </div>

            <div className="space-y-6">
               <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-900 font-bold">
                    <Clock size={16} className="text-orange-500" />
                    <span>Estimated Arrival: {summary.recentOrder.eta}</span>
                  </div>
                  <span className="text-emerald-600 font-black">
                    {summary.pendingDeliveries > 0 ? 'Active' : 'Settled'}
                  </span>
               </div>
               <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5">
                  <div className={`h-full rounded-full shadow-sm ${summary.pendingDeliveries > 0 ? 'bg-orange-500 w-3/5 shadow-orange-200' : 'bg-emerald-500 w-full shadow-emerald-200'}`}></div>
               </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-50 flex items-center space-x-4">
               <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                 <Truck size={18} className="text-white" />
               </div>
               <p className="text-sm font-medium text-gray-500">
                 {summary.pendingDeliveries > 0
                   ? <>Order is moving through the live delivery pipeline.</>
                   : <>No active rider assigned right now.</>}
               </p>
            </div>
          </div>

          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-black text-gray-900">Recommended for You</h3>
            <Link to="/shop" className="text-orange-500 font-bold text-xs uppercase tracking-widest flex items-center hover:underline">
              See All <ChevronRight size={14} className="ml-1" />
            </Link>
          </div>

          {/* Simple Product List Widget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             {recommendedProducts.map((item) => (
               <div key={item.id} onClick={() => navigate(`/product/${item.id}`)} className="bg-white p-4 rounded-[32px] border border-gray-100 flex items-center space-x-4 hover:shadow-lg transition-all cursor-pointer">
                  <img
                    src={getProductPrimaryImage(item)}
                    onError={(event) => handleProductImageError(event, item.category)}
                    loading="lazy"
                    decoding="async"
                    className="w-20 h-20 rounded-2xl object-cover"
                    alt={item.name}
                  />
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{item.name}</h4>
                    <p className="text-orange-500 font-black text-xs mt-1">RWF {item.price.toLocaleString()}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Support Ticket */}
          <div className="bg-gray-900 rounded-[40px] p-8 text-white">
            <h4 className="font-black text-lg mb-4">Need help?</h4>
            <p className="text-gray-400 text-sm mb-8">Chat with our 24/7 Rwandan support team for help with any order.</p>
            <button
              onClick={() => navigate('/contact')}
              className="w-full py-4 bg-white text-gray-900 rounded-2xl font-black text-sm hover:bg-orange-500 hover:text-white transition-all"
            >
              Open Support Ticket
            </button>
          </div>

          {/* Promo Widget */}
          <div className="bg-emerald-500 rounded-[40px] p-8 text-white relative overflow-hidden">
             <div className="absolute -right-8 -bottom-8 opacity-20 transform rotate-12">
               <ShoppingBag size={150} />
             </div>
             <h4 className="font-black text-lg mb-2">Weekend Special!</h4>
             <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-6">Use Code: RWANDA20</p>
             <p className="text-sm font-medium leading-relaxed mb-6">Get 20% off all fashion items this weekend.</p>
             <Link to="/shop?category=2" className="inline-block px-6 py-2 bg-white text-emerald-600 rounded-full font-black text-xs uppercase shadow-lg">
                Claim Now
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:border-orange-100 transition-all cursor-pointer group">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${getCardColors(color)}`}>
      {icon}
    </div>
    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black text-gray-900">{value}</p>
  </div>
);

export default CustomerDashboard;
