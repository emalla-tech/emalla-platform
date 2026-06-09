
import React, { useState, useEffect } from 'react';
import { 
  Package, Truck, Clock, CheckCircle2, XCircle, 
  Printer, MoreHorizontal, User, MapPin, Navigation,
  AlertCircle, ChevronRight, Play, Check, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OrderService } from '../../services/orderService';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../../types';
import { useAuth } from '../../auth/AuthContext';
import { html, printPdfDocument, renderTableRows } from '../../lib/documentExport';

const MerchantOrders: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all' | 'incoming' | 'transit'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cod'>('all');
  const [stats, setStats] = useState({ new: 0, preparing: 0, completed: 0 });
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    void loadOrders(user.id);
    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadOrders(user.id);
      }
    }, 15000);

    return () => window.clearInterval(refreshInterval);
  }, [user]);

  const loadOrders = async (merchantId: string) => {
    const data = await OrderService.getOrdersByMerchant(merchantId);
    setOrders(data);
    setStats({
      new: data.filter(o => [OrderStatus.PAID, OrderStatus.CONFIRMED].includes(o.status)).length,
      preparing: data.filter(o => [OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP].includes(o.status)).length,
      completed: data.filter(o => o.status === OrderStatus.COMPLETED).length
    });
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingOrderId(orderId);
    setActionMessage(null);
    setActionError(null);
    try {
      await OrderService.updateOrderStatus(orderId, status);
      setActionMessage(
        status === OrderStatus.PREPARING
          ? 'Preparation started. The customer has been notified.'
          : 'Order marked ready for pickup. Riders can now accept the delivery.'
      );
      if (user?.id) {
        await loadOrders(user.id);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update this order right now.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handlePrintDeliveryNote = (order: Order) => {
    const bodyHtml = `
      <div class="page">
        <div class="header">
          <div>
            <div class="brand">E-<span>Malla</span> Rwanda</div>
            <div class="subtitle">Seller delivery note and dispatch manifest</div>
          </div>
          <div class="meta">
            <div><strong>Order:</strong> ${html.escape(order.orderNumber)}</div>
            <div><strong>Created:</strong> ${html.escape(new Date(order.createdAt).toLocaleString())}</div>
            <div><strong>Status:</strong> <span class="pill">${html.escape(order.status)}</span></div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-label">Customer</div>
            <div class="card-value">${html.escape(order.customerName)}</div>
          </div>
          <div class="card">
            <div class="card-label">Payment</div>
            <div class="card-value">${html.escape(order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'Cash on Delivery' : 'Paid Online')}</div>
          </div>
          <div class="card">
            <div class="card-label">Merchant Payout</div>
            <div class="card-value">RWF ${html.escape(Math.max(order.totalAmount - order.deliveryFee, 0).toLocaleString())}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Manifest Items</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Variant</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${renderTableRows(order.items.map((item) => [
                item.productName,
                item.variant || 'Standard',
                item.quantity,
                `RWF ${Number(item.price || 0).toLocaleString()}`,
                `RWF ${Number(item.subtotal || 0).toLocaleString()}`
              ]))}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2 class="section-title">Delivery Details</h2>
          <table>
            <tbody>
              ${renderTableRows([
                ['Customer Phone', order.phone],
                ['Delivery Address', order.address],
                ['Delivery Fee', `RWF ${Number(order.deliveryFee || 0).toLocaleString()}`],
                ['Payment Status', order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'Pending on delivery' : order.paymentStatus],
                ['Transaction Reference', order.tx_ref || 'Pending'],
                ['Order Notes', order.notes || 'No notes provided']
              ])}
            </tbody>
          </table>
        </div>

        <div class="footer">
          This delivery note was generated from the live seller fulfillment queue in E-Malla Rwanda.
        </div>
      </div>
    `;

    printPdfDocument(`Delivery Note - ${order.orderNumber}`, bodyHtml);
  };

  const handlePrintDailyReport = () => {
    const reportOrders = filteredOrders.slice().sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    const totalRevenue = reportOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const totalDeliveryFees = reportOrders.reduce((sum, order) => sum + Number(order.deliveryFee || 0), 0);
    const totalPayout = reportOrders.reduce((sum, order) => sum + Math.max(Number(order.totalAmount || 0) - Number(order.deliveryFee || 0), 0), 0);

    const bodyHtml = `
      <div class="page">
        <div class="header">
          <div>
            <div class="brand">E-<span>Malla</span> Rwanda</div>
            <div class="subtitle">Seller fulfillment daily report</div>
          </div>
          <div class="meta">
            <div><strong>Generated:</strong> ${html.escape(new Date().toLocaleString())}</div>
            <div><strong>Orders in View:</strong> ${html.escape(reportOrders.length)}</div>
            <div><strong>Filter:</strong> ${html.escape(`${activeTab} / ${paymentFilter}`)}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-label">Gross Revenue</div>
            <div class="card-value">RWF ${html.escape(totalRevenue.toLocaleString())}</div>
          </div>
          <div class="card">
            <div class="card-label">Delivery Fees</div>
            <div class="card-value">RWF ${html.escape(totalDeliveryFees.toLocaleString())}</div>
          </div>
          <div class="card">
            <div class="card-label">Merchant Payout Value</div>
            <div class="card-value">RWF ${html.escape(totalPayout.toLocaleString())}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Order Summary</h2>
          ${
            reportOrders.length > 0
              ? `<table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>${renderTableRows(reportOrders.map((order) => [
                    order.orderNumber,
                    order.customerName,
                    order.status,
                    order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'Cash on Delivery' : 'Paid Online',
                    `RWF ${Number(order.totalAmount || 0).toLocaleString()}`
                  ]))}</tbody>
                </table>`
              : '<div class="card muted">No orders match the current seller filters.</div>'
          }
        </div>

        <div class="footer">
          This report was generated from the live seller fulfillment list currently visible in E-Malla Rwanda.
        </div>
      </div>
    `;

    printPdfDocument(`Daily Report - ${new Date().toISOString().slice(0, 10)}`, bodyHtml);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      activeTab === 'all' ||
      (activeTab === 'incoming' && [OrderStatus.PAID, OrderStatus.CONFIRMED].includes(order.status)) ||
      (activeTab === 'transit' && [
        OrderStatus.ASSIGNED,
        OrderStatus.PICKED_UP,
        OrderStatus.ON_THE_WAY,
        OrderStatus.OUT_FOR_DELIVERY
      ].includes(order.status)) ||
      order.status === activeTab;
    const matchesPayment = paymentFilter === 'all' || order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY;
    return matchesStatus && matchesPayment;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Fulfillment Center</h1>
          <p className="text-gray-500 text-sm font-medium">Process your incoming orders and manage stock dispatch.</p>
        </div>
        <div className="flex space-x-3 w-full lg:w-auto">
          <button
            onClick={() => {
              if (filteredOrders[0]) {
                handlePrintDeliveryNote(filteredOrders[0]);
              }
            }}
            className="flex-1 lg:flex-none p-3 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center"
          >
            <Printer size={20} className="mr-2" /> Manifest
          </button>
          <button
            onClick={handlePrintDailyReport}
            className="flex-1 lg:flex-none bg-black text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-black/10 hover:bg-orange-500 transition-all"
          >
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
      {actionMessage ? (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-4 text-sm font-bold text-emerald-700">
          {actionMessage}
        </div>
      ) : null}
      {actionError ? (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-sm font-bold text-red-600">
          {actionError}
        </div>
      ) : null}
      <div className="flex space-x-8 border-b border-gray-100 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'all', label: 'All Activity' },
          { id: 'incoming', label: 'Incoming' },
          { id: OrderStatus.PREPARING, label: 'Preparing' },
          { id: OrderStatus.READY_FOR_PICKUP, label: 'Dispatch' },
          { id: 'transit', label: 'Transit' }
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

      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All Payments' },
          { id: 'cod', label: 'COD Only' }
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setPaymentFilter(filter.id as 'all' | 'cod')}
            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              paymentFilter === filter.id ? 'bg-orange-500 text-white' : 'bg-white border border-gray-100 text-gray-500 hover:border-orange-200'
            }`}
          >
            {filter.label}
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
                       {order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY && (
                         <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border border-orange-100">COD</span>
                       )}
                      </div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 flex items-center">
                        <Clock size={12} className="mr-1.5" /> Placed {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {[OrderStatus.PAID, OrderStatus.CONFIRMED].includes(order.status) && (
                    <button 
                      onClick={() => handleUpdateStatus(order.id, OrderStatus.PREPARING)}
                      disabled={updatingOrderId === order.id}
                      className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center active:scale-95"
                    >
                      <Play size={18} className="mr-2" /> {updatingOrderId === order.id ? 'Starting...' : 'Start Preparing'}
                    </button>
                  )}
                  {order.status === OrderStatus.PREPARING && (
                    <button 
                      onClick={() => handleUpdateStatus(order.id, OrderStatus.READY_FOR_PICKUP)}
                      disabled={updatingOrderId === order.id}
                      className="px-8 py-3 bg-orange-500 text-white rounded-2xl font-black text-sm hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 flex items-center active:scale-95"
                    >
                      <Check size={18} className="mr-2" /> {updatingOrderId === order.id ? 'Completing...' : 'Complete Preparation'}
                    </button>
                  )}
                  {order.status === OrderStatus.READY_FOR_PICKUP && (
                    <div className="flex items-center space-x-3 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
                       <Send size={18} className="text-emerald-500" />
                       <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Awaiting Rider</span>
                    </div>
                  )}

                  <div className="h-10 w-px bg-gray-100 mx-2 hidden lg:block"></div>
                  <button
                    onClick={() => handlePrintDeliveryNote(order)}
                    className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all"
                  >
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
                      <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                        <span className="text-gray-400">Payment</span>
                        <span className={order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'text-orange-600' : 'text-emerald-600'}>
                          {order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'Cash on Delivery' : 'Paid Online'}
                        </span>
                      </div>
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
