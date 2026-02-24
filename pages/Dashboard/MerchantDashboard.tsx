
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { 
  Plus, Package, DollarSign, TrendingUp, AlertCircle, RefreshCw, Truck, MapPin, Navigation, ArrowRight, Clock
} from 'lucide-react';
import { MerchantService } from '../../services/merchantService';

const DATA = [
  { name: 'Mon', sales: 400000, orders: 24 },
  { name: 'Tue', sales: 300000, orders: 13 },
  { name: 'Wed', sales: 200000, orders: 98 },
  { name: 'Thu', sales: 278000, orders: 39 },
  { name: 'Fri', sales: 189000, orders: 48 },
  { name: 'Sat', sales: 239000, orders: 38 },
  { name: 'Sun', sales: 349000, orders: 43 },
];

const ACTIVE_DELIVERIES = [
  { 
    id: 'ORD-892', 
    customer: 'Mugisha Jean', 
    status: 'In Transit', 
    rider: 'Eric M.', 
    lastLocation: 'Near Nyabugogo', 
    eta: '12 mins',
    progress: 75
  },
  { 
    id: 'ORD-905', 
    customer: 'Uwase Aline', 
    status: 'Picked Up', 
    rider: 'Paul K.', 
    lastLocation: 'Kicukiro Hub', 
    eta: '45 mins',
    progress: 20
  }
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-5 rounded-[24px] shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
        <div className="mb-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">{label} Performance</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between space-x-12">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>
              <span className="text-xs font-bold text-gray-500">Gross Sales</span>
            </div>
            <span className="text-sm font-black text-gray-900">RWF {payload[0].value.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between space-x-12">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-bold text-gray-500">Total Orders</span>
            </div>
            <span className="text-sm font-black text-gray-900">{payload[0].payload.orders}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const MerchantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    MerchantService.getProducts().then(products => {
      setProductCount(products.length);
    });
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Merchant Dashboard</h1>
          <p className="text-gray-500">Welcome back, Inzira Coffee Ltd.</p>
        </div>
        <button 
          onClick={() => navigate('/seller/products')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center shadow-lg transition-all active:scale-95"
        >
          <Plus className="mr-2" size={20} /> Add New Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><DollarSign size={24} /></div>
            <span className="text-green-500 text-xs font-bold">+12%</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-2xl font-black">RWF 1,245,000</p>
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
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp size={24} /></div>
            <span className="text-red-500 text-xs font-bold">-2%</span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Store Visits</h3>
          <p className="text-2xl font-black">3.2k</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><RefreshCw size={24} /></div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Pending Delivery</h3>
          <p className="text-2xl font-black">8</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-900">Sales Performance</h3>
            <div className="bg-gray-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400">Weekly View</div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                  tickFormatter={(val) => `RWF ${val / 1000}k`}
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#f97316" 
                  strokeWidth={4} 
                  dot={{ fill: '#f97316', r: 6, strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders Activity */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="text-lg font-black mb-6">Recent Activity</h3>
          <div className="space-y-6 flex-grow">
            {[
              { title: 'New Order #892', time: '2 mins ago', amount: '+ RWF 15,000' },
              { title: 'Payment Confirmed', time: '1 hour ago', amount: '+ RWF 45,000' },
              { title: 'Order Dispatched', time: '3 hours ago', amount: 'Order #890' },
              { title: 'New Customer Review', time: '5 hours ago', amount: '⭐⭐⭐⭐⭐' },
              { title: 'Stock Alert: Coffee', time: '1 day ago', amount: 'Low Stock', warning: true },
            ].map((activity, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                <div>
                  <h4 className={`text-sm font-bold ${activity.warning ? 'text-red-500' : 'text-gray-900'}`}>{activity.title}</h4>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
                <span className="text-xs font-bold text-gray-600">{activity.amount}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 text-orange-600 font-bold border border-orange-200 rounded-xl hover:bg-orange-50 transition-colors">
            View All Activity
          </button>
        </div>
      </div>

      {/* Live Logistics Monitoring Section */}
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
            {ACTIVE_DELIVERIES.map((delivery) => (
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
                      <h4 className="text-white font-black">{delivery.id}</h4>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{delivery.customer}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                      {delivery.status}
                    </span>
                    <p className="text-emerald-400 text-[10px] font-black mt-2">ETA: {delivery.eta}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center text-gray-400">
                      <MapPin size={12} className="mr-1.5 text-orange-500" />
                      <span>Last Ping: <span className="text-white ml-1">{delivery.lastLocation}</span></span>
                    </div>
                    <span className="text-gray-400">Courier: <span className="text-white ml-1">{delivery.rider}</span></span>
                  </div>
                  
                  <div className="relative">
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000 group-hover/card:brightness-125" 
                        style={{ width: `${delivery.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center space-x-2 text-gray-500 text-[10px] font-black uppercase">
                      <Clock size={12} />
                      <span>Updated 2m ago</span>
                    </div>
                    <div className="text-orange-500 flex items-center text-[10px] font-black uppercase group-hover/card:underline">
                      View Map <Navigation size={10} className="ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantDashboard;
