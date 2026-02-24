
import React, { useEffect, useState } from 'react';
import { 
  Package, Search, Filter, ChevronRight, 
  MapPin, Printer, RefreshCcw, Star, Truck,
  Clock, CheckCircle2, XCircle, AlertCircle,
  FileText, ArrowRight
} from 'lucide-react';
import { OrderService } from '../../services/orderService';
import { Order, OrderStatus } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import { DEV_USER } from '../../config/devUser';

const MyOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    OrderService.getOrdersByCustomer(DEV_USER.id).then(setOrders);
  }, []);

  const getStatusBadge = (status: OrderStatus) => {
    const config = {
      [OrderStatus.PENDING_PAYMENT]: { bg: 'bg-yellow-50', text: 'text-yellow-600', label: 'Payment Pending' },
      [OrderStatus.PAID]: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Paid' },
      [OrderStatus.CONFIRMED]: { bg: 'bg-indigo-50', text: 'text-indigo-600', label: 'Confirmed' },
      [OrderStatus.PREPARING]: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Preparing' },
      [OrderStatus.ON_THE_WAY]: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'On The Way' },
      [OrderStatus.DELIVERED]: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Delivered' },
      [OrderStatus.CANCELLED]: { bg: 'bg-red-50', text: 'text-red-600', label: 'Cancelled' },
    };
    const style = config[status as keyof typeof config] || { bg: 'bg-gray-50', text: 'text-gray-400', label: status };
    
    return (
      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const handleCancel = async (orderId: string) => {
    if (confirm("Are you sure you want to cancel this order?")) {
      await OrderService.cancelOrder(orderId);
      const updated = await OrderService.getOrdersByCustomer(DEV_USER.id);
      setOrders(updated);
      setSelectedOrder(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Shopping History</h1>
          <p className="text-gray-500 text-sm font-medium">Manage your active orders and review past purchases.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
           {['all', 'active', 'completed'].map((f) => (
             <button 
               key={f}
               onClick={() => setActiveFilter(f)}
               className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                 activeFilter === f ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'text-gray-400 hover:text-gray-600'
               }`}
             >
               {f}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Orders List */}
        <div className="xl:col-span-2 space-y-6">
          {orders.map((order) => (
            <div 
              key={order.id} 
              onClick={() => setSelectedOrder(order)}
              className={`bg-white rounded-[40px] border-2 transition-all cursor-pointer group overflow-hidden ${
                selectedOrder?.id === order.id ? 'border-orange-500 shadow-2xl scale-[1.01]' : 'border-transparent shadow-sm hover:shadow-xl hover:border-gray-200'
              }`}
            >
              <div className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                  <div className="flex items-center space-x-6">
                    <div className={`p-4 rounded-[24px] transition-colors ${selectedOrder?.id === order.id ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-500'}`}>
                      <Package size={28} />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-gray-900">{order.orderNumber}</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Placed {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(order.status)}
                    <ChevronRight size={20} className={`text-gray-300 transition-transform ${selectedOrder?.id === order.id ? 'rotate-90 text-orange-500' : ''}`} />
                  </div>
                </div>

                <div className="flex items-center justify-between py-6 border-y border-gray-50">
                  <div className="flex -space-x-3 overflow-hidden">
                    {order.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="w-12 h-12 rounded-xl border-4 border-white bg-gray-100 overflow-hidden shadow-sm">
                         <img src={`https://picsum.photos/id/${100 + i}/100/100`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-12 h-12 rounded-xl border-4 border-white bg-gray-900 flex items-center justify-center text-[10px] font-black text-white">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Total Paid</p>
                     <p className="text-xl font-black text-gray-900">RWF {order.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="bg-white rounded-[40px] p-24 text-center border-2 border-dashed border-gray-100 shadow-sm">
              <Package size={64} className="mx-auto text-gray-200 mb-8" />
              <h2 className="text-3xl font-black text-gray-900 mb-3">No orders yet</h2>
              <p className="text-gray-500 max-w-sm mx-auto font-medium">Your marketplace journey starts with your first purchase!</p>
              <Link to="/shop" className="mt-10 bg-orange-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-orange-600 transition-all inline-block">Explore Shop</Link>
            </div>
          )}
        </div>

        {/* Order Detail Panel */}
        <div className="xl:col-span-1">
          {selectedOrder ? (
            <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden sticky top-32 animate-in slide-in-from-right duration-500">
               <div className="bg-gray-900 p-10 text-white relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full blur-[60px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                  <h4 className="text-xs font-black text-orange-500 uppercase tracking-[4px] mb-2">Order Details</h4>
                  <p className="text-3xl font-black">{selectedOrder.orderNumber}</p>
                  <p className="text-gray-400 text-xs mt-4 flex items-center"><Clock size={14} className="mr-2" /> Last update: Just now</p>
               </div>
               
               <div className="p-10 space-y-10">
                  {/* Timeline View */}
                  <div className="space-y-8">
                     <div className="flex items-center justify-between">
                        <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest">Tracking Status</h5>
                        <button className="text-orange-500 text-[10px] font-black uppercase hover:underline">Live Map</button>
                     </div>
                     <div className="space-y-6">
                        {[
                           { status: 'Order Placed', time: '10:00 AM', done: true },
                           { status: 'Payment Verified', time: '10:05 AM', done: selectedOrder.paymentStatus === 'SUCCESS' },
                           { status: 'Seller Confirmed', time: 'Pending', done: selectedOrder.status !== 'pending_payment' && selectedOrder.status !== 'paid' },
                           { status: 'Out for Delivery', time: 'Pending', done: selectedOrder.status === 'on_the_way' || selectedOrder.status === 'delivered' }
                        ].map((step, i) => (
                           <div key={i} className="flex items-start space-x-4">
                              <div className="flex flex-col items-center">
                                 <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${step.done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                                    {step.done ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                 </div>
                                 {i < 3 && <div className={`w-0.5 h-10 mt-2 ${step.done ? 'bg-emerald-100' : 'bg-gray-50'}`}></div>}
                              </div>
                              <div>
                                 <p className={`text-sm font-bold ${step.done ? 'text-gray-900' : 'text-gray-300'}`}>{step.status}</p>
                                 <p className="text-[10px] font-black text-gray-400 uppercase">{step.time}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                     <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivery Address</h5>
                     <div className="flex items-start space-x-3">
                        <MapPin size={18} className="text-orange-500 mt-1 flex-shrink-0" />
                        <p className="text-sm font-bold text-gray-700 leading-relaxed">{selectedOrder.address}</p>
                     </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 space-y-3">
                    <button className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm flex items-center justify-center space-x-2 hover:bg-orange-500 transition-all">
                       <Printer size={18} />
                       <span>Download Invoice PDF</span>
                    </button>
                    {['pending_payment', 'paid', 'confirmed'].includes(selectedOrder.status) && (
                       <button 
                        onClick={() => handleCancel(selectedOrder.id)}
                        className="w-full py-4 bg-white border-2 border-red-100 text-red-500 rounded-2xl font-black text-sm hover:bg-red-50 transition-all"
                       >
                         Cancel Order
                       </button>
                    )}
                  </div>
               </div>
            </div>
          ) : (
            <div className="bg-white rounded-[40px] p-12 text-center border-2 border-dashed border-gray-100 h-[600px] flex flex-col items-center justify-center">
               <FileText size={48} className="text-gray-100 mb-6" />
               <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Select an order <br/> to see details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
