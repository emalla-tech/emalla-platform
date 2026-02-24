
import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownLeft, Clock, Wallet, ChevronRight } from 'lucide-react';
import { RiderService } from '../../services/riderService';

const RiderEarnings: React.FC = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    RiderService.getEarningsSummary().then(setStats);
  }, []);

  if (!stats) return null;

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="px-2">
        <h1 className="text-2xl font-black text-gray-900">Earnings & Wallet</h1>
        <p className="text-gray-500 text-sm font-medium">Manage your payouts and daily income.</p>
      </div>

      {/* Main Balance Card */}
      <div className="bg-gray-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full blur-[80px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-10">
             <div className="p-3 bg-white/10 rounded-2xl text-orange-500">
               <Wallet size={24} />
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">Verified</span>
             </div>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Available Balance</p>
          <h2 className="text-4xl font-black">RWF {stats.walletBalance.toLocaleString()}</h2>
          
          <button className="w-full mt-10 bg-orange-500 hover:bg-orange-600 py-4 rounded-2xl font-black text-sm shadow-xl shadow-orange-500/20 transition-all active:scale-95">
            Withdraw to MTN MoMo
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">This Week</p>
          <div className="flex items-end justify-between">
            <h3 className="text-xl font-black text-gray-900">RWF {stats.week.toLocaleString()}</h3>
            <TrendingUp size={18} className="text-emerald-500 mb-1" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pending</p>
          <div className="flex items-end justify-between">
            <h3 className="text-xl font-black text-gray-900">RWF {stats.pendingClearance.toLocaleString()}</h3>
            <Clock size={18} className="text-orange-500 mb-1" />
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-black text-gray-900 px-2">Financial Activity</h3>
        <div className="space-y-3">
          {[
            { id: '1', title: 'Withdrawal', type: 'payout', amount: 50000, date: 'Today, 08:30 AM' },
            { id: '2', title: 'Delivery Fee #892', type: 'income', amount: 1500, date: 'Yesterday' },
            { id: '3', title: 'Delivery Fee #771', type: 'income', amount: 1500, date: 'May 23' },
          ].map((txn) => (
            <div key={txn.id} className="bg-white p-5 rounded-[24px] border border-gray-100 flex items-center justify-between group">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${txn.type === 'payout' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                  {txn.type === 'payout' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{txn.title}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{txn.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-black text-sm ${txn.type === 'payout' ? 'text-red-500' : 'text-emerald-600'}`}>
                  {txn.type === 'payout' ? '-' : '+'} RWF {txn.amount.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RiderEarnings;
