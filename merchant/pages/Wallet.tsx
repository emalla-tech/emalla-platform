
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Download, ArrowUpRight, 
  ArrowDownLeft, Clock, CheckCircle2, HelpCircle 
} from 'lucide-react';
import { MerchantService } from '../../services/merchantService';
import { Transaction } from '../../types';

const MerchantWallet: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallet, setWallet] = useState<any>(null);

  useEffect(() => {
    MerchantService.getTransactions().then(setTransactions);
    MerchantService.getWalletBalance().then(setWallet);
  }, []);

  if (!wallet) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-900">E-Malla Wallet</h1>
          <p className="text-gray-500 text-sm">Manage your earnings and payout schedule.</p>
        </div>
        <button className="flex items-center px-6 py-3 border border-gray-200 rounded-2xl text-sm font-black bg-white hover:bg-gray-50 transition-all shadow-sm">
          <Download size={18} className="mr-2" /> Export Statements
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Balance Card */}
        <div className="lg:col-span-2 bg-gray-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-black/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
               <div className="p-4 bg-white/10 border border-white/10 rounded-2xl text-orange-500">
                 <DollarSign size={32} />
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Commission Rate</p>
                  <p className="text-xl font-black">10%</p>
               </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Available to withdraw</p>
              <h2 className="text-5xl md:text-6xl font-black">RWF {wallet.currentBalance.toLocaleString()}</h2>
            </div>
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <button className="flex-grow bg-orange-500 hover:bg-orange-600 py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 transition-all active:scale-95">
                Request Payout to MoMo
              </button>
              <button className="px-10 bg-white/10 hover:bg-white/20 py-5 rounded-2xl font-black text-lg transition-all">
                Bank Settings
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group hover:border-orange-500/30 transition-all">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pending Clearances</p>
              <div className="flex justify-between items-end">
                 <h3 className="text-2xl font-black text-gray-900">RWF {wallet.pendingPayouts.toLocaleString()}</h3>
                 <Clock className="text-orange-500 mb-1" size={24} />
              </div>
              <p className="text-xs text-gray-500 mt-4 font-medium">Clearance in 2-3 business days after delivery.</p>
           </div>
           <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group hover:border-emerald-500/30 transition-all">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Earnings (Life)</p>
              <div className="flex justify-between items-end">
                 <h3 className="text-2xl font-black text-gray-900">RWF {wallet.totalWithdrawn.toLocaleString()}</h3>
                 <TrendingUp className="text-emerald-500 mb-1" size={24} />
              </div>
              <div className="mt-4 flex items-center space-x-2 text-emerald-600">
                <CheckCircle2 size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Verified Seller Account</span>
              </div>
           </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-10">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black text-gray-900">Recent Transactions</h3>
          <button className="text-orange-500 font-bold text-sm hover:underline flex items-center">
            View All History <ArrowUpRight size={16} className="ml-1" />
          </button>
        </div>

        <div className="space-y-6">
          {transactions.map((txn) => (
            <div key={txn.id} className="flex items-center justify-between p-6 rounded-3xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group">
              <div className="flex items-center space-x-6">
                <div className={`p-3 rounded-2xl ${txn.type === 'payout' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                   {txn.type === 'payout' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-sm group-hover:text-orange-600 transition-colors">{txn.method}</h4>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{txn.id} • {new Date(txn.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-black text-lg ${txn.type === 'payout' ? 'text-red-500' : 'text-gray-900'}`}>
                  {txn.type === 'payout' ? '-' : '+'} RWF {txn.amount.toLocaleString()}
                </p>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                  txn.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-yellow-50 text-yellow-600'
                }`}>
                  {txn.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MerchantWallet;
