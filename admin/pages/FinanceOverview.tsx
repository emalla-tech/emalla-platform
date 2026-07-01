import React, { useEffect, useState } from 'react';
import { Banknote, CreditCard, DollarSign, ReceiptText, Wallet } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../auth/AuthContext';
import { AdminService, FinanceReport, FinanceReportMetricKey } from '../../services/adminService';
import AdminToast from '../../components/AdminToast';
import { downloadCsv, html, printPdfDocument, renderTableRows } from '../../lib/documentExport';
import { UserRole } from '../../types';

type FinanceSummary = {
  overview: {
    grossRevenue: number;
    onlineRevenue: number;
    pendingCodValue: number;
    deliveryFeesCollected: number;
    totalCommissionEarned: number;
    merchantNetRevenue: number;
    platformNetRevenue: number;
    completedPayouts: number;
    pendingPayouts: number;
    successfulOrders: number;
  };
  categoryCommission: Array<{
    categoryId: string;
    categoryName: string;
    rate: number;
    grossSales: number;
    commissionEarned: number;
    merchantNet: number;
    successfulOrders: number;
  }>;
  paymentBreakdown: Array<{
    label: string;
    method: string;
    count: number;
    value: number;
  }>;
  payoutSummary: {
    totalRequests: number;
    completedCount: number;
    pendingCount: number;
    rejectedCount: number;
  };
};

const defaultSummary: FinanceSummary = {
  overview: {
    grossRevenue: 0,
    onlineRevenue: 0,
    pendingCodValue: 0,
    deliveryFeesCollected: 0,
    totalCommissionEarned: 0,
    merchantNetRevenue: 0,
    platformNetRevenue: 0,
    completedPayouts: 0,
    pendingPayouts: 0,
    successfulOrders: 0
  },
  categoryCommission: [],
  paymentBreakdown: [],
  payoutSummary: {
    totalRequests: 0,
    completedCount: 0,
    pendingCount: 0,
    rejectedCount: 0
  }
};

const money = (value: number) => `RWF ${Number(value || 0).toLocaleString()}`;
const chartColors = ['#f97316', '#0f766e', '#2563eb', '#eab308', '#db2777', '#7c3aed'];
const financeMetricOptions: Array<{
  key: FinanceReportMetricKey;
  label: string;
  description: string;
}> = [
  { key: 'grossRevenue', label: 'Gross Revenue', description: 'Successful payments recorded in the period.' },
  { key: 'platformNetRevenue', label: 'Platform Net Revenue', description: 'Commission plus collected delivery fees.' },
  { key: 'totalCommissionEarned', label: 'Commission Earned', description: 'Category commission from successful sales.' },
  { key: 'pendingCodValue', label: 'Pending COD Value', description: 'Current outstanding COD orders created in the period.' }
];
const defaultReportMetrics = financeMetricOptions.map((option) => option.key);
const toDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const getDefaultReportStart = () => {
  const date = new Date();
  return toDateInput(new Date(date.getFullYear(), date.getMonth(), 1));
};

