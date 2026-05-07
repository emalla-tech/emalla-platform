import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Search, Send, AlertCircle, Clock, CheckCircle2, Eye } from 'lucide-react';
import { AdminService } from '../../services/adminService';

const statusTone = {
  sent: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  logged: 'bg-blue-50 text-blue-600 border-blue-100',
  queued: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  failed: 'bg-red-50 text-red-500 border-red-100',
  skipped: 'bg-gray-50 text-gray-500 border-gray-100'
} as const;

const EmailLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [emailStatus, setEmailStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'logged' | 'queued' | 'failed' | 'skipped'>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [emailLogs, status] = await Promise.all([
          AdminService.getEmailLogs(statusFilter),
          AdminService.getEmailStatus()
        ]);
        setLogs(emailLogs);
        setEmailStatus(status);
        setSelected((current) => emailLogs.find((entry: any) => entry.id === current?.id) || emailLogs[0] || null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [statusFilter]);

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return logs;

    return logs.filter((entry) =>
      [entry.subject, entry.template, entry.provider, entry.to, entry.error, entry.note]
        .flat()
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [logs, query]);

  const counts = useMemo(() => {
    return logs.reduce(
      (acc, entry) => {
        const key = String(entry.status || 'logged').toLowerCase();
        acc[key] = (acc[key] || 0) + 1;
        acc.all += 1;
        return acc;
      },
      { all: 0, sent: 0, logged: 0, queued: 0, failed: 0, skipped: 0 } as Record<string, number>
    );
  }, [logs]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Email Delivery Desk</h1>
          <p className="text-gray-500">Monitor application emails, finance notifications, and support updates from one place.</p>
        </div>
        <div className="flex items-center gap-3">
          {emailStatus ? (
            <div className={`rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-widest ${
              emailStatus.liveDeliveryReady
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              {emailStatus.liveDeliveryReady ? 'Live Email Ready' : 'Log Mode / Setup Needed'}
            </div>
          ) : null}
          <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500">
            Total Emails: {counts.all}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by subject, recipient, template, or provider..."
                className="w-full rounded-2xl bg-gray-50 border border-gray-100 pl-11 pr-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'sent', 'logged', 'queued', 'failed', 'skipped'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    statusFilter === status ? 'bg-orange-500 text-white' : 'bg-gray-50 border border-gray-100 text-gray-500'
                  }`}
                >
                  {status} ({counts[status] || 0})
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-20 flex justify-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-16 text-center">
                <Mail size={44} className="mx-auto text-gray-200 mb-4" />
                <p className="text-sm font-bold text-gray-500">No email logs match the current filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredLogs.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelected(entry)}
                    className={`w-full text-left px-6 py-5 transition-all hover:bg-gray-50 ${selected?.id === entry.id ? 'bg-orange-50/60' : ''}`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-black text-gray-900 truncate">{entry.subject}</p>
                          <span className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${statusTone[String(entry.status || 'logged') as keyof typeof statusTone] || statusTone.logged}`}>
                            {entry.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 truncate">
                          To: {Array.isArray(entry.to) ? entry.to.join(', ') : entry.to}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">
                          {entry.template || 'general_email'} | {entry.provider || 'log'} | {new Date(entry.sentAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Eye size={16} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {emailStatus ? (
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
              <h2 className="text-xl font-black text-gray-900">Email Provider Status</h2>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Provider</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{emailStatus.provider}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sender</p>
                  <p className="text-sm font-bold text-gray-900 mt-1 break-all">{emailStatus.fromName} &lt;{emailStatus.fromEmail}&gt;</p>
                </div>
                {emailStatus.issues?.length ? (
                  <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Setup Notes</p>
                    <ul className="mt-2 space-y-1 text-xs font-semibold text-amber-800">
                      {emailStatus.issues.map((issue: string) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
            <h2 className="text-xl font-black text-gray-900">Delivery Summary</h2>
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-4 flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-700">Delivered</span>
                <span className="text-lg font-black text-gray-900">{counts.sent}</span>
              </div>
              <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-4 flex items-center justify-between">
                <span className="text-sm font-bold text-blue-700">Logged Only</span>
                <span className="text-lg font-black text-gray-900">{counts.logged}</span>
              </div>
              <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-4 flex items-center justify-between">
                <span className="text-sm font-bold text-red-600">Failed</span>
                <span className="text-lg font-black text-gray-900">{counts.failed}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
            <h2 className="text-xl font-black text-gray-900">Email Preview</h2>
            {selected ? (
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Send size={18} className="text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recipient</p>
                    <p className="text-sm font-bold text-gray-900 mt-1 break-all">{Array.isArray(selected.to) ? selected.to.join(', ') : selected.to}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Template / Provider</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{selected.template || 'general_email'} | {selected.provider || 'log'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  {selected.status === 'failed' ? <AlertCircle size={18} className="text-red-500 mt-0.5" /> : <CheckCircle2 size={18} className="text-emerald-500 mt-0.5" />}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery State</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{selected.status}</p>
                    {selected.error ? <p className="text-xs text-red-500 mt-1">{selected.error}</p> : null}
                    {selected.note ? <p className="text-xs text-gray-500 mt-1">{selected.note}</p> : null}
                  </div>
                </div>
                <div className="rounded-[28px] bg-gray-50 border border-gray-100 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Body Preview</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-7">{selected.body || 'No plain-text body recorded.'}</p>
                </div>
              </div>
            ) : (
              <div className="mt-6 text-sm text-gray-500">Select an email log to preview details.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailLogsPage;
