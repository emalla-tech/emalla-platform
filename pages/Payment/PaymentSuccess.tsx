import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Share2, Star, Printer, UserPlus } from 'lucide-react';
import { Order, PaymentMethod } from '../../types';
import { OrderService } from '../../services/orderService';
import { html, printPdfDocument, renderTableRows } from '../../lib/documentExport';
import { useAuth } from '../../auth/AuthContext';

const PaymentSuccess: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const orderId = searchParams.get('order_id');
  const mode = searchParams.get('mode');
  const isGuestOrder = !!order?.customerId?.startsWith('GST-');
  const guestTrackingUrl =
    order && order.customerEmail
      ? `/track-order/${order.id}?email=${encodeURIComponent(order.customerEmail)}`
      : order
        ? `/track-order/${order.id}`
        : '/shop';
  const createAccountUrl =
    order?.customerEmail
      ? `/register?role=customer&next=${encodeURIComponent(guestTrackingUrl)}`
      : '/register?role=customer';

  useEffect(() => {
    if (!orderId) return;
    OrderService.getOrderById(orderId).then(setOrder);
  }, [orderId]);

  const handleDownloadInvoice = () => {
    if (!order) return;

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
            <div class="subtitle">Customer payment receipt and invoice</div>
          </div>
          <div class="meta">
            <div><strong>Order:</strong> ${html.escape(order.orderNumber)}</div>
            <div><strong>Generated:</strong> ${html.escape(new Date().toLocaleString())}</div>
            <div><strong>Status:</strong> <span class="pill">${html.escape(mode === 'cod' ? 'cod_confirmed' : 'payment_confirmed')}</span></div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-label">Merchant</div>
            <div class="card-value">${html.escape(order.merchantName)}</div>
          </div>
          <div class="card">
            <div class="card-label">Payment Method</div>
            <div class="card-value">${html.escape(paymentLabel)}</div>
          </div>
          <div class="card">
            <div class="card-label">Order Total</div>
            <div class="card-value">RWF ${html.escape(Number(order.totalAmount || 0).toLocaleString())}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Items</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${renderTableRows(order.items.map((item) => [
                item.productName,
                item.quantity,
                `RWF ${Number(item.price || 0).toLocaleString()}`,
                `RWF ${Number(item.subtotal || 0).toLocaleString()}`
              ]))}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2 class="section-title">Order Details</h2>
          <table>
            <tbody>
              ${renderTableRows([
                ['Payment Status', paymentState],
                ['Transaction Reference', order.tx_ref || 'Pending'],
                ['Delivery Address', order.address],
                ['Phone Number', order.phone],
                ['Delivery Fee', `RWF ${Number(order.deliveryFee || 0).toLocaleString()}`]
              ])}
            </tbody>
          </table>
        </div>

        <div class="footer">
          This receipt was generated from your confirmed order in E-Malla Rwanda.
        </div>
      </div>
    `;

    printPdfDocument(`Payment Receipt - ${order.orderNumber}`, bodyHtml);
  };

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
            {mode === 'cod'
              ? <>Your order <span className="text-gray-900 font-black">{order?.orderNumber || '#Pending'}</span> is confirmed with <span className="text-orange-600 font-black">Cash on Delivery</span>. Please pay when it arrives.</>
              : <>Payment confirmed. Your order <span className="text-gray-900 font-black">{order?.orderNumber || '#Pending'}</span> is being processed by <span className="text-orange-600 font-black">{order?.merchantName || 'E-Malla'}</span>.</>}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order Total</p>
            <p className="text-xl font-black text-gray-900">RWF {Number(order?.totalAmount || 0).toLocaleString()}</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Items</p>
            <p className="text-xl font-black text-emerald-600">{order?.items?.length || 0} items</p>
          </div>
        </div>

        <div className="space-y-3">
          {isGuestOrder && !user ? (
            <div className="rounded-[28px] border border-orange-100 bg-orange-50 p-6 text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Complete Your Setup</p>
              <h3 className="text-lg font-black text-gray-900 mb-2">Create an account to track this order faster</h3>
              <p className="text-sm text-gray-600 mb-4">
                Save your details, keep all future orders in one place, and get a smoother checkout next time.
              </p>
              <Link
                to={createAccountUrl}
                className="inline-flex items-center space-x-2 rounded-2xl bg-orange-500 px-5 py-3 font-black text-white hover:bg-orange-600 transition-all"
              >
                <UserPlus size={18} />
                <span>Create Account</span>
              </Link>
            </div>
          ) : null}
          {order ? (
            <button
              onClick={handleDownloadInvoice}
              className="w-full bg-white border border-gray-100 text-gray-600 py-5 rounded-[24px] font-black hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
            >
              <Printer size={18} />
              <span>Download Receipt PDF</span>
            </button>
          ) : null}
          <Link 
            to={isGuestOrder ? guestTrackingUrl : order ? `/buyer/orders/${order.id}/track` : '/buyer/orders'} 
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

        <div className="mt-12 pt-8 border-t border-gray-50 flex items-center justify-center space-x-6 text-gray-400">
           <Share2 size={20} />
           <Star size={20} />
           <p className="text-[10px] font-black uppercase tracking-widest">
             {order ? `Reference ${order.tx_ref || order.orderNumber}` : 'Order confirmation'}
           </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
