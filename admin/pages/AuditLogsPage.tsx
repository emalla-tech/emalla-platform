import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, Database, ShieldAlert, XCircle } from 'lucide-react';
import { AdminService } from '../../services/adminService';

const FILTERS = ['all', 'orders', 'payments', 'sellers', 'products', 'riders'] as const;

const inferAuditCategory = (log: any) => {
  if (log.category) return String(log.category).toLowerCase();
  const content = `${log.event || ''} ${log.actor || ''}`.toLowerCase();
  if (content.includes('payment') || content.includes('cash on delivery')) return 'payments';
  if (content.includes('seller') || content.includes('merchant')) return 'sellers';
  if (content.includes('product')) return 'products';
  if (content.includes('rider') || content.includes('delivery')) return 'riders';
  if (content.includes('order')) return 'orders';
  return 'system';
};

const AuditLogsPage: React.FC = () => {
  const [audit, setAudit] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const dashboard = await AdminService.getDashboardStats();
        setAudit(dashboard.audit || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const normalizedAudit = useMemo(
    () => audit.map((log) => ({ ...log, category: inferAuditCategory(log) })),
    [audit]
  );
  const filteredAudit = normalizedAudit.filter((log) => filter === 'all' || log.category === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Audit Logs</h1>
          <p className="text-gray-500">Review platform actions, approvals, payments, and logistics events in one timeline.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item}
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

      {loading ? (
        <div className="p-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
            <Database size={20} className="text-orange-500" />
            <div>
              <h2 className="text-xl font-black text-gray-900">Operational Event Stream</h2>
              <p className="text-sm text-gray-500 mt-1">Latest backend-backed events across the platform.</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {filteredAudit.map((log) => (
              <div key={log.id} className="px-8 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-600">
                      {log.category}
                    </span>
                    <p className="text-sm font-black text-gray-900">{log.event}</p>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">{log.actor}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    {log.status === 'success' ? (
                      <span className="flex items-center text-emerald-600 text-xs font-bold">
                        <CheckCircle2 size={14} className="mr-1.5" /> Normal
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
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {new Date(log.time).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {filteredAudit.length === 0 && (
              <div className="px-8 py-16 text-center">
                <ShieldAlert size={36} className="mx-auto text-gray-200 mb-4" />
                <p className="text-sm font-bold text-gray-500">No audit records found for this filter.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
