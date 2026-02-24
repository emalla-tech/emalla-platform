
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RefreshCw, ShieldCheck, Zap } from 'lucide-react';
import { PaymentService } from '../../services/paymentService';
import { PaymentStatus } from '../../types';

const PaymentProcessing: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tx_ref = searchParams.get('tx_ref');
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');

  useEffect(() => {
    if (!tx_ref) {
      navigate('/checkout');
      return;
    }

    const verify = async () => {
      try {
        const result = await PaymentService.verifyPayment(tx_ref);
        if (result.status === PaymentStatus.SUCCESS) {
          setTimeout(() => navigate('/payment/success'), 1000);
        } else {
          setTimeout(() => navigate('/payment/failure'), 1000);
        }
      } catch (err) {
        navigate('/payment/failure');
      }
    };

    verify();
  }, [tx_ref, navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-10 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-24 h-24 border-8 border-orange-100 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center text-orange-500">
            <Zap size={32} />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Verifying Payment...</h1>
          <p className="text-gray-500 font-medium">
            Please do not refresh this page. We are confirming your transaction with <span className="text-orange-600 font-bold">MTN MoMo</span>.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 flex items-center justify-center space-x-3">
          <ShieldCheck className="text-emerald-500" size={20} />
          <span className="text-xs font-black uppercase tracking-widest text-gray-400">Secure Fintech Layer Active</span>
        </div>

        <div className="pt-10">
          <div className="flex items-center justify-center space-x-2 text-gray-300">
             <RefreshCw size={14} className="animate-spin" />
             <span className="text-[10px] font-black uppercase tracking-[3px]">Syncing with Gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessing;
