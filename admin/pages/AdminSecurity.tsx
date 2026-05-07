import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Laptop, LogOut, RefreshCw, Shield, ShieldBan, Smartphone } from 'lucide-react';
import AdminToast from '../../components/AdminToast';
import { AdminService } from '../../services/adminService';

type AdminSession = {
  id: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
  createdAt: string;
  lastSeenAt: string;
  userAgent?: string;
  isSuspicious: boolean;
  reasons: string[];
};

const AdminSecurity: React.FC = () => {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'success' | 'error' | 'info'>('success');

  const loadSessions = async () => {
    setLoading(true);
    try {
      const result = await AdminService.getSessions(roleFilter, suspiciousOnly);
      setSessions(result);
    } catch (error) {
      setToastTone('error');
      setToast(error instanceof Error ? error.message : 'Unable to load active sessions.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, [roleFilter, suspiciousOnly]);

  const summary = useMemo(() => {
    const suspicious = sessions.filter((session) => session.isSuspicious).length;
    const admins = sessions.filter((session) => session.role === 'ADMIN').length;
    const mobile = sessions.filter((session) => /android|iphone|mobile/i.test(session.userAgent || '')).length;
    const merchants = sessions.filter((session) => session.role === 'MERCHANT').length;
    return {
      total: sessions.length,
      suspicious,
      admins,
      mobile,
      merchants
    };
  }, [sessions]);

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await AdminService.revokeSession(sessionId);
      setToastTone('success');
      setToast('Session revoked successfully.');
      await loadSessions();
    } catch (error) {
      setToastTone('error');
      setToast(error instanceof Error ? error.message : 'Unable to revoke session.');
    } finally {
      setRevokingId(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleRevokeUserSessions = async (userId: string) => {
    setRevokingUserId(userId);
    try {
      await AdminService.revokeUserSessions(userId);
      setToastTone('success');
      setToast('All sessions for that user were revoked successfully.');
      await loadSessions();
    } catch (error) {
      setToastTone('error');
      setToast(error instanceof Error ? error.message : 'Unable to revoke user sessions.');
    } finally {
      setRevokingUserId(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="space-y-8">
      <AdminToast message={toast} tone={toastTone} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Security Sessions</h1>
          <p className="text-gray-500">Monitor active logins across admin, seller, buyer, and rider workspaces.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadSessions()}
          className="px-5 py-3 rounded-2xl bg-white border border-gray-100 text-gray-700 font-black text-sm flex items-center"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Active Sessions</p>
          <p className="text-3xl font-black text-gray-900 mt-2">{summary.total}</p>
        </div>
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Suspicious</p>
          <p className="text-3xl font-black text-red-600 mt-2">{summary.suspicious}</p>
        </div>
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Admin Sessions</p>
          <p className="text-3xl font-black text-gray-900 mt-2">{summary.admins}</p>
        </div>
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Merchant Sessions</p>
          <p className="text-3xl font-black text-gray-900 mt-2">{summary.merchants}</p>
        </div>
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mobile Devices</p>
          <p className="text-3xl font-black text-gray-900 mt-2">{summary.mobile}</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', 'ADMIN', 'MERCHANT', 'CUSTOMER', 'DELIVERY'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                roleFilter === role ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {role === 'all' ? 'All Roles' : role}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSuspiciousOnly((current) => !current)}
          className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
            suspiciousOnly ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600'
          }`}
        >
          {suspiciousOnly ? 'Showing Suspicious Only' : 'Show Suspicious Only'}
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sessions.length ? (
          sessions.map((session) => (
            <div key={session.id} className="bg-white rounded-[30px] border border-gray-100 shadow-sm p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl font-black text-gray-900">{session.userName}</h3>
                    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest">
                      {session.role}
                    </span>
                    {session.isSuspicious ? (
                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Suspicious
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Shield size={12} />
                        Normal
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-700">{session.email}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    {/android|iphone|mobile/i.test(session.userAgent || '') ? <Smartphone size={16} /> : <Laptop size={16} />}
                    <span>{session.userAgent || 'Unknown device'}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="rounded-2xl bg-gray-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Signed In</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{new Date(session.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Last Activity</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{new Date(session.lastSeenAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {session.reasons.length ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {session.reasons.map((reason) => (
                        <span key={reason} className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest">
                          {reason}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="min-w-[220px] space-y-3">
                  <button
                    type="button"
                    onClick={() => void handleRevoke(session.id)}
                    disabled={revokingId === session.id}
                    className="w-full px-5 py-3 rounded-2xl bg-red-500 text-white font-black text-sm hover:bg-red-600 transition-all flex items-center justify-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    {revokingId === session.id ? 'Revoking...' : 'Revoke Session'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRevokeUserSessions(session.userId)}
                    disabled={revokingUserId === session.userId}
                    className="w-full px-5 py-3 rounded-2xl bg-gray-900 text-white font-black text-sm hover:bg-black transition-all flex items-center justify-center"
                  >
                    <ShieldBan size={16} className="mr-2" />
                    {revokingUserId === session.userId ? 'Revoking User Sessions...' : 'Revoke All For User'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-gray-100 rounded-[30px] py-20 text-center">
            <p className="text-gray-500 font-bold">No sessions match the current filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSecurity;
