import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  Navigation,
  Package,
  Plus,
  RefreshCw,
  Truck
} from 'lucide-react';
import { MerchantService } from '../../services/merchantService';
import { Order, OrderStatus, PaymentMethod } from '../../types';

const ACTIVE_STATUSES = [
  OrderStatus.ASSIGNED,
  OrderStatus.PICKED_UP,
  OrderStatus.ON_THE_WAY,
  OrderStatus.OUT_FOR_DELIVERY
];

const FULFILLMENT_STATUSES = [
  OrderStatus.PAID,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.PROCESSING,
  OrderStatus.READY_FOR_PICKUP,
  ...ACTIVE_STATUSES
];

const CLOSED_STATUSES = [
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
  OrderStatus.REJECTED,
  OrderStatus.REFUNDED
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white p-5 rounded-[24px] shadow-2xl border border-gray-100">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4">{label} Performance</p>
      <div className="space-y-3">
        <div className="flex items-center justify-between space-x-12">
          <span className="text-xs font-bold text-gray-500">Net Sales</span>
          <span className="text-sm font-black text-gray-900">RWF {payload[0].value.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between space-x-12">
          <span className="text-xs font-bold text-gray-500">Orders</span>
          <span className="text-sm font-black text-gray-900">{payload[0].payload.orders}</span>
        </div>
      </div>
    </div>
  );
};

const MerchantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [productCount, setProductCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    businessName: string;
    balance: number;
    totalSales: number;
    commissionRate: number;
    grossSales: number;
    commissionAmount: number;
    supportEmail?: string;
    logoUrl?: string;
    coverUrl?: string;
  } | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const [products, merchantOrders, merchantProfile] = await Promise.all([
          MerchantService.getProducts(),
          MerchantService.getOrders(),
          MerchantService.getProfile()
        ]);

        setProductCount(products.length);
        setLowStockCount(products.filter((product) => Number(product.stock || 0) <= 5).length);
        setOrders(merchantOrders);
        setProfile({
          businessName: merchantProfile.businessName,
          balance: merchantProfile.balance,
          totalSales: merchantProfile.totalSales || 0,
          commissionRate: merchantProfile.commissionRate || 0,
          grossSales: merchantProfile.grossSales || merchantProfile.totalSales || 0,
          commissionAmount: merchantProfile.commissionAmount || 0,
          supportEmail: merchantProfile.supportEmail || '',
          logoUrl: merchantProfile.logoUrl || '',
          coverUrl: merchantProfile.coverUrl || ''
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load seller dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const chartData = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const buckets = labels.map((name) => ({ name, sales: 0, orders: 0 }));

    orders.filter((order) => order.paymentStatus === 'SUCCESS').forEach((order) => {
      const dayIndex = (new Date(order.createdAt).getDay() + 6) % 7;
      buckets[dayIndex].orders += 1;
      buckets[dayIndex].sales += Math.max(order.totalAmount - order.deliveryFee, 0);
    });

    return buckets;
  }, [orders]);

  const activeDeliveries = useMemo(
    () => orders.filter((order) => ACTIVE_STATUSES.includes(order.status)).slice(0, 2),
    [orders]
  );

  const stats = useMemo(() => {
    const activeOrders = orders.filter((order) => !CLOSED_STATUSES.includes(order.status));
    const codOrders = activeOrders.filter((order) => order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY);
    const onlineOrders = orders.filter(
      (order) => order.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY && order.paymentStatus === 'SUCCESS'
    );
    const pendingRevenueOrders = orders.filter((order) =>
      !CLOSED_STATUSES.includes(order.status) && order.paymentStatus !== 'SUCCESS'
    );
    const expectedRevenue = pendingRevenueOrders.reduce(
      (sum, order) => sum + Math.max(order.totalAmount - order.deliveryFee, 0),
      0
    );

    return {
      revenue: profile?.totalSales || 0,
      grossSales: profile?.grossSales || 0,
      commissionAmount: profile?.commissionAmount || 0,
      expectedRevenue,
      pendingDelivery: orders.filter((order) => FULFILLMENT_STATUSES.includes(order.status)).length,
      codOrders: codOrders.length,
      codValue: codOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      onlineOrders: onlineOrders.length,
      onlineValue: onlineOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      storeVisits: orders.length,
      revenueGrowth: orders.filter((order) => order.paymentStatus === 'SUCCESS').length
    };
  }, [orders, profile]);

  const urgentActions = useMemo(() => [
    {
      label: 'Orders to accept',
      value: orders.filter((order) => [OrderStatus.PAID, OrderStatus.CONFIRMED].includes(order.status)).length,
      detail: 'Start preparing confirmed orders',
      icon: Package,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      label: 'In preparation',
      value: orders.filter((order) => [OrderStatus.PREPARING, OrderStatus.PROCESSING].includes(order.status)).length,
      detail: 'Complete packing for rider pickup',
      icon: Clock,
      color: 'text-orange-600 bg-orange-50'
    },
    {
      label: 'Ready for pickup',
      value: orders.filter((order) => order.status === OrderStatus.READY_FOR_PICKUP).length,
      detail: 'Waiting for an available rider',
      icon: Truck,
      color: 'text-emerald-600 bg-emerald-50'
    },
    {
      label: 'Low stock products',
      value: lowStockCount,
      detail: 'Restock products with 5 or fewer units',
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50'
    }
  ], [lowStockCount, orders]);

  const recentActivity = useMemo(() => {
    return orders
      .slice()
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
      .slice(0, 5)
      .map((order) => ({
        id: order.id,
        title: `${order.orderNumber} ${String(order.status).replace(/_/g, ' ')}`,
        time: new Date(order.updatedAt).toLocaleString(),
        amount: `RWF ${Math.max(order.totalAmount - order.deliveryFee, 0).toLocaleString()}`
      }));
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 text-center shadow-sm">
        <h2 className="text-xl font-black text-gray-900">Seller dashboard unavailable</h2>
        <p className="text-sm text-gray-500 mt-2">{error || 'We could not load seller dashboard right now.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-[40px] border border-gray-100 bg-white shadow-sm">
        {profile.coverUrl ? (
          <img src={profile.coverUrl} alt={`${profile.businessName} cover`} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className={`absolute inset-0 ${profile.coverUrl ? 'bg-slate-950/55' : 'bg-gradient-to-r from-slate-900 via-slate-800 to-orange-600'}`}></div>
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:justify-between md:items-center p-8 md:p-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-[28px] bg-white shadow-xl overflow-hidden flex items-center justify-center border border-white/80">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt={`${profile.businessName} logo`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-black text-orange-600">{profile.businessName.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-200">Seller Workspace</p>
              <h1 className="text-3xl md:text-4xl font-black text-white mt-2">Welcome back, {profile.businessName}.</h1>
              <p className="text-sm text-white/80 mt-2">
                Live overview of products, orders, payouts, and delivery operations.
                {profile.supportEmail ? ` Support contact: ${profile.supportEmail}` : ''}
              </p>
            </div>
          </div>
          <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/seller/orders')}
              className="w-full sm:w-auto bg-white/12 hover:bg-white/20 text-white border border-white/15 px-5 py-3 rounded-2xl font-black text-sm transition-all"
            >
              View Orders
            </button>
            <button
              onClick={() => navigate('/seller/products')}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center justify-center shadow-lg transition-all active:scale-95"
            >
              <Plus className="mr-2" size={20} /> Add New Product
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><DollarSign size={24} /></div>
            <span className="text-green-500 text-xs font-bold">Live</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Net Revenue</h3>
          <p className="text-2xl font-black">RWF {stats.revenue.toLocaleString()}</p>
          <p className="mt-2 text-xs font-bold text-gray-400">Confirmed payments after commission</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Package size={24} /></div>
            <span className="text-green-500 text-xs font-bold">Live</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
          <p className="text-2xl font-black">{productCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><RefreshCw size={24} /></div>
            <span className="text-gray-500 text-xs font-bold">{profile.commissionRate.toFixed(1)}%</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Available Balance</h3>
          <p className="text-2xl font-black">RWF {profile.balance.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><Truck size={24} /></div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Pending Delivery</h3>
          <p className="text-2xl font-black">{stats.pendingDelivery}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Banknote size={24} /></div>
            <span className="text-orange-500 text-xs font-bold">COD</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Active COD Orders</h3>
          <p className="text-2xl font-black">{stats.codOrders}</p>
        </div>
      </div>

      <div className="rounded-[32px] border border-orange-100 bg-orange-50/60 p-6 md:p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-600">Expected Revenue</p>
            <h2 className="mt-2 text-3xl font-black text-gray-950">RWF {stats.expectedRevenue.toLocaleString()}</h2>
            <p className="mt-1 text-sm font-medium text-gray-600">Value awaiting payment confirmation or successful COD delivery.</p>
          </div>
          <button onClick={() => navigate('/seller/orders')} className="rounded-2xl bg-gray-950 px-6 py-4 text-xs font-black uppercase tracking-widest text-white">
            Review Pending Orders
          </button>
        </div>
      </div>

      <div>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">Action Center</p>
            <h2 className="mt-2 text-2xl font-black text-gray-950">Needs your attention</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {urgentActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <button key={action.label} onClick={() => navigate(action.label === 'Low stock products' ? '/seller/products' : '/seller/orders')} className="rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${action.color}`}><ActionIcon size={20} /></div>
                <p className="mt-5 text-3xl font-black text-gray-950">{action.value}</p>
                <p className="mt-1 text-sm font-black text-gray-800">{action.label}</p>
                <p className="mt-2 text-xs font-medium leading-5 text-gray-500">{action.detail}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Gross Sales</h3>
          <p className="text-2xl font-black mt-2">RWF {stats.grossSales.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Commission Deducted</h3>
          <p className="text-2xl font-black mt-2">RWF {stats.commissionAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Effective Commission</h3>
          <p className="text-2xl font-black mt-2">{profile.commissionRate.toFixed(1)}%</p>
          <p className="mt-2 text-xs font-bold text-gray-400">Weighted rate on successfully paid sales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-900">Sales Performance</h3>
            <div className="bg-gray-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400">Weekly View</div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} tickFormatter={(val) => `RWF ${val / 1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Line type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={4} dot={{ fill: '#f97316', r: 6, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="text-lg font-black mb-6">Recent Activity</h3>
          <div className="space-y-6 flex-grow">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{activity.title}</h4>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
                <span className="text-xs font-bold text-gray-600">{activity.amount}</span>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-sm text-gray-400 font-medium">No store activity yet for this seller account.</div>
            )}
          </div>
          <button
            onClick={() => navigate('/seller/orders')}
            className="w-full mt-8 py-3 text-orange-600 font-bold border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors"
          >
            View All Activity
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Banknote size={22} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">COD Mix</span>
          </div>
          <h3 className="text-lg font-black text-gray-900">Cash on Delivery</h3>
          <p className="text-sm text-gray-500 mt-1">Active orders waiting for cash collection or fulfillment.</p>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-gray-900">{stats.codOrders}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Orders</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-emerald-600">RWF {stats.codValue.toLocaleString()}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Gross Value</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <DollarSign size={22} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Online Mix</span>
          </div>
          <h3 className="text-lg font-black text-gray-900">Online Payments</h3>
          <p className="text-sm text-gray-500 mt-1">Orders completed through MoMo, Airtel, cards, or transfer.</p>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-gray-900">{stats.onlineOrders}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Orders</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-blue-600">RWF {stats.onlineValue.toLocaleString()}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Gross Value</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-[120px] opacity-10 -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-orange-500 text-white rounded-2xl shadow-xl shadow-orange-500/20">
                <Navigation size={28} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Live Logistics Monitoring</h2>
                <p className="text-gray-400 text-sm">Real-time movement tracking for your outgoing shipments.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/seller/orders')}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center group"
            >
              Dispatch Center <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {activeDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                onClick={() => navigate(`/seller/orders/${delivery.id}/track`)}
                className="bg-white/5 border border-white/10 rounded-[32px] p-8 hover:bg-white/[0.08] transition-all cursor-pointer group/card"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-orange-500">
                      <Truck size={24} />
                    </div>
                    <div>
                      <h4 className="text-white font-black">{delivery.orderNumber}</h4>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{delivery.customerName}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                      {String(delivery.status).replace(/_/g, ' ')}
                    </span>
                    <p className="text-emerald-400 text-[10px] font-black mt-2">{delivery.riderName || 'Rider being assigned'}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <div className="text-gray-400">
                      Delivery to: <span className="text-white ml-1">{delivery.address}</span>
                    </div>
                    <span className="text-gray-400">Updated <span className="text-white ml-1">{new Date(delivery.updatedAt).toLocaleTimeString()}</span></span>
                  </div>

                  <div className="relative">
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000"
                        style={{ width: `${delivery.status === OrderStatus.ASSIGNED ? 25 : delivery.status === OrderStatus.PICKED_UP ? 55 : delivery.status === OrderStatus.ON_THE_WAY ? 80 : 95}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center space-x-2 text-gray-500 text-[10px] font-black uppercase">
                      <Clock size={12} />
                      <span>{delivery.phone}</span>
                    </div>
                    <div className="text-orange-500 flex items-center text-[10px] font-black uppercase group-hover/card:underline">
                      Track Order <Navigation size={10} className="ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {activeDeliveries.length === 0 && (
              <div className="bg-white/5 border border-white/10 rounded-[32px] p-10 text-center text-white/80">
                <CheckCircle2 size={36} className="mx-auto mb-4 text-emerald-400" />
                <h4 className="font-black text-xl text-white">No active deliveries yet</h4>
                <p className="text-sm text-gray-400 mt-2">This seller account will show only its own delivery operations here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantDashboard;
