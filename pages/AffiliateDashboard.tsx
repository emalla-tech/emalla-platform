import React, { useState } from 'react';
import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import {
  AffiliatePartnerDashboard,
  AffiliatePartnerService
} from '../services/affiliatePartnerService';

const money = (value: number) => `RWF ${Number(value || 0).toLocaleString()}`;

const statusTone = (status: string) => {
  if (status === 'eligible') return 'bg-emerald-100 text-emerald-700';
  if (status === 'paid') return 'bg-blue-100 text-blue-700';
  return 'bg-amber-100 text-amber-700';
};

const AffiliateDashboard: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    code: ''
  });
  const [dashboard, setDashboard] = useState<AffiliatePartnerDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    try {
      const data = await AffiliatePartnerService.getDashboard({
        email: formData.email,
        code: formData.code
      });
      setDashboard(data);
    } catch (err) {
      setDashboard(null);
      setError(err instanceof Error ? err.message : 'Unable to load affiliate dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf7]">
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.28),transparent_34rem)]" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1fr_420px] lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-300">
              <ShieldCheck size={14} />
              Affiliate Partner Portal
            </span>
            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
              Track your E-Malla referral performance.
            </h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-gray-300">
              Approved partners can view their referral links, attributed orders, pending commission, and eligible commission without waiting for manual updates.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/10 bg-white p-6 text-gray-950 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                <LockKeyhole size={22} />
              </div>
              <div>
                <h2 className="text-xl font-black">Partner Access</h2>
                <p className="text-sm text-gray-500">Use the approved email and official code.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Affiliate Email</span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 font-bold outline-none focus:border-emerald-300 focus:bg-white"
                  placeholder="partner@example.com"
                  required
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Official Code</span>
                <input
                  value={formData.code}
                  onChange={(event) => setFormData((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                  className="mt-2 w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 font-black uppercase tracking-wider outline-none focus:border-emerald-300 focus:bg-white"
                  placeholder="YOURCODE"
                  required
                />
                <span className="mt-2 block text-xs font-semibold text-gray-500">
                  Use the exact official code from your approval email or Admin Inquiries record.
                </span>
              </label>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <ArrowRight size={18} className="mr-2" />}
              {loading ? 'Loading...' : 'Open Dashboard'}
            </button>
          </form>
        </div>
      </section>

      {dashboard ? (
        <main className="mx-auto max-w-7xl space-y-8 px-4 py-12">
          <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Welcome back</p>
                <h2 className="mt-2 text-3xl font-black text-gray-950">{dashboard.affiliate.name}</h2>
                <p className="mt-2 text-sm font-bold text-gray-500">{dashboard.affiliate.email} | {dashboard.affiliate.partnerType || 'Affiliate Partner'}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-emerald-800">
                <p className="text-[10px] font-black uppercase tracking-widest">Official Code</p>
                <p className="mt-1 text-2xl font-black">{dashboard.affiliate.code}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Attributed Orders', dashboard.summary.attributedOrders, PackageCheck, 'text-emerald-600', 'bg-emerald-50'],
              ['Eligible Commission', money(dashboard.summary.eligibleCommission), BadgeDollarSign, 'text-orange-600', 'bg-orange-50'],
              ['Pending Commission', money(dashboard.summary.pendingCommission), TrendingUp, 'text-amber-600', 'bg-amber-50'],
              ['Paid Commission', money(dashboard.summary.paidCommission), CheckCircle2, 'text-blue-600', 'bg-blue-50']
            ].map(([label, value, Icon, color, bg]) => (
              <div key={String(label)} className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
                <div className={`mb-4 inline-flex rounded-2xl p-3 ${bg as string} ${color as string}`}>
                  {React.createElement(Icon as typeof PackageCheck, { size: 22 })}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                <p className="mt-2 text-2xl font-black text-gray-950">{value}</p>
              </div>
            ))}
          </div>

          <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
              <div className="flex items-center gap-3">
                <Link2 size={22} className="text-emerald-600" />
                <div>
                  <h3 className="text-xl font-black text-gray-950">Referral Links</h3>
                  <p className="text-sm text-gray-500">Share these links in WhatsApp, social pages, content, and communities.</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  ['Homepage Link', dashboard.affiliate.referralLink],
                  ['Shop Link', dashboard.affiliate.shopReferralLink]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                    <p className="mt-2 break-all text-sm font-black text-gray-950">{value}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => copyLink(label, value)}
                        className="inline-flex items-center rounded-xl bg-gray-950 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white"
                      >
                        <Copy size={14} className="mr-2" />
                        {copied === label ? 'Copied' : 'Copy Link'}
                      </button>
                      <a
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-700"
                      >
                        <ExternalLink size={14} className="mr-2" />
                        Open
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-emerald-100 bg-emerald-50 p-6 md:p-8">
              <h3 className="text-xl font-black text-gray-950">Commission Rules</h3>
              <div className="mt-5 space-y-4 text-sm text-gray-700">
                <p><span className="font-black">Current rate:</span> {dashboard.summary.commissionRate}% of attributed merchandise value.</p>
                <p><span className="font-black">Pending:</span> orders are tracked, but not eligible until completed and revenue is released.</p>
                <p><span className="font-black">Eligible:</span> finance can review these for future payout processing.</p>
                <p><span className="font-black">Paid:</span> payout history will activate when affiliate payout workflow is enabled.</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5 md:px-8">
              <h3 className="text-xl font-black text-gray-950">Attributed Orders</h3>
              <p className="mt-1 text-sm text-gray-500">Customer details stay private. This view focuses on performance and commission status.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    {['Order', 'Date', 'Value', 'Commission', 'Status'].map((header) => (
                      <th key={header} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dashboard.orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-sm font-bold text-gray-500">
                        No attributed orders yet. Share your referral link to start tracking results.
                      </td>
                    </tr>
                  ) : dashboard.orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-gray-950">{order.orderNumber}</p>
                        <p className="mt-1 text-xs font-bold text-gray-500">{order.itemCount} item(s)</p>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-5 text-sm font-black text-gray-950">{money(order.totalAmount)}</td>
                      <td className="px-6 py-5 text-sm font-black text-gray-950">{money(order.commissionAmount)}</td>
                      <td className="px-6 py-5">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${statusTone(order.commissionStatus)}`}>
                          {order.commissionStatus.replaceAll('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      ) : (
        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="rounded-[32px] border border-gray-100 bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-black text-gray-950">Approved affiliate partners get private performance visibility.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-500">
              If you have applied but do not yet have an official code, wait for approval from the E-Malla team or contact support.
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default AffiliateDashboard;
