
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Share2, Star } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-emerald-50/30 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-[50px] shadow-2xl border border-white p-10 md:p-16 text-center relative overflow-hidden animate-in zoom-in fade-in duration-700">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-2 bg-emerald-500 rounded-b-full"></div>
        
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl shadow-emerald-100">
          <CheckCircle2 size={56} />
        </div>

        <div className="space-y-4 mb-12">
          <h1 className="text-4xl font-black text-gray-900">Murakoze Cyane!</h1>
          <p className="text-gray-500 font-medium text-lg">
            Payment confirmed. Your order <span className="text-gray-900 font-black">#892</span> is being processed by <span className="text-orange-600 font-black">Inyange Fashion</span>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Earned</p>
            <p className="text-xl font-black text-gray-900">+500 Points</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
            <p className="text-xl font-black text-emerald-600">PAID</p>
          </div>
        </div>

        <div className="space-y-3">
          <Link 
            to="/dashboard/orders/892/track" 
            className="w-full bg-black text-white py-5 rounded-[24px] font-black text-lg flex items-center justify-center space-x-3 hover:bg-orange-500 transition-all shadow-xl shadow-black/10"
          >
            <Package size={22} />
            <span>Track Delivery</span>
          </Link>
          <Link 
            to="/shop" 
            className="w-full bg-white border border-gray-100 text-gray-600 py-5 rounded-[24px] font-black hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
          >
            <span>Continue Shopping</span>
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-50 flex items-center justify-center space-x-6 grayscale opacity-40">
           <Share2 size={20} />
           <Star size={20} />
           <p className="text-[10px] font-black uppercase tracking-widest">Feedback & Sharing</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
