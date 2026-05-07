import React, { useEffect, useState } from 'react';
import { CheckCircle2, Mail, Phone, Search, UserCircle2, X, BadgeCheck, Shield, KeyRound, ImagePlus, FileBadge } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import AdminToast from '../../components/AdminToast';

type SellerApplication = {
  id: string;
  businessName: string;
  category: string;
  email: string;
  phone: string;
  logoUrl?: string;
  supportingDocumentUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  temporaryUsername?: string;
};

const isImageAsset = (url = '') =>
  url.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(url.split('?')[0] || '');

const SellerApplications: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'success' | 'error' | 'info'>('success');
  const [selectedApplication, setSelectedApplication] = useState<SellerApplication | null>(null);
  const [autoOpened, setAutoOpened] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const focusApplicationId = searchParams.get('applicationId');
  const focusSellerEmail = searchParams.get('sellerEmail');

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAdminSellerApplications(activeFilter);
      setApplications(response.applications || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [activeFilter]);

  useEffect(() => {
    if (focusSellerEmail) {
      setQuery(focusSellerEmail);
      setActiveFilter('all');
    }
  }, [focusSellerEmail]);

  useEffect(() => {
    if (autoOpened || !applications.length) return;

    const target = applications.find(
      (application) =>
        (focusApplicationId && application.id === focusApplicationId) ||
        (focusSellerEmail && application.email === focusSellerEmail)
    );

    if (target) {
      setSelectedApplication(target);
      setAutoOpened(true);
    }
  }, [applications, autoOpened, focusApplicationId, focusSellerEmail]);

  useEffect(() => {
    if (!selectedApplication) return;

    const refreshedSelection = applications.find((application) => application.id === selectedApplication.id);
    if (refreshedSelection) {
      setSelectedApplication(refreshedSelection);
    }
  }, [applications, selectedApplication]);

  const approveSeller = async (applicationId: string) => {
    setApprovingId(applicationId);
    try {
      await apiClient.approveAdminSellerApplication(applicationId);
      setToastTone('success');
      setMessage('Seller approved successfully. Credentials email has been queued.');
      await loadApplications();
    } catch (error) {
      setToastTone('error');
      setMessage(error instanceof Error ? error.message : 'Failed to approve seller application.');
    } finally {
      setApprovingId(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const rejectSeller = async (applicationId: string) => {
    const trimmedReason = rejectReason.trim();
    if (!trimmedReason) {
      setToastTone('error');
      setMessage('Add a rejection reason before sending the decision.');
      setTimeout(() => setMessage(null), 4000);
      return;
    }

    setRejectingId(applicationId);
    try {
      await apiClient.rejectAdminSellerApplication(applicationId, trimmedReason);
      setToastTone('success');
      setMessage('Seller application rejected and email has been queued.');
      setRejectReason('');
      await loadApplications();
    } catch (error) {
      setToastTone('error');
      setMessage(error instanceof Error ? error.message : 'Failed to reject seller application.');
    } finally {
      setRejectingId(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const filtered = applications.filter((application) => {
    const keyword = query.toLowerCase().trim();
    if (!keyword) return true;
    return (
      application.businessName.toLowerCase().includes(keyword) ||
      application.email.toLowerCase().includes(keyword) ||
      application.phone.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="space-y-8">
      <AdminToast message={message} tone={toastTone} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Seller Approval Portal</h1>
          <p className="text-gray-500">Review onboarding requests and issue temporary login credentials.</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500">
          Pending Applications: {applications.filter((entry) => entry.status === 'pending').length}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[30px] p-6 shadow-sm flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 font-bold outline-none"
            placeholder="Search by business, email, or phone..."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeFilter === filter ? 'bg-black text-white' : 'bg-gray-50 text-gray-500'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((application) => (
            <div
              key={application.id}
              onClick={() => setSelectedApplication(application)}
              className={`bg-white border rounded-[30px] p-6 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                (focusApplicationId && application.id === focusApplicationId) || (focusSellerEmail && application.email === focusSellerEmail)
                  ? 'border-orange-300 ring-2 ring-orange-100'
                  : 'border-gray-100'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-black text-gray-900">{application.businessName}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        application.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : application.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {application.status}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 font-bold">
                    <Mail size={16} className="mr-2 text-gray-400" />
                    {application.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 font-bold">
                    <Phone size={16} className="mr-2 text-gray-400" />
                    {application.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 font-bold">
                    <UserCircle2 size={16} className="mr-2 text-gray-400" />
                    Category: {application.category}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {application.logoUrl ? (
                      <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-[10px] font-black uppercase tracking-widest">
                        Logo attached
                      </span>
                    ) : null}
                    {application.supportingDocumentUrl ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                        Document attached
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Submitted: {new Date(application.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col gap-3 min-w-[260px]">
                  {application.status === 'pending' && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        approveSeller(application.id);
                      }}
                      disabled={approvingId === application.id}
                      className="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-600 transition-all flex items-center justify-center"
                    >
                      <CheckCircle2 size={16} className="mr-2" />
                      {approvingId === application.id ? 'Approving...' : 'Approve Seller'}
                    </button>
                  )}

                  {application.status === 'approved' && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                      <p className="text-[10px] font-black uppercase tracking-widest">Credentials Sent</p>
                      <p className="text-xs font-bold mt-2">Username: {application.temporaryUsername || 'N/A'}</p>
                      <p className="text-xs font-bold">Password sent by email only</p>
                    </div>
                  )}

                  {application.status === 'rejected' && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700">
                      <p className="text-[10px] font-black uppercase tracking-widest">Rejected</p>
                      <p className="text-xs font-bold mt-2">{application.rejectedReason || 'Reason shared with applicant by email.'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!filtered.length && (
            <div className="text-center py-20 bg-white border border-gray-100 rounded-[30px]">
              <p className="text-gray-500 font-bold">No seller applications found.</p>
            </div>
          )}
        </div>
      )}

      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/40 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close seller application details"
            className="flex-1 cursor-default"
            onClick={() => setSelectedApplication(null)}
          />
          <div className="w-full max-w-2xl h-full bg-white shadow-2xl border-l border-gray-100 overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-8 py-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Seller Application Details</p>
                <h2 className="text-2xl font-black text-gray-900">{selectedApplication.businessName}</h2>
                <p className="text-sm text-gray-500 mt-2">Review onboarding details, approval state, and issued temporary access credentials.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className="w-11 h-11 rounded-2xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-orange-200 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Application Status</p>
                  <p className="text-sm font-bold text-gray-900 uppercase">{selectedApplication.status}</p>
                </div>
                <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Submitted At</p>
                  <p className="text-sm font-bold text-gray-900">{new Date(selectedApplication.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {(selectedApplication.logoUrl || selectedApplication.supportingDocumentUrl) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedApplication.logoUrl ? (
                    <div className="rounded-[32px] border border-gray-100 overflow-hidden bg-white">
                      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <ImagePlus size={16} className="text-orange-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Business Logo</p>
                      </div>
                      <img src={selectedApplication.logoUrl} alt={`${selectedApplication.businessName} logo`} className="w-full h-48 object-cover" />
                    </div>
                  ) : null}
                  {selectedApplication.supportingDocumentUrl ? (
                    <div className="rounded-[32px] border border-gray-100 overflow-hidden bg-white">
                      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <FileBadge size={16} className="text-emerald-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Supporting Document</p>
                      </div>
                      {isImageAsset(selectedApplication.supportingDocumentUrl) ? (
                        <img src={selectedApplication.supportingDocumentUrl} alt={`${selectedApplication.businessName} supporting document`} className="w-full h-48 object-cover" />
                      ) : (
                        <a
                          href={selectedApplication.supportingDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-48 items-center justify-center bg-emerald-50 text-sm font-black text-emerald-700 hover:text-emerald-900"
                        >
                          Open supporting document
                        </a>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-3xl border border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <Mail size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Business Email</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 break-all">{selectedApplication.email}</p>
                </div>
                <div className="rounded-3xl border border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <Phone size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Phone Number</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{selectedApplication.phone}</p>
                </div>
                <div className="rounded-3xl border border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <UserCircle2 size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Primary Category</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{selectedApplication.category}</p>
                </div>
                <div className="rounded-3xl border border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-3">
                    <Shield size={16} />
                    <p className="text-[10px] font-black uppercase tracking-widest">Application ID</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 break-all">{selectedApplication.id}</p>
                </div>
              </div>

              {selectedApplication.status === 'approved' ? (
                <div className="rounded-[32px] border border-emerald-100 bg-emerald-50 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BadgeCheck size={20} className="text-emerald-600" />
                    <h3 className="text-lg font-black text-emerald-800">Approved Seller Access</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-white/70 px-4 py-4 border border-emerald-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Temporary Username</p>
                      <p className="text-sm font-bold text-emerald-900">{selectedApplication.temporaryUsername || 'Not available'}</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 px-4 py-4 border border-emerald-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Temporary Password</p>
                      <p className="text-sm font-bold text-emerald-900">Sent to applicant email only</p>
                    </div>
                  </div>
                  <p className="text-sm text-emerald-800 mt-4">
                    Approval email was prepared with temporary credentials so the seller can sign in directly to Seller Hub.
                  </p>
                </div>
              ) : selectedApplication.status === 'rejected' ? (
                <div className="rounded-[32px] border border-red-100 bg-red-50 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <KeyRound size={20} className="text-red-700" />
                    <h3 className="text-lg font-black text-red-900">Rejected Application</h3>
                  </div>
                  <p className="text-sm text-red-900">
                    This application was rejected and the applicant was notified by email.
                  </p>
                  <div className="mt-4 rounded-2xl bg-white/70 border border-red-100 px-4 py-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2">Rejection Reason</p>
                    <p className="text-sm font-bold text-red-900">{selectedApplication.rejectedReason || 'No rejection reason recorded.'}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-[32px] border border-yellow-100 bg-yellow-50 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <KeyRound size={20} className="text-yellow-700" />
                    <h3 className="text-lg font-black text-yellow-900">Pending Admin Decision</h3>
                  </div>
                  <p className="text-sm text-yellow-900">
                    This applicant has not received seller credentials yet. Once approved, the platform will issue temporary access details and queue the approval email.
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-black text-gray-900 mb-4">Admin Actions</h3>
                {selectedApplication.status === 'pending' ? (
                  <div className="rounded-[28px] border border-gray-100 bg-gray-50 p-5 mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Rejection Reason</p>
                    <textarea
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      rows={4}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-orange-300 resize-none"
                      placeholder="Explain what is missing or what the seller should correct before reapplying."
                    />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  {selectedApplication.status === 'pending' && (
                    <>
                      <button
                        onClick={() => approveSeller(selectedApplication.id)}
                        disabled={approvingId === selectedApplication.id || rejectingId === selectedApplication.id}
                        className="px-5 py-3 rounded-2xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-600 transition-all flex items-center justify-center"
                      >
                        <CheckCircle2 size={16} className="mr-2" />
                        {approvingId === selectedApplication.id ? 'Approving...' : 'Approve Seller'}
                      </button>
                      <button
                        onClick={() => rejectSeller(selectedApplication.id)}
                        disabled={rejectingId === selectedApplication.id || approvingId === selectedApplication.id}
                        className="px-5 py-3 rounded-2xl bg-red-500 text-white font-black text-sm hover:bg-red-600 transition-all flex items-center justify-center"
                      >
                        <X size={16} className="mr-2" />
                        {rejectingId === selectedApplication.id ? 'Sending Rejection...' : 'Reject Seller'}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedApplication(null)}
                    className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-700 font-black text-sm hover:bg-gray-200 transition-all"
                  >
                    Close Panel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerApplications;
