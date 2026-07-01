import React, { useEffect, useState } from 'react';
import {
  BadgeCheck,
  BriefcaseBusiness,
  Loader2,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserPlus,
  UserRoundCheck,
  UserRoundX,
  X
} from 'lucide-react';
import AdminToast from '../../components/AdminToast';
import { AdminService } from '../../services/adminService';
import { StaffLevel, StaffUser, UserRole } from '../../types';

type StaffRole = UserRole.LOGISTICS | UserRole.FINANCE | UserRole.SUPPORT;
type StaffDraft = {
  name: string;
  phone: string;
  role: StaffRole;
  staffLevel: StaffLevel;
};

const STAFF_ROLE_OPTIONS: Array<{ value: StaffRole; label: string }> = [
  { value: UserRole.LOGISTICS, label: 'Logistics' },
  { value: UserRole.FINANCE, label: 'Finance' },
  { value: UserRole.SUPPORT, label: 'Support' }
];

const emptyForm: StaffDraft & { email: string } = {
  name: '',
  email: '',
  phone: '',
  role: UserRole.LOGISTICS,
  staffLevel: 'officer'
};

const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [drafts, setDrafts] = useState<Record<string, StaffDraft>>({});
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (message: string, tone: 'success' | 'error' | 'info' = 'success') => {
    setToast(message);
    setToastTone(tone);
    window.setTimeout(() => setToast(null), 3500);
  };

  const loadStaff = async () => {
    setLoading(true);
    try {
      const records = await AdminService.getStaff();
      setStaff(records);
      setDrafts(
        Object.fromEntries(records.map((entry) => [
          entry.id,
          {
            name: entry.name,
            phone: entry.phone || '',
            role: entry.role,
            staffLevel: entry.staffLevel || 'officer'
          }
        ]))
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load staff accounts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStaff();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      await AdminService.createStaff(form);
      setForm(emptyForm);
      setShowCreate(false);
      await loadStaff();
      showToast('Staff account created. Temporary credentials were sent by email.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to create staff account.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async (entry: StaffUser) => {
    const draft = drafts[entry.id];
    if (!draft) return;
    setBusyId(entry.id);
    try {
      await AdminService.updateStaff(entry.id, draft);
      await loadStaff();
      showToast('Staff access updated. Existing sessions were refreshed.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update staff access.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleStatus = async (entry: StaffUser, status: 'active' | 'suspended') => {
    setBusyId(entry.id);
    try {
      await AdminService.updateStaff(entry.id, { status });
      await loadStaff();
      showToast(status === 'active' ? 'Staff account activated.' : 'Staff account suspended and sessions revoked.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to update account status.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const filteredStaff = staff.filter((entry) => {
    const keyword = query.toLowerCase().trim();
    return !keyword ||
      entry.name.toLowerCase().includes(keyword) ||
      entry.email.toLowerCase().includes(keyword) ||
      entry.role.toLowerCase().includes(keyword);
  });

  return (
    <div className="space-y-8">
      <AdminToast message={toast} tone={toastTone} />

      <section className="overflow-hidden rounded-[36px] bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 p-7 text-white shadow-xl md:p-10">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-400">Identity & Access</p>
            <h1 className="mt-4 text-3xl font-black md:text-4xl">Staff Team Access</h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-300">
              Create least-privilege Logistics, Finance, and Support accounts without sharing Admin credentials.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-950/30 transition-colors hover:bg-orange-600"
          >
            <UserPlus size={18} className="mr-2" />
            Add Staff Account
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Staff" value={staff.length} />
        <StatCard label="Managers" value={staff.filter((entry) => entry.staffLevel === 'manager').length} />
        <StatCard label="Active" value={staff.filter((entry) => entry.status === 'active').length} tone="green" />
        <StatCard label="Suspended" value={staff.filter((entry) => entry.status === 'suspended').length} tone="red" />
      </section>

      <section className="rounded-[32px] border border-gray-100 bg-white p-5 shadow-sm md:p-6">
        <div className="relative max-w-lg">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-2xl bg-gray-50 py-4 pl-12 pr-4 text-sm font-bold text-gray-900 outline-none ring-orange-100 focus:ring-4"
            placeholder="Search staff by name, email, or department..."
          />
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={36} /></div>
      ) : (
        <section className="grid gap-5">
          {filteredStaff.map((entry) => {
            const draft = drafts[entry.id];
            if (!draft) return null;
            return (
              <article key={entry.id} className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm">
                <div className="grid gap-7 xl:grid-cols-[1fr_1.4fr_auto] xl:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-black text-gray-900">{entry.name}</h2>
                      <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                        entry.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                    <p className="mt-3 flex items-center text-sm font-bold text-gray-600"><Mail size={15} className="mr-2 text-gray-400" />{entry.email}</p>
                    <p className="mt-2 flex items-center text-sm font-bold text-gray-600"><Phone size={15} className="mr-2 text-gray-400" />{entry.phone || 'No phone provided'}</p>
                    <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Username: {entry.username || 'Assigned'} · Last login: {entry.lastLoginAt ? new Date(entry.lastLoginAt).toLocaleString() : 'Never'}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Department</span>
                      <select
                        value={draft.role}
                        onChange={(event) => setDrafts((current) => ({
                          ...current,
                          [entry.id]: { ...draft, role: event.target.value as StaffRole }
                        }))}
                        className="mt-2 w-full rounded-2xl bg-gray-50 px-4 py-3 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-200"
                      >
                        {STAFF_ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Access Level</span>
                      <select
                        value={draft.staffLevel}
                        onChange={(event) => setDrafts((current) => ({
                          ...current,
                          [entry.id]: { ...draft, staffLevel: event.target.value as StaffLevel }
                        }))}
                        className="mt-2 w-full rounded-2xl bg-gray-50 px-4 py-3 font-bold capitalize text-gray-900 outline-none focus:ring-2 focus:ring-orange-200"
                      >
                        <option value="officer">Officer</option>
                        <option value="manager">Manager</option>
                      </select>
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:max-w-[190px] xl:justify-end">
                    <button
                      type="button"
                      onClick={() => void handleSave(entry)}
                      disabled={busyId === entry.id}
                      className="inline-flex min-h-11 items-center rounded-xl bg-gray-950 px-4 py-3 text-xs font-black text-white disabled:opacity-50"
                    >
                      <ShieldCheck size={15} className="mr-2" /> Save Access
                    </button>
                    {entry.status === 'active' ? (
                      <button
                        type="button"
                        onClick={() => void handleStatus(entry, 'suspended')}
                        disabled={busyId === entry.id}
                        className="inline-flex min-h-11 items-center rounded-xl bg-red-50 px-4 py-3 text-xs font-black text-red-600 disabled:opacity-50"
                      >
                        <UserRoundX size={15} className="mr-2" /> Suspend
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleStatus(entry, 'active')}
                        disabled={busyId === entry.id}
                        className="inline-flex min-h-11 items-center rounded-xl bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700 disabled:opacity-50"
                      >
                        <UserRoundCheck size={15} className="mr-2" /> Activate
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          {filteredStaff.length === 0 && (
            <div className="rounded-[32px] border border-dashed border-gray-200 bg-white py-20 text-center">
              <BriefcaseBusiness className="mx-auto text-gray-300" size={38} />
              <p className="mt-4 font-black text-gray-700">No staff accounts match this search.</p>
            </div>
          )}
        </section>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreate} className="w-full max-w-2xl rounded-[36px] bg-white p-7 shadow-2xl md:p-9">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Admin Provisioning</p>
                <h2 className="mt-3 text-2xl font-black text-gray-900">Create Staff Account</h2>
                <p className="mt-2 text-sm text-gray-500">Temporary credentials are emailed directly to the staff member.</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} aria-label="Close staff form" className="rounded-xl bg-gray-100 p-3 text-gray-500"><X size={18} /></button>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <Field label="Full Name">
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} placeholder="Staff member name" />
              </Field>
              <Field label="Work Email">
                <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} placeholder="name@emallarwanda.com" />
              </Field>
              <Field label="Phone (Optional)">
                <input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className={inputClass} placeholder="+250..." />
              </Field>
              <Field label="Department">
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as StaffRole })} className={inputClass}>
                  {STAFF_ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
              <Field label="Access Level">
                <select value={form.staffLevel} onChange={(event) => setForm({ ...form, staffLevel: event.target.value as StaffLevel })} className={inputClass}>
                  <option value="officer">Officer</option>
                  <option value="manager">Manager</option>
                </select>
              </Field>
            </div>

            <div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
              <BadgeCheck size={17} className="mr-2 inline" />
              This account receives only its department workspace and must change the temporary password on first login.
            </div>

            <button type="submit" disabled={creating} className="mt-7 flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-500 px-6 font-black text-white shadow-lg shadow-orange-100 disabled:opacity-50">
              {creating ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={18} className="mr-2" />Create & Send Access</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const inputClass = 'w-full rounded-2xl bg-gray-50 px-5 py-4 font-bold text-gray-900 outline-none ring-orange-100 focus:ring-4';

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label>
    <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
    {children}
  </label>
);

const StatCard = ({ label, value, tone = 'gray' }: { label: string; value: number; tone?: 'gray' | 'green' | 'red' }) => {
  const toneClass = tone === 'green' ? 'text-emerald-600' : tone === 'red' ? 'text-red-500' : 'text-gray-900';
  return (
    <div className="rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p>
      <p className={`mt-2 text-3xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
};

export default StaffManagement;
