
import React, { useEffect, useMemo, useState } from 'react';
import { 
  Package, ChevronRight, 
  MapPin, Printer,
  Clock, CheckCircle2,
  FileText
} from 'lucide-react';
import { OrderService } from '../../services/orderService';
import { Order, OrderStatus, PaymentMethod } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import { html, printPdfDocument, renderTableRows } from '../../lib/documentExport';
import { getCategoryFallbackImage, handleProductImageError } from '../../lib/productImages';

const MyOrders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
  const [receiptMessage, setReceiptMessage] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const products = useProducts();

  useEffect(() => {
    if (!user) return;

    const loadOrders = async () => {
      const data = await OrderService.getOrdersByCustomer(user.id);
      setOrders(data);
      setSelectedOrder((current) => data.find((order) => order.id === current?.id) || data[0] || null);
    };

    void loadOrders();
    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadOrders();
      }
    }, 15000);

    return () => window.clearInterval(refreshInterval);
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') {
      return ![OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status);
    }
    return order.status === OrderStatus.COMPLETED;
  });

  const productImageById = useMemo(() => {
    return new Map(products.map((product) => [product.id, product.image]));
  }, [products]);

  const getTimelineSteps = (order: Order) => {
    const isPaid = order.paymentStatus === 'SUCCESS' || order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY;
    const isSellerConfirmed = ![OrderStatus.PENDING, OrderStatus.PENDING_PAYMENT, OrderStatus.PAID].includes(order.status);
    const isPreparing = [
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.ASSIGNED,
      OrderStatus.PICKED_UP,
      OrderStatus.ON_THE_WAY,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETED
    ].includes(order.status);
    const isReadyForDispatch = [
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.ASSIGNED,
      OrderStatus.PICKED_UP,
      OrderStatus.ON_THE_WAY,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETED
    ].includes(order.status);
    const isRiderAssigned = [
      OrderStatus.ASSIGNED,
      OrderStatus.PICKED_UP,
      OrderStatus.ON_THE_WAY,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETED
    ].includes(order.status);
    const isOnTheWay = [
      OrderStatus.ON_THE_WAY,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETED
    ].includes(order.status);
    const isDelivered = [OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(order.status);
    const isCompleted = order.status === OrderStatus.COMPLETED;

    return [
      { label: 'Order Placed', done: true, time: new Date(order.createdAt).toLocaleString() },
      { label: order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'Cash on Delivery Confirmed' : 'Payment Verified', done: isPaid, time: isPaid ? new Date(order.updatedAt).toLocaleString() : 'Pending' },
      { label: 'Seller Confirmed', done: isSellerConfirmed, time: isSellerConfirmed ? new Date(order.updatedAt).toLocaleString() : 'Pending' },
      { label: 'Seller Preparing Order', done: isPreparing, time: isPreparing ? new Date(order.updatedAt).toLocaleString() : 'Pending' },
      { label: 'Ready for Dispatch', done: isReadyForDispatch, time: isReadyForDispatch ? new Date(order.updatedAt).toLocaleString() : 'Pending' },
      { label: 'Rider Assigned', done: isRiderAssigned, time: isRiderAssigned ? new Date(order.updatedAt).toLocaleString() : 'Pending' },
      { label: 'On the Way', done: isOnTheWay, time: isOnTheWay ? new Date(order.updatedAt).toLocaleString() : 'Pending' },
      { label: 'Delivered', done: isDelivered, time: isDelivered ? new Date(order.updatedAt).toLocaleString() : 'Pending' },
      { label: 'Received Well', done: isCompleted, time: isCompleted ? new Date(order.updatedAt).toLocaleString() : 'Waiting for your confirmation' }
    ];
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config = {
      [OrderStatus.PENDING_PAYMENT]: { bg: 'bg-yellow-50', text: 'text-yellow-600', label: 'Payment Pending' },
      [OrderStatus.PAID]: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Paid' },
      [OrderStatus.CONFIRMED]: { bg: 'bg-indigo-50', text: 'text-indigo-600', label: 'Confirmed' },
      [OrderStatus.PREPARING]: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Preparing' },
      [OrderStatus.READY_FOR_PICKUP]: { bg: 'bg-cyan-50', text: 'text-cyan-600', label: 'Ready for Pickup' },
      [OrderStatus.ASSIGNED]: { bg: 'bg-teal-50', text: 'text-teal-600', label: 'Rider Assigned' },
      [OrderStatus.PICKED_UP]: { bg: 'bg-violet-50', text: 'text-violet-600', label: 'Picked Up' },
      [OrderStatus.ON_THE_WAY]: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'On The Way' },
      [OrderStatus.OUT_FOR_DELIVERY]: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', label: 'Out for Delivery' },
      [OrderStatus.DELIVERED]: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Delivered' },
      [OrderStatus.COMPLETED]: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Received Well' },
      [OrderStatus.CANCELLED]: { bg: 'bg-red-50', text: 'text-red-600', label: 'Cancelled' },
    };
    const style = config[status as keyof typeof config] || { bg: 'bg-gray-50', text: 'text-gray-400', label: status };
    
    return (
      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getPaymentBadge = (order: Order) => {
    if (order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY) {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700">
          COD
        </span>
      );
    }

    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
        order.paymentStatus === 'SUCCESS' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-700'
      }`}>
        {order.paymentStatus === 'SUCCESS' ? 'Paid' : 'Pending'}
      </span>
    );
  };

  const handleCancel = async (orderId: string) => {
    if (confirm("Are you sure you want to cancel this order?")) {
      await OrderService.cancelOrder(orderId);
      const updated = await OrderService.getOrdersByCustomer(user?.id || '');
      setOrders(updated);
      setSelectedOrder(null);
    }
  };

  const handleConfirmReceived = async (order: Order) => {
    setConfirmingReceipt(true);
    setReceiptMessage(null);
    setReceiptError(null);
    try {
      await OrderService.confirmReceived(order.id);
      const updated = await OrderService.getOrdersByCustomer(user?.id || '');
      setOrders(updated);
      setSelectedOrder(updated.find((entry) => entry.id === order.id) || null);
      setReceiptMessage('Thank you. The order has been confirmed as received well.');
    } catch (error) {
      setReceiptError(error instanceof Error ? error.message : 'Unable to confirm receipt right now.');
    } finally {
      setConfirmingReceipt(false);
    }
  };

  const handleDownloadInvoice = (order: Order) => {
    const itemRows = order.items.map((item) => [
      item.productName,
      item.variant || 'Standard',
      item.quantity,
      `RWF ${Number(item.price || 0).toLocaleString()}`,
      `RWF ${Number(item.subtotal || 0).toLocaleString()}`
    ]);

    const paymentLabel =
      order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
        ? 'Cash on Delivery'
        : order.paymentMethod.replaceAll('_', ' ');

    const paymentState =
      order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
        ? 'Pending on delivery'
        : order.paymentStatus;

    const bodyHtml = `
      <div class="page">
        <div class="header">
          <div>
            <div class="brand">E-<span>Malla</span> Rwanda</div>
            <div class="subtitle">Customer order invoice</div>
          </div>
          <div class="meta">
            <div><strong>Invoice:</strong> ${html.escape(order.orderNumber)}</div>
            <div><strong>Placed:</strong> ${html.escape(new Date(order.createdAt).toLocaleString())}</div>
            <div><strong>Status:</strong> <span class="pill">${html.escape(order.status)}</span></div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-label">Merchant</div>
            <div class="card-value">${html.escape(order.merchantName)}</div>
          </div>
          <div class="card">
            <div class="card-label">Payment</div>
            <div class="card-value">${html.escape(paymentLabel)}</div>
          </div>
          <div class="card">
            <div class="card-label">Total</div>
            <div class="card-value">RWF ${html.escape(Number(order.totalAmount || 0).toLocaleString())}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Order Items</h2>
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
            <tbody>${renderTableRows(itemRows)}</tbody>
          </table>
        </div>

        <div class="section">
          <h2 class="section-title">Delivery and Payment Details</h2>
          <table>
            <tbody>
              ${renderTableRows([
                ['Delivery Address', order.address],
                ['Phone Number', order.phone],
                ['Delivery Fee', `RWF ${Number(order.deliveryFee || 0).toLocaleString()}`],
                ['Payment Status', paymentState],
                ['Transaction Reference', order.tx_ref || 'Pending'],
                ['Customer Notes', order.notes || 'No notes provided']
              ])}
            </tbody>
          </table>
        </div>

        <div class="footer">
          This invoice was generated from your live order record in E-Malla Rwanda.
        </div>
      </div>
    `;

    printPdfDocument(`Invoice - ${order.orderNumber}`, bodyHtml);
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
          {filteredOrders.map((order) => (
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
                    {getPaymentBadge(order)}
                    {getStatusBadge(order.status)}
                    <ChevronRight size={20} className={`text-gray-300 transition-transform ${selectedOrder?.id === order.id ? 'rotate-90 text-orange-500' : ''}`} />
                  </div>
                </div>

                <div className="flex items-center justify-between py-6 border-y border-gray-50">
                  <div className="flex -space-x-3 overflow-hidden">
                    {order.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="w-12 h-12 rounded-xl border-4 border-white bg-gray-100 overflow-hidden shadow-sm">
                         {productImageById.get(item.productId) ? (
                           <img
                             src={productImageById.get(item.productId)}
                             alt={item.productName}
                             onError={(event) => handleProductImageError(event)}
                             className="w-full h-full object-cover"
                           />
                         ) : (
                           <img
                             src={getCategoryFallbackImage()}
                             alt={item.productName}
                             className="w-full h-full object-cover"
                           />
                         )}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-12 h-12 rounded-xl border-4 border-white bg-gray-900 flex items-center justify-center text-[10px] font-black text-white">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] text-gray-400 font-black uppercase mb-1">
                       {order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'Order Total' : 'Total Paid'}
                     </p>
                     <p className="text-xl font-black text-gray-900">RWF {order.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
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
                  <p className="text-gray-400 text-xs mt-4 flex items-center"><Clock size={14} className="mr-2" /> Last update: {new Date(selectedOrder.updatedAt).toLocaleString()}</p>
               </div>
               
               <div className="p-10 space-y-10">
                  <div className="flex items-center gap-3">
                    {getPaymentBadge(selectedOrder)}
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {selectedOrder.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? 'Pay on delivery' : selectedOrder.paymentMethod.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {/* Timeline View */}
                  <div className="space-y-8">
                     <div className="flex items-center justify-between">
                        <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest">Tracking Status</h5>
                        <button
                          onClick={() => navigate(`/buyer/orders/${selectedOrder.id}/track`)}
                          className="text-orange-500 text-[10px] font-black uppercase hover:underline"
                        >
                          Open Tracking
                        </button>
                     </div>
                     <div className="space-y-6">
                        {getTimelineSteps(selectedOrder).map((step, i, steps) => (
                           <div key={i} className="flex items-start space-x-4">
                              <div className="flex flex-col items-center">
                                 <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${step.done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                                    {step.done ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                 </div>
                                 {i < steps.length - 1 && <div className={`w-0.5 h-10 mt-2 ${step.done ? 'bg-emerald-100' : 'bg-gray-50'}`}></div>}
                              </div>
                              <div>
                                 <p className={`text-sm font-bold ${step.done ? 'text-gray-900' : 'text-gray-300'}`}>{step.label}</p>
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
                    {receiptMessage ? <p className="text-sm font-bold text-emerald-600">{receiptMessage}</p> : null}
                    {receiptError ? <p className="text-sm font-bold text-red-600">{receiptError}</p> : null}
                    {selectedOrder.status === OrderStatus.DELIVERED ? (
                      <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-5 space-y-4">
                        <div>
                          <p className="text-sm font-black text-emerald-800">Has your order arrived safely?</p>
                          <p className="text-xs text-emerald-700 mt-1">Confirm only after checking that the package was received well.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleConfirmReceived(selectedOrder)}
                          disabled={confirmingReceipt}
                          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all disabled:opacity-60"
                        >
                          {confirmingReceipt ? 'Confirming Receipt...' : 'Confirm Received Well'}
                        </button>
                      </div>
                    ) : null}
                    <button
                      onClick={() => handleDownloadInvoice(selectedOrder)}
                      className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm flex items-center justify-center space-x-2 hover:bg-orange-500 transition-all"
                    >
                       <Printer size={18} />
                       <span>Download Invoice PDF</span>
                    </button>
                    <Link
                      to={`/buyer/support?type=${[OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(selectedOrder.status) ? 'return' : 'support'}&orderId=${selectedOrder.id}`}
                      className="flex w-full items-center justify-center space-x-2 rounded-2xl border-2 border-blue-100 bg-blue-50 py-4 text-sm font-black text-blue-600 transition-all hover:bg-blue-100"
                    >
                      <span>{[OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(selectedOrder.status) ? 'Return or Refund Help' : 'Get Support for This Order'}</span>
                    </Link>
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
