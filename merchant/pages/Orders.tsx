
import React, { useState, useEffect } from 'react';
import { 
  Package, Truck, Clock, CheckCircle2, XCircle, 
  Printer, MoreHorizontal, User, MapPin, Navigation,
  AlertCircle, ChevronRight, Play, Check, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OrderService } from '../../services/orderService';
import { Order, OrderStatus, PaymentStatus } from '../../types';

const MerchantOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [stats, setStats] = useState({ new: 0, preparing: 0, completed: 0 });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const data = await OrderService.getAllOrders(); // In reality: getOrdersByMerchant('MCH-05')
    setOrders(data);
    setStats({
      new: data.filter(o => o.status === OrderStatus.PAID).length,
      preparing: data.filter(o => o.status === OrderStatus.PREPARING).length,
      completed: data.filter(o => o.status === OrderStatus.DELIVERED).length
    });
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    await OrderService.updateOrderStatus(orderId, status);
    loadOrders();
  };

  const filteredOrders = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Fulfillment Center</h1>
          <p className="text-gray-500 text-sm font-medium">Process your incoming orders and manage stock dispatch.</p>
        </div>
        <div className="flex space-x-3 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none p-3 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center">
            <Printer size={20} className="mr-2" /> Manifest
          </button>
          <button className="flex-1 lg:flex-none bg-black text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-black/10 hover:bg-orange-500 transition-all">
            Daily Report
          </button>
        </div>
      </div>

      {/* Merchant KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-blue-600 p-8 rounded-[32px] text-white shadow-xl shadow-blue-100">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">New Orders</p>
            <div className="flex justify-between items-end">
               <h3 className="text-4xl font-black">{stats.new}</h3>
               <Package size={32} className="opacity-40" />
            </div>
         </div>
         <div className="bg-orange-500 p-8 rounded-[32px] text-white shadow-xl shadow-orange-100">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">In Preparation</p>
            <div className="flex justify-between items-end">
               <h3 className="text-4xl font-black">{stats.preparing}</h3>
               <Clock size={32} className="opacity-40" />
            </div>
         </div>
         <div className="bg-gray-900 p-8 rounded-[32px] text-white shadow-xl shadow-black/10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Daily Completed</p>
            <div className="flex justify-between items-end">
               <h3 className="text-4xl font-black">{stats.completed}</h3>
               <CheckCircle2 size={32} className="opacity-40" />
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-8 border-b border-gray-100 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'all', label: 'All Activity' },
          { id: OrderStatus.PAID, label: 'Incoming' },
          { id: OrderStatus.PREPARING, label: 'Preparing' },
          { id: OrderStatus.READY_FOR_PICKUP, label: 'Dispatch' },
          { id: OrderStatus.ON_THE_WAY, label: 'Transit' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${
              activeTab === tab.id ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-t-full shadow-lg" />}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="grid gap-6">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden hover:shadow-2xl hover:border-orange-100 transition-all group">
            <div className="p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-8">
                <div className="flex items-center space-x-6">
                  <div className="p-5 bg-orange-50 text-orange-500 rounded-[28px] group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                    <Package size={32} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3">
                       <h3 className="font-black text-2xl text-gray-900">{order.orderNumber}</h3>
                       {order.paymentStatus === PaymentStatus.SUCCESS && (
                         <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border border-emerald-100">Paid</span>
                       )}
                    </div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 flex items-center">
                      <Clock size={12} className="mr-1.5" /> Placed {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {order.status === OrderStatus.PAID && (
                    <button 
                      onClick={() => handleUpdateStatus(order.id, OrderStatus.PREPARING)}
                      className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center active:scale-95"
                    >
                      <Play size={18} className="mr-2" /> Start Preparing
                    </button>
                  )}
                  {order.status === OrderStatus.PREPARING && (
                    <button 
                      onClick={() => handleUpdateStatus(order.id, OrderStatus.READY_FOR_PICKUP)}
                      className="px-8 py-3 bg-orange-500 text-white rounded-2xl font-black text-sm hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 flex items-center active:scale-95"
                    >
                      <Check size={18} className="mr-2" /> Ready for Pickup
                    </button>
                  )}
                  {order.status === OrderStatus.READY_FOR_PICKUP && (
                    <div className="flex items-center space-x-3 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
                       <Send size={18} className="text-emerald-500" />
                       <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Awaiting Rider</span>
                    </div>
                  )}

                  <div className="h-10 w-px bg-gray-100 mx-2 hidden lg:block"></div>
                  <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all">
                    <Printer size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-gray-50 pt-10">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Customer</p>
                   <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-500 text-lg">
                        {order.customerName[0]}
                      </div>
                      <div>
                        <p className="font-black text-gray-900">{order.customerName}</p>
                        <p className="text-xs text-gray-400 font-medium">Verified Phone: {order.phone}</p>
                      </div>
                   </div>
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Drop-off Location</p>
                   <div className="flex items-start space-x-3 text-gray-500">
                      <MapPin size={18} className="mt-0.5 text-orange-500 flex-shrink-0" />
                      <p className="text-sm font-bold text-gray-700 leading-relaxed">{order.address}</p>
                   </div>
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Manifest Items</p>
                   <div className="bg-gray-50 p-4 rounded-3xl space-y-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="font-bold text-gray-900">{item.quantity}x {item.productName}</span>
                          <span className="text-gray-400 font-medium">RWF {item.price.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                         <span className="text-xs font-black uppercase text-gray-400">Total Payout</span>
                         <span className="text-lg font-black text-emerald-600">RWF {(order.totalAmount - order.deliveryFee).toLocaleString()}</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-[40px] p-24 text-center border-2 border-dashed border-gray-100 shadow-sm">
            <AlertCircle size={48} className="mx-auto text-gray-200 mb-6" />
            <h3 className="text-xl font-black text-gray-900 mb-2">No orders in this status</h3>
            <p className="text-gray-500 font-medium">Check other tabs or wait for new customer requests.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantOrders;
