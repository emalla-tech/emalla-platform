
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, TrendingUp, Download, ArrowUpRight, 
  ArrowDownLeft, Clock, CheckCircle2, X, Loader2
} from 'lucide-react';
import { MerchantService } from '../../services/merchantService';
import { Transaction } from '../../types';
import { downloadCsv, html, printPdfDocument, renderTableRows } from '../../lib/documentExport';

const MerchantWallet: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  useEffect(() => {
    const loadWallet = async () => {
      setLoading(true);
      setError(null);
      try {
        const [walletTransactions, walletBalance, merchantSettings] = await Promise.all([
          MerchantService.getTransactions(),
          MerchantService.getWalletBalance(),
          MerchantService.getSettings()
        ]);
        setTransactions(walletTransactions);
        setWallet(walletBalance);
        setSettings(merchantSettings);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load seller wallet.');
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, []);

  const refreshWallet = async () => {
    const [walletTransactions, walletBalance, merchantSettings] = await Promise.all([
      MerchantService.getTransactions(),
      MerchantService.getWalletBalance(),
      MerchantService.getSettings()
    ]);
    setTransactions(walletTransactions);
    setWallet(walletBalance);
    setSettings(merchantSettings);
  };

  const payoutDestination = settings?.payoutMethod === 'bank'
    ? settings?.bankName && settings?.bankAccountNumber
      ? `${settings.bankName} • ${settings.bankAccountNumber}`
      : null
    : settings?.momoNumber || null;

  const handleRequestPayout = async () => {
    const amount = Number(payoutAmount);

    if (!payoutDestination) {
      setError('Set your payout destination first in Seller Settings.');
      setShowPayoutModal(false);
      navigate('/seller/settings');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid payout amount.');
      return;
    }

    if (amount > Number(wallet.currentBalance || 0)) {
      setError('Payout amount cannot exceed available balance.');
      return;
    }

    setSubmittingPayout(true);
    setError(null);
    try {
      await MerchantService.requestPayout(amount);
      await refreshWallet();
      setShowPayoutModal(false);
      setPayoutAmount('');
      setMessage('Payout request submitted successfully.');
      window.setTimeout(() => setMessage(null), 3000);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to request payout.');
    } finally {
      setSubmittingPayout(false);
    }
  };

  const handleExportStatements = () => {
    const rows = transactions.map((txn) => ({
      transaction_id: txn.id,
      date: new Date(txn.timestamp).toISOString(),
      type: txn.type,
      status: txn.status,
      method: txn.method,
      amount_rwf: txn.amount,
      reference: txn.tx_ref,
      order_id: txn.orderId || ''
    }));

    downloadCsv(`seller-wallet-statement-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const handleExportPdf = () => {
    const generatedAt = new Date();
    const transactionRows = transactions.map((txn) => [
      new Date(txn.timestamp).toLocaleDateString(),
      txn.id,
      txn.method,
      txn.type,
      txn.status,
      `RWF ${Number(txn.amount || 0).toLocaleString()}`
    ]);

    const bodyHtml = `
      <div class="page">
        <div class="header">
          <div>
            <div class="brand">E-<span>Malla</span> Rwanda</div>
            <div class="subtitle">Seller wallet statement and payout snapshot</div>
          </div>
          <div class="meta">
            <div><strong>Document:</strong> Seller Wallet Statement</div>
            <div><strong>Generated:</strong> ${html.escape(generatedAt.toLocaleString())}</div>
            <div><strong>Payout destination:</strong> ${html.escape(payoutDestination || 'Not configured')}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-label">Available Balance</div>
            <div class="card-value">RWF ${html.escape(Number(wallet.currentBalance || 0).toLocaleString())}</div>
          </div>
          <div class="card">
            <div class="card-label">Net Revenue</div>
            <div class="card-value">RWF ${html.escape(Number(wallet.netRevenue || 0).toLocaleString())}</div>
          </div>
          <div class="card">
            <div class="card-label">Commission Rate</div>
            <div class="card-value">${html.escape(Number(wallet.averageCommissionRate || 0).toFixed(1))}%</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-label">Gross Sales</div>
            <div class="card-value">RWF ${html.escape(Number(wallet.grossSales || 0).toLocaleString())}</div>
          </div>
          <div class="card">
            <div class="card-label">Commission Deducted</div>
            <div class="card-value">RWF ${html.escape(Number(wallet.commissionAmount || 0).toLocaleString())}</div>
          </div>
          <div class="card">
            <div class="card-label">Pending Payouts</div>
            <div class="card-value">RWF ${html.escape(Number(wallet.pendingPayouts || 0).toLocaleString())}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Transaction History</h2>
          ${
            transactionRows.length > 0
              ? `<table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference</th>
                      <th>Method</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>${renderTableRows(transactionRows)}</tbody>
                </table>`
              : '<div class="card muted">No wallet transactions available yet.</div>'
          }
        </div>

        <div class="footer">
          This statement was generated from the live seller wallet data currently loaded in E-Malla Rwanda.
        </div>
      </div>
    `;

    printPdfDocument(`Seller Wallet Statement - ${generatedAt.toISOString().slice(0, 10)}`, bodyHtml);
  };

  const handleExportPayoutReceipt = (txn: Transaction) => {
    const generatedAt = new Date();
    const bodyHtml = `
      <div class="page">
        <div class="header">
          <div>
            <div class="brand">E-<span>Malla</span> Rwanda</div>
            <div class="subtitle">Seller payout receipt</div>
          </div>
          <div class="meta">
            <div><strong>Receipt:</strong> ${html.escape(txn.id)}</div>
            <div><strong>Generated:</strong> ${html.escape(generatedAt.toLocaleString())}</div>
            <div><strong>Status:</strong> <span class="pill">${html.escape(txn.status)}</span></div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-label">Amount</div>
            <div class="card-value">RWF ${html.escape(Number(txn.amount || 0).toLocaleString())}</div>
          </div>
          <div class="card">
            <div class="card-label">Method</div>
            <div class="card-value">${html.escape(txn.method || 'Payout')}</div>
          </div>
          <div class="card">
            <div class="card-label">Requested On</div>
            <div class="card-value">${html.escape(new Date(txn.timestamp).toLocaleDateString())}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Payout Details</h2>
          <table>
            <tbody>
              ${renderTableRows([
                ['Transaction ID', txn.id],
                ['Reference', txn.tx_ref || txn.id],
                ['Status', txn.status],
                ['Payout Method', txn.method || 'Not specified'],
                ['Destination', payoutDestination || 'Not configured'],
                ['Linked Order', txn.orderId || 'Not linked to a single order']
              ])}
            </tbody>
          </table>
        </div>

        <div class="footer">
          This receipt was generated from the live merchant wallet transaction history in E-Malla Rwanda.
        </div>
      </div>
    `;

    printPdfDocument(`Payout Receipt - ${txn.id}`, bodyHtml);
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 text-center shadow-sm">
        <h2 className="text-xl font-black text-gray-900">Seller wallet unavailable</h2>
        <p className="text-sm text-gray-500 mt-2">{error || 'We could not load seller wallet right now.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {message ? (
        <div className="rounded-2xl bg-emerald-500 text-white px-5 py-4 font-black shadow-lg">
          {message}
        </div>
      ) : null}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">E-Malla Wallet</h1>
          <p className="text-gray-500 text-sm">Manage your earnings and payout schedule.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportPdf}
            className="flex items-center px-5 py-3 border border-orange-200 rounded-2xl text-sm font-black bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all shadow-sm"
          >
            <Download size={18} className="mr-2" /> Export PDF
          </button>
          <button
            onClick={handleExportStatements}
            className="flex items-center px-6 py-3 border border-gray-200 rounded-2xl text-sm font-black bg-white hover:bg-gray-50 transition-all shadow-sm"
          >
            <Download size={18} className="mr-2" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Balance Card */}
        <div className="lg:col-span-2 bg-gray-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-black/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
               <div className="p-4 bg-white/10 border border-white/10 rounded-2xl text-orange-500">
                 <DollarSign size={32} />
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Commission Rate</p>
                  <p className="text-xl font-black">{Number(wallet.averageCommissionRate || 0).toFixed(1)}%</p>
               </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Available to withdraw</p>
              <h2 className="text-5xl md:text-6xl font-black">RWF {wallet.currentBalance.toLocaleString()}</h2>
            </div>
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowPayoutModal(true)}
                className="flex-grow bg-orange-500 hover:bg-orange-600 py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 transition-all active:scale-95"
              >
                Request Payout to MoMo
              </button>
              <button
                onClick={() => navigate('/seller/settings')}
                className="px-10 bg-white/10 hover:bg-white/20 py-5 rounded-2xl font-black text-lg transition-all"
              >
                Bank Settings
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group hover:border-orange-500/30 transition-all">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pending Clearances</p>
              <div className="flex justify-between items-end">
                 <h3 className="text-2xl font-black text-gray-900">RWF {wallet.pendingPayouts.toLocaleString()}</h3>
                 <Clock className="text-orange-500 mb-1" size={24} />
              </div>
              <p className="text-xs text-gray-500 mt-4 font-medium">Clearance in 2-3 business days after delivery.</p>
           </div>
           <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm group hover:border-emerald-500/30 transition-all">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Withdrawn</p>
              <div className="flex justify-between items-end">
                 <h3 className="text-2xl font-black text-gray-900">RWF {wallet.totalWithdrawn.toLocaleString()}</h3>
                 <TrendingUp className="text-emerald-500 mb-1" size={24} />
              </div>
              <div className="mt-4 flex items-center space-x-2 text-emerald-600">
                <CheckCircle2 size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Verified Seller Account</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Gross Sales</p>
          <p className="text-2xl font-black text-gray-900">RWF {Number(wallet.grossSales || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Commission Deducted</p>
          <p className="text-2xl font-black text-gray-900">RWF {Number(wallet.commissionAmount || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Net Revenue</p>
          <p className="text-2xl font-black text-gray-900">RWF {Number(wallet.netRevenue || 0).toLocaleString()}</p>
        </div>
      </div>

      {showPayoutModal ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPayoutModal(false)}></div>
          <div className="relative z-10 w-full max-w-lg rounded-[36px] bg-white shadow-2xl border border-gray-100 p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Request Payout</h2>
                <p className="text-sm text-gray-500 mt-1">Submit a payout request using your saved seller settings.</p>
              </div>
              <button onClick={() => setShowPayoutModal(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="rounded-[28px] bg-gray-50 border border-gray-100 p-5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Destination</p>
              <p className="text-sm font-black text-gray-900">{payoutDestination || 'No payout destination configured'}</p>
              <button
                onClick={() => {
                  setShowPayoutModal(false);
                  navigate('/seller/settings');
                }}
                className="text-xs font-black uppercase tracking-widest text-orange-500"
              >
                Update payout settings
              </button>
            </div>

            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Amount (RWF)</span>
              <input
                value={payoutAmount}
                onChange={(event) => setPayoutAmount(event.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 font-bold outline-none border border-transparent focus:border-orange-300"
                placeholder="Enter payout amount"
                type="number"
                min="1"
              />
            </label>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-bold">Available Balance</span>
              <span className="font-black text-gray-900">RWF {Number(wallet.currentBalance || 0).toLocaleString()}</span>
            </div>

            <button
              onClick={handleRequestPayout}
              disabled={submittingPayout}
              className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submittingPayout ? <Loader2 size={18} className="animate-spin" /> : <DollarSign size={18} />}
              Confirm Payout Request
            </button>
          </div>
        </div>
      ) : null}

      {/* Transaction History */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-10">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black text-gray-900">Recent Transactions</h3>
          <button className="text-orange-500 font-bold text-sm hover:underline flex items-center">
            View All History <ArrowUpRight size={16} className="ml-1" />
          </button>
        </div>

        <div className="space-y-6">
          {transactions.map((txn) => (
            <div key={txn.id} className="flex items-center justify-between p-6 rounded-3xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group">
              <div className="flex items-center space-x-6">
                <div className={`p-3 rounded-2xl ${txn.type === 'payout' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                   {txn.type === 'payout' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-sm group-hover:text-orange-600 transition-colors">{txn.method}</h4>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{txn.id} • {new Date(txn.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-black text-lg ${txn.type === 'payout' ? 'text-red-500' : 'text-gray-900'}`}>
                  {txn.type === 'payout' ? '-' : '+'} RWF {txn.amount.toLocaleString()}
                </p>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                    txn.status === 'success' ? 'bg-emerald-50 text-emerald-600' : txn.status === 'failed' ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'
                  }`}>
                    {txn.status}
                  </span>
                  {txn.type === 'payout' ? (
                    <button
                      onClick={() => handleExportPayoutReceipt(txn)}
                      className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      Receipt PDF
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MerchantWallet;
