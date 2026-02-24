
import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, RefreshCw, ArrowLeft, Phone } from 'lucide-react';

const PaymentFailure: React.FC = () => {
  return (
    <div className="min-h-screen bg-red-50/30 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-[50px] shadow-2xl border border-white p-10 md:p-16 text-center relative overflow-hidden animate-in zoom-in fade-in duration-700">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-2 bg-red-500 rounded-b-full"></div>
        
        <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl shadow-red-100">
          <XCircle size={56} />
        </div>

        <div className="space-y-4 mb-12">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Payment Interrupted</h1>
          <p className="text-gray-500 font-medium text-lg leading-relaxed">
            Something went wrong while processing your <span className="text-red-600 font-black uppercase">MTN MoMo</span> transaction. 
            No funds have been debited from your account.
          </p>
        </div>

        <div className="space-y-4 bg-gray-50 p-6 rounded-[32px] border border-gray-100 mb-10 text-left">
           <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Troubleshooting:</h4>
           <ul className="space-y-3 text-sm font-bold text-gray-600">
              <li className="flex items-center"><div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3"></div> Check your balance & daily limits</li>
              <li className="flex items-center"><div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3"></div> Ensure you entered the correct MoMo PIN</li>
              <li className="flex items-center"><div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3"></div> Network congestion in your area</li>
           </ul>
        </div>

        <div className="space-y-3">
          <Link 
            to="/checkout" 
            className="w-full bg-black text-white py-5 rounded-[24px] font-black text-lg flex items-center justify-center space-x-3 hover:bg-orange-500 transition-all shadow-xl"
          >
            <RefreshCw size={22} />
            <span>Try Again</span>
          </Link>
          <Link 
            to="/contact" 
            className="w-full bg-white border border-gray-100 text-gray-600 py-5 rounded-[24px] font-black hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
          >
            <Phone size={18} />
            <span>Contact Support</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