const FinanceOverview: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<FinanceSummary>(defaultSummary);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [paymentClaims, setPaymentClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<'success' | 'error' | 'info'>('success');
  const [busyPayoutId, setBusyPayoutId] = useState<string | null>(null);
  const [busyClaimId, setBusyClaimId] = useState<string | null>(null);
  const [reportFrom, setReportFrom] = useState(getDefaultReportStart);
  const [reportTo, setReportTo] = useState(() => toDateInput(new Date()));
  const [reportMetrics, setReportMetrics] = useState<FinanceReportMetricKey[]>(defaultReportMetrics);
  const [reportPreview, setReportPreview] = useState<FinanceReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'csv' | null>(null);
  const isFinanceWorkspace = user?.role === UserRole.FINANCE;
  const canReview = user?.role === UserRole.ADMIN || (isFinanceWorkspace && user.staffLevel === 'manager');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [data, payoutData, claimData] = await Promise.all([
          AdminService.getFinanceSummary(),
          AdminService.getPayouts(),
          AdminService.getPaymentClaims()
        ]);
        if (!active) return;
        setSummary({
          overview: data.overview || defaultSummary.overview,
          categoryCommission: data.categoryCommission || [],
          paymentBreakdown: data.paymentBreakdown || [],
          payoutSummary: data.payoutSummary || defaultSummary.payoutSummary
        });
        setPayouts(payoutData);
        setPaymentClaims(claimData);
      } catch (error) {
        if (!active) return;
        setMessageTone('error');
        setMessage(error instanceof Error ? error.message : 'Unable to load finance operations.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const commissionChartData = summary.categoryCommission.slice(0, 6).map((entry) => ({
    name: entry.categoryName,
    commission: entry.commissionEarned,
    merchantNet: entry.merchantNet
  }));

  const payoutVsPlatformData = [
    { name: 'Platform Net', value: summary.overview.platformNetRevenue },
    { name: 'Completed Payouts', value: summary.overview.completedPayouts },
    { name: 'Pending Payouts', value: summary.overview.pendingPayouts }
  ];

  const handlePayoutReview = async (payoutId: string, status: 'success' | 'failed') => {
    setBusyPayoutId(payoutId);
    try {
      const updated = await AdminService.updatePayoutStatus(payoutId, status);
      setPayouts((current) => current.map((entry) => (entry.id === payoutId ? updated : entry)));
      const latestSummary = await AdminService.getFinanceSummary();
      setSummary({
        overview: latestSummary.overview || defaultSummary.overview,
        categoryCommission: latestSummary.categoryCommission || [],
        paymentBreakdown: latestSummary.paymentBreakdown || [],
        payoutSummary: latestSummary.payoutSummary || defaultSummary.payoutSummary
      });
      setMessageTone(status === 'success' ? 'success' : 'info');
      setMessage(status === 'success' ? 'Payout approved successfully.' : 'Payout rejected successfully.');
      window.setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessageTone('error');
      setMessage(error instanceof Error ? error.message : 'Unable to review payout.');
      window.setTimeout(() => setMessage(null), 3000);
    } finally {
      setBusyPayoutId(null);
    }
  };

  const handlePaymentClaimReview = async (paymentId: string, status: 'approved' | 'rejected') => {
    setBusyClaimId(paymentId);
    try {
      const updated = await AdminService.reviewPaymentClaim(paymentId, status);
      setPaymentClaims((current) => current.map((entry) => (entry.id === paymentId ? updated : entry)));
      setMessageTone(status === 'approved' ? 'success' : 'info');
      setMessage(status === 'approved' ? 'GTBank payment approved.' : 'GTBank payment rejected.');
      window.setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessageTone('error');
      setMessage(error instanceof Error ? error.message : 'Unable to review GTBank payment.');
      window.setTimeout(() => setMessage(null), 3000);
    } finally {
      setBusyClaimId(null);
    }
  };

  const applyReportPreset = (preset: 'today' | '7days' | '30days' | 'month') => {
    const end = new Date();
    const start = new Date(end);
    if (preset === '7days') start.setDate(end.getDate() - 6);
    if (preset === '30days') start.setDate(end.getDate() - 29);
    if (preset === 'month') start.setDate(1);
    setReportFrom(toDateInput(start));
    setReportTo(toDateInput(end));
    setReportPreview(null);
  };

  const toggleReportMetric = (metric: FinanceReportMetricKey) => {
    setReportMetrics((current) =>
      current.includes(metric)
        ? current.filter((entry) => entry !== metric)
        : [...current, metric]
    );
    setReportPreview(null);
  };

  const handlePreviewReport = async () => {
    if (reportMetrics.length === 0) {
      setMessageTone('error');
      setMessage('Select at least one finance metric.');
      return;
    }

    setReportLoading(true);
    try {
      const report = await AdminService.getFinanceReport({
        from: reportFrom,
        to: reportTo,
        metrics: reportMetrics
      });
      setReportPreview(report);
      setMessage(null);
    } catch (error) {
      setMessageTone('error');
      setMessage(error instanceof Error ? error.message : 'Unable to prepare finance report.');
    } finally {
      setReportLoading(false);
    }
  };

  const downloadFinanceCsv = (report: FinanceReport) => {
    const rows = report.metrics.map((metric) => ({
      from: report.range.from,
      to: report.range.to,
      timezone: report.range.timezone,
      metric: metric.label,
      amount_rwf: metric.value,
      basis: metric.basis,
      successful_orders: report.successfulOrders,
      generated_at: report.generatedAt,
      generated_by: user?.name || user?.email || 'E-Malla Finance'
    }));
    downloadCsv(`emalla-finance-${report.range.from}-to-${report.range.to}.csv`, rows);
  };

  const printFinancePdf = (report: FinanceReport) => {
    const generatedAt = new Date(report.generatedAt);
    const metricCards = report.metrics.map((metric) => `
      <div class="card">
        <div class="card-label">${html.escape(metric.label)}</div>
        <div class="card-value">RWF ${html.escape(Number(metric.value || 0).toLocaleString())}</div>
        <div class="muted">${html.escape(metric.basis)}</div>
      </div>
    `).join('');
    const bodyHtml = `
      <div class="page">
        <div class="header">
          <div>
            <div class="brand">E-<span>Malla</span> Rwanda</div>
            <div class="subtitle">Controlled finance report</div>
          </div>
          <div class="meta">
            <div><strong>Period:</strong> ${html.escape(report.range.from)} to ${html.escape(report.range.to)}</div>
            <div><strong>Timezone:</strong> ${html.escape(report.range.timezone)}</div>
            <div><strong>Generated:</strong> ${html.escape(generatedAt.toLocaleString())}</div>
            <div><strong>Generated by:</strong> ${html.escape(user?.name || user?.email || 'E-Malla Finance')}</div>
          </div>
        </div>
        <div class="grid">${metricCards}</div>
        <div class="section">
          <h2 class="section-title">Report Controls</h2>
          <table>
            <tbody>
              ${renderTableRows([
                ['Successful Orders', report.successfulOrders],
                ['Selected Metrics', report.metrics.map((metric) => metric.label).join(', ')],
                ['Period Start', report.range.from],
                ['Period End', report.range.to]
              ])}
            </tbody>
          </table>
        </div>
        <div class="footer">
          Pending COD represents current outstanding COD orders created in the selected period. This export is recorded in the E-Malla audit trail.
        </div>
      </div>
    `;

    printPdfDocument(`E-Malla Finance ${report.range.from} to ${report.range.to}`, bodyHtml);
  };

  const handleReportExport = async (format: 'pdf' | 'csv') => {
    if (reportMetrics.length === 0) {
      setMessageTone('error');
      setMessage('Select at least one finance metric.');
      return;
    }

    setExportingFormat(format);
    try {
      const report = await AdminService.exportFinanceReport({
        from: reportFrom,
        to: reportTo,
        metrics: reportMetrics,
        format
      });
      setReportPreview(report);
      if (format === 'pdf') printFinancePdf(report);
      else downloadFinanceCsv(report);
      setMessageTone('success');
      setMessage(`${format.toUpperCase()} finance report exported and recorded in audit logs.`);
      window.setTimeout(() => setMessage(null), 3500);
    } catch (error) {
      setMessageTone('error');
      setMessage(error instanceof Error ? error.message : 'Unable to export finance report.');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleExportPayoutReceipt = (payout: any) => {
    const generatedAt = new Date();
    const bodyHtml = `
      <div class="page">
        <div class="header">
          <div>
            <div class="brand">E-<span>Malla</span> Rwanda</div>
            <div class="subtitle">Admin payout receipt and review record</div>
          </div>
          <div class="meta">
            <div><strong>Receipt:</strong> ${html.escape(payout.id)}</div>
            <div><strong>Generated:</strong> ${html.escape(generatedAt.toLocaleString())}</div>
            <div><strong>Status:</strong> <span class="pill">${html.escape(payout.status)}</span></div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-label">Merchant</div>
            <div class="card-value">${html.escape(payout.merchantName)}</div>
          </div>
          <div class="card">
            <div class="card-label">Amount</div>
            <div class="card-value">RWF ${html.escape(Number(payout.amount || 0).toLocaleString())}</div>
          </div>
          <div class="card">
            <div class="card-label">Requested On</div>
            <div class="card-value">${html.escape(new Date(payout.timestamp).toLocaleDateString())}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Payout Review Details</h2>
          <table>
            <tbody>
              ${renderTableRows([
                ['Payout ID', payout.id],
                ['Merchant Email', payout.merchantEmail || 'Not available'],
                ['Request Reference', payout.tx_ref || payout.id],
                ['Status', payout.status],
                ['Payout Method', payout.payoutMethod || payout.method || 'Not specified'],
                ['Destination', payout.payoutDestination || 'Not configured']
              ])}
            </tbody>
          </table>
        </div>

        <div class="footer">
          This receipt was generated from the live admin finance payout queue in E-Malla Rwanda.
        </div>
      </div>
    `;

    printPdfDocument(`Admin Payout Receipt - ${payout.id}`, bodyHtml);
  };

  return (
    <div className="space-y-8">
      <AdminToast message={message} tone={messageTone} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">
            {isFinanceWorkspace ? 'Protected Finance Workspace' : 'Admin Financial Oversight'}
          </p>
          <h1 className="mt-2 text-3xl font-black text-gray-900">Finance Command Center</h1>
          <p className="mt-1 text-gray-500">Verify payments, reconcile collections, and control merchant settlements from live platform data.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500">
            Successful Orders: {summary.overview.successfulOrders}
          </div>
        </div>
      </div>

      {isFinanceWorkspace && (
        <div className={`rounded-2xl border px-5 py-4 text-sm ${
          canReview
            ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
            : 'border-amber-100 bg-amber-50 text-amber-800'
        }`}>
          <span className="font-black">{canReview ? 'Manager controls active.' : 'Read-only finance access.'}</span>{' '}
          {canReview
            ? 'Payment and payout decisions are recorded in the audit trail.'
            : 'A Finance Manager must approve or reject payments and payouts.'}
        </div>
      )}

      <section className="overflow-hidden rounded-[32px] border border-blue-100 bg-white shadow-sm">
        <div className="border-b border-blue-100 bg-blue-50/70 px-6 py-5 md:px-8">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Controlled Reporting</p>
          <h2 className="mt-2 text-xl font-black text-gray-950">Finance Report Builder</h2>
          <p className="mt-1 text-sm text-gray-600">Choose the reporting period and include only the metrics needed for this document.</p>
        </div>

        <div className="space-y-6 p-6 md:p-8">
          <div className="flex flex-wrap gap-2" aria-label="Finance report date presets">
            {([
              ['today', 'Today'],
              ['7days', 'Last 7 Days'],
              ['30days', 'Last 30 Days'],
              ['month', 'This Month']
            ] as const).map(([preset, label]) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyReportPreset(preset)}
                className="min-h-11 rounded-xl border border-gray-200 bg-white px-4 text-xs font-black text-gray-600 hover:border-blue-300 hover:text-blue-700"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-bold text-gray-700">
              From
              <input
                type="date"
                value={reportFrom}
                max={reportTo}
                onChange={(event) => {
                  setReportFrom(event.target.value);
                  setReportPreview(null);
                }}
                className="mt-2 min-h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </label>
            <label className="text-sm font-bold text-gray-700">
              To
              <input
                type="date"
                value={reportTo}
                min={reportFrom}
                max={toDateInput(new Date())}
                onChange={(event) => {
                  setReportTo(event.target.value);
                  setReportPreview(null);
                }}
                className="mt-2 min-h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-black text-gray-900">Metrics to include</legend>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {financeMetricOptions.map((option) => {
                const selected = reportMetrics.includes(option.key);
                return (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleReportMetric(option.key)}
                    className={`min-h-24 rounded-2xl border p-4 text-left transition-colors ${
                      selected
                        ? 'border-blue-500 bg-blue-50 text-blue-950'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="block text-sm font-black">{option.label}</span>
                    <span className="mt-1 block text-xs leading-relaxed opacity-75">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePreviewReport}
              disabled={reportLoading || reportMetrics.length === 0}
              className="min-h-12 rounded-2xl bg-gray-950 px-6 text-xs font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reportLoading ? 'Preparing...' : 'Generate Preview'}
            </button>
            {canReview ? (
              <>
                <button
                  type="button"
                  onClick={() => handleReportExport('pdf')}
                  disabled={exportingFormat !== null || reportMetrics.length === 0}
                  className="min-h-12 rounded-2xl border border-orange-200 bg-orange-50 px-6 text-xs font-black uppercase tracking-widest text-orange-700 disabled:opacity-50"
                >
                  {exportingFormat === 'pdf' ? 'Exporting...' : 'Export PDF'}
                </button>
                <button
                  type="button"
                  onClick={() => handleReportExport('csv')}
                  disabled={exportingFormat !== null || reportMetrics.length === 0}
                  className="min-h-12 rounded-2xl border border-gray-200 bg-white px-6 text-xs font-black uppercase tracking-widest text-gray-700 disabled:opacity-50"
                >
                  {exportingFormat === 'csv' ? 'Exporting...' : 'Export CSV'}
                </button>
              </>
            ) : (
              <span className="rounded-2xl bg-amber-50 px-5 py-3 text-xs font-bold text-amber-800">
                Finance Manager approval is required to export.
              </span>
            )}
          </div>

          {reportPreview && (
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5 md:p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Preview</p>
                  <h3 className="mt-1 font-black text-gray-950">{reportPreview.range.from} to {reportPreview.range.to}</h3>
                </div>
                <p className="text-xs font-bold text-gray-500">{reportPreview.range.timezone} | {reportPreview.successfulOrders} successful orders</p>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {reportPreview.metrics.map((metric) => (
                  <div key={metric.key} className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{metric.label}</p>
                    <p className="mt-2 text-xl font-black text-gray-950">{money(metric.value)}</p>
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">{metric.basis}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {loading ? (
        <div className="p-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl inline-flex mb-5"><DollarSign size={22} /></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Gross Revenue</p>
              <p className="text-3xl font-black text-gray-900">{money(summary.overview.grossRevenue)}</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl inline-flex mb-5"><CreditCard size={22} /></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Platform Net Revenue</p>
              <p className="text-3xl font-black text-gray-900">{money(summary.overview.platformNetRevenue)}</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl inline-flex mb-5"><Banknote size={22} /></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Commission Earned</p>
              <p className="text-3xl font-black text-gray-900">{money(summary.overview.totalCommissionEarned)}</p>
            </div>
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl inline-flex mb-5"><Wallet size={22} /></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Pending COD Value</p>
              <p className="text-3xl font-black text-gray-900">{money(summary.overview.pendingCodValue)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100">
                <h2 className="text-xl font-black text-gray-900">Commission by Category</h2>
                <p className="text-sm text-gray-500 mt-1">Compare platform commission earned against merchant net by category.</p>
              </div>
              <div className="h-[340px] px-4 py-6">
                {commissionChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500">No commission data to chart yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={commissionChartData} barCategoryGap={18}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ececec" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} />
                      <Tooltip
                        formatter={(value: number) => money(Number(value || 0))}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="commission" name="Platform Commission" radius={[10, 10, 0, 0]} fill="#f97316" />
                      <Bar dataKey="merchantNet" name="Merchant Net" radius={[10, 10, 0, 0]} fill="#0f766e" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="xl:col-span-2 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100">
                <h2 className="text-xl font-black text-gray-900">Revenue vs Payouts</h2>
                <p className="text-sm text-gray-500 mt-1">Quick view of platform retention against merchant settlements.</p>
              </div>
              <div className="h-[340px] px-4 py-6">
                {payoutVsPlatformData.every((entry) => entry.value === 0) ? (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500">No payout or platform revenue data yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={payoutVsPlatformData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={72}
                        outerRadius={110}
                        paddingAngle={4}
                      >
                        {payoutVsPlatformData.map((entry, index) => (
                          <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => money(Number(value || 0))}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="px-8 pb-8 grid grid-cols-1 gap-3">
                {payoutVsPlatformData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }}></span>
                      <span className="text-sm font-bold text-gray-700">{entry.name}</span>
                    </div>
                    <span className="text-sm font-black text-gray-900">{money(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100">
                <h2 className="text-xl font-black text-gray-900">Category Commission Performance</h2>
                <p className="text-sm text-gray-500 mt-1">Real commission earnings based on admin category rates and successful orders.</p>
              </div>
              <div className="divide-y divide-gray-100">
                {summary.categoryCommission.length === 0 ? (
                  <div className="px-8 py-10 text-sm text-gray-500">No successful category sales yet.</div>
                ) : summary.categoryCommission.map((entry) => (
                  <div key={entry.categoryId} className="px-8 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-gray-900">{entry.categoryName}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                        {entry.rate}% commission | {entry.successfulOrders} line items
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:w-[520px]">
                      <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Gross</p>
                        <p className="text-sm font-black text-gray-900 mt-1">{money(entry.grossSales)}</p>
                      </div>
                      <div className="rounded-2xl bg-orange-50 border border-orange-100 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Commission</p>
                        <p className="text-sm font-black text-gray-900 mt-1">{money(entry.commissionEarned)}</p>
                      </div>
                      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Merchant Net</p>
                        <p className="text-sm font-black text-gray-900 mt-1">{money(entry.merchantNet)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                <h2 className="text-xl font-black text-gray-900">Merchant Payouts</h2>
                <p className="text-sm text-gray-500 mt-1">Track payout requests against merchant net revenue.</p>
                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Completed Payouts</p>
                    <p className="text-2xl font-black text-gray-900 mt-2">{money(summary.overview.completedPayouts)}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Pending Payouts</p>
                    <p className="text-2xl font-black text-gray-900 mt-2">{money(summary.overview.pendingPayouts)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Requests</p>
                      <p className="text-xl font-black text-gray-900 mt-1">{summary.payoutSummary.totalRequests}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Completed</p>
                      <p className="text-xl font-black text-gray-900 mt-1">{summary.payoutSummary.completedCount}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pending</p>
                      <p className="text-xl font-black text-gray-900 mt-1">{summary.payoutSummary.pendingCount}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rejected</p>
                      <p className="text-xl font-black text-gray-900 mt-1">{summary.payoutSummary.rejectedCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                <h2 className="text-xl font-black text-gray-900">Settlement Snapshot</h2>
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Merchant net revenue</span>
                    <span className="font-black text-gray-900">{money(summary.overview.merchantNetRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Online payments collected</span>
                    <span className="font-black text-gray-900">{money(summary.overview.onlineRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Delivery fees collected</span>
                    <span className="font-black text-gray-900">{money(summary.overview.deliveryFeesCollected)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900">Payment Method Breakdown</h2>
              <p className="text-sm text-gray-500 mt-1">Real transaction distribution across supported payment channels.</p>
            </div>
            <div className="divide-y divide-gray-100">
              {summary.paymentBreakdown.map((item) => (
                <div key={item.label} className="px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-orange-500">
                      <ReceiptText size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">{item.label}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{item.count} orders</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-gray-900">{money(item.value)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900">GTBank Payment Verification Queue</h2>
              <p className="text-sm text-gray-500 mt-1">Confirm the bank reference and amount before releasing an order to the seller.</p>
            </div>
            <div className="divide-y divide-gray-100">
              {paymentClaims.length === 0 ? (
                <div className="px-8 py-10 text-sm text-gray-500">No GTBank payments are waiting for verification.</div>
              ) : paymentClaims.map((claim) => (
                <div key={claim.id} className="px-8 py-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-gray-900">{claim.orderNumber} | {claim.customerName}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">{claim.customerEmail}</p>
                    <p className="mt-2 text-xs font-bold text-gray-600">Bank reference: {claim.bankReference || 'Not supplied'} | Phone: {claim.payerPhone || 'Not supplied'}</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="rounded-2xl bg-gray-50 border border-gray-100 px-5 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</p>
                      <p className="mt-1 text-sm font-black text-gray-900">{money(claim.orderTotal || claim.amount)}</p>
                    </div>
                    {claim.status === 'VERIFICATION_PENDING' ? (
                      canReview ? (
                        <>
                          <button onClick={() => handlePaymentClaimReview(claim.id, 'approved')} disabled={busyClaimId === claim.id} className="rounded-2xl bg-emerald-500 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-60">Approve</button>
                          <button onClick={() => handlePaymentClaimReview(claim.id, 'rejected')} disabled={busyClaimId === claim.id} className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 disabled:opacity-60">Reject</button>
                        </>
                      ) : (
                        <span className="rounded-2xl bg-amber-50 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-amber-700">Manager review required</span>
                      )
                    ) : (
                      <span className="rounded-2xl bg-red-50 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-red-500">Rejected</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900">Payout Review Queue</h2>
              <p className="text-sm text-gray-500 mt-1">Approve or reject merchant payout requests from the finance desk.</p>
            </div>
            <div className="divide-y divide-gray-100">
              {payouts.length === 0 ? (
                <div className="px-8 py-10 text-sm text-gray-500">No payout requests yet.</div>
              ) : payouts.map((payout) => (
                <div key={payout.id} className="px-8 py-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-gray-900">{payout.merchantName}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                      {payout.merchantEmail} | {payout.payoutMethod}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">{payout.payoutDestination || 'No payout destination saved'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 xl:w-[720px]">
                    <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</p>
                      <p className="text-sm font-black text-gray-900 mt-1">{money(payout.amount)}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Requested</p>
                      <p className="text-sm font-black text-gray-900 mt-1">{new Date(payout.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</p>
                      <p className="text-sm font-black text-gray-900 mt-1">{payout.status}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {payout.status === 'pending' ? (
                        canReview ? (
                          <>
                            <button
                              onClick={() => handleExportPayoutReceipt(payout)}
                              className="rounded-2xl bg-white border border-gray-200 text-gray-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50"
                            >
                              Receipt
                            </button>
                            <button
                              onClick={() => handlePayoutReview(payout.id, 'success')}
                              disabled={busyPayoutId === payout.id}
                              className="flex-1 rounded-2xl bg-emerald-500 text-white px-4 py-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handlePayoutReview(payout.id, 'failed')}
                              disabled={busyPayoutId === payout.id}
                              className="flex-1 rounded-2xl bg-red-50 text-red-500 border border-red-100 px-4 py-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleExportPayoutReceipt(payout)}
                              className="rounded-2xl bg-white border border-gray-200 text-gray-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50"
                            >
                              Receipt
                            </button>
                            <div className="flex-1 rounded-2xl bg-amber-50 px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-amber-700">
                              Manager review required
                            </div>
                          </>
                        )
                      ) : (
                        <>
                          <button
                            onClick={() => handleExportPayoutReceipt(payout)}
                            className="rounded-2xl bg-white border border-gray-200 text-gray-600 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50"
                          >
                            Receipt
                          </button>
                          <div className={`flex-1 rounded-2xl px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest ${
                            payout.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                          }`}>
                            {payout.status === 'success' ? 'Approved' : 'Rejected'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinanceOverview;
