import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  Rocket,
  Globe,
  Users,
  Loader2,
  ArrowRight,
  Home,
  MessageSquare,
  Sparkles,
  ImagePlus,
  FileBadge,
  ShieldCheck,
  Search,
  Clock3,
  BadgeCheck,
  CircleX
} from 'lucide-react';
import { MerchantService } from '../services/merchantService';
import { uploadService } from '../services/uploadService';

const BecomeSeller: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionMode, setSubmissionMode] = useState<'submitted' | 'resubmitted'>('submitted');
  const [submissionSummary, setSubmissionSummary] = useState({
    logoSubmitted: false,
    supportingDocumentSubmitted: false
  });
  const [statusLookup, setStatusLookup] = useState({ email: '', phone: '' });
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusResult, setStatusResult] = useState<null | {
    id: string;
    businessName: string;
    status: 'pending' | 'approved' | 'rejected';
    category: string;
    createdAt: string;
    approvedAt?: string;
    rejectedAt?: string;
    rejectedReason?: string;
    temporaryUsername?: string;
  }>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    category: 'Fashion',
    email: '',
    phone: '',
    logoUrl: '',
    supportingDocumentUrl: ''
  });

  const isImagePreview = (url: string) =>
    url.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(url.split('?')[0] || '');

  const handleAssetUpload = async (file: File, kind: 'logo' | 'document') => {
    const setUploading = kind === 'logo' ? setIsUploadingLogo : setIsUploadingDocument;
    const field = kind === 'logo' ? 'logoUrl' : 'supportingDocumentUrl';

    setUploading(true);
    setError(null);
    try {
      const upload =
        kind === 'document'
          ? await uploadService.uploadSellerDocument(file)
          : await uploadService.uploadSellerBrandImage(file);
      setFormData((current) => ({
        ...current,
        [field]: upload.url
      }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload seller document.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await MerchantService.registerSeller(formData);
      setSubmissionMode(result.action === 'resubmitted' ? 'resubmitted' : 'submitted');
      setSubmissionSummary({
        logoSubmitted: Boolean(formData.logoUrl),
        supportingDocumentSubmitted: Boolean(formData.supportingDocumentUrl)
      });
      setIsSubmitted(true);
      setFormData({
        businessName: '',
        category: 'Fashion',
        email: '',
        phone: '',
        logoUrl: '',
        supportingDocumentUrl: ''
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Submission failed', error);
      setError(error instanceof Error ? error.message : 'Something went wrong. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusCheck = async (event: React.FormEvent) => {
    event.preventDefault();
    setCheckingStatus(true);
    setError(null);
    try {
      const application = await MerchantService.checkSellerApplicationStatus(statusLookup);
      setStatusResult(application);
    } catch (lookupError) {
      setStatusResult(null);
      setError(lookupError instanceof Error ? lookupError.message : 'Unable to check seller application status.');
    } finally {
      setCheckingStatus(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-white px-4 py-20 animate-in fade-in duration-700">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-emerald-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto relative z-10 shadow-xl shadow-emerald-100/50">
              <CheckCircle size={56} strokeWidth={2.5} />
            </div>
            <div className="absolute -top-2 -right-2 text-orange-500 animate-bounce">
              <Sparkles size={24} />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
              {submissionMode === 'resubmitted' ? 'Application Resubmitted' : 'Application Received'} <br /> <span className="text-orange-500">Successfully!</span>
            </h1>
            <div className="max-w-lg mx-auto bg-gray-50 p-8 rounded-[32px] border border-gray-100">
              <p className="text-lg text-gray-600 leading-relaxed font-medium">
                Thank you for registering with <span className="text-gray-900 font-bold">E-Malla Rwanda</span>.
                {submissionMode === 'resubmitted'
                  ? ' Your updated seller application has been sent back for admin review.'
                  : ' Your seller application has been received and is currently under review.'}
              </p>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Expected Timeline</p>
                <p className="text-gray-900 font-black text-lg mt-1">24 - 48 Hours</p>
                <p className="text-xs text-gray-400 mt-2 italic">
                  A confirmation email has been sent. Our team will review and email you the result.
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  <div className="rounded-2xl bg-white px-4 py-3 border border-gray-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Logo Submitted</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{submissionSummary.logoSubmitted ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 border border-gray-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Supporting File</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{submissionSummary.supportingDocumentSubmitted ? 'Attached' : 'Not attached'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/"
              className="w-full sm:w-auto bg-black text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-orange-600 transition-all shadow-xl shadow-black/10 flex items-center justify-center group active:scale-95"
            >
              <Home size={20} className="mr-3" />
              Back to Home
            </Link>
            <a
              href="https://wa.me/250788000000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-white text-gray-900 border-2 border-gray-100 px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-50 transition-all flex items-center justify-center group active:scale-95"
            >
              <MessageSquare size={20} className="mr-3 text-emerald-500" />
              Contact Support
            </a>
          </div>

          <div className="pt-10 opacity-40 flex items-center justify-center space-x-2">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            <p className="text-[10px] font-black uppercase tracking-[4px] text-gray-500">Official Merchant Portal</p>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 inline-block">
            Merchant Partnerships
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 tracking-tight">Grow Your Business Online</h1>
          <p className="text-xl text-gray-500 leading-relaxed font-medium">
            E-Malla Rwanda provides the infrastructure you need to sell to customers across the country. We handle the digital store, payments, and delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
          {[
            {
              icon: <Rocket className="text-orange-500" size={40} />,
              title: 'Quick Setup',
              desc: 'Register your store and start listing products in less than 24 hours.'
            },
            {
              icon: <Globe className="text-orange-500" size={40} />,
              title: 'Nationwide Reach',
              desc: 'Sell to customers in Kigali, Musanze, Rubavu, and every corner of Rwanda.'
            },
            {
              icon: <Users className="text-orange-500" size={40} />,
              title: 'Dedicated Support',
              desc: 'Our merchant success team is here to help you optimize your sales.'
            }
          ].map((item, idx) => (
            <div key={idx} className="p-10 bg-gray-50 rounded-[40px] text-center border border-transparent hover:border-orange-200 transition-all group">
              <div className="mb-8 flex justify-center group-hover:scale-110 transition-transform">{item.icon}</div>
              <h3 className="text-2xl font-black mb-4 text-gray-900">{item.title}</h3>
              <p className="text-gray-600 font-medium">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 rounded-[60px] p-8 md:p-20 text-white flex flex-col lg:flex-row items-center relative overflow-hidden">
          <div className="absolute inset-0 imigongo-bg opacity-5"></div>
          <div className="lg:w-1/2 mb-12 lg:mb-0 relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-8 text-white leading-tight">
              Ready to join our <br /> <span className="text-orange-500">community?</span>
            </h2>
            <ul className="space-y-6">
              {[
                'Access to 100,000+ potential customers',
                'Integrated Mobile Money & Card payments',
                'Warehousing & Nationwide Logistics'
              ].map((text, i) => (
                <li key={i} className="flex items-center space-x-4">
                  <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                    <CheckCircle size={14} strokeWidth={3} />
                  </div>
                  <span className="text-lg font-medium text-gray-300">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2 w-full relative z-10">
            <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl shadow-black/50">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
                    {error}
                  </div>
                ) : null}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Business Name</label>
                  <input
                    required
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 outline-none transition-all text-black font-bold"
                    placeholder="e.g. Inyange Fashion Ltd"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Primary Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 outline-none transition-all text-black font-bold appearance-none cursor-pointer"
                  >
                    <option>Fashion</option>
                    <option>Electronics</option>
                    <option>Agriculture</option>
                    <option>Crafts</option>
                    <option>Health & Beauty</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-[28px] border border-gray-100 bg-gray-50 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-white text-orange-500 flex items-center justify-center shadow-sm">
                        <ImagePlus size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">Business Logo</p>
                        <p className="text-xs text-gray-500">Optional branding for admin review and future store setup.</p>
                      </div>
                    </div>
                    {formData.logoUrl ? (
                      <div className="mb-4 rounded-2xl overflow-hidden border border-gray-200 bg-white">
                        <img src={formData.logoUrl} alt="Business logo preview" loading="lazy" decoding="async" className="w-full h-32 object-cover" />
                      </div>
                    ) : null}
                    <label className="inline-flex items-center justify-center w-full px-4 py-3 rounded-2xl bg-white text-gray-900 font-black text-sm cursor-pointer border border-gray-200">
                      {isUploadingLogo ? <Loader2 size={18} className="mr-2 animate-spin" /> : <ImagePlus size={18} className="mr-2" />}
                      {formData.logoUrl ? 'Replace Logo' : 'Upload Logo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingLogo}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void handleAssetUpload(file, 'logo');
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  <div className="rounded-[28px] border border-gray-100 bg-gray-50 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-2xl bg-white text-emerald-500 flex items-center justify-center shadow-sm">
                        <FileBadge size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">Supporting Document</p>
                        <p className="text-xs text-gray-500">Upload a verification image or PDF like ID, license, or certificate.</p>
                      </div>
                    </div>
                    {formData.supportingDocumentUrl ? (
                      <div className="mb-4 rounded-2xl overflow-hidden border border-gray-200 bg-white">
                        {isImagePreview(formData.supportingDocumentUrl) ? (
                          <img src={formData.supportingDocumentUrl} alt="Supporting document preview" loading="lazy" decoding="async" className="w-full h-32 object-cover" />
                        ) : (
                          <a href={formData.supportingDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex h-32 items-center justify-center text-sm font-black text-emerald-700 hover:text-emerald-900">
                            View uploaded document
                          </a>
                        )}
                      </div>
                    ) : null}
                    <label className="inline-flex items-center justify-center w-full px-4 py-3 rounded-2xl bg-white text-gray-900 font-black text-sm cursor-pointer border border-gray-200">
                      {isUploadingDocument ? <Loader2 size={18} className="mr-2 animate-spin" /> : <FileBadge size={18} className="mr-2" />}
                      {formData.supportingDocumentUrl ? 'Replace File' : 'Upload File'}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        disabled={isUploadingDocument}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void handleAssetUpload(file, 'document');
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Business Email</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 outline-none transition-all text-black font-bold"
                    placeholder="sales@yourbusiness.rw"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">MoMo Phone Number</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 outline-none transition-all text-black font-bold"
                    placeholder="+250 78x xxx xxx"
                  />
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-4 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-emerald-900">Admin review package</p>
                    <p className="text-xs text-emerald-800 mt-1">
                      Uploaded branding and verification files will appear inside the admin approval page for faster onboarding.
                    </p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingLogo || isUploadingDocument}
                  className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-3 animate-spin" size={24} />
                      Processing...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight className="ml-3" size={20} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-white border border-gray-100 rounded-[48px] shadow-sm p-8 md:p-12">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10">
            <div className="lg:max-w-xl">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-700 text-[10px] font-black uppercase tracking-widest">
                <Search size={14} />
                Application Tracker
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-6">Check Your Seller Application Status</h2>
              <p className="text-gray-500 text-base mt-4 leading-relaxed">
                Enter the same business email and phone number used during application so you can see whether your request is pending, approved, or needs updates.
              </p>
            </div>

            <div className="w-full lg:max-w-xl">
              <form onSubmit={handleStatusCheck} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    required
                    type="email"
                    value={statusLookup.email}
                    onChange={(event) => setStatusLookup((current) => ({ ...current, email: event.target.value }))}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 outline-none transition-all text-black font-bold"
                    placeholder="Business email"
                  />
                  <input
                    required
                    type="tel"
                    value={statusLookup.phone}
                    onChange={(event) => setStatusLookup((current) => ({ ...current, phone: event.target.value }))}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 outline-none transition-all text-black font-bold"
                    placeholder="Phone number"
                  />
                </div>
                <button
                  type="submit"
                  disabled={checkingStatus}
                  className="inline-flex w-full sm:w-auto items-center justify-center px-6 py-4 rounded-2xl bg-black text-white font-black text-sm hover:bg-orange-600 transition-all disabled:opacity-70"
                >
                  {checkingStatus ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Search size={18} className="mr-2" />}
                  Check Status
                </button>
              </form>

              {statusResult ? (
                <div className="mt-6 rounded-[32px] border border-gray-100 bg-gray-50 p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-black text-gray-900">{statusResult.businessName}</h3>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      statusResult.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : statusResult.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {statusResult.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                    <div className="rounded-2xl bg-white px-4 py-4 border border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{statusResult.category}</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-4 border border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Submitted</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{new Date(statusResult.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {statusResult.status === 'pending' ? (
                    <div className="mt-5 rounded-2xl bg-yellow-50 border border-yellow-100 px-4 py-4 flex gap-3">
                      <Clock3 size={18} className="text-yellow-700 mt-0.5" />
                      <div>
                        <p className="text-sm font-black text-yellow-900">Pending Admin Review</p>
                        <p className="text-xs text-yellow-800 mt-1">Your application is in queue. We will send the next update by email after review.</p>
                      </div>
                    </div>
                  ) : null}

                  {statusResult.status === 'approved' ? (
                    <div className="mt-5 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-4 flex gap-3">
                      <BadgeCheck size={18} className="text-emerald-700 mt-0.5" />
                      <div>
                        <p className="text-sm font-black text-emerald-900">Approved</p>
                        <p className="text-xs text-emerald-800 mt-1">
                          Your seller account has been approved. {statusResult.temporaryUsername ? `Temporary username: ${statusResult.temporaryUsername}. ` : ''}Check your email for login instructions.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {statusResult.status === 'rejected' ? (
                    <div className="mt-5 rounded-2xl bg-red-50 border border-red-100 px-4 py-4 flex gap-3">
                      <CircleX size={18} className="text-red-700 mt-0.5" />
                      <div>
                        <p className="text-sm font-black text-red-900">Needs Update Before Approval</p>
                        <p className="text-xs text-red-800 mt-1">{statusResult.rejectedReason || 'Your application needs additional corrections before approval.'}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeSeller;
