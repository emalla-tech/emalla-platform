import React, { useEffect, useState } from 'react';
import { BadgeCheck, Bike, CalendarDays, Clock3, Loader2, Mail, Phone, Search, ShieldCheck, Truck, UserCheck, UserX, Wallet, X, KeyRound } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { RiderApplication } from '../../types';
import { AdminService } from '../../services/adminService';
import AdminToast from '../../components/AdminToast';

type AdminRider = {
  id: string; name: string; username?: string; email: string; phone?: string;
  status: 'active' | 'offline' | 'suspended'; createdAt: string;
  totalDeliveries: number; assignedDeliveries: number; activeDeliveries: number;
  earnings: number; operationalStatus: string;
};

const RIDER_FILTERS = ['all', 'active', 'offline', 'suspended'] as const;
const APPLICATION_FILTERS = ['pending', 'approved', 'rejected', 'all'] as const;

const RiderManagement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState<(typeof RIDER_FILTERS)[number]>('all');
  const [applicationFilter, setApplicationFilter] = useState<(typeof APPLICATION_FILTERS)[number]>('pending');
  const [riders, setRiders] = useState<AdminRider[]>([]);
  const [applications, setApplications] = useState<RiderApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approvingApplicationId, setApprovingApplicationId] = useState<string | null>(null);
  const [rejectingApplicationId, setRejectingApplicationId] = useState<string | null>(null);
  const [selectedRider, setSelectedRider] = useState<AdminRider | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<RiderApplication | null>(null);
  const [applicationQuery, setApplicationQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'success' | 'error' | 'info'>('success');
  const [rejectReason, setRejectReason] = useState('');
  const [autoOpened, setAutoOpened] = useState(false);
  const focusRiderId = searchParams.get('riderId');
  const focusRiderEmail = searchParams.get('riderEmail');

  const showToast = (message: string, tone: 'success' | 'error' | 'info' = 'success') => {
    setToastTone(tone); setToast(message); window.setTimeout(() => setToast(null), 3500);
  };

  const loadRiders = async (nextFilter = filter) => { setLoading(true); try { setRiders(await AdminService.getRiders(nextFilter)); } finally { setLoading(false); } };
  const loadApplications = async (nextFilter = applicationFilter) => { setApplicationsLoading(true); try { setApplications(await AdminService.getRiderApplications(nextFilter)); } finally { setApplicationsLoading(false); } };

  useEffect(() => { void loadRiders(filter); }, [filter]);
  useEffect(() => { void loadApplications(applicationFilter); }, [applicationFilter]);
  useEffect(() => { if (focusRiderId || focusRiderEmail) setFilter('all'); }, [focusRiderId, focusRiderEmail]);
  useEffect(() => {
    if (autoOpened || !riders.length) return;
    const target = riders.find((r) => (focusRiderId && r.id === focusRiderId) || (focusRiderEmail && r.email === focusRiderEmail));
    if (target) { setSelectedRider(target); setAutoOpened(true); }
  }, [riders, autoOpened, focusRiderId, focusRiderEmail]);
  useEffect(() => { if (!selectedRider) return; const next = riders.find((r) => r.id === selectedRider.id); if (next) setSelectedRider(next); }, [riders, selectedRider]);
  useEffect(() => { if (!selectedApplication) return; const next = applications.find((a) => a.id === selectedApplication.id); if (next) setSelectedApplication(next); }, [applications, selectedApplication]);

  const handleStatusChange = async (riderId: string, status: 'active' | 'offline' | 'suspended') => {
    setBusyId(riderId);
    try {
      await AdminService.updateRiderStatus(riderId, status);
      await loadRiders(filter);
      showToast(status === 'active' ? 'Rider activated successfully.' : status === 'offline' ? 'Rider moved offline successfully.' : 'Rider suspended successfully.', status === 'suspended' ? 'error' : 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update rider status.', 'error');
    } finally { setBusyId(null); }
  };

  const approveApplication = async (applicationId: string) => {
    setApprovingApplicationId(applicationId);
    try {
      await AdminService.approveRiderApplication(applicationId);
      await Promise.all([loadApplications(applicationFilter), loadRiders('all')]);
      showToast('Rider approved successfully. Credentials email has been queued.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to approve rider application.', 'error');
    } finally { setApprovingApplicationId(null); }
  };

  const rejectApplication = async (applicationId: string) => {
    const trimmedReason = rejectReason.trim();
    if (!trimmedReason) return showToast('Add a rejection reason before sending the decision.', 'error');
    setRejectingApplicationId(applicationId);
    try {
      await AdminService.rejectRiderApplication(applicationId, trimmedReason);
      setRejectReason('');
      await loadApplications(applicationFilter);
      showToast('Rider application rejected and email has been queued.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to reject rider application.', 'error');
    } finally { setRejectingApplicationId(null); }
  };

  const filteredApplications = applications.filter((a) => {
    const q = applicationQuery.toLowerCase().trim();
    return !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.phone.toLowerCase().includes(q) || a.vehicleNumber.toLowerCase().includes(q);
  });
  const pendingApplications = applications.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-8">
      <AdminToast message={toast} tone={toastTone} />
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-500 mb-2">Admin Logistics</p>
          <h1 className="text-3xl font-black text-gray-900">Rider Management</h1>
          <p className="text-sm text-gray-500 mt-2">Review rider applicants, approve access, and manage live delivery operations from one place.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Pending Apps" value={pendingApplications} tone="orange" />
          <StatCard label="Total Riders" value={riders.length} tone="gray" />
          <StatCard label="Active Now" value={riders.filter((r) => r.status === 'active').length} tone="green" />
          <StatCard label="Suspended" value={riders.filter((r) => r.status === 'suspended').length} tone="red" />
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader title="Rider Applications" subtitle="Approval queue" loading={applicationsLoading} />
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={applicationQuery} onChange={(e) => setApplicationQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 font-bold outline-none" placeholder="Search rider application..." />
          </div>
          <div className="flex flex-wrap gap-2">
            {APPLICATION_FILTERS.map((item) => (
              <button key={item} onClick={() => setApplicationFilter(item)} className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${applicationFilter === item ? 'bg-black text-white' : 'bg-gray-50 text-gray-500'}`}>{item}</button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredApplications.map((application) => (
            <div key={application.id} onClick={() => setSelectedApplication(application)} className="p-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 cursor-pointer transition-colors hover:bg-gray-50">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center"><Bike size={24} /></div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-black text-gray-900">{application.name}</h3>
                    <StatusBadge status={application.status} />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{application.email} {application.phone ? `• ${application.phone}` : ''}</p>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-2">Plate: {application.vehicleNumber} • Submitted {new Date(application.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                {application.status === 'approved' ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 min-w-[220px]">
                    <p className="text-[10px] font-black uppercase tracking-widest">Credentials Sent</p>
                    <p className="text-xs font-bold mt-2">Username: {application.temporaryUsername || 'N/A'}</p>
                    <p className="text-xs font-bold">Password sent by email only</p>
                  </div>
                ) : application.status === 'rejected' ? (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 min-w-[220px]">
                    <p className="text-[10px] font-black uppercase tracking-widest">Rejected</p>
                    <p className="text-xs font-bold mt-2">{application.rejectedReason || 'Reason shared with applicant by email.'}</p>
                  </div>
                ) : (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); void approveApplication(application.id); }} disabled={approvingApplicationId === application.id} className="px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-600 font-black text-xs uppercase tracking-widest hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-2"><UserCheck size={14} />{approvingApplicationId === application.id ? 'Approving...' : 'Approve Rider'}</button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedApplication(application); }} className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-600 font-black text-xs uppercase tracking-widest hover:bg-gray-200 flex items-center gap-2"><Clock3 size={14} />Review</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {!applicationsLoading && filteredApplications.length === 0 && <EmptyState title="No rider applications found" body="There are no rider applications matching the current filter." />}
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <SectionHeader title="Rider Directory" subtitle="Live operations control" loading={loading} />
        <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap gap-3">
          {RIDER_FILTERS.map((item) => (
            <button key={item} onClick={() => setFilter(item)} className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === item ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-white text-gray-500 border border-gray-100 hover:border-orange-200'}`}>{item}</button>
          ))}
        </div>
        <div className="divide-y divide-gray-100">
          {riders.map((rider) => (
            <div key={rider.id} onClick={() => setSelectedRider(rider)} className={`p-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 cursor-pointer transition-colors hover:bg-gray-50 ${(focusRiderId && rider.id === focusRiderId) || (focusRiderEmail && rider.email === focusRiderEmail) ? 'bg-orange-50/70' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center"><Bike size={24} /></div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-black text-gray-900">{rider.name}</h3>
                    <StatusBadge status={rider.status} />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{rider.email} {rider.phone ? `• ${rider.phone}` : ''}</p>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-2">Username: {rider.username || 'N/A'} • Joined {new Date(rider.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 xl:min-w-[540px]">
                <Metric label="Completed" value={rider.totalDeliveries} />
                <Metric label="Assigned" value={rider.assignedDeliveries} />
                <Metric label="Active Jobs" value={rider.activeDeliveries} accent="orange" />
                <Metric label="Earnings" value={`RWF ${rider.earnings.toLocaleString()}`} />
              </div>
              <div className="flex flex-wrap gap-3 xl:justify-end">
                <ActionButton tone="green" label="Activate" icon={<UserCheck size={14} />} onClick={(e) => { e.stopPropagation(); void handleStatusChange(rider.id, 'active'); }} disabled={busyId === rider.id} />
                <ActionButton tone="gray" label="Set Offline" icon={<Truck size={14} />} onClick={(e) => { e.stopPropagation(); void handleStatusChange(rider.id, 'offline'); }} disabled={busyId === rider.id} />
                <ActionButton tone="red" label="Suspend" icon={<UserX size={14} />} onClick={(e) => { e.stopPropagation(); void handleStatusChange(rider.id, 'suspended'); }} disabled={busyId === rider.id} />
              </div>
            </div>
          ))}
          {!loading && riders.length === 0 && <EmptyState title="No riders found" body="There are no rider accounts matching the current filter." />}
        </div>
      </div>

      {selectedApplication && (
        <Drawer title="Rider Application Details" heading={selectedApplication.name} subtitle="Review rider onboarding details, admin decision state, and temporary access credentials." onClose={() => setSelectedApplication(null)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard label="Application Status" value={String(selectedApplication.status).toUpperCase()} />
            <MetricCard label="Submitted At" value={new Date(selectedApplication.createdAt).toLocaleString()} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard icon={<Mail size={16} />} label="Email" value={selectedApplication.email} breakAll />
            <InfoCard icon={<Phone size={16} />} label="Phone" value={selectedApplication.phone} />
            <InfoCard icon={<Bike size={16} />} label="Plate Number" value={selectedApplication.vehicleNumber} />
            <InfoCard icon={<ShieldCheck size={16} />} label="Application ID" value={selectedApplication.id} breakAll />
          </div>
          {selectedApplication.status === 'approved' ? (
            <div className="rounded-[32px] border border-emerald-100 bg-emerald-50 p-6">
              <div className="flex items-center gap-3 mb-4"><BadgeCheck size={20} className="text-emerald-600" /><h3 className="text-lg font-black text-emerald-800">Approved Rider Access</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricCard label="Temporary Username" value={selectedApplication.temporaryUsername || 'Not available'} tone="green" />
                <MetricCard label="Temporary Password" value="Sent by email only" tone="green" />
              </div>
              <p className="text-sm text-emerald-800 mt-4">Approval email was prepared with temporary credentials so the rider can sign in directly to Rider Hub.</p>
            </div>
          ) : selectedApplication.status === 'rejected' ? (
            <div className="rounded-[32px] border border-red-100 bg-red-50 p-6">
              <div className="flex items-center gap-3 mb-3"><KeyRound size={20} className="text-red-700" /><h3 className="text-lg font-black text-red-900">Rejected Application</h3></div>
              <p className="text-sm text-red-900">This application was rejected and the applicant was notified by email.</p>
              <div className="mt-4 rounded-2xl bg-white/70 border border-red-100 px-4 py-4"><p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2">Rejection Reason</p><p className="text-sm font-bold text-red-900">{selectedApplication.rejectedReason || 'No rejection reason recorded.'}</p></div>
            </div>
          ) : (
            <div className="rounded-[32px] border border-yellow-100 bg-yellow-50 p-6">
              <div className="flex items-center gap-3 mb-3"><Clock3 size={20} className="text-yellow-700" /><h3 className="text-lg font-black text-yellow-900">Pending Admin Decision</h3></div>
              <p className="text-sm text-yellow-900">This rider applicant has not received credentials yet. Once approved, the platform will issue temporary access details and queue the approval email.</p>
            </div>
          )}
          <div>
            <h3 className="text-lg font-black text-gray-900 mb-4">Admin Actions</h3>
            {selectedApplication.status === 'pending' && (
              <div className="rounded-[28px] border border-gray-100 bg-gray-50 p-5 mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Rejection Reason</p>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-orange-300 resize-none" placeholder="Explain what is missing or what the rider should correct before reapplying." />
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {selectedApplication.status === 'pending' && (
                <>
                  <button onClick={() => void approveApplication(selectedApplication.id)} disabled={approvingApplicationId === selectedApplication.id || rejectingApplicationId === selectedApplication.id} className="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-600 transition-all flex items-center justify-center"><UserCheck size={16} className="mr-2" />{approvingApplicationId === selectedApplication.id ? 'Approving...' : 'Approve Rider'}</button>
                  <button onClick={() => void rejectApplication(selectedApplication.id)} disabled={rejectingApplicationId === selectedApplication.id || approvingApplicationId === selectedApplication.id} className="px-5 py-3 rounded-2xl bg-red-500 text-white font-black text-sm hover:bg-red-600 transition-all flex items-center justify-center"><X size={16} className="mr-2" />{rejectingApplicationId === selectedApplication.id ? 'Sending Rejection...' : 'Reject Rider'}</button>
                </>
              )}
              <button type="button" onClick={() => setSelectedApplication(null)} className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-700 font-black text-sm hover:bg-gray-200 transition-all">Close Panel</button>
            </div>
          </div>
        </Drawer>
      )}

      {selectedRider && (
        <Drawer title="Rider Details" heading={selectedRider.name} subtitle="Review rider availability, delivery capacity, and earnings from one operational panel." onClose={() => setSelectedRider(null)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard label="Status" value={String(selectedRider.status).toUpperCase()} />
            <MetricCard label="Operational State" value={String(selectedRider.operationalStatus).toUpperCase()} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard icon={<Mail size={16} />} label="Email" value={selectedRider.email} breakAll />
            <InfoCard icon={<Phone size={16} />} label="Phone" value={selectedRider.phone || 'No phone on file'} />
            <InfoCard icon={<Bike size={16} />} label="Username" value={selectedRider.username || 'N/A'} />
            <InfoCard icon={<CalendarDays size={16} />} label="Joined" value={new Date(selectedRider.createdAt).toLocaleString()} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard label="Completed" value={selectedRider.totalDeliveries} />
            <MetricCard label="Assigned" value={selectedRider.assignedDeliveries} />
            <MetricCard label="Active Jobs" value={selectedRider.activeDeliveries} tone="orange" />
            <MetricCard label="Earnings" value={`RWF ${selectedRider.earnings.toLocaleString()}`} />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 mb-4">Rider Actions</h3>
            <div className="flex flex-wrap gap-3">
              <ActionButton tone="green" label="Activate" icon={<UserCheck size={14} />} onClick={() => void handleStatusChange(selectedRider.id, 'active')} disabled={busyId === selectedRider.id} />
              <ActionButton tone="gray" label="Set Offline" icon={<Truck size={14} />} onClick={() => void handleStatusChange(selectedRider.id, 'offline')} disabled={busyId === selectedRider.id} />
              <ActionButton tone="red" label="Suspend" icon={<UserX size={14} />} onClick={() => void handleStatusChange(selectedRider.id, 'suspended')} disabled={busyId === selectedRider.id} />
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};

const StatCard = ({ label, value, tone }: { label: string; value: string | number; tone: 'orange' | 'gray' | 'green' | 'red' }) => {
  const colors = { orange: 'text-orange-500', gray: 'text-gray-900', green: 'text-emerald-600', red: 'text-red-500' };
  return <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p><p className={`text-2xl font-black ${colors[tone]}`}>{value}</p></div>;
};

const SectionHeader = ({ title, subtitle, loading }: { title: string; subtitle: string; loading: boolean }) => (
  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
    <div><h2 className="text-lg font-black text-gray-900">{title}</h2><p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{subtitle}</p></div>
    {loading && <Loader2 size={18} className="animate-spin text-orange-500" />}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status === 'approved' || status === 'active' ? 'bg-emerald-50 text-emerald-600' : status === 'rejected' || status === 'suspended' ? 'bg-red-50 text-red-500' : status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{status}</span>;
const Metric = ({ label, value, accent }: { label: string; value: string | number; accent?: 'orange' }) => <div className="bg-gray-50 rounded-2xl p-4"><p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p><p className={`text-xl font-black ${accent === 'orange' ? 'text-orange-500' : 'text-gray-900'}`}>{value}</p></div>;
const MetricCard = ({ label, value, tone }: { label: string; value: string | number; tone?: 'orange' | 'green' }) => <div className={`rounded-3xl border ${tone === 'green' ? 'border-emerald-100 bg-emerald-50/60' : tone === 'orange' ? 'border-orange-100 bg-orange-50/60' : 'border-gray-100 bg-gray-50'} px-5 py-4`}><p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{label}</p><p className="text-sm font-bold text-gray-900">{value}</p></div>;
const InfoCard = ({ icon, label, value, breakAll }: { icon: React.ReactNode; label: string; value: string; breakAll?: boolean }) => <div className="rounded-3xl border border-gray-100 px-5 py-4"><div className="flex items-center gap-2 text-gray-400 mb-3">{icon}<p className="text-[10px] font-black uppercase tracking-widest">{label}</p></div><p className={`text-sm font-semibold text-gray-900 ${breakAll ? 'break-all' : ''}`}>{value}</p></div>;
const ActionButton = ({ tone, label, icon, onClick, disabled }: { tone: 'green' | 'gray' | 'red'; label: string; icon: React.ReactNode; onClick: any; disabled?: boolean }) => <button onClick={onClick} disabled={disabled} className={`px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center gap-2 ${tone === 'green' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : tone === 'red' ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{icon}{label}</button>;
const EmptyState = ({ title, body }: { title: string; body: string }) => <div className="p-14 text-center"><ShieldCheck size={40} className="mx-auto text-gray-200 mb-4" /><h3 className="text-xl font-black text-gray-900">{title}</h3><p className="text-sm text-gray-400 mt-2">{body}</p></div>;

const Drawer = ({ title, heading, subtitle, onClose, children }: { title: string; heading: string; subtitle: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/40 backdrop-blur-sm">
    <button type="button" aria-label={`Close ${title}`} className="flex-1 cursor-default" onClick={onClose} />
    <div className="w-full max-w-2xl h-full bg-white shadow-2xl border-l border-gray-100 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-8 py-6 flex items-start justify-between gap-4">
        <div><p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">{title}</p><h2 className="text-2xl font-black text-gray-900">{heading}</h2><p className="text-sm text-gray-500 mt-2">{subtitle}</p></div>
        <button type="button" onClick={onClose} className="w-11 h-11 rounded-2xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-orange-200 flex items-center justify-center transition-colors"><X size={18} /></button>
      </div>
      <div className="p-8 space-y-8">{children}</div>
    </div>
  </div>
);

export default RiderManagement;
