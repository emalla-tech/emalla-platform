import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Cloud, Database, HardDrive, Mail, RefreshCw, Server } from 'lucide-react';
import { AdminService } from '../../services/adminService';

type MonitoringData = {
  status: 'healthy' | 'attention';
  checkedAt: string;
  services: {
    database: { provider?: string; mode?: string; ready?: boolean; configured?: boolean };
    email: { provider?: string; liveDeliveryReady?: boolean; issues?: string[] };
    storage: { provider?: string; liveReady?: boolean };
  };
  runtime: {
    nodeEnv: string;
    uptimeSeconds: number;
    memoryUsedMb: number;
    memoryLimitObservedMb: number;
  };
  metrics: {
    errorsLast24Hours: number;
    frontendErrorsLast24Hours: number;
    serverErrorsLast24Hours: number;
  };
  recentErrors: Array<{
    id: string;
    event: string;
    actor: string;
    time: string;
    metadata?: Record<string, unknown>;
  }>;
};

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;
};

const Monitoring: React.FC = () => {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      setData(await AdminService.getMonitoring());
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Monitoring data is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(true);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <RefreshCw className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  const serviceCards = data
    ? [
        {
          label: 'Database',
          value: data.services.database.mode || data.services.database.provider || 'Unknown',
          ready: Boolean(data.services.database.ready && data.services.database.configured !== false),
          icon: <Database size={22} />
        },
        {
          label: 'Email',
          value: data.services.email.provider || 'Unknown',
          ready: Boolean(data.services.email.liveDeliveryReady),
          icon: <Mail size={22} />
        },
        {
          label: 'Storage',
          value: data.services.storage.provider || 'Unknown',
          ready: Boolean(data.services.storage.liveReady),
          icon: <Cloud size={22} />
        },
        {
          label: 'Backend',
          value: data.runtime.nodeEnv,
          ready: true,
          icon: <Server size={22} />
        }
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Production Observability</p>
          <h1 className="mt-2 text-3xl font-black text-gray-900">System Monitoring</h1>
          <p className="mt-2 text-sm font-medium text-gray-500">Service health, runtime performance, and captured application failures.</p>
        </div>
        <button
          onClick={() => void load(true)}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-orange-600"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Status
        </button>
      </div>

      {message && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">{message}</div>
      )}

      {data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {serviceCards.map((service) => (
              <article key={service.label} className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className={service.ready ? 'text-emerald-500' : 'text-red-500'}>{service.icon}</div>
                  <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${service.ready ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {service.ready ? 'Operational' : 'Attention'}
                  </span>
                </div>
                <p className="mt-8 text-xs font-black uppercase tracking-widest text-gray-400">{service.label}</p>
                <p className="mt-2 text-xl font-black capitalize text-gray-900">{service.value}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Errors / 24h', value: data.metrics.errorsLast24Hours, icon: <AlertTriangle size={20} />, tone: 'text-red-500' },
              { label: 'Frontend Errors', value: data.metrics.frontendErrorsLast24Hours, icon: <Activity size={20} />, tone: 'text-orange-500' },
              { label: 'Server Errors', value: data.metrics.serverErrorsLast24Hours, icon: <Server size={20} />, tone: 'text-blue-500' },
              { label: 'Backend Uptime', value: formatUptime(data.runtime.uptimeSeconds), icon: <HardDrive size={20} />, tone: 'text-emerald-500' }
            ].map((metric) => (
              <article key={metric.label} className="rounded-3xl bg-gray-900 p-6 text-white shadow-xl shadow-gray-200">
                <div className={metric.tone}>{metric.icon}</div>
                <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-gray-400">{metric.label}</p>
                <p className="mt-2 text-3xl font-black">{metric.value}</p>
              </article>
            ))}
          </section>

          <section className="overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
              <div>
                <h2 className="text-xl font-black text-gray-900">Recent Captured Errors</h2>
                <p className="mt-1 text-sm font-medium text-gray-500">Reports are sanitized and correlated with request IDs where available.</p>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Checked {new Date(data.checkedAt).toLocaleString()}
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {data.recentErrors.map((error) => (
                <article key={error.id} className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_auto] md:px-8">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <AlertTriangle size={16} className="text-red-500" />
                      <p className="text-sm font-black text-gray-900">{error.event}</p>
                    </div>
                    <p className="mt-2 text-xs font-bold text-gray-400">{error.actor}</p>
                    {error.metadata?.route && (
                      <p className="mt-2 font-mono text-[11px] text-gray-500">
                        {String(error.metadata.route)} {error.metadata.requestId ? `· ${String(error.metadata.requestId)}` : ''}
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{new Date(error.time).toLocaleString()}</p>
                </article>
              ))}
              {data.recentErrors.length === 0 && (
                <div className="px-8 py-16 text-center">
                  <CheckCircle2 size={40} className="mx-auto text-emerald-400" />
                  <p className="mt-4 text-sm font-black text-gray-700">No application errors have been captured.</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Monitoring;
