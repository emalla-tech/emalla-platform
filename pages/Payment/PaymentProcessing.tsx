import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, CheckCircle2, Copy, Loader2, ShieldCheck } from 'lucide-react';
import { PaymentService } from '../../services/paymentService';

const BK_ACCOUNT_NUMBER = import.meta.env.VITE_BK_ACCOUNT_NUMBER || '100149281929';
const RECIPIENT_NAME = import.meta.env.VITE_BK_RECIPIENT_NAME || 'Perfect Technologies Ltd';
const BANK_NAME = 'Bank of Kigali';
const buildDialHref = (code: string) => `tel:${encodeURIComponent(code)}`;

const PaymentProcessing: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const txRef = searchParams.get('tx_ref') || '';
  const orderId = searchParams.get('order_id') || '';
  const email = searchParams.get('email') || '';
  const amount = Number(searchParams.get('amount') || 0);
  const method = searchParams.get('method') === 'BK_BANK_TRANSFER' ? 'BK_BANK_TRANSFER' : 'BK_EKASH';
  const isBankTransfer = method === 'BK_BANK_TRANSFER';
  const ussdCode = `*182*1*2*${BK_ACCOUNT_NUMBER}*${Math.round(amount)}#`;
  const copyValue = isBankTransfer ? BK_ACCOUNT_NUMBER : ussdCode;
  const [payerPhone, setPayerPhone] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyCode = async () => {
    await navigator.clipboard.writeText(copyValue);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const submitPayment = async () => {
    if (!txRef || !orderId || !email) {
      setError('Payment session details are missing. Please return to checkout.');
      return;
    }
    if (payerPhone.trim().length < 9 || bankReference.trim().length < 4) {
      setError('Enter the phone number used and the transaction reference.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await PaymentService.submitManualPayment({
        txRef,
        orderId,
        email,
        payerPhone: payerPhone.trim(),
        bankReference: bankReference.trim()
      });
      navigate(`/payment/success?order_id=${orderId}&mode=verification_pending&email=${encodeURIComponent(email)}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to submit payment for verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf6] px-4 py-10 md:py-16">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-[36px] border border-orange-100 bg-white shadow-2xl shadow-orange-100/60">
        <div className="bg-gray-950 p-7 text-white md:p-10">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600"><Building2 size={28} /></div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400">Secure Manual Payment</p>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">Pay with {isBankTransfer ? 'BK Bank Transfer' : 'BK eKash'}</h1>
          <p className="mt-3 text-sm font-medium leading-6 text-gray-400">Your order stays protected until E-Malla Finance confirms the transaction.</p>
        </div>

        <div className="space-y-7 p-6 md:p-10">
          {isBankTransfer ? (
            <div className="rounded-3xl border border-gray-100 bg-gray-50 p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Bank transfer details</p>
              <div className="mt-4 grid gap-2 text-sm font-semibold text-gray-600">
                <p>Bank: <strong className="text-gray-950">{BANK_NAME}</strong></p>
                <p>Account No: <strong className="text-gray-950">{BK_ACCOUNT_NUMBER}</strong></p>
                <p>Account Name: <strong className="text-gray-950">{RECIPIENT_NAME}</strong></p>
                <p>Amount: <strong className="text-gray-950">RWF {amount.toLocaleString()}</strong></p>
              </div>
              <button type="button" onClick={copyCode} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-blue-700 shadow-sm">
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy Account'}
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">BK eKash USSD</p>
              <p className="mt-2 text-sm font-bold text-gray-700">Dial this code and confirm the payment on your phone.</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <code className="break-all text-xl font-black text-gray-950 md:text-2xl">{ussdCode}</code>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <a href={buildDialHref(ussdCode)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-xs font-black text-white shadow-sm hover:bg-blue-800">
                    Dial & Pay
                  </a>
                  <button type="button" onClick={copyCode} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-blue-700 shadow-sm">
                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied' : 'Copy Code'}
                  </button>
                </div>
              </div>
              <div className="mt-5 grid gap-2 border-t border-blue-100 pt-5 text-sm font-semibold text-gray-600">
                <p>Amount: <strong className="text-gray-950">RWF {amount.toLocaleString()}</strong></p>
                <p>Bank account: <strong className="text-gray-950">{BK_ACCOUNT_NUMBER}</strong></p>
                <p>Recipient shown on your phone: <strong className="text-gray-950">{RECIPIENT_NAME}</strong></p>
                <p className="text-xs leading-5 text-gray-500">On mobile, Dial & Pay opens your phone dialer with the USSD code. You still confirm the payment on your phone and submit the reference here for verification.</p>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-black text-gray-950">I have completed payment</h2>
            <p className="mt-1 text-sm text-gray-500">Enter the details from your {isBankTransfer ? 'bank transfer' : 'BK eKash'} confirmation message.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                Phone used
                <input value={payerPhone} onChange={(event) => setPayerPhone(event.target.value)} placeholder="07..." className="rounded-2xl border-2 border-gray-100 px-5 py-4 text-sm font-bold normal-case tracking-normal text-gray-950 outline-none focus:border-orange-500" />
              </label>
              <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                Transaction reference
                <input value={bankReference} onChange={(event) => setBankReference(event.target.value)} placeholder={isBankTransfer ? 'Bank transfer reference' : 'BK eKash reference'} className="rounded-2xl border-2 border-gray-100 px-5 py-4 text-sm font-bold normal-case tracking-normal text-gray-950 outline-none focus:border-orange-500" />
              </label>
            </div>
          </div>

          {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">{error}</p> : null}

          <button type="button" onClick={submitPayment} disabled={isSubmitting} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-orange-500 px-6 py-5 text-base font-black text-white shadow-xl shadow-orange-200 hover:bg-orange-600 disabled:opacity-60">
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
            Submit for Verification
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessing;
