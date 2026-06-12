import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Headphones, LifeBuoy, MessageCircle, PackageSearch, Plus, RotateCcw, ShieldCheck, WalletCards, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { OrderService } from '../../services/orderService';
import { SupportService } from '../../services/supportService';
import { Order, OrderStatus, PaymentStatus, SupportTicket, SupportTicketType } from '../../types';

const WHATSAPP_NUMBER = '250784352174';

const typeConfig: Record<SupportTicketType, { label: string; icon: React.ReactNode; tone: string }> = {
  support: { label: 'Support', icon: <Headphones size={17} />, tone: 'bg-blue-50 text-blue-700' },
  return: { label: 'Return', icon: <RotateCcw size={17} />, tone: 'bg-amber-50 text-amber-700' },
  refund: { label: 'Refund', icon: <WalletCards size={17} />, tone: 'bg-rose-50 text-rose-700' }
};

const SupportCenter: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(Boolean(searchParams.get('type') || searchParams.get('orderId')));
  const [form, setForm] = useState({
    type: (searchParams.get('type') || 'support') as SupportTicketType,
    orderId: searchParams.get('orderId') || '',
    subject: '',
    reason: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    message: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const [nextTickets, nextOrders] = await Promise.all([
        SupportService.getTickets(),
        OrderService.getAllOrders()
      ]);
      setTickets(nextTickets);
      setOrders(nextOrders);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the Support Center.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const returnEligibleOrders = useMemo(
    () => orders.filter((order) => [OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(order.status)),
    [orders]
  );
  const refundEligibleOrders = useMemo(
    () => orders.filter((order) =>
      order.paymentStatus === PaymentStatus.SUCCESS &&
      [OrderStatus.CANCELLED, OrderStatus.REJECTED, OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(order.status)
    ),
    [orders]
  );

  const openForm = (type: SupportTicketType) => {
    setForm((current) => ({
      ...current,
      type,
      priority: type === 'support' ? 'normal' : 'high',
      subject: type === 'return' ? 'Return request' : type === 'refund' ? 'Refund request' : current.subject
    }));
    setError(null);
    setSuccess(null);
    setFormOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const ticket = await SupportService.createTicket(form);
      setTickets((current) => [ticket, ...current]);
      setSuccess(`${ticket.ticketNumber} was created successfully.`);
      setFormOpen(false);
      setSearchParams({});
      setForm({ type: 'support', orderId: '', subject: '', reason: '', priority: 'normal', message: '' });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create this request.');
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello E-Malla Support, I need help${form.orderId ? ` with order ${orders.find((order) => order.id === form.orderId)?.orderNumber || form.orderId}` : ''}.`
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="relative overflow-hidden rounded-[36px] bg-gray-950 px-6 py-10 text-white md:px-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
              <ShieldCheck size={14} /> Customer care
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">Support that stays with your order.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300 md:text-base">
              Open and track support tickets, returns, and refund requests from one secure place.
            </p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-black text-white shadow-xl shadow-emerald-950/30 transition hover:bg-emerald-400"
          >
            <MessageCircle size={20} /> Chat on WhatsApp
          </a>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {(['support', 'return', 'refund'] as SupportTicketType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => openForm(type)}
            className="group rounded-[28px] border border-gray-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"
          >
            <span className={`inline-flex rounded-2xl p-3 ${typeConfig[type].tone}`}>{typeConfig[type].icon}</span>
            <h2 className="mt-5 text-xl font-black text-gray-900">
              {type === 'support' ? 'Get Help' : type === 'return' ? 'Request a Return' : 'Request a Refund'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              {type === 'support'
                ? 'Questions about orders, delivery, payments, or your account.'
                : type === 'return'
                  ? 'Start a return for an eligible delivered order.'
                  : 'Ask support to review an eligible order payment.'}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-500">
              Start request <Plus size={14} />
            </span>
          </button>
        ))}
      </div>

      {success ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
          <CheckCircle2 size={18} /> {success}
        </div>
      ) : null}
      {error ? <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">{error}</div> : null}

      {formOpen ? (
        <section className="rounded-[32px] border border-orange-100 bg-white p-6 shadow-xl md:p-8">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-500">New request</p>
              <h2 className="mt-2 text-2xl font-black text-gray-900">{typeConfig[form.type].label} Request</h2>
            </div>
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl bg-gray-50 p-3 text-gray-500" aria-label="Close request form">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Request Type</span>
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as SupportTicketType })} className="w-full rounded-2xl bg-gray-50 px-5 py-4 font-bold outline-none">
                <option value="support">General Support</option>
                <option value="return">Return Request</option>
                <option value="refund">Refund Request</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Related Order</span>
              <select
                value={form.orderId}
                required={form.type !== 'support'}
                onChange={(event) => setForm({ ...form, orderId: event.target.value })}
                className="w-full rounded-2xl bg-gray-50 px-5 py-4 font-bold outline-none"
              >
                <option value="">{form.type === 'support' ? 'No order selected' : 'Select an eligible delivered order'}</option>
                {(form.type === 'support' ? orders : form.type === 'return' ? returnEligibleOrders : refundEligibleOrders).map((order) => (
                  <option key={order.id} value={order.id}>{order.orderNumber} - RWF {order.totalAmount.toLocaleString()}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Subject</span>
              <input required value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} className="w-full rounded-2xl bg-gray-50 px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-orange-300" placeholder="Briefly describe what you need help with" />
            </label>
            {form.type !== 'support' ? (
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Reason</span>
                <select required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} className="w-full rounded-2xl bg-gray-50 px-5 py-4 font-bold outline-none">
                  <option value="">Select reason</option>
                  <option value="damaged">Item arrived damaged</option>
                  <option value="wrong_item">Wrong item received</option>
                  <option value="not_as_described">Item not as described</option>
                  <option value="missing_items">Items are missing</option>
                  <option value="other">Other</option>
                </select>
              </label>
            ) : null}
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Priority</span>
              <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as typeof form.priority })} className="w-full rounded-2xl bg-gray-50 px-5 py-4 font-bold outline-none">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Details</span>
              <textarea required minLength={10} rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="w-full resize-none rounded-2xl bg-gray-50 px-5 py-4 font-medium outline-none focus:ring-2 focus:ring-orange-300" placeholder="Share useful details so our support team can help quickly." />
            </label>
            <button disabled={submitting} className="min-h-14 rounded-2xl bg-orange-500 px-6 py-4 font-black text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:opacity-60 md:col-span-2">
              {submitting ? 'Submitting Request...' : 'Submit Support Request'}
            </button>
          </form>
        </section>
      ) : null}

      <section className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">Request history</p>
            <h2 className="mt-2 text-2xl font-black text-gray-900">Your Support Tickets</h2>
          </div>
          <span className="rounded-full bg-gray-100 px-4 py-2 text-xs font-black text-gray-600">{tickets.length} total</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm font-bold text-gray-400">Loading your requests...</div>
        ) : tickets.length === 0 ? (
          <div className="mt-8 rounded-[28px] border-2 border-dashed border-gray-100 py-14 text-center">
            <LifeBuoy className="mx-auto text-gray-200" size={42} />
            <p className="mt-4 font-black text-gray-700">No support tickets yet</p>
            <p className="mt-1 text-sm text-gray-400">When you open a request, its progress will appear here.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="rounded-[26px] border border-gray-100 bg-gray-50/60 p-5 md:p-6">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${typeConfig[ticket.type].tone}`}>
                        {typeConfig[ticket.type].icon} {typeConfig[ticket.type].label}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : ticket.status === 'replied' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {ticket.status}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500">{ticket.priority}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-black text-gray-900">{ticket.subject}</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">{ticket.message}</p>
                  </div>
                  <div className="shrink-0 rounded-2xl bg-white px-4 py-3 md:text-right">
                    <p className="text-xs font-black text-gray-900">{ticket.ticketNumber}</p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 md:justify-end">
                      <Clock3 size={12} /> {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {ticket.orderNumber ? (
                  <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 text-xs font-bold text-gray-500">
                    <PackageSearch size={15} className="text-orange-500" /> Related order: {ticket.orderNumber}
                  </div>
                ) : null}
                {ticket.lastResponse ? (
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Latest Support Response</p>
                    <p className="mt-2 text-sm leading-6 text-blue-900">{ticket.lastResponse}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SupportCenter;
