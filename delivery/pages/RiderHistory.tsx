
import React, { useState, useEffect } from 'react';
import { Package, Calendar, CheckCircle2, ChevronRight, Search } from 'lucide-react';
import { RiderService } from '../../services/riderService';
import { Order } from '../../types';

const RiderHistory: React.FC = () => {
  const [history, setHistory] = useState<Order[]>([]);

  useEffect(() => {
    // In a real app, we'd fetch actual history. Using mock for now.
    RiderService.getAssignedDeliveries().then(data => {
      // Mocking more items for history
      const mockHistory = [
        ...data,
        { ...data[0], id: 'ORD-771', status: 'DELIVERED' as any, createdAt: '2024-05-23T10:00:00Z' },
        { ...data[0], id: 'ORD-765', status: 'DELIVERED' as any, createdAt: '2024-05-22T15:30:00Z' },
        { ...data[0], id: 'ORD-750', status: 'DELIVERED' as any, createdAt: '2024-05-21T09:45:00Z' },
      ];
      setHistory(mockHistory);
    });
  }, []);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="px-2">
        <h1 className="text-2xl font-black text-gray-900">Delivery History</h1>
        <p className="text-gray-500 text-sm font-medium">Your track record on the platform.</p>
      </div>

      <div className="relative group px-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search by Order ID..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-orange-50 font-bold text-sm shadow-sm transition-all"
        />
      </div>

      <div className="space-y-4">
        {history.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="font-black text-gray-900">Order #{item.id}</h4>
                <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                  <Calendar size={10} className="mr-1" />
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-gray-900">RWF 1,500</p>
              <span className="text-[8px] font-black uppercase text-emerald-500 tracking-tighter">Completed</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200 text-center">
         <Package size={40} className="mx-auto text-gray-200 mb-4" />
         <p className="text-sm font-bold text-gray-400">End of history log</p>
      </div>
    </div>
  );
};

export default RiderHistory;
