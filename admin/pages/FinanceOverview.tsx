import React, { useEffect, useState } from 'react';
import { Banknote, CreditCard, DollarSign, ReceiptText, Wallet } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AdminService } from '../../services/adminService';
import AdminToast from '../../components/AdminToast';
import { downloadCsv, html, printPdfDocument, renderTableRows } from '../../lib/documentExport';

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

const FinanceOverview: React.FC = () => {
  const [summary, setSummary] = useState<FinanceSummary>(defaultSummary);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<'success' | 'error' | 'info'>('success');
  const [busyPayoutId, setBusyPayoutId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [data, payoutData] = await Promise.all([
          AdminService.getFinanceSummary(),
          AdminService.getPayouts()
        ]);
        setSummary({
          overview: data.overview || defaultSummary.overview,
          categoryCommission: data.categoryCommission || [],
          paymentBreakdown: data.paymentBreakdown || [],
          payoutSummary: data.payoutSummary || defaultSummary.payoutSummary
        });
        setPayouts(payoutData);
      } finally {
        setLoading(false);
      }
    };

    load();
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

  const handleExportFinance = () => {
    const rows = [
      {
        section: 'overview',
        metric: 'gross_revenue',
        value: summary.overview.grossRevenue
      },
      {
        section: 'overview',
        metric: 'platform_net_revenue',
        value: summary.overview.platformNetRevenue
      },
      {
        section: 'overview',
        metric: 'commission_earned',
        value: summary.overview.totalCommissionEarned
      },
      ...summary.categoryCommission.map((entry) => ({
        section: 'category_commission',
        metric: entry.categoryName,
        value: entry.commissionEarned
      })),
      ...payouts.map((entry) => ({
        section: 'payout_request',
        metric: `${entry.merchantName} (${entry.status})`,
        value: entry.amount
      }))
    ];

    downloadCsv(`admin-finance-report-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const handleExportFinancePdf = () => {
    const generatedAt = new Date();
    const categoryRows = summary.categoryCommission.map((entry) => [
      entry.categoryName,
      `${entry.rate}%`,
      entry.successfulOrders,
      `RWF ${Number(entry.grossSales || 0).toLocaleString()}`,
      `RWF ${Number(entry.commissionEarned || 0).toLocaleString()}`,
      `RWF ${Number(entry.merchantNet || 0).toLocaleString()}`
    ]);
    const payoutRows = payouts.map((entry) => [
      entry.merchantName,
      entry.payoutMethod,
      entry.status,
      `RWF ${Number(entry.amount || 0).toLocaleString()}`,
      entry.payoutDestination || 'Not configured',
      new Date(entry.timestamp).toLocaleDateString()
    ]);

    const bodyHtml = `
      <div class="page">
        <div class="header">
          <div>
            <div class="brand">E-<span>Malla</span> Rwanda</div>
            <div class="subtitle">Admin finance report with commissions and merchant settlements</div>
          </div>
          <div class="meta">
            <div><strong>Document:</strong> Finance Command Center Report</div>
            <div><strong>Generated:</strong> ${html.escape(generatedAt.toLocaleString())}</div>
            <div><strong>Successful Orders:</strong> ${html.escape(summary.overview.successfulOrders)}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-label">Gross Revenue</div>
            <div class="card-value">RWF ${html.escape(Number(summary.overview.grossRevenue || 0).toLocaleString())}</div>
          </div>
          <div class="card">
            <div class="card-label">Platform Net Revenue</div>
            <div class="card-value">RWF ${html.escape(Number(summary.overview.platformNetRevenue || 0).toLocaleString())}</div>
          </div>
          <div class="card">
            <div class="card-label">Commission Earned</div>
            <div class="card-value">RWF ${html.escape(Number(summary.overview.totalCommissionEarned || 0).toLocaleString())}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-label">Pending COD Value</div>
            <div class="card-value">RWF ${html.escape(Number(summary.overview.pendingCodValue || 0).toLocaleString())}</div>
          </div>
          <div class="card">
            <div class="card-label">Completed Payouts</div>
            <div class="card-value">RWF ${html.escape(Number(summary.overview.completedPayouts || 0).toLocaleString())}</div>
          </div>
          <div class="card">
            <div class="card-label">Pending Payouts</div>
            <div class="card-value">RWF ${html.escape(Number(summary.overview.pendingPayouts || 0).toLocaleString())}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Category Commission Performance</h2>
          ${
            categoryRows.length > 0
              ? `<table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Rate</th>
                      <th>Orders</th>
                      <th>Gross Sales</th>
                      <th>Commission</th>
                      <th>Merchant Net</th>
                    </tr>
                  </thead>
                  <tbody>${renderTableRows(categoryRows)}</tbody>
                </table>`
              : '<div class="card muted">No category commission activity available yet.</div>'
          }
        </div>

        <div class="section">
          <h2 class="section-title">Merchant Payout Queue</h2>
          ${
            payoutRows.length > 0
              ? `<table>
                  <thead>
                    <tr>
                      <th>Merchant</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Destination</th>
                      <th>Requested</th>
                    </tr>
                  </thead>
                  <tbody>${renderTableRows(payoutRows)}</tbody>
                </table>`
              : '<div class="card muted">No payout requests available yet.</div>'
          }
        </div>

        <div class="footer">
          This finance report was generated from the live admin dashboard data currently loaded in E-Malla Rwanda.
        </div>
      </div>
    `;

    printPdfDocument(`Admin Finance Report - ${generatedAt.toISOString().slice(0, 10)}`, bodyHtml);
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
          <h1 className="text-3xl font-black text-gray-900">Finance Command Center</h1>
          <p className="text-gray-500">Monitor platform earnings, category commissions, merchant payouts, and cash exposure in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportFinancePdf}
            className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-orange-600 hover:bg-orange-100"
          >
            Export PDF
          </button>
          <button
            onClick={handleExportFinance}
            className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50"
          >
            Export CSV
          </button>
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500">
            Successful Orders: {summary.overview.successfulOrders}
          </div>
        </div>
      </div>

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
