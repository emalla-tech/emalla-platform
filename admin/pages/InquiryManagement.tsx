import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Mail, MessageSquare, Search, UserCheck } from 'lucide-react';
import AdminToast from '../../components/AdminToast';
import { useAuth } from '../../auth/AuthContext';
import { AdminService } from '../../services/adminService';

type InquiryStatus = 'new' | 'replied' | 'resolved';

type Inquiry = {
  id: string;
  ticketNumber?: string;
  type: 'contact' | 'investor' | 'support' | 'return' | 'refund';
  name: string;
  email: string;
  subject: string;
  company?: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt?: string;
  repliedAt?: string | null;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  internalNotes?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  orderNumber?: string | null;
  reason?: string;
  requestedAmount?: number;
};

const FILTERS = ['all', 'support', 'return', 'refund', 'contact', 'investor'] as const;

const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: 'bg-amber-100 text-amber-700',
  replied: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700'
};

const InquiryManagement: React.FC = () => {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'success' | 'error' | 'info'>('success');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await AdminService.getInquiries(filter);
        setInquiries(data);
        setNoteDrafts(
          Object.fromEntries(
            data.map((entry: Inquiry) => [entry.id, entry.internalNotes || ''])
          )
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filter]);

  const filteredInquiries = useMemo(
    () =>
      inquiries.filter((entry) => {
        const keyword = query.trim().toLowerCase();
        if (!keyword) return true;

        return [
          entry.name,
          entry.email,
          entry.subject,
          entry.company || '',
          entry.message,
          entry.assignedAdminName || '',
          entry.internalNotes || ''
        ].some((value) => value.toLowerCase().includes(keyword));
      }),
    [inquiries, query]
  );

  const showToast = (message: string, tone: 'success' | 'error' | 'info') => {
    setToastTone(tone);
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const syncInquiry = (updated: Inquiry) => {
    setInquiries((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
    setNoteDrafts((current) => ({ ...current, [updated.id]: updated.internalNotes || '' }));
  };

  const handleStatusUpdate = async (inquiryId: string, status: InquiryStatus) => {
    setBusyId(inquiryId);
    try {
      const updated = await AdminService.updateInquiry(inquiryId, { status });
      syncInquiry(updated);
      const message =
        status === 'resolved'
          ? 'Inquiry marked as resolved.'
          : status === 'replied'
            ? 'Inquiry marked as replied.'
            : 'Inquiry reopened.';
      showToast(message, status === 'resolved' ? 'success' : 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update inquiry status.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleAssignToSelf = async (inquiryId: string) => {
    setBusyId(inquiryId);
    try {
      const updated = await AdminService.updateInquiry(inquiryId, { assignToSelf: true });
      syncInquiry(updated);
      showToast('Inquiry assigned to your admin account.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to assign inquiry.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveNotes = async (inquiryId: string) => {
    setBusyId(inquiryId);
    try {
      const updated = await AdminService.updateInquiry(inquiryId, {
        internalNotes: noteDrafts[inquiryId] || ''
      });
      syncInquiry(updated);
      showToast('Internal notes saved.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save notes.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleSendResponse = async (inquiryId: string) => {
    const responseMessage = (responseDrafts[inquiryId] || '').trim();
    if (!responseMessage) {
      showToast('Write a customer response before sending.', 'error');
      return;
    }

    setBusyId(inquiryId);
    try {
      const updated = await AdminService.updateInquiry(inquiryId, { responseMessage });
      syncInquiry(updated);
      setResponseDrafts((current) => ({ ...current, [inquiryId]: '' }));
      showToast('Response sent to the customer by email and notification.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to send response.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      <AdminToast message={toast} tone={toastTone} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Inquiries Desk</h1>
          <p className="text-gray-500">Manage customer support tickets, returns, refunds, contact messages, and investor inquiries.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
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

      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 font-bold outline-none"
            placeholder="Search by name, email, subject, company..."
          />
        </div>
      </div>

      {loading ? (
        <div className="p-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInquiries.map((entry) => {
            const isBusy = busyId === entry.id;
            const isAssignedToCurrentAdmin = Boolean(user?.id && entry.assignedAdminId === user.id);
            const draftNotes = noteDrafts[entry.id] ?? entry.internalNotes ?? '';

            return (
              <div key={entry.id} className="bg-white border border-gray-100 rounded-[30px] p-6 shadow-sm">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-black text-gray-900">{entry.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        entry.type === 'investor'
                          ? 'bg-purple-100 text-purple-700'
                          : entry.type === 'refund'
                            ? 'bg-rose-100 text-rose-700'
                            : entry.type === 'return'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                      }`}>
                        {entry.type}
                      </span>
                      {entry.priority ? (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          entry.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {entry.priority} priority
                        </span>
                      ) : null}
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_STYLES[entry.status]}`}>
                        {entry.status}
                      </span>
                      {entry.assignedAdminName ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-700">
                          Assigned: {entry.assignedAdminName}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center text-sm text-gray-600 font-bold">
                      <Mail size={16} className="mr-2 text-gray-400" />
                      {entry.email}
                    </div>

                    {entry.company ? (
                      <div className="flex items-center text-sm text-gray-600 font-bold">
                        <Building2 size={16} className="mr-2 text-gray-400" />
                        {entry.company}
                      </div>
                    ) : null}

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Subject</p>
                      <p className="text-sm font-bold text-gray-900">{entry.subject}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Message</p>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{entry.message}</p>
                    </div>
                    {entry.orderNumber || entry.reason ? (
                      <div className="grid gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4 sm:grid-cols-2">
                        {entry.orderNumber ? (
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Related Order</p>
                            <p className="mt-1 text-sm font-black text-gray-900">{entry.orderNumber}</p>
                          </div>
                        ) : null}
                        {entry.reason ? (
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Request Reason</p>
                            <p className="mt-1 text-sm font-black text-gray-900">{entry.reason.replaceAll('_', ' ')}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="bg-gray-50 border border-gray-100 rounded-[28px] p-5">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Internal Notes</p>
                        {entry.repliedAt ? (
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                            Replied {new Date(entry.repliedAt).toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                      <textarea
                        value={draftNotes}
                        onChange={(event) =>
                          setNoteDrafts((current) => ({
                            ...current,
                            [entry.id]: event.target.value
                          }))
                        }
                        rows={4}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none resize-none"
                        placeholder="Add private admin notes, follow-up context, or callback details..."
                      />
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleSaveNotes(entry.id)}
                          disabled={isBusy}
                          className="px-4 py-3 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
                        >
                          Save Notes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAssignToSelf(entry.id)}
                          disabled={isBusy || isAssignedToCurrentAdmin}
                          className="px-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
                        >
                          {isAssignedToCurrentAdmin ? 'Assigned to You' : 'Assign to Me'}
                        </button>
                      </div>
                    </div>
                    <div className="rounded-[28px] border border-blue-100 bg-blue-50 p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Customer Response</p>
                      <p className="mt-1 text-xs font-medium text-blue-700">This message will be sent by email and shown as a support update.</p>
                      <textarea
                        value={responseDrafts[entry.id] || ''}
                        onChange={(event) => setResponseDrafts((current) => ({ ...current, [entry.id]: event.target.value }))}
                        rows={4}
                        className="mt-4 w-full resize-none rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-gray-700 outline-none"
                        placeholder="Write a clear response or resolution for the customer..."
                      />
                      <button
                        type="button"
                        onClick={() => handleSendResponse(entry.id)}
                        disabled={isBusy}
                        className="mt-3 rounded-2xl bg-blue-600 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-60"
                      >
                        Send Customer Response
                      </button>
                    </div>
                  </div>

                  <div className="xl:min-w-[260px] rounded-3xl bg-gray-50 border border-gray-100 p-5">
                    <div className="flex items-center gap-2 text-gray-400 mb-3">
                      <MessageSquare size={16} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Submission</p>
                    </div>
                    <p className="text-sm font-black text-gray-900">{new Date(entry.createdAt).toLocaleString()}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-4">Inquiry ID</p>
                    <p className="text-xs font-bold text-gray-600 mt-1 break-all">{entry.ticketNumber || entry.id}</p>
                    <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
                      <UserCheck size={16} className="mt-0.5 text-gray-400" />
                      <div>
                        <p className="font-black text-gray-900">Owner</p>
                        <p className="font-bold">{entry.assignedAdminName || 'Unassigned'}</p>
                      </div>
                    </div>
                    <div className="mt-5 pt-5 border-t border-gray-200 space-y-3">
                      {entry.status !== 'replied' ? (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(entry.id, 'replied')}
                          disabled={isBusy}
                          className="w-full px-4 py-3 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-60"
                        >
                          Mark Reply Sent
                        </button>
                      ) : null}

                      {entry.status === 'resolved' ? (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(entry.id, 'new')}
                          disabled={isBusy}
                          className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all disabled:opacity-60"
                        >
                          Reopen Inquiry
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(entry.id, 'resolved')}
                          disabled={isBusy}
                          className="w-full px-4 py-3 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-60"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredInquiries.length === 0 && (
            <div className="text-center py-20 bg-white border border-gray-100 rounded-[30px]">
              <p className="text-gray-500 font-bold">No inquiries found for this filter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InquiryManagement;
