import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Package, Search, Printer } from 'lucide-react';
import { RiderService } from '../../services/riderService';
import { Order, OrderStatus } from '../../types';
import { html, printPdfDocument, renderTableRows } from '../../lib/documentExport';

const COMPLETED_STATUSES = new Set<OrderStatus>([
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED
]);

const RiderHistory: React.FC = () => {
  const [history, setHistory] = useState<Order[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      const data = await RiderService.getAssignedDeliveries();
      const completed = data
        .filter((order) => COMPLETED_STATUSES.has(order.status))
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
      setHistory(completed);
    };

    loadHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return history;

    return history.filter(
      (item) =>
        item.orderNumber.toLowerCase().includes(normalizedQuery) ||
        item.id.toLowerCase().includes(normalizedQuery) ||
        item.merchantName.toLowerCase().includes(normalizedQuery)
    );
  }, [history, query]);

  const handlePrintDeliveryNote = (order: Order) => {
    const bodyHtml = `
      <div class="page">
        <div class="header">
          <div>
            <div class="brand">E-<span>Malla</span> Rwanda</div>
            <div class="subtitle">Rider delivery completion note</div>
          </div>
          <div class="meta">
            <div><strong>Order:</strong> ${html.escape(order.orderNumber)}</div>
            <div><strong>Closed:</strong> ${html.escape(new Date(order.updatedAt).toLocaleString())}</div>
            <div><strong>Status:</strong> <span class="pill">${html.escape(order.status)}</span></div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-label">Merchant</div>
            <div class="card-value">${html.escape(order.merchantName)}</div>
          </div>
          <div class="card">
            <div class="card-label">Delivery Fee</div>
            <div class="card-value">RWF ${html.escape(Number(order.deliveryFee || 0).toLocaleString())}</div>
          </div>
          <div class="card">
            <div class="card-label">Customer</div>
            <div class="card-value">${html.escape(order.customerName)}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Route and Delivery Details</h2>
          <table>
            <tbody>
              ${renderTableRows([
                ['Merchant', order.merchantName],
                ['Drop-off Address', order.address],
                ['Customer Phone', order.phone],
                ['Delivery Reference', order.tx_ref || order.id],
                ['Items in Delivery', order.items.map((item) => `${item.quantity}x ${item.productName}`).join(', ') || 'No items listed']
              ])}
            </tbody>
          </table>
        </div>

        <div class="footer">
          This delivery note was generated from the live rider delivery history in E-Malla Rwanda.
        </div>
      </div>
    `;

    printPdfDocument(`Rider Delivery Note - ${order.orderNumber}`, bodyHtml);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="px-2">
        <h1 className="text-2xl font-black text-gray-900">Delivery History</h1>
        <p className="text-gray-500 text-sm font-medium">Your completed and closed delivery records.</p>
      </div>

      <div className="relative group px-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by order number or merchant..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-orange-50 font-bold text-sm shadow-sm transition-all"
        />
      </div>

      <div className="space-y-4">
        {filteredHistory.map((item) => (
          <div
            key={item.id}
            className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="font-black text-gray-900">{item.orderNumber}</h4>
                <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                  <Calendar size={10} className="mr-1" />
                  {new Date(item.updatedAt).toLocaleDateString()} | {item.merchantName}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-gray-900">RWF {item.deliveryFee.toLocaleString()}</p>
              <div className="mt-2 flex items-center justify-end gap-2">
                <span className={`text-[8px] font-black uppercase tracking-tighter ${item.status === OrderStatus.CANCELLED ? 'text-red-500' : 'text-emerald-500'}`}>
                  {item.status === OrderStatus.CANCELLED ? 'Cancelled' : 'Completed'}
                </span>
                <button
                  onClick={() => handlePrintDeliveryNote(item)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                >
                  <Printer size={12} />
                  Note
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <div className="p-8 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200 text-center">
          <Package size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="text-sm font-bold text-gray-400">
            {history.length === 0 ? 'No closed deliveries yet' : 'No delivery matches your search'}
          </p>
        </div>
      )}
    </div>
  );
};

export default RiderHistory;
