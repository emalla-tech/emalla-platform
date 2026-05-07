
import React, { useEffect, useRef, useState } from 'react';
import { 
  Banknote,
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Users, 
  Store, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Activity,
  Database,
  ChevronRight,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { AdminService } from '../../services/adminService';
import { PaymentMethod } from '../../types';
import AdminToast from '../../components/AdminToast';

const AUDIT_FILTERS = [
  { key: 'all', label: 'All Activity' },
  { key: 'orders', label: 'Orders' },
  { key: 'payments', label: 'Payments' },
  { key: 'sellers', label: 'Sellers' },
  { key: 'products', label: 'Products' },
  { key: 'riders', label: 'Riders' },
  { key: 'security', label: 'Security' }
] as const;

const inferAuditCategory = (log: any) => {
  if (log.category) return String(log.category).toLowerCase();

  const content = `${log.event || ''} ${log.actor || ''}`.toLowerCase();
  if (content.includes('payment') || content.includes('cash on delivery')) return 'payments';
  if (content.includes('seller') || content.includes('merchant')) return 'sellers';
  if (content.includes('product')) return 'products';
  if (content.includes('rider') || content.includes('delivery')) return 'riders';
  if (content.includes('session') || content.includes('password') || content.includes('security')) return 'security';
  if (content.includes('order')) return 'orders';
  return 'system';
};

const getColorClasses = (color: string) => {
  const mapping: Record<string, string> = {
    orange: 'bg-orange-50 text-orange-500',
    blue: 'bg-blue-50 text-blue-500',
    emerald: 'bg-emerald-50 text-emerald-500',
    purple: 'bg-purple-50 text-purple-500',
    red: 'bg-red-50 text-red-500',
  };
  return mapping[color] || 'bg-gray-50 text-gray-500';
};

const StatCard = ({ label, value, trend, icon, color }: any) => (
  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 group hover:shadow-xl hover:border-orange-100 transition-all duration-300">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${getColorClasses(color)}`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-black ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          {trend >= 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">{label}</p>
    <p className="text-3xl font-black text-gray-900">{value}</p>
  </div>
);

const getSeverityClasses = (severity?: 'high' | 'medium' | 'low' | null) => {
  if (severity === 'high') return 'bg-red-100 text-red-600';
  if (severity === 'medium') return 'bg-amber-100 text-amber-700';
  if (severity === 'low') return 'bg-slate-100 text-slate-600';
  return 'bg-gray-100 text-gray-500';
};

const AlertItem = ({ count, label, color, severity }: any) => (
  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer">
    <div className="flex items-center space-x-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm bg-white/10 ${color === 'orange' ? 'text-orange-400' : color === 'blue' ? 'text-blue-400' : color === 'red' ? 'text-red-400' : 'text-emerald-400'}`}>
        {count}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-gray-300">{label}</p>
        {severity ? (
          <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${getSeverityClasses(severity)}`}>
            {severity} severity
          </span>
        ) : null}
      </div>
    </div>
    <ChevronRight size={16} className="text-gray-700" />
  </div>
);

const formatMetadataLabel = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

const getAuditJumpActions = (log: any) => {
  const actions = [];
  const params = new URLSearchParams();

  if (log.metadata?.orderId) params.set('orderId', String(log.metadata.orderId));
  if (log.metadata?.orderNumber) params.set('orderNumber', String(log.metadata.orderNumber));
  if (log.metadata?.productId) params.set('productId', String(log.metadata.productId));
  if (log.metadata?.productName) params.set('productName', String(log.metadata.productName));
  if (log.metadata?.applicationId) params.set('applicationId', String(log.metadata.applicationId));
  if (log.metadata?.sellerEmail) params.set('sellerEmail', String(log.metadata.sellerEmail));
  if (log.metadata?.email) params.set('sellerEmail', String(log.metadata.email));
  if (log.metadata?.riderId) params.set('riderId', String(log.metadata.riderId));
  if (log.metadata?.riderEmail) params.set('riderEmail', String(log.metadata.riderEmail));
  const query = params.toString();
  const withQuery = (path: string) => (query ? `${path}?${query}` : path);

  if (['orders', 'payments'].includes(log.category)) {
    actions.push({
      label: 'Open Orders',
      description: 'Review the related order workflow and payment state.',
      path: withQuery('/admin/dashboard/orders')
    });
  }

  if (log.category === 'sellers') {
    actions.push({
      label: 'Open Sellers',
      description: 'Review seller applications and merchant account status.',
      path: withQuery('/admin/dashboard/sellers')
    });
  }

  if (log.category === 'products') {
    actions.push({
      label: 'Open Products',
      description: 'Review product approvals and seller listings.',
      path: withQuery('/admin/dashboard/products')
    });
  }

  if (log.category === 'riders') {
    actions.push({
      label: 'Open Logistics',
      description: 'Review rider availability and delivery operations.',
      path: withQuery('/admin/dashboard/logistics')
    });
  }

  return actions;
};

const formatSecurityReason = (reason: string) =>
  String(reason || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

const getSecuritySeverity = (latestSecurityEvent?: any, delta: number = 1): 'high' | 'medium' | 'low' => {
  const role = String(latestSecurityEvent?.metadata?.role || '').toUpperCase();
  const reasons = Array.isArray(latestSecurityEvent?.metadata?.reasons)
    ? latestSecurityEvent.metadata.reasons.map((reason: string) => String(reason).toLowerCase())
    : [];

  if (role === 'ADMIN' || reasons.includes('inactive_account') || delta >= 3) {
    return 'high';
  }

  if (reasons.includes('multiple_sessions') || reasons.includes('stale_session') || delta === 2) {
    return 'medium';
  }

  return 'low';
};

const buildSecurityToastMessage = (delta: number, latestSecurityEvent?: any) => {
  const affectedRole = String(latestSecurityEvent?.metadata?.role || '').toLowerCase();
  const roleLabel = affectedRole ? `${affectedRole} account${delta > 1 ? 's' : ''}` : `session${delta > 1 ? 's' : ''}`;
  const reasons = Array.isArray(latestSecurityEvent?.metadata?.reasons)
    ? latestSecurityEvent.metadata.reasons
    : [];
  const primaryReason = reasons.length > 0 ? formatSecurityReason(reasons[0]) : 'Security Review Needed';
  const severity = getSecuritySeverity(latestSecurityEvent, delta).toUpperCase();

  return `[${severity}] ${delta} new suspicious ${roleLabel}. Primary flag: ${primaryReason}.`;
};

const getAuditSeverity = (log: any): 'high' | 'medium' | 'low' | null => {
  if (inferAuditCategory(log) !== 'security') return null;
  return getSecuritySeverity(log, 1);
};

const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<any>(null);
  const [codOrders, setCodOrders] = useState(0);
  const [onlineOrders, setOnlineOrders] = useState(0);
  const [codValue, setCodValue] = useState(0);
  const [onlineValue, setOnlineValue] = useState(0);
  const [failedPayments, setFailedPayments] = useState(0);
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const hasLoadedRef = useRef(false);
  const lastSuspiciousCountRef = useRef(0);
  const lastSecurityEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }

      const [dashboardData, orders] = await Promise.all([
        AdminService.getDashboardStats(),
        AdminService.getOrders()
      ]);

      if (!isMounted) return;

      setDashboard(dashboardData);
      const cod = orders.filter((order) => order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY);
      const online = orders.filter((order) => order.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY);
      setCodOrders(cod.length);
      setOnlineOrders(online.length);
      setCodValue(cod.reduce((sum, order) => sum + order.totalAmount, 0));
      setOnlineValue(online.reduce((sum, order) => sum + order.totalAmount, 0));
      setFailedPayments(
        orders.filter((order) => ['FAILED', 'ABANDONED'].includes(order.paymentStatus)).length
      );

      const suspiciousCount = Number(dashboardData?.stats?.suspiciousSessions || 0);
      const latestSecurityEvent = (dashboardData?.audit || []).find(
        (log: any) => inferAuditCategory(log) === 'security'
      );
      const latestSecurityEventId = latestSecurityEvent?.id || null;

      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        lastSuspiciousCountRef.current = suspiciousCount;
        lastSecurityEventIdRef.current = latestSecurityEventId;
        return;
      }

      const suspiciousCountIncreased = suspiciousCount > lastSuspiciousCountRef.current;
      const hasNewSecurityEvent =
        Boolean(latestSecurityEventId) && latestSecurityEventId !== lastSecurityEventIdRef.current;

      if (suspiciousCountIncreased || hasNewSecurityEvent) {
        const severity = getSecuritySeverity(
          latestSecurityEvent,
          suspiciousCountIncreased ? suspiciousCount - lastSuspiciousCountRef.current : 1
        );
        setToastTone(severity === 'high' ? 'error' : severity === 'medium' ? 'warning' : 'info');
        if (suspiciousCountIncreased) {
          const delta = suspiciousCount - lastSuspiciousCountRef.current;
          setToastMessage(buildSecurityToastMessage(delta, latestSecurityEvent));
        } else if (latestSecurityEvent) {
          const reasons = Array.isArray(latestSecurityEvent?.metadata?.reasons)
            ? latestSecurityEvent.metadata.reasons.map((reason: string) => formatSecurityReason(reason)).join(', ')
            : '';
          const severityLabel = getSecuritySeverity(latestSecurityEvent, 1).toUpperCase();
          setToastMessage(
            reasons
              ? `[${severityLabel}] ${latestSecurityEvent.event}. Flags: ${reasons}.`
              : `[${severityLabel}] ${latestSecurityEvent.event || 'New security activity detected.'}`
          );
        }
      }

      lastSuspiciousCountRef.current = suspiciousCount;
      lastSecurityEventIdRef.current = latestSecurityEventId;
    };

    loadDashboard();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDashboard();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const intervalId = window.setInterval(loadDashboard, 90000);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!toastMessage) return;

    const timeoutId = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  if (!dashboard) return (
    <div className="p-20 flex justify-center">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const { stats, chart, audit } = dashboard;
  const normalizedAudit = (audit || []).map((log: any) => ({
    ...log,
    category: inferAuditCategory(log),
    severity: getAuditSeverity(log)
  }));
  const latestSecurityAudit = normalizedAudit.find((log: any) => log.category === 'security');
  const currentSecuritySeverity =
    stats.suspiciousSessions > 0
      ? getSecuritySeverity(latestSecurityAudit, Number(stats.suspiciousSessions || 1))
      : null;
  const filteredAudit = normalizedAudit.filter((log: any) =>
    auditFilter === 'all' ? true : log.category === auditFilter
  );
  const selectedMetadataEntries = Object.entries(selectedAudit?.metadata || {}).filter(
    ([, value]) => value !== undefined && value !== null && value !== ''
  );
  const selectedAuditActions = selectedAudit ? getAuditJumpActions(selectedAudit) : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminToast
        message={toastMessage}
        tone={toastTone}
        onClick={toastTone !== 'success' ? () => navigate('/admin/dashboard/security') : null}
        actionLabel={toastTone !== 'success' ? 'Open Security Console' : null}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Platform Performance</h1>
          <p className="text-gray-500">Global health and logistics overview for E-Malla Rwanda.</p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-black uppercase tracking-widest">Systems Stable</span>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <StatCard 
          label="Total Revenue" 
          value={`RWF ${stats.totalSales.toLocaleString()}`} 
          trend={stats.revenueGrowth} 
          icon={<DollarSign size={24} />} 
          color="orange"
        />
        <StatCard 
          label="Total Orders" 
          value={stats.totalOrders} 
          trend={stats.salesGrowth} 
          icon={<ShoppingBag size={24} />} 
          color="blue"
        />
        <StatCard 
          label="Platform Users" 
          value={stats.activeUsers} 
          trend={12.5} 
          icon={<Users size={24} />} 
          color="emerald"
        />
        <StatCard 
          label="System Load" 
          value={`${stats.systemLoad}%`} 
          icon={<Activity size={24} />} 
          color="purple"
        />
        <StatCard
          label="COD Orders"
          value={codOrders}
          icon={<Banknote size={24} />}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Area Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black text-gray-900">Revenue & Traffic Trends</h3>
            <div className="flex space-x-4">
               <span className="flex items-center text-xs font-bold text-gray-400"><div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div> Gross Revenue</span>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 600}} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Alerts */}
        <div className="bg-gray-900 p-10 rounded-[40px] shadow-xl text-white">
          <h3 className="text-xl font-black mb-8 flex items-center">
            <ShieldAlert size={24} className="text-orange-500 mr-3" />
            Operational Hub
          </h3>
          <div className="space-y-6">
            <AlertItem count={stats.pendingOrders} label="Orders pending fulfillment" color="orange" />
            <AlertItem count={stats.pendingSellers} label="Merchant applications" color="blue" />
            <AlertItem count={codOrders} label="Cash on delivery orders" color="emerald" />
            <AlertItem count={failedPayments} label="Payment incidents to review" color="red" />
            <AlertItem
              count={stats.suspiciousSessions}
              label="Suspicious sessions detected"
              color="red"
              severity={currentSecuritySeverity}
            />
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard/orders')}
            className="w-full mt-10 py-4 bg-orange-500 hover:bg-orange-600 rounded-2xl font-black text-sm transition-all shadow-lg shadow-orange-500/20"
          >
            View Logistics Center
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Banknote size={22} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Platform COD</span>
          </div>
          <h3 className="text-lg font-black text-gray-900">Cash on Delivery Orders</h3>
          <p className="text-sm text-gray-500 mt-1">Orders that will be settled at doorstep handoff.</p>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-gray-900">{codOrders}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Orders</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-emerald-600">RWF {codValue.toLocaleString()}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Gross Value</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <DollarSign size={22} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Platform Online</span>
          </div>
          <h3 className="text-lg font-black text-gray-900">Online Payment Orders</h3>
          <p className="text-sm text-gray-500 mt-1">Orders cleared through MoMo, Airtel, cards, or bank transfer.</p>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-gray-900">{onlineOrders}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Orders</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-blue-600">RWF {onlineValue.toLocaleString()}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Gross Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Audit Log */}
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h3 className="text-xl font-black text-gray-900 flex items-center">
              <Database size={20} className="mr-3 text-orange-500" />
              Real-time Audit Log
            </h3>
            <div className="flex flex-wrap gap-2">
              {AUDIT_FILTERS.map((filter) => {
                const count = filter.key === 'all'
                  ? normalizedAudit.length
                  : normalizedAudit.filter((log: any) => log.category === filter.key).length;

                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setAuditFilter(filter.key)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${
                      auditFilter === filter.key
                        ? 'bg-gray-900 text-white border-gray-900 shadow-lg'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-orange-200 hover:text-orange-600'
                    }`}
                  >
                    {filter.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Filter operational activity by workflow to review orders, payments, sellers, products, and rider actions faster.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-50">
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Event</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actor</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAudit.map((log: any) => (
                <tr
                  key={log.id}
                  className="group cursor-pointer hover:bg-orange-50/50 transition-colors"
                  onClick={() => setSelectedAudit(log)}
                >
                  <td className="py-5">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-600">
                      {log.category}
                    </span>
                    {log.severity ? (
                      <span className={`ml-2 inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getSeverityClasses(log.severity)}`}>
                        {log.severity}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-5 font-bold text-sm text-gray-900">{log.event}</td>
                  <td className="py-5 text-sm text-gray-500 font-medium">{log.actor}</td>
                  <td className="py-5">
                    {log.status === 'success' ? (
                      <span className="flex items-center text-emerald-600 text-xs font-bold">
                        <CheckCircle size={14} className="mr-1.5" /> Normal
                      </span>
                    ) : log.status === 'info' ? (
                      <span className="flex items-center text-blue-600 text-xs font-bold">
                        <Activity size={14} className="mr-1.5" /> Info
                      </span>
                    ) : (
                      <span className="flex items-center text-red-500 text-xs font-bold">
                        <XCircle size={14} className="mr-1.5" /> Alert
                      </span>
                    )}
                  </td>
                  <td className="py-5 text-[10px] text-gray-400 font-black uppercase tracking-widest text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span>{new Date(log.time).toLocaleString()}</span>
                      <span className="inline-flex items-center text-orange-500">
                        Details <ChevronRight size={14} className="ml-1" />
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAudit.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-gray-500 font-medium">
                    No audit activity found for this filter yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/40 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close audit details"
            className="flex-1 cursor-default"
            onClick={() => setSelectedAudit(null)}
          />
          <div className="w-full max-w-xl h-full bg-white shadow-2xl border-l border-gray-100 overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-8 py-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">
                  Audit Event Details
                </p>
                <h4 className="text-2xl font-black text-gray-900">{selectedAudit.event}</h4>
                <p className="text-sm text-gray-500 mt-2">
                  Reviewed from the admin operational audit stream.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAudit(null)}
                className="w-11 h-11 rounded-2xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-orange-200 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Category</p>
                    <p className="text-sm font-bold text-gray-900">{selectedAudit.category}</p>
                  </div>
                <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Actor</p>
                  <p className="text-sm font-bold text-gray-900">{selectedAudit.actor}</p>
                </div>
                <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Status</p>
                  <p className="text-sm font-bold text-gray-900 uppercase">{selectedAudit.status}</p>
                </div>
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Time</p>
                    <p className="text-sm font-bold text-gray-900">{new Date(selectedAudit.time).toLocaleString()}</p>
                  </div>
                  {selectedAudit.severity ? (
                    <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Severity</p>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getSeverityClasses(selectedAudit.severity)}`}>
                        {selectedAudit.severity}
                      </span>
                    </div>
                  ) : null}
                </div>

              <div>
                <h5 className="text-lg font-black text-gray-900 mb-4">Linked Metadata</h5>
                {selectedMetadataEntries.length > 0 ? (
                  <div className="space-y-3">
                    {selectedMetadataEntries.map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-start justify-between gap-6 rounded-3xl border border-gray-100 px-5 py-4"
                      >
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 min-w-32">
                          {formatMetadataLabel(key)}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 text-right break-all">
                          {String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-gray-200 px-5 py-6 text-sm text-gray-500">
                    No extra metadata is available for this event yet.
                  </div>
                )}
              </div>

              <div>
                <h5 className="text-lg font-black text-gray-900 mb-4">Quick Actions</h5>
                {selectedAuditActions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedAuditActions.map((action) => (
                      <button
                        key={action.path}
                        type="button"
                        onClick={() => {
                          navigate(action.path);
                          setSelectedAudit(null);
                        }}
                        className="w-full rounded-3xl border border-gray-100 px-5 py-4 text-left hover:border-orange-200 hover:bg-orange-50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-black text-gray-900">{action.label}</p>
                            <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                          </div>
                          <ChevronRight size={18} className="text-orange-500 shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-gray-200 px-5 py-6 text-sm text-gray-500">
                    No direct admin destination is available for this event yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
