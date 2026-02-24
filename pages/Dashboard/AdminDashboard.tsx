
import React from 'react';
import { 
  Users, 
  ShieldAlert, 
  Activity, 
  Database, 
  CheckCircle, 
  XCircle, 
  ChevronRight,
  TrendingUp,
  Globe
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const GROWTH_DATA = [
  { name: 'Jan', users: 4000, merchants: 400 },
  { name: 'Feb', users: 5200, merchants: 450 },
  { name: 'Mar', users: 7800, merchants: 600 },
  { name: 'Apr', users: 12000, merchants: 850 },
  { name: 'May', users: 18500, merchants: 1200 },
];

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Admin Console</h1>
          <p className="text-gray-500 font-medium">System overview and global platform management.</p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-black uppercase tracking-widest">Systems Online</span>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl"><Users size={24} /></div>
            <span className="text-emerald-500 text-xs font-black">+24%</span>
          </div>
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest">Total Users</h3>
          <p className="text-3xl font-black text-gray-900 mt-1">54,230</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><Activity size={24} /></div>
            <span className="text-emerald-500 text-xs font-black">Stable</span>
          </div>
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest">Active Sessions</h3>
          <p className="text-3xl font-black text-gray-900 mt-1">1,402</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><ShieldAlert size={24} /></div>
            <span className="text-red-500 text-xs font-black">2 Alerts</span>
          </div>
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest">Security Flags</h3>
          <p className="text-3xl font-black text-gray-900 mt-1">12</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><Database size={24} /></div>
            <span className="text-emerald-500 text-xs font-black">82%</span>
          </div>
          <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest">Storage Used</h3>
          <p className="text-3xl font-black text-gray-900 mt-1">1.2 TB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black text-gray-900">Platform Growth</h3>
            <div className="flex space-x-2">
              <span className="flex items-center text-xs font-bold text-gray-400"><div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div> Users</span>
              <span className="flex items-center text-xs font-bold text-gray-400"><div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div> Merchants</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={GROWTH_DATA}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="users" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Merchant Verifications */}
        <div className="bg-gray-900 p-10 rounded-[40px] shadow-xl text-white">
          <h3 className="text-xl font-black mb-8 flex items-center">
            <TrendingUp className="mr-3 text-orange-500" size={24} />
            Pending Verification
          </h3>
          <div className="space-y-6">
            {[
              { name: 'Kigali Tech Hub', location: 'Gasabo', date: '2h ago' },
              { name: 'Inyange Fashion', location: 'Rubavu', date: '5h ago' },
              { name: 'Nyabugogo Spices', location: 'Nyarugenge', date: '1d ago' },
              { name: 'Huye Handcrafts', location: 'Huye', date: '2d ago' }
            ].map((merchant, i) => (
              <div key={i} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center font-bold text-orange-500">
                    {merchant.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{merchant.name}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{merchant.location}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-700 group-hover:text-orange-500 transition-colors" />
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-4 bg-orange-500 hover:bg-orange-600 rounded-2xl font-black text-sm transition-all shadow-lg shadow-orange-500/20">
            Review All Requests
          </button>
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
        <h3 className="text-xl font-black text-gray-900 mb-8">System Audit Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-50">
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Event</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { event: 'Bulk Product Upload', user: 'Admin (System)', status: 'success', time: '10:42 AM' },
                { event: 'Database Backup', user: 'Automated Task', status: 'success', time: '04:00 AM' },
                { event: 'Failed Login Attempt', user: 'Unknown IP (192.168.1.1)', status: 'error', time: 'Yesterday' },
                { event: 'Merchant Verified', user: 'Mugisha Eric (SuperAdmin)', status: 'success', time: 'Yesterday' }
              ].map((log, i) => (
                <tr key={i} className="group">
                  <td className="py-5 font-bold text-sm text-gray-900">{log.event}</td>
                  <td className="py-5 text-sm text-gray-500 font-medium">{log.user}</td>
                  <td className="py-5">
                    {log.status === 'success' ? (
                      <span className="flex items-center text-emerald-600 text-xs font-bold">
                        <CheckCircle size={14} className="mr-1.5" /> Success
                      </span>
                    ) : (
                      <span className="flex items-center text-red-500 text-xs font-bold">
                        <XCircle size={14} className="mr-1.5" /> Alert
                      </span>
                    )}
                  </td>
                  <td className="py-5 text-xs text-gray-400 font-black uppercase tracking-widest">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
