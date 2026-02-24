
import React, { useState, useEffect } from 'react';
import { 
  Zap, MapPin, CheckCircle2, Navigation, 
  ArrowRight, DollarSign, Package, Power 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RiderService } from '../../services/riderService';
import { Rider } from '../../types';

const RiderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [rider, setRider] = useState<Rider | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    RiderService.getProfile().then(setRider);
    RiderService.getEarningsSummary().then(setStats);
  }, []);

  const handleToggleStatus = () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    RiderService.toggleStatus(nextStatus);
  };

  if (!rider || !stats) return null;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Header with Status Toggle */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Mwaramutse, {rider.name.split(' ')[0]}!</h1>
          <p className={`text-xs font-bold uppercase tracking-widest ${isOnline ? 'text-emerald-500' : 'text-gray-400'}`}>
            {isOnline ? 'You are receiving orders' : 'You are currently offline'}
          </p>
        </div>
        <button 
          onClick={handleToggleStatus}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 ${
            isOnline ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-gray-100 text-gray-400 shadow-gray-100'
          }`}
        >
          <Power size={28} />
        </button>
      </div>

      {/* Quick Earnings KPI */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-[32px] p-6 text-white">
          <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Earnings Today</p>
          <h3 className="text-2xl font-black">RWF {stats.today.toLocaleString()}</h3>
        </div>
        <div className="bg-orange-500 rounded-[32px] p-6 text-white">
          <p className="text-[10px] font-black uppercase text-orange-200 mb-1">Wallet Balance</p>
          <h3 className="text-2xl font-black">RWF {stats.walletBalance.toLocaleString()}</h3>
        </div>
      </div>

      {/* Active Assignment Hint */}
      {isOnline ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-lg font-black text-gray-900">Active Task</h3>
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest animate-pulse">In Progress</span>
          </div>
          
          <div className="bg-white rounded-[40px] p-6 border border-gray-100 shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
               <div className="flex items-center space-x-3">
                 <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl">
                    <Package size={20} />
                 </div>
                 <div>
                    <h4 className="font-bold text-gray-900">Order #892</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Pickup from: Inyange Fashion</p>
                 </div>
               </div>
               <button className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                 <Navigation size={20} />
               </button>
            </div>

            <div className="space-y-4 mb-6">
               <div className="flex items-start space-x-3">
                 <div className="mt-1 w-2 h-2 rounded-full bg-orange-500"></div>
                 <p className="text-xs font-medium text-gray-600">KG 11 St, Gasabo, Kigali</p>
               </div>
               <div className="flex items-start space-x-3">
                 <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500"></div>
                 <p className="text-xs font-medium text-gray-600">Kimironko Market, House 10</p>
               </div>
            </div>

            <button 
              onClick={() => navigate('/dashboard/orders/892/track')}
              className="w-full bg-black text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2"
            >
              <span>View Task Details</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[40px] p-12 text-center">
           <Zap size={48} className="mx-auto text-gray-200 mb-4" />
           <h3 className="text-xl font-black text-gray-900 mb-2">Ready to earn?</h3>
           <p className="text-gray-500 text-sm mb-8">Go online to start receiving delivery requests in your area.</p>
           <button 
            onClick={handleToggleStatus}
            className="bg-orange-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-orange-200"
           >
             Go Online Now
           </button>
        </div>
      )}

      {/* Performance Summary */}
      <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 mb-6">Your Performance</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
           <div>
              <p className="text-xl font-black text-gray-900">{rider.rating}</p>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Rating</p>
           </div>
           <div className="border-x border-gray-50">
              <p className="text-xl font-black text-gray-900">98%</p>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">On-Time</p>
           </div>
           <div>
              <p className="text-xl font-black text-gray-900">{rider.totalDeliveries}</p>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Jobs Done</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 transition-all active:scale-95 group">
    <div className={`w-10 h-10 bg-${color}-50 text-${color}-500 rounded-xl flex items-center justify-center mb-4`}>
      {icon}
    </div>
    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black text-gray-900">{value}</p>
  </div>
);

export default RiderDashboard;
