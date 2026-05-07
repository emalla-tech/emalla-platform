import React, { useEffect, useState } from 'react';
import { Mail, Search, ShoppingBag, UserCircle2, Wallet } from 'lucide-react';
import { AdminService } from '../../services/adminService';

type AdminCustomer = {
  id: string;
  name: string;
  username?: string;
  email: string;
  status: string;
  createdAt: string;
  totalOrders: number;
  completedOrders: number;
  lifetimeSpend: number;
  lastOrderAt: string | null;
};

const FILTERS = ['all', 'active', 'suspended'] as const;

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await AdminService.getUsers(filter);
        setCustomers(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filter]);

  const filteredCustomers = customers.filter((customer) => {
    const keyword = query.toLowerCase().trim();
    if (!keyword) return true;
    return (
      customer.name.toLowerCase().includes(keyword) ||
      customer.email.toLowerCase().includes(keyword) ||
      String(customer.username || '').toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Customer Directory</h1>
          <p className="text-gray-500">Review buyer accounts, ordering behavior, and account activity across the marketplace.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === item ? 'bg-black text-white' : 'bg-white text-gray-500 border border-gray-100'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 font-bold outline-none"
            placeholder="Search by customer name, email, or username..."
          />
        </div>
      </div>

      {loading ? (
        <div className="p-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white border border-gray-100 rounded-[30px] p-6 shadow-sm">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-black text-gray-900">{customer.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      customer.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {customer.status}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 font-bold">
                    <Mail size={16} className="mr-2 text-gray-400" />
                    {customer.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 font-bold">
                    <UserCircle2 size={16} className="mr-2 text-gray-400" />
                    Username: {customer.username || 'N/A'}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Joined: {new Date(customer.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xl:min-w-[520px]">
                  <div className="rounded-2xl bg-gray-50 px-4 py-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <ShoppingBag size={14} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Total Orders</p>
                    </div>
                    <p className="text-xl font-black text-gray-900">{customer.totalOrders}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <ShoppingBag size={14} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Completed</p>
                    </div>
                    <p className="text-xl font-black text-gray-900">{customer.completedOrders}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 px-4 py-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Wallet size={14} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Lifetime Spend</p>
                    </div>
                    <p className="text-xl font-black text-gray-900">RWF {customer.lifetimeSpend.toLocaleString()}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">
                      Last Order: {customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString() : 'No orders'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="text-center py-20 bg-white border border-gray-100 rounded-[30px]">
              <p className="text-gray-500 font-bold">No customers found for this filter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
