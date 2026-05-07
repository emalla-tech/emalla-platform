import React, { useEffect, useState } from 'react';
import { Bell, KeyRound, Percent, Save, Shield, UserCircle2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import AdminToast from '../../components/AdminToast';
import { CATEGORIES } from '../../constants';
import { AdminService } from '../../services/adminService';

type AdminPreferences = {
  emailAlerts: boolean;
  auditDigest: boolean;
  codAlerts: boolean;
  logisticsAlerts: boolean;
};

const defaultPreferences: AdminPreferences = {
  emailAlerts: true,
  auditDigest: true,
  codAlerts: true,
  logisticsAlerts: true
};

const defaultCategoryCommissionRates = CATEGORIES.reduce<Record<string, number>>((acc, category) => {
  acc[category.id] = 10;
  return acc;
}, {});

const AdminSettings: React.FC = () => {
  const { user, changePassword } = useAuth();
  const [preferences, setPreferences] = useState<AdminPreferences>(defaultPreferences);
  const [categoryCommissionRates, setCategoryCommissionRates] = useState<Record<string, number>>(defaultCategoryCommissionRates);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'success' | 'error' | 'info'>('success');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const settings = await AdminService.getSettings();
        setPreferences({
          ...defaultPreferences,
          ...(settings.preferences || {})
        });
        setCategoryCommissionRates({
          ...defaultCategoryCommissionRates,
          ...(settings.categoryCommissionRates || {})
        });
      } catch (error) {
        setToastTone('error');
        setToast(error instanceof Error ? error.message : 'Failed to load admin settings.');
        setTimeout(() => setToast(null), 3000);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await AdminService.updateSettings({
        preferences,
        categoryCommissionRates
      });
      setToastTone('success');
      setToast('Admin settings and category commissions saved successfully.');
    } catch (error) {
      setToastTone('error');
      setToast(error instanceof Error ? error.message : 'Failed to save admin settings.');
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const togglePreference = (key: keyof AdminPreferences) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
  };

  const updateCommissionRate = (categoryId: string, value: string) => {
    const nextValue = Number(value);
    setCategoryCommissionRates((current) => ({
      ...current,
      [categoryId]: Number.isFinite(nextValue) ? Math.max(0, Math.min(100, nextValue)) : 0
    }));
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setToastTone('error');
      setToast('Fill in all password fields before submitting.');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setToastTone('error');
      setToast('New password must be at least 8 characters long.');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToastTone('error');
      setToast('New password and confirmation do not match.');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setToastTone('success');
      setToast('Admin password changed successfully.');
    } catch (error) {
      setToastTone('error');
      setToast(error instanceof Error ? error.message : 'Failed to change admin password.');
    } finally {
      setIsChangingPassword(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="p-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminToast message={toast} tone={toastTone} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Admin Settings</h1>
          <p className="text-gray-500">Manage account profile visibility, operational alerts, and category commission strategy.</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-3 rounded-2xl bg-orange-500 text-white font-black text-sm hover:bg-orange-600 transition-all flex items-center disabled:opacity-60"
        >
          <Save size={16} className="mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <UserCircle2 size={22} className="text-orange-500" />
            <h2 className="text-xl font-black text-gray-900">Administrator Profile</h2>
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Name</p>
              <p className="text-sm font-bold text-gray-900">{user?.name || 'Admin E-Malla'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Email</p>
              <p className="text-sm font-bold text-gray-900">{user?.email || 'admin@emalla.rw'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Role</p>
              <p className="text-sm font-bold text-gray-900">{user?.role || 'ADMIN'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <Bell size={22} className="text-orange-500" />
            <h2 className="text-xl font-black text-gray-900">Operational Preferences</h2>
          </div>
          <div className="space-y-4">
            {[
              ['emailAlerts', 'Email Alerts', 'Receive admin alert updates in the dashboard workflow.'],
              ['auditDigest', 'Audit Digest', 'Keep audit monitoring enabled for quick operations review.'],
              ['codAlerts', 'COD Alerts', 'Highlight high-value cash on delivery orders in finance monitoring.'],
              ['logisticsAlerts', 'Logistics Alerts', 'Show delivery and rider workflow alerts in admin operations.']
            ].map(([key, label, description]) => (
              <button
                key={key}
                type="button"
                onClick={() => togglePreference(key as keyof AdminPreferences)}
                className="w-full rounded-3xl border border-gray-100 px-5 py-4 text-left hover:border-orange-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-gray-900">{label}</p>
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    preferences[key as keyof AdminPreferences] ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {preferences[key as keyof AdminPreferences] ? 'On' : 'Off'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <Percent size={22} className="text-orange-500" />
          <div>
            <h2 className="text-xl font-black text-gray-900">Category Commission Rates</h2>
            <p className="text-sm text-gray-500 mt-1">Set the platform commission percentage for each seller category.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {CATEGORIES.map((category) => (
            <div key={category.id} className="rounded-3xl border border-gray-100 px-5 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                  {category.icon}
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">{category.name}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Category ID: {category.id}</p>
                </div>
              </div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                Commission Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={categoryCommissionRates[category.id] ?? 0}
                  onChange={(event) => updateCommissionRate(category.id, event.target.value)}
                  className="w-full rounded-2xl bg-gray-50 px-4 py-3 pr-12 font-black text-gray-900 outline-none border border-transparent focus:border-orange-200"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <KeyRound size={22} className="text-orange-500" />
          <div>
            <h2 className="text-xl font-black text-gray-900">Change Admin Password</h2>
            <p className="text-sm text-gray-500 mt-1">Update your admin password securely from the dashboard.</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
              Current Password
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
              className="w-full rounded-2xl bg-gray-50 px-4 py-3 font-black text-gray-900 outline-none border border-transparent focus:border-orange-200"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
              New Password
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
              className="w-full rounded-2xl bg-gray-50 px-4 py-3 font-black text-gray-900 outline-none border border-transparent focus:border-orange-200"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
              Confirm Password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              className="w-full rounded-2xl bg-gray-50 px-4 py-3 font-black text-gray-900 outline-none border border-transparent focus:border-orange-200"
            />
          </div>
          <div className="md:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-3 rounded-2xl bg-gray-900 text-white font-black text-sm hover:bg-orange-500 transition-all disabled:opacity-60"
            >
              {isChangingPassword ? 'Updating Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={22} className="text-orange-500" />
          <h2 className="text-xl font-black text-gray-900">Security Note</h2>
        </div>
        <p className="text-sm text-gray-600 leading-7">
          Admin settings and category commission rates are now persisted through the backend database for the platform.
          Account authentication and access control remain enforced by the protected admin portal.
        </p>
      </div>
    </div>
  );
};

export default AdminSettings;
