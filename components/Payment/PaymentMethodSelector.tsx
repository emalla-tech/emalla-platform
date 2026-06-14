
import React from 'react';
import { Building2, CheckCircle2, Banknote } from 'lucide-react';
import { PaymentMethod } from '../../types';

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ selected, onSelect }) => {
  const methods = [
    {
      id: PaymentMethod.GTBANK_MOMO_PAY,
      name: 'GTBank MoMo Pay',
      desc: 'Pay free by dialing a secure USSD code',
      icon: <Building2 className="text-red-600" />,
      color: 'border-red-100 bg-red-50/30',
      activeColor: 'border-red-500 bg-red-50 ring-red-100',
      badge: 'Recommended'
    },
    {
      id: PaymentMethod.CASH_ON_DELIVERY,
      name: 'Cash on Delivery',
      desc: 'Pay with cash when your order arrives',
      icon: <Banknote className="text-emerald-600" />,
      color: 'border-emerald-100 bg-emerald-50/30',
      activeColor: 'border-emerald-500 bg-emerald-50 ring-emerald-100',
      badge: 'COD'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Select Payment Method</h3>
      </div>
      
      <div className="grid gap-4">
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            className={`relative p-6 border-2 rounded-[32px] transition-all flex items-center justify-between text-left group ${
              selected === method.id 
              ? `${method.activeColor} shadow-xl shadow-gray-100 ring-4`
              : 'border-gray-100 bg-white hover:border-orange-200'
            }`}
          >
            <div className="flex items-center space-x-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                selected === method.id ? 'bg-white shadow-sm' : 'bg-gray-50'
              }`}>
                {method.icon}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-black text-gray-900">{method.name}</h4>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                    selected === method.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {method.badge}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-1">{method.desc}</p>
              </div>
            </div>
            
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              selected === method.id ? 'border-orange-500 bg-orange-500' : 'border-gray-200'
            }`}>
              {selected === method.id && <CheckCircle2 size={16} className="text-white" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
