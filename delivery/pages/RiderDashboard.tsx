import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  KeyRound,
  LogOut,
  Navigation,
  Package,
  Power,
  RefreshCw,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RiderService } from '../../services/riderService';
import { authService } from '../../services/authService';
import { useAuth } from '../../auth/AuthContext';
import { Order, OrderStatus, Rider } from '../../types';

const ACTIVE_DELIVERY_STATUSES = new Set<OrderStatus>([
  OrderStatus.ASSIGNED,
  OrderStatus.PICKED_UP,
  OrderStatus.ON_THE_WAY,
  OrderStatus.OUT_FOR_DELIVERY
]);

const RiderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logoutAllDevices, changePassword } = useAuth();
  const settingsSectionRef = useRef<HTMLDivElement | null>(null);
  const [rider, setRider] = useState<Rider | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState<{ today: number; walletBalance: number } | null>(null);
  const [activeTask, setActiveTask] = useState<Order | null>(null);
  const [sessions, setSessions] = useState<Array<{
    id: string;
    createdAt: string;
    lastSeenAt: string;
    isCurrent: boolean;
    userAgent?: string;
  }>>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState({
    phone: '',
    mobileMoneyNumber: '',
    vehicleNumber: '',
    emergencyContact: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profile, wallet, deliveries] = await Promise.all([
          RiderService.getProfile(),
          RiderService.getEarningsSummary(),
          RiderService.getAssignedDeliveries(),
        ]);

        setRider(profile);
        setIsOnline(profile.status !== 'offline');
        setStats(wallet);

        const nextTask =
          deliveries.find((order) => ACTIVE_DELIVERY_STATUSES.has(order.status)) ||
          deliveries.find(
            (order) =>
              ![OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(order.status)
          ) ||
          null;

        setActiveTask(nextTask);
        const activeSessions = await authService.getSessions();
        setSessions(activeSessions);
        setSettingsForm({
          phone: profile.phone || '',
          mobileMoneyNumber: profile.mobileMoneyNumber || '',
          vehicleNumber: profile.vehicleNumber || '',
          emergencyContact: profile.emergencyContact || ''
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load rider dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    if (!loading && location.state && (location.state as { openSettings?: boolean }).openSettings) {
      settingsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, location.state]);

  const handleToggleStatus = async () => {
    const nextStatus = !isOnline;
    await RiderService.toggleStatus(nextStatus);
    setIsOnline(nextStatus);
    setRider((current) =>
      current
        ? {
            ...current,
            status: nextStatus ? 'available' : 'offline'
          }
        : current
    );
  };

  const refreshSessions = async () => {
    setLoadingSessions(true);
    try {
      const activeSessions = await authService.getSessions();
      setSessions(activeSessions);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setLoggingOutAll(true);
    try {
      await logoutAllDevices();
    } finally {
      setLoggingOutAll(false);
    }
  };

  const handleSaveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingSettings(true);
    setSettingsMessage(null);
    setSettingsError(null);

    try {
      const updatedProfile = await RiderService.updateProfile(settingsForm);
      setRider(updatedProfile);
      setSettingsMessage('Rider settings updated successfully.');
    } catch (saveError) {
      setSettingsError(saveError instanceof Error ? saveError.message : 'Failed to update rider settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setChangingPassword(true);
    setSettingsMessage(null);
    setSettingsError(null);

    try {
      if (passwordForm.newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters.');
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('Password confirmation does not match.');
      }

      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSettingsMessage('Rider password changed successfully.');
    } catch (passwordError) {
      setSettingsError(passwordError instanceof Error ? passwordError.message : 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !rider || !stats) {
    return (
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 text-center shadow-sm">
        <h2 className="text-xl font-black text-gray-900">Rider dashboard unavailable</h2>
        <p className="text-sm text-gray-500 mt-2">{error || 'We could not load rider data right now.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Mwaramutse, {rider.name.split(' ')[0]}!</h1>
          <p className={`text-xs font-bold uppercase tracking-widest ${isOnline ? 'text-emerald-500' : 'text-gray-400'}`}>
            {isOnline ? 'You are receiving delivery requests' : 'You are currently offline'}
          </p>
        </div>
        <button
          onClick={handleToggleStatus}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 ${
            isOnline ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-gray-100 text-gray-400 shadow-gray-100'
          }`}
        >
          <Power size={28} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-[32px] p-6 text-white">
          <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Earnings Today</p>
          <h3 className="text-2xl font-black">RWF {stats.today.toLocaleString()}</h3>
        </div>
        <div className="bg-orange-500 rounded-[32px] p-6 text-white">
          <p className="text-[10px] font-black uppercase text-orange-200 mb-1">Wallet Balance</p>
          <h3 className="text-2xl font-black">RWF {stats.walletBalance.toLocaleString()}</h3>
        </div>
      </div>

      {isOnline ? (
        activeTask ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-lg font-black text-gray-900">Active Task</h3>
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest animate-pulse">
                {activeTask.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="bg-white rounded-[40px] p-6 border border-gray-100 shadow-xl relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl">
                    <Package size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{activeTask.orderNumber}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                      Pickup from: {activeTask.merchantName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/rider/orders/${activeTask.id}/track`)}
                  className="p-3 bg-blue-50 text-blue-600 rounded-2xl"
                >
                  <Navigation size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-orange-500"></div>
                  <p className="text-xs font-medium text-gray-600">{activeTask.merchantName} dispatch point</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500"></div>
                  <p className="text-xs font-medium text-gray-600">{activeTask.address}</p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/rider/orders/${activeTask.id}/track`)}
                className="w-full bg-black text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2"
              >
                <span>View Task Details</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] p-12 border border-gray-100 text-center shadow-sm">
            <Package size={48} className="mx-auto text-gray-200 mb-4" />
            <h3 className="text-xl font-black text-gray-900 mb-2">No active delivery yet</h3>
            <p className="text-gray-500 text-sm mb-8">
              You are online. New assignments will appear here as soon as dispatch confirms them.
            </p>
            <button
              onClick={() => navigate('/rider/available')}
              className="bg-orange-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-orange-200"
            >
              Check Available Jobs
            </button>
          </div>
        )
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[40px] p-12 text-center">
          <Zap size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-xl font-black text-gray-900 mb-2">Ready to earn?</h3>
          <p className="text-gray-500 text-sm mb-8">Go online to start receiving delivery requests in your area.</p>
          <button
            onClick={handleToggleStatus}
            className="bg-orange-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-orange-200"
          >
            Go Online Now
          </button>
        </div>
      )}

      <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 mb-6">Your Performance</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-black text-gray-900">{rider.rating}</p>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Rating</p>
          </div>
          <div className="border-x border-gray-50">
            <p className="text-xl font-black text-gray-900">
              {rider.totalDeliveries > 0 ? `${Math.min(100, Math.round((rider.totalDeliveries / (rider.totalDeliveries + 1)) * 100))}%` : '0%'}
            </p>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Completion</p>
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{rider.totalDeliveries}</p>
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Jobs Done</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Account Security</h3>
              <p className="text-sm text-gray-500">Track rider app sessions and sign out every device if your account needs protection.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refreshSessions()}
            disabled={loadingSessions}
            className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 font-black text-[10px] uppercase tracking-widest flex items-center justify-center"
          >
            <RefreshCw size={14} className={`mr-2 ${loadingSessions ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-gray-900">{session.isCurrent ? 'Current rider device' : 'Signed-in rider device'}</p>
                  <p className="text-xs text-gray-500 mt-1">{session.userAgent || 'Active delivery session'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${session.isCurrent ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                  {session.isCurrent ? 'Current' : 'Active'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-3 text-[11px] font-bold text-gray-500">
                <p>Signed in: {new Date(session.createdAt).toLocaleString()}</p>
                <p>Last activity: {new Date(session.lastSeenAt).toLocaleString()}</p>
              </div>
            </div>
          ))}

          {!sessions.length ? (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm font-bold text-gray-400">
              No active rider sessions were found for this account.
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void handleLogoutAllDevices()}
          disabled={loggingOutAll}
          className="w-full py-4 rounded-2xl bg-red-50 text-red-600 font-black text-sm flex items-center justify-center hover:bg-red-100 transition-all disabled:opacity-60"
        >
          <LogOut size={16} className="mr-2" />
          {loggingOutAll ? 'Signing Out Devices...' : 'Logout All Devices'}
        </button>
      </div>

      <div ref={settingsSectionRef} className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm space-y-8">
        <div>
          <h3 className="text-lg font-black text-gray-900">Rider Settings</h3>
          <p className="text-sm text-gray-500 mt-1">Update your rider contact details, wallet number, vehicle information, and account password.</p>
        </div>

        {settingsMessage ? <p className="text-sm font-bold text-emerald-600">{settingsMessage}</p> : null}
        {settingsError ? <p className="text-sm font-bold text-red-600">{settingsError}</p> : null}

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="tel"
              value={settingsForm.phone}
              onChange={(event) => setSettingsForm((current) => ({ ...current, phone: event.target.value }))}
              placeholder="Phone number"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-4 outline-none font-bold text-gray-900 transition-all"
            />
            <input
              type="tel"
              value={settingsForm.mobileMoneyNumber}
              onChange={(event) => setSettingsForm((current) => ({ ...current, mobileMoneyNumber: event.target.value }))}
              placeholder="MTN MoMo / Wallet Number"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-4 outline-none font-bold text-gray-900 transition-all"
            />
            <input
              type="text"
              value={settingsForm.vehicleNumber}
              onChange={(event) => setSettingsForm((current) => ({ ...current, vehicleNumber: event.target.value }))}
              placeholder="Vehicle plate number"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-4 outline-none font-bold text-gray-900 transition-all"
            />
            <input
              type="tel"
              value={settingsForm.emergencyContact}
              onChange={(event) => setSettingsForm((current) => ({ ...current, emergencyContact: event.target.value }))}
              placeholder="Emergency contact"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-4 outline-none font-bold text-gray-900 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={savingSettings}
            className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-600 transition-all disabled:opacity-60"
          >
            {savingSettings ? 'Saving Rider Settings...' : 'Save Rider Settings'}
          </button>
        </form>

        <form onSubmit={handleChangePassword} className="space-y-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3 pt-6">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <KeyRound size={18} />
            </div>
            <div>
              <h4 className="text-base font-black text-gray-900">Change Password</h4>
              <p className="text-sm text-gray-500">Protect your rider account with a new secure password.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
              placeholder="Current password"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-4 outline-none font-bold text-gray-900 transition-all"
            />
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
              placeholder="New password"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-4 outline-none font-bold text-gray-900 transition-all"
            />
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              placeholder="Confirm new password"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-4 outline-none font-bold text-gray-900 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="w-full py-4 rounded-2xl bg-gray-900 text-white font-black text-sm hover:bg-emerald-600 transition-all disabled:opacity-60"
          >
            {changingPassword ? 'Updating Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RiderDashboard;
