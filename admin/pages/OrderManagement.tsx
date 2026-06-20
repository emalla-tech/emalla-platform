
import React, { useEffect, useState } from 'react';
import { 
  Search, Filter, MoreHorizontal, Truck, 
  CheckCircle2, Clock, XCircle, Eye, Printer,
  ShieldAlert, RefreshCcw, User, ArrowRight,
  TrendingUp, Activity, Package, X, MapPin, Wallet, CalendarDays
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { OrderService } from '../../services/orderService';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../../types';
import AdminToast from '../../components/AdminToast';
import { AdminService } from '../../services/adminService';

type AdminRiderOption = {
  id: string;
  name: string;
  status: 'active' | 'offline' | 'suspended';
  operationalStatus: string;
};

const OrderManagement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cod'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'success' | 'error' | 'info'>('success');
  const [riders, setRiders] = useState<AdminRiderOption[]>([]);
  const [assigningRiderId, setAssigningRiderId] = useState<string | null>(null);
  const [riderPayoutDrafts, setRiderPayoutDrafts] = useState<Record<string, string>>({});
  const [savingPayoutOrderId, setSavingPayoutOrderId] = useState<string | null>(null);
  const focusOrderId = searchParams.get('orderId');
  const focusOrderNumber = searchParams.get('orderNumber');

  useEffect(() => {
    loadAllOrders();
    loadRiders();
  }, []);

  useEffect(() => {
    if (focusOrderNumber) {
      setSearchTerm(focusOrderNumber);
    }
  }, [focusOrderNumber]);

  useEffect(() => {
    if (!orders.length) return;

    const focusedOrder = orders.find(
      (order) =>
        (focusOrderId && order.id === focusOrderId) ||
        (focusOrderNumber && order.orderNumber === focusOrderNumber)
    );

    if (focusedOrder) {
      setSelectedOrder(focusedOrder);
    }
  }, [orders, focusOrderId, focusOrderNumber]);

  const loadAllOrders = async () => {
    setLoading(true);
    const data = await OrderService.getAllOrders();
    setOrders(data);
    setLoading(false);
  };

  const loadRiders = async () => {
    const data = await AdminService.getRiders('all');
    setRiders(data);
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
    try {
      if (action === 'cancel') {
        await OrderService.updateOrderStatus(orderId, OrderStatus.CANCELLED);
        setToastTone('success');
        setToast('Order cancelled successfully.');
      } else {
        await OrderService.updateOrderStatus(orderId, OrderStatus.COMPLETED);
        setToastTone('success');
        setToast('Order marked as completed.');
      }
      setTimeout(() => setToast(null), 3000);
      loadAllOrders();
    } catch (error) {
      setToastTone('error');
      setToast(error instanceof Error ? error.message : 'Failed to update order.');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || o.status === activeFilter;
    const matchesPayment = paymentFilter === 'all' || o.paymentMethod === PaymentMethod.CASH_ON_DELIVERY;
    return matchesSearch && matchesFilter && matchesPayment;
  });

  const selectedOrderItems = selectedOrder?.items || [];
  const activeRiders = riders.filter((rider) => rider.status === 'active');
  const getRiderPayoutAmount = (order: Order) => Number(order.riderPayout ?? order.deliveryFee ?? 0);

  const handleAssignRider = async (order: Order, rider: AdminRiderOption) => {
    setAssigningRiderId(rider.id);
    try {
      await AdminService.assignRider(order.id, rider.id, rider.name);
      setToastTone('success');
      setToast(`Assigned ${rider.name} to ${order.orderNumber}.`);
      setTimeout(() => setToast(null), 3000);
      await loadAllOrders();
    } catch (error) {
      setToastTone('error');
      setToast(error instanceof Error ? error.message : 'Failed to assign rider.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setAssigningRiderId(null);
    }
  };

  const handleSaveRiderPayout = async (order: Order) => {
    const draft = riderPayoutDrafts[order.id] ?? String(getRiderPayoutAmount(order));
    const riderPayout = Number(draft);

    if (!Number.isFinite(riderPayout) || riderPayout < 0) {
      setToastTone('error');
      setToast('Please enter a valid rider payout amount.');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setSavingPayoutOrderId(order.id);
    try {
      const updatedOrder = await AdminService.updateOrderRiderPayout(order.id, Math.round(riderPayout));
      setOrders((current) => current.map((entry) => entry.id === updatedOrder.id ? updatedOrder : entry));
      setSelectedOrder(updatedOrder);
      setRiderPayoutDrafts((current) => ({ ...current, [updatedOrder.id]: String(updatedOrder.riderPayout || 0) }));
      setToastTone('success');
      setToast(`Rider payout updated to RWF ${Number(updatedOrder.riderPayout || 0).toLocaleString()}.`);
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToastTone('error');
      setToast(error instanceof Error ? error.message : 'Failed to update rider payout.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSavingPayoutOrderId(null);
    }
  };

  const handleCompleteSelectedOrder = async (order: Order) => {
    try {
      await OrderService.updateOrderStatus(order.id, OrderStatus.COMPLETED);
      setToastTone('success');
      setToast(`Order ${order.orderNumber} marked as completed.`);
      setTimeout(() => setToast(null), 3000);
      await loadAllOrders();
    } catch (error) {
      setToastTone('error');
      setToast(error instanceof Error ? error.message : 'Failed to complete order.');
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <AdminToast message={toast} tone={toastTone} />
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
        <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
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
           <div className="flex items-center space-x-3 md:space-x-4 overflow-x-auto no-scrollbar w-full md:w-auto pb-1">
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
              {[
                { id: 'all', label: 'All Payments' },
                { id: 'cod', label: 'COD Only' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setPaymentFilter(filter.id as 'all' | 'cod')}
                  className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    paymentFilter === filter.id ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 md:px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</th>
                <th className="px-6 md:px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entities</th>
                <th className="px-6 md:px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Financials</th>
                <th className="px-6 md:px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Logistics</th>
                <th className="px-6 md:px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className={`group hover:bg-gray-50/50 transition-colors ${
                    (focusOrderId && order.id === focusOrderId) || (focusOrderNumber && order.orderNumber === focusOrderNumber)
                      ? 'bg-orange-50/70 ring-1 ring-inset ring-orange-200'
                      : ''
                  }`}
                >
                  <td className="px-6 md:px-10 py-8">
                    <div className="flex items-center space-x-4">
                       <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-orange-500 shadow-sm"><Package size={24} /></div>
                       <div>
                          <p className="font-black text-gray-900">{order.orderNumber}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-8">
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
                  <td className="px-6 md:px-10 py-8">
                    <div>
                       <p className="text-lg font-black text-gray-900">RWF {order.totalAmount.toLocaleString()}</p>
                       <p className={`text-[9px] font-black uppercase mt-1 ${order.paymentStatus === 'SUCCESS' ? 'text-emerald-500' : 'text-red-400'}`}>
                         {order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'COD' : order.paymentMethod} • {order.paymentStatus}
                       </p>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-8">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 md:px-10 py-8 text-right">
                    <div className="flex justify-end space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                       <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-3 bg-white border border-gray-100 text-gray-500 rounded-xl hover:bg-black hover:text-white transition-all shadow-sm"
                       >
                         <Eye size={18} />
                       </button>
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

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/40 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close order details"
            className="flex-1 cursor-default"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="w-full max-w-2xl h-full bg-white shadow-2xl border-l border-gray-100 overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-8 py-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Order Details</p>
                <h2 className="text-2xl font-black text-gray-900">{selectedOrder.orderNumber}</h2>
                <p className="text-sm text-gray-500 mt-2">Operational view for payment, fulfillment, rider, and delivery information.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-11 h-11 rounded-2xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-orange-200 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Customer</p>
                  <p className="text-sm font-bold text-gray-900">{selectedOrder.customerName}</p>
                </div>
                <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Merchant</p>
                  <p className="text-sm font-bold text-gray-900">{selectedOrder.merchantName}</p>
                </div>
                <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Order Status</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Payment</p>
                  <p className="text-sm font-bold text-gray-900">
                    {selectedOrder.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'Cash on Delivery' : selectedOrder.paymentMethod}
                  </p>
                  <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${
                    selectedOrder.paymentStatus === PaymentStatus.SUCCESS ? 'text-emerald-600' : 'text-orange-500'
                  }`}>
                    {selectedOrder.paymentStatus}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-3xl border border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <Wallet size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Financials</p>
                  </div>
                  <p className="text-lg font-black text-gray-900">RWF {selectedOrder.totalAmount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Delivery Fee: RWF {selectedOrder.deliveryFee.toLocaleString()}</p>
                  <p className="text-xs text-emerald-600 font-black mt-1">Rider Payout: RWF {getRiderPayoutAmount(selectedOrder).toLocaleString()}</p>
                </div>
                <div className="rounded-3xl border border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <Truck size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Rider</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{selectedOrder.riderName || 'Not assigned yet'}</p>
                  {selectedOrder.riderId && <p className="text-xs text-gray-500 mt-1">ID: {selectedOrder.riderId}</p>}
                </div>
                <div className="rounded-3xl border border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <CalendarDays size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Timeline</p>
                  </div>
                  <p className="text-xs text-gray-600 font-bold">Created: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  <p className="text-xs text-gray-600 font-bold mt-2">Updated: {new Date(selectedOrder.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-[32px] border border-emerald-100 bg-emerald-50/40 overflow-hidden">
                <div className="px-6 py-4 border-b border-emerald-100 bg-white/70">
                  <h3 className="text-lg font-black text-gray-900">Rider Payout Control</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Set the delivery fee the rider will see before accepting this job. Customer delivery fee remains separate.
                  </p>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Rider payout amount</span>
                    <input
                      type="number"
                      min={0}
                      value={riderPayoutDrafts[selectedOrder.id] ?? String(getRiderPayoutAmount(selectedOrder))}
                      onChange={(event) => setRiderPayoutDrafts((current) => ({ ...current, [selectedOrder.id]: event.target.value }))}
                      disabled={[OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(selectedOrder.status)}
                      className="mt-2 w-full rounded-2xl border-2 border-transparent bg-white px-5 py-4 font-black text-gray-900 outline-none focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSaveRiderPayout(selectedOrder)}
                    disabled={savingPayoutOrderId === selectedOrder.id || [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(selectedOrder.status)}
                    className="px-6 py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 transition-all"
                  >
                    {savingPayoutOrderId === selectedOrder.id ? 'Saving...' : 'Save Payout'}
                  </button>
                </div>
              </div>

              {selectedOrder.status === OrderStatus.READY_FOR_PICKUP && (
                <div className="rounded-[32px] border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-lg font-black text-gray-900">Assign Rider</h3>
                    <p className="text-sm text-gray-500 mt-1">Choose an active rider to move this order into live delivery.</p>
                  </div>
                  <div className="p-6 space-y-3">
                    {activeRiders.length > 0 ? activeRiders.map((rider) => (
                      <div key={rider.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border border-gray-100 px-5 py-4">
                        <div>
                          <p className="text-sm font-black text-gray-900">{rider.name}</p>
                          <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">{rider.operationalStatus}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAssignRider(selectedOrder, rider)}
                          disabled={assigningRiderId === rider.id}
                          className="px-4 py-3 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase tracking-widest hover:bg-orange-600 disabled:opacity-50 transition-all"
                        >
                          {assigningRiderId === rider.id ? 'Assigning...' : 'Assign Rider'}
                        </button>
                      </div>
                    )) : (
                      <div className="rounded-3xl border border-dashed border-gray-200 px-5 py-6 text-sm text-gray-500">
                        No active riders are available right now.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-[32px] border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-lg font-black text-gray-900">Order Items</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {selectedOrderItems.map((item, index) => (
                    <div key={`${item.productId}-${index}`} className="px-6 py-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-gray-900">{item.productName}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          Qty {item.quantity} • Unit RWF {item.price.toLocaleString()}
                          {item.variant ? ` • ${item.variant}` : ''}
                        </p>
                      </div>
                      <p className="text-sm font-black text-gray-900">RWF {item.subtotal.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-3xl border border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <MapPin size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Delivery Address</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{selectedOrder.address || 'No address provided'}</p>
                  <p className="text-xs text-gray-500 mt-2">{selectedOrder.phone || 'No phone number provided'}</p>
                </div>
                <div className="rounded-3xl border border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <Activity size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Reference</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 break-all">{selectedOrder.tx_ref || 'No transaction reference'}</p>
                  <p className="text-xs text-gray-500 mt-2">{selectedOrder.notes || 'No additional customer notes.'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900 mb-4">Admin Actions</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedOrder.status === OrderStatus.DELIVERED && (
                    <button
                      type="button"
                      onClick={() => handleCompleteSelectedOrder(selectedOrder)}
                      className="px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-600 font-black text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center"
                    >
                      <CheckCircle2 size={16} className="mr-2" />
                      Complete Order
                    </button>
                  )}
                  {selectedOrder.status !== OrderStatus.CANCELLED && selectedOrder.status !== OrderStatus.COMPLETED && (
                    <button
                      type="button"
                      onClick={() => handleAction(selectedOrder.id, 'cancel')}
                      className="px-4 py-3 rounded-2xl bg-red-50 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all flex items-center"
                    >
                      <XCircle size={16} className="mr-2" />
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;

