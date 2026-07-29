import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, MessageSquareText, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { quoteRequestService } from '../../services/quoteRequestService';
import { Product } from '../../types';
import { getPublicFulfillmentHubLabel } from '../../lib/fulfillmentHub';

interface QuoteRequestModalProps {
  product: Product;
  defaultQuantity: number;
  isOpen: boolean;
  onClose: () => void;
}

const QuoteRequestModal = ({
  product,
  defaultQuantity,
  isOpen,
  onClose
}: QuoteRequestModalProps) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    quantity: Math.max(1, defaultQuantity),
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: '',
      quantity: Math.max(1, defaultQuantity),
      message: ''
    });
    setError('');
    setSubmitted(false);
  }, [defaultQuantity, isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.body.classList.add('quote-modal-open');
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.classList.remove('quote-modal-open');
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await quoteRequestService.create({
        productId: product.id,
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        message: form.message.trim()
      });
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to send your request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-gray-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="Close quote request backdrop"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        disabled={isSubmitting}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-request-title"
        className="relative z-10 max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[34px] bg-white shadow-2xl sm:rounded-[34px]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white/95 px-6 py-5 backdrop-blur sm:px-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-500">Price on request</p>
            <h2 id="quote-request-title" className="mt-1 text-2xl font-black text-gray-950">Request a Quote</h2>
            <p className="mt-1 text-sm font-medium text-gray-500">{product.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
            aria-label="Close quote request"
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-12 text-center sm:px-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={34} />
            </span>
            <h3 className="mt-6 text-2xl font-black text-gray-950">Request sent successfully</h3>
            <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-7 text-gray-500">
              {getPublicFulfillmentHubLabel()} has received your request. The E-Malla team will coordinate the quotation using the details you provided.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 rounded-2xl bg-gray-950 px-8 py-4 text-sm font-black text-white transition-colors hover:bg-orange-600"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-7 sm:px-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Full Name</span>
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-5 py-4 font-bold text-gray-900 outline-none transition-colors focus:border-orange-500 focus:bg-white"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</span>
                <input
                  required
                  type="email"
                  maxLength={180}
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-5 py-4 font-bold text-gray-900 outline-none transition-colors focus:border-orange-500 focus:bg-white"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone</span>
                <input
                  required
                  type="tel"
                  maxLength={30}
                  placeholder="078..."
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-5 py-4 font-bold text-gray-900 outline-none transition-colors focus:border-orange-500 focus:bg-white"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Quantity</span>
                <input
                  required
                  type="number"
                  min={1}
                  max={product.stock > 0 ? product.stock : 999}
                  value={form.quantity}
                  onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) || 1 })}
                  className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-5 py-4 font-bold text-gray-900 outline-none transition-colors focus:border-orange-500 focus:bg-white"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery Location</span>
              <input
                required
                maxLength={240}
                placeholder="District, sector or full delivery area"
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
                className="w-full rounded-2xl border-2 border-transparent bg-gray-50 px-5 py-4 font-bold text-gray-900 outline-none transition-colors focus:border-orange-500 focus:bg-white"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Additional Details (Optional)</span>
              <textarea
                rows={3}
                maxLength={800}
                placeholder="Preferred specifications, color, deadline or questions for the E-Malla team..."
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                className="w-full resize-none rounded-2xl border-2 border-transparent bg-gray-50 px-5 py-4 font-bold text-gray-900 outline-none transition-colors focus:border-orange-500 focus:bg-white"
              />
            </label>

            {error && (
              <p role="alert" className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-600">{error}</p>
            )}

            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-xs font-semibold leading-6 text-blue-800">
              Your contact details are used only to prepare and communicate this quotation through E-Malla Rwanda.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-500 px-6 py-5 text-base font-black text-white shadow-xl shadow-orange-200 transition-all hover:bg-orange-600 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <MessageSquareText size={20} />}
              {isSubmitting ? 'Sending Request...' : 'Send Price Request'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

export default QuoteRequestModal;
