
import React, { useEffect, useState } from 'react';
import { 
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
  XCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { AdminService } from '../../services/adminService';

const DATA_CHART = [
  { name: 'Jan', revenue: 4000, users: 400 },
  { name: 'Feb', revenue: 5200, users: 450 },
  { name: 'Mar', revenue: 7800, users: 600 },
  { name: 'Apr', revenue: 12000, users: 850 },
  { name: 'May', revenue: 18500, users: 1200 },
];

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

const AlertItem = ({ count, label, color }: any) => (
  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer">
    <div className="flex items-center space-x-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm bg-white/10 ${color === 'orange' ? 'text-orange-400' : color === 'blue' ? 'text-blue-400' : color === 'red' ? 'text-red-400' : 'text-emerald-400'}`}>
        {count}
      </div>
      <p className="text-sm font-medium text-gray-300">{label}</p>
    </div>
    <ChevronRight size={16} className="text-gray-700" />
  </div>
);

const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    AdminService.getDashboardStats().then(setStats);
  }, []);

  if (!stats) return (
    <div className="p-20 flex justify-center">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          value="82%" 
          icon={<Activity size={24} />} 
          color="purple"
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
              <AreaChart data={DATA_CHART}>
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
            <AlertItem count={stats.pendingOrders} label="Orders pending pickup" color="orange" />
            <AlertItem count={stats.pendingSellers} label="Merchant applications" color="blue" />
            <AlertItem count={4} label="System database backups" color="emerald" />
            <AlertItem count={2} label="Security firewall alerts" color="red" />
          </div>
          <button className="w-full mt-10 py-4 bg-orange-500 hover:bg-orange-600 rounded-2xl font-black text-sm transition-all shadow-lg shadow-orange-500/20">
            View Logistics Center
          </button>
        </div>
      </div>

      {/* System Audit Log */}
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
        <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center">
          <Database size={20} className="mr-3 text-orange-500" />
          Real-time Audit Log
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-50">
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Event</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actor</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { event: 'Bulk Inventory Sync', user: 'Merchant Hub (API)', status: 'success', time: '10:42 AM' },
                { event: 'Database Snapshot', user: 'Automated Task', status: 'success', time: '09:00 AM' },
                { event: 'Failed Payout Request', user: 'Merchant MCH-05', status: 'error', time: '08:15 AM' },
                { event: 'New Seller Approved', user: 'Admin Eric', status: 'success', time: 'Yesterday' }
              ].map((log, i) => (
                <tr key={i} className="group">
                  <td className="py-5 font-bold text-sm text-gray-900">{log.event}</td>
                  <td className="py-5 text-sm text-gray-500 font-medium">{log.user}</td>
                  <td className="py-5">
                    {log.status === 'success' ? (
                      <span className="flex items-center text-emerald-600 text-xs font-bold">
                        <CheckCircle size={14} className="mr-1.5" /> Normal
                      </span>
                    ) : (
                      <span className="flex items-center text-red-500 text-xs font-bold">
                        <XCircle size={14} className="mr-1.5" /> Alert
                      </span>
                    )}
                  </td>
                  <td className="py-5 text-[10px] text-gray-400 font-black uppercase tracking-widest text-right">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
