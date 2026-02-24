
import React, { useEffect, useState } from 'react';
import { 
  Search, Filter, MoreHorizontal, Truck, 
  CheckCircle2, Clock, XCircle, Eye, Printer,
  ShieldAlert, RefreshCcw, User, ArrowRight,
  TrendingUp, Activity, Package
} from 'lucide-react';
import { OrderService } from '../../services/orderService';
import { Order, OrderStatus, PaymentStatus } from '../../types';

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    loadAllOrders();
  }, []);

  const loadAllOrders = async () => {
    setLoading(true);
    const data = await OrderService.getAllOrders();
    setOrders(data);
    setLoading(false);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config = {
      [OrderStatus.PENDING_PAYMENT]: { bg: 'bg-yellow-50', text: 'text-yellow-600', dot: 'bg-yellow-500' },
      [OrderStatus.PAID]: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
      [OrderStatus.PREPARING]: { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' },
      [OrderStatus.ON_THE_WAY]: { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' },
      [OrderStatus.DELIVERED]: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
      [OrderStatus.CANCELLED]: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
    };
    const style = config[status as keyof typeof config] || { bg: 'bg-gray-50', text: 'text-gray-400', dot: 'bg-gray-400' };
    
    return (
      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${style.bg} ${style.text}`}>
        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${style.dot}`}></div>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const handleAction = async (orderId: string, action: 'cancel' | 'complete') => {
    if (action === 'cancel') {
      await OrderService.updateOrderStatus(orderId, OrderStatus.CANCELLED);
    } else {
      await OrderService.updateOrderStatus(orderId, OrderStatus.COMPLETED);
    }
    loadAllOrders();
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || o.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Global Logistics Hub</h1>
          <p className="text-gray-500 text-lg font-medium">Monitoring nationwide order lifecycle from 30 districts.</p>
        </div>
        <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
           <button onClick={loadAllOrders} className="p-3 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-orange-500 transition-all">
             <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      {/* Global Admin KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
               <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition-all duration-500"><TrendingUp size={24} /></div>
               <span className="text-emerald-500 text-xs font-black">+12.5%</span>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Orders</p>
            <h3 className="text-3xl font-black text-gray-900">{orders.length}</h3>
         </div>
         <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
               <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-500"><Truck size={24} /></div>
               <span className="text-blue-500 text-xs font-black">Stable</span>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">In Transit</p>
            <h3 className="text-3xl font-black text-gray-900">{orders.filter(o => o.status === OrderStatus.ON_THE_WAY).length}</h3>
         </div>
         <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
               <div className="p-4 bg-red-50 text-red-500 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-all duration-500"><ShieldAlert size={24} /></div>
               <span className="text-red-500 text-xs font-black">2 Alerts</span>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Failed Payments</p>
            <h3 className="text-3xl font-black text-gray-900">2</h3>
         </div>
         <div className="bg-gray-900 p-8 rounded-[40px] shadow-2xl text-white">
            <div className="flex justify-between items-start mb-6">
               <div className="p-4 bg-white/10 rounded-2xl text-emerald-400"><Activity size={24} /></div>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg. Delivery</p>
            <h3 className="text-3xl font-black">2.4 Hours</h3>
         </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
        {/* Table Header / Filters */}
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search Order Number or Customer..." 
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-none font-bold text-sm transition-all" 
              />
           </div>
           <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar w-full md:w-auto">
              {['all', OrderStatus.PAID, OrderStatus.ON_THE_WAY, OrderStatus.DELIVERED].map(f => (
                <button 
                  key={f}
                  onClick={() => setActiveFilter(f as any)}
                  className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeFilter === f ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {f === 'all' ? 'All' : f.replace('_', ' ')}
                </button>
              ))}
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entities</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Financials</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Logistics</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-10 py-8">
                    <div className="flex items-center space-x-4">
                       <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-orange-500 shadow-sm"><Package size={24} /></div>
                       <div>
                          <p className="font-black text-gray-900">{order.orderNumber}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="space-y-3">
                       <div className="flex items-center space-x-2">
                          <User size={14} className="text-blue-500" />
                          <span className="text-xs font-bold text-gray-700">{order.customerName}</span>
                       </div>
                       <div className="flex items-center space-x-2">
                          <Truck size={14} className="text-orange-500" />
                          <span className="text-xs font-bold text-gray-700">{order.merchantName}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div>
                       <p className="text-lg font-black text-gray-900">RWF {order.totalAmount.toLocaleString()}</p>
                       <p className={`text-[9px] font-black uppercase mt-1 ${order.paymentStatus === 'SUCCESS' ? 'text-emerald-500' : 'text-red-400'}`}>
                         {order.paymentMethod} • {order.paymentStatus}
                       </p>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-3 bg-white border border-gray-100 text-gray-500 rounded-xl hover:bg-black hover:text-white transition-all shadow-sm"><Eye size={18} /></button>
                       <button 
                        onClick={() => handleAction(order.id, 'cancel')}
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                       >
                         <XCircle size={18} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-32 text-center">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-200"><Search size={48} /></div>
             <h3 className="text-2xl font-black text-gray-900 mb-2">No logistics found</h3>
             <p className="text-gray-500 font-medium">Try adjusting your filters or search keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
