
import React, { useState, useEffect } from 'react';
import {
  Package, MapPin, DollarSign, Clock, 
  ChevronRight, ArrowRight, ShieldCheck,
  Navigation, CheckCircle2
} from 'lucide-react';
import { OrderService } from '../../services/orderService';
import { Order, OrderStatus } from '../../types';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const AvailableJobs: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Order[]>([]);
  const [dismissedJobIds, setDismissedJobIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);

  useEffect(() => {
    void loadPool();
    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadPool();
      }
    }, 15000);

    return () => window.clearInterval(refreshInterval);
  }, []);

  const loadPool = async () => {
    setLoading(true);
    try {
      const data = await OrderService.getOrderPool();
      setJobs(data.filter((o) => o.status === OrderStatus.READY_FOR_PICKUP && !o.riderId));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (orderId: string) => {
    if (!user?.id) return;

    const riderId = user.id;
    const riderName = user.name || 'E-Malla Rider';

    setAcceptingJobId(orderId);
    setError(null);
    try {
      await OrderService.assignRider(orderId, riderId, riderName);
      setMessage('Delivery accepted. The customer and seller have been notified.');
      await loadPool();
      window.setTimeout(() => navigate(`/rider/orders/${orderId}/track`), 900);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Unable to accept this delivery right now.');
    } finally {
      setAcceptingJobId(null);
    }
  };

  const handleDismissJob = (orderId: string) => {
    setDismissedJobIds((current) => [...current, orderId]);
    setMessage('Job hidden from your list for now.');
    window.setTimeout(() => setMessage(null), 2500);
  };

  const visibleJobs = jobs.filter((job) => !dismissedJobIds.includes(job.id));

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {message ? (
        <div className="mx-2 rounded-2xl bg-emerald-500 text-white px-5 py-4 text-sm font-black shadow-lg">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mx-2 rounded-2xl bg-red-50 border border-red-100 text-red-600 px-5 py-4 text-sm font-black">
          {error}
        </div>
      ) : null}
      <div className="flex justify-between items-end px-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Available Pickup Jobs</h1>
          <p className="text-gray-500 text-sm font-medium">Live fulfillment requests ready for rider assignment.</p>
        </div>
        <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
          {visibleJobs.length} Active Jobs
        </div>
      </div>

      <div className="space-y-6">
        {visibleJobs.map((job) => {
          const riderPayout = Number(job.riderPayout ?? job.deliveryFee ?? 0);
          const canAccept = riderPayout > 0 && acceptingJobId !== job.id;

          return (
          <div key={job.id} className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm hover:border-orange-500/30 transition-all group relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-emerald-500 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest">
               Rider Payout • RWF {riderPayout.toLocaleString()}
             </div>
             
             <div className="flex items-center space-x-4 mb-8">
                <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                  <Package size={24} />
                </div>
                <div>
                   <h4 className="font-black text-lg text-gray-900">Pickup: {job.merchantName}</h4>
                   <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center">
                     <Clock size={12} className="mr-1" /> Requested {new Date(job.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </p>
                </div>
             </div>

             <div className="space-y-6 bg-gray-50 p-6 rounded-3xl mb-8">
                <div className="flex items-start space-x-4">
                   <div className="mt-1 w-2.5 h-2.5 rounded-full bg-orange-500 border-4 border-orange-100 shadow-sm"></div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pick up items at:</p>
                      <p className="text-sm font-bold text-gray-700">{job.merchantName} dispatch point</p>
                   </div>
                </div>
                <div className="flex items-start space-x-4">
                   <div className="mt-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-4 border-emerald-100 shadow-sm"></div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deliver to:</p>
                      <p className="text-sm font-bold text-gray-700">{job.address}</p>
                   </div>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 border border-gray-100">
                  <div className="flex items-center space-x-2 text-emerald-600">
                    <DollarSign size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Your fee</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900">RWF {riderPayout.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Customer fee RWF {Number(job.deliveryFee || 0).toLocaleString()}</p>
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleDismissJob(job.id)}
                  className="py-5 bg-gray-100 text-gray-500 rounded-[24px] font-black text-xs hover:bg-gray-200 transition-all uppercase tracking-widest active:scale-95"
                >
                  Dismiss
                </button>
                <button 
                  onClick={() => handleAcceptJob(job.id)}
                  disabled={!canAccept}
                  className="py-5 bg-black text-white rounded-[24px] font-black text-xs shadow-xl shadow-black/10 active:bg-orange-500 transition-all uppercase tracking-widest active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Navigation size={16} />
                  <span>{acceptingJobId === job.id ? 'Accepting...' : riderPayout > 0 ? `Accept • RWF ${riderPayout.toLocaleString()}` : 'Fee Pending'}</span>
                </button>
             </div>
          </div>
          );
        })}

        {visibleJobs.length === 0 && !loading && (
          <div className="bg-white rounded-[40px] p-24 text-center border-2 border-dashed border-gray-100 shadow-sm">
            <Clock size={56} className="mx-auto text-gray-100 mb-8" />
            <h2 className="text-2xl font-black text-gray-900 mb-3">No pickup jobs available</h2>
            <p className="text-gray-500 text-sm max-w-[260px] mx-auto font-medium">New pickup requests will appear here as soon as sellers prepare orders for collection.</p>
            <button onClick={loadPool} className="mt-8 bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">Refresh Jobs</button>
          </div>
        )}
      </div>

      <div className="p-8 bg-gray-900 rounded-[40px] text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[80px] opacity-10 -translate-y-1/2 translate-x-1/2"></div>
         <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-6">
               <div className="p-4 bg-white/10 rounded-2xl text-emerald-400 shadow-inner">
                  <ShieldCheck size={32} />
               </div>
               <div>
                  <h4 className="font-black text-lg leading-none mb-2">Delivery Standards</h4>
                  <p className="text-xs text-gray-400 font-medium">Handle merchant packages carefully and confirm each handoff accurately.</p>
               </div>
            </div>
            <ChevronRight size={24} className="text-gray-700" />
         </div>
      </div>
    </div>
  );
};

export default AvailableJobs;
