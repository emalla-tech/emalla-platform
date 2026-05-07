import React, { useEffect, useState } from 'react';
import { Building2, CreditCard, ImagePlus, Loader2, Save, Smartphone, Trash2 } from 'lucide-react';
import { MerchantService } from '../../services/merchantService';
import { uploadService } from '../../services/uploadService';
import { authService } from '../../services/authService';
import { useAuth } from '../../auth/AuthContext';

type MerchantSettingsState = {
  payoutMethod: string;
  momoNumber: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  settlementSchedule: string;
  supportEmail: string;
  storeLogoUrl: string;
  storeCoverUrl: string;
};

const DEFAULT_SETTINGS: MerchantSettingsState = {
  payoutMethod: 'momo',
  momoNumber: '',
  bankName: '',
  bankAccountName: '',
  bankAccountNumber: '',
  settlementSchedule: 'weekly',
  supportEmail: '',
  storeLogoUrl: '',
  storeCoverUrl: ''
};

const MerchantSettingsPage: React.FC = () => {
  const { logoutAllDevices } = useAuth();
  const [form, setForm] = useState<MerchantSettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [sessions, setSessions] = useState<Array<{
    id: string;
    createdAt: string;
    lastSeenAt: string;
    isCurrent: boolean;
    userAgent?: string;
  }>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const [settings, activeSessions] = await Promise.all([
          MerchantService.getSettings(),
          authService.getSessions()
        ]);
        setForm({
          ...DEFAULT_SETTINGS,
          ...(settings || {})
        });
        setSessions(activeSessions);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load seller settings.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const clearMessageSoon = () => {
    window.setTimeout(() => setMessage(null), 3000);
  };

  const handleImageUpload = async (file: File, kind: 'logo' | 'cover') => {
    const setUploading = kind === 'logo' ? setUploadingLogo : setUploadingCover;
    const field = kind === 'logo' ? 'storeLogoUrl' : 'storeCoverUrl';
    const label = kind === 'logo' ? 'Store logo' : 'Store cover';

    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const upload = kind === 'logo'
        ? await uploadService.uploadSellerBrandImage(file)
        : await uploadService.uploadBannerImage(file);
      setForm((current) => ({
        ...current,
        [field]: upload.url
      }));
      setMessage(
        upload.provider === 'cloudinary'
          ? `${label} uploaded successfully.`
          : `${label} saved locally. Add Cloudinary credentials for cloud delivery.`
      );
      clearMessageSoon();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : `Unable to upload ${label.toLowerCase()}.`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const settings = await MerchantService.updateSettings(form);
      setForm({
        ...DEFAULT_SETTINGS,
        ...(settings || {})
      });
      setMessage('Seller settings saved successfully.');
      clearMessageSoon();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save seller settings.');
    } finally {
      setSaving(false);
    }
  };

  const refreshSessions = async () => {
    setLoadingSessions(true);
    try {
      const activeSessions = await authService.getSessions();
      setSessions(activeSessions);
    } catch (sessionError) {
      setError(sessionError instanceof Error ? sessionError.message : 'Unable to load active sessions.');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setLoggingOutAll(true);
    setError(null);
    try {
      await logoutAllDevices();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Unable to log out all devices.');
      setLoggingOutAll(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {message ? (
        <div className="rounded-2xl bg-emerald-500 text-white px-5 py-4 font-black shadow-lg">
          {message}
        </div>
      ) : null}

      <div>
        <h1 className="text-2xl font-black text-gray-900">Seller Settings</h1>
        <p className="text-gray-500 text-sm">Manage payout details, settlement schedule, and store contact preferences.</p>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 font-bold">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 space-y-8">
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <ImagePlus size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Store Branding</h2>
                <p className="text-sm text-gray-500">Upload the logo and cover image used across your seller workspace.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="relative overflow-hidden rounded-[28px] border border-gray-100 bg-gray-50 min-h-[180px]">
                {form.storeCoverUrl ? (
                  <img src={form.storeCoverUrl} alt="Store cover" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
                ) : null}
                <div className={`absolute inset-0 ${form.storeCoverUrl ? 'bg-black/25' : 'bg-gradient-to-br from-slate-100 to-orange-50'}`}></div>
                <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 min-h-[180px]">
                  <div className="flex items-end gap-4">
                    <div className="w-24 h-24 rounded-[28px] border-4 border-white/90 bg-white shadow-xl overflow-hidden flex items-center justify-center">
                      {form.storeLogoUrl ? (
                        <img src={form.storeLogoUrl} alt="Store logo" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Logo</span>
                      )}
                    </div>
                    <div className="text-white">
                      <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${form.storeCoverUrl ? 'text-white/80' : 'text-gray-500'}`}>Brand Preview</p>
                      <h3 className={`text-2xl font-black mt-2 ${form.storeCoverUrl ? 'text-white' : 'text-gray-900'}`}>Seller Hub storefront</h3>
                      <p className={`text-sm mt-1 ${form.storeCoverUrl ? 'text-white/85' : 'text-gray-500'}`}>Your branding appears on dashboard touchpoints and future storefront experiences.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white text-gray-900 font-black text-sm cursor-pointer shadow-sm">
                      {uploadingLogo ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                      Upload Logo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingLogo}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void handleImageUpload(file, 'logo');
                          }
                          event.target.value = '';
                        }}
                      />
                    </label>
                    <label className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white text-gray-900 font-black text-sm cursor-pointer shadow-sm">
                      {uploadingCover ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                      Upload Cover
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingCover}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void handleImageUpload(file, 'cover');
                          }
                          event.target.value = '';
                        }}
                      />
                    </label>
                    {(form.storeLogoUrl || form.storeCoverUrl) ? (
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, storeLogoUrl: '', storeCoverUrl: '' }))}
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-600 font-black text-sm"
                      >
                        <Trash2 size={16} />
                        Clear Images
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Smartphone size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Payout Method</h2>
                <p className="text-sm text-gray-500">Choose how seller settlements should be sent.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, payoutMethod: 'momo' }))}
                className={`rounded-[28px] border p-5 text-left transition-all ${
                  form.payoutMethod === 'momo' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <p className="text-sm font-black text-gray-900">Mobile Money</p>
                <p className="text-xs text-gray-500 mt-1">Use MTN MoMo or Airtel payout number.</p>
              </button>
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, payoutMethod: 'bank' }))}
                className={`rounded-[28px] border p-5 text-left transition-all ${
                  form.payoutMethod === 'bank' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <p className="text-sm font-black text-gray-900">Bank Transfer</p>
                <p className="text-xs text-gray-500 mt-1">Set a business bank account for settlements.</p>
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">MoMo Number</span>
                <input
                  value={form.momoNumber}
                  onChange={(event) => setForm((current) => ({ ...current, momoNumber: event.target.value }))}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 font-bold outline-none border border-transparent focus:border-orange-300"
                  placeholder="07XXXXXXXX"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Settlement Schedule</span>
                <select
                  value={form.settlementSchedule}
                  onChange={(event) => setForm((current) => ({ ...current, settlementSchedule: event.target.value }))}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 font-bold outline-none border border-transparent focus:border-orange-300"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Bank Details</h2>
                <p className="text-sm text-gray-500">Used when payout method is set to bank transfer.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bank Name</span>
                <input
                  value={form.bankName}
                  onChange={(event) => setForm((current) => ({ ...current, bankName: event.target.value }))}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 font-bold outline-none border border-transparent focus:border-orange-300"
                  placeholder="Bank of Kigali"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account Name</span>
                <input
                  value={form.bankAccountName}
                  onChange={(event) => setForm((current) => ({ ...current, bankAccountName: event.target.value }))}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 font-bold outline-none border border-transparent focus:border-orange-300"
                  placeholder="Business account name"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account Number</span>
                <input
                  value={form.bankAccountNumber}
                  onChange={(event) => setForm((current) => ({ ...current, bankAccountNumber: event.target.value }))}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 font-bold outline-none border border-transparent focus:border-orange-300"
                  placeholder="0000000000"
                />
              </label>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Building2 size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Store Contact</h2>
                <p className="text-sm text-gray-500">Shared with finance and settlement operations.</p>
              </div>
            </div>

            <label className="space-y-2 block">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Support Email</span>
              <input
                value={form.supportEmail}
                onChange={(event) => setForm((current) => ({ ...current, supportEmail: event.target.value }))}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 font-bold outline-none border border-transparent focus:border-orange-300"
                placeholder="store@example.com"
              />
            </label>
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-gray-900">Active Sessions</h2>
                <p className="text-sm text-gray-500">Review this seller account's active devices and last activity.</p>
              </div>
              <button
                type="button"
                onClick={() => void refreshSessions()}
                disabled={loadingSessions}
                className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-700 font-black text-xs uppercase tracking-widest"
              >
                {loadingSessions ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-gray-900">{session.isCurrent ? 'Current device' : 'Signed-in device'}</p>
                      <p className="text-xs text-gray-500 mt-1">{session.userAgent || 'Session active on this account'}</p>
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
                  No active sessions were found for this seller account.
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-gray-900 text-white rounded-[40px] p-8 space-y-4 shadow-xl">
            <h3 className="text-xl font-black">Save Seller Preferences</h3>
            <p className="text-sm text-gray-300">These settings are now saved on the backend and reused across seller sessions.</p>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Settings
            </button>
            <button
              type="button"
              onClick={() => void handleLogoutAllDevices()}
              disabled={loggingOutAll}
              className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 font-black text-sm transition-all disabled:opacity-60"
            >
              {loggingOutAll ? 'Signing Out Devices...' : 'Logout All Devices'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MerchantSettingsPage;
