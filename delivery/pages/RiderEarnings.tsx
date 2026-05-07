import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock, TrendingUp, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RiderService } from '../../services/riderService';
import { Transaction } from '../../types';

const RiderEarnings: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<{
    week: number;
    walletBalance: number;
    pendingClearance: number;
  } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWallet = async () => {
      setLoading(true);
      setError(null);
      try {
        const [walletSummary, walletTransactions] = await Promise.all([
          RiderService.getEarningsSummary(),
          RiderService.getTransactions()
        ]);

        setStats(walletSummary);
        setTransactions(
          walletTransactions.sort(
            (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
          )
        );
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load rider wallet.');
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 text-center shadow-sm">
        <h2 className="text-xl font-black text-gray-900">Rider wallet unavailable</h2>
        <p className="text-sm text-gray-500 mt-2">{error || 'We could not load rider earnings right now.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="px-2">
        <h1 className="text-2xl font-black text-gray-900">Earnings & Wallet</h1>
        <p className="text-gray-500 text-sm font-medium">Manage your payouts and confirmed delivery income.</p>
      </div>

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

          <button
            type="button"
            onClick={() => navigate('/rider', { state: { openSettings: true } })}
            className="w-full mt-10 bg-orange-500 hover:bg-orange-600 py-4 rounded-2xl font-black text-sm shadow-xl shadow-orange-500/20 transition-all active:scale-95"
          >
            Withdraw to MTN MoMo
          </button>
        </div>
      </div>

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

      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-black text-gray-900 px-2">Financial Activity</h3>
        <div className="space-y-3">
          {transactions.map((transaction) => {
            const isPayout = transaction.type === 'payout';
            const title = isPayout
              ? 'Wallet Withdrawal'
              : transaction.orderId
                ? `Delivery Income ${transaction.orderId}`
                : 'Wallet Credit';

            return (
              <div key={transaction.id} className="bg-white p-5 rounded-[24px] border border-gray-100 flex items-center justify-between group">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${isPayout ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    {isPayout ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{title}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-sm ${isPayout ? 'text-red-500' : 'text-emerald-600'}`}>
                    {isPayout ? '-' : '+'} RWF {transaction.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {transactions.length === 0 && (
        <div className="bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 p-8 text-center">
          <p className="text-sm font-bold text-gray-400">No wallet transactions yet</p>
        </div>
      )}
    </div>
  );
};

export default RiderEarnings;
