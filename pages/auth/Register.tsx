import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Store,
  ShoppingBag,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Phone,
  Bike,
  Search,
  Clock3,
  BadgeCheck,
  CircleX
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { UserRole } from '../../types';
import { MerchantService } from '../../services/merchantService';
import { RiderService } from '../../services/riderService';
import { useLanguage } from '../../i18n/LanguageContext';

type SubmissionNotice = {
  role: UserRole;
  title: string;
  message: string;
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const initialRole = (() => {
    const requestedRole = String(searchParams.get('role') || '').toLowerCase();
    if (requestedRole === 'merchant' || requestedRole === 'seller') return UserRole.MERCHANT;
    if (requestedRole === 'delivery' || requestedRole === 'rider') return UserRole.DELIVERY;
    return UserRole.CUSTOMER;
  })();
  const [role, setRole] = useState<UserRole>(initialRole);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<SubmissionNotice | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [buyerForm, setBuyerForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [sellerForm, setSellerForm] = useState({
    businessName: '',
    category: 'Fashion',
    email: '',
    phone: ''
  });
  const [riderForm, setRiderForm] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleNumber: ''
  });
  const [riderStatusLookup, setRiderStatusLookup] = useState({ email: '', phone: '' });
  const [checkingRiderStatus, setCheckingRiderStatus] = useState(false);
  const [riderStatusResult, setRiderStatusResult] = useState<null | {
    id: string;
    name: string;
    email: string;
    phone: string;
    vehicleNumber: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    approvedAt?: string;
    rejectedAt?: string;
    rejectedReason?: string;
    temporaryUsername?: string;
  }>(null);
  const nextPath = searchParams.get('next') || '';
  const { t } = useLanguage();

  useEffect(() => {
    setError(null);
    setNotice(null);
  }, [role]);

  const canAccessPath = (nextRole: UserRole, targetPath: string) => {
    if (!targetPath) return false;
    if (targetPath.startsWith('/buyer')) return nextRole === UserRole.CUSTOMER;
    if (targetPath.startsWith('/seller')) return nextRole === UserRole.MERCHANT;
    if (targetPath.startsWith('/rider')) return nextRole === UserRole.DELIVERY;
    if (targetPath.startsWith('/admin')) return nextRole === UserRole.ADMIN;
    return true;
  };

  const handleBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (buyerForm.password !== buyerForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setNotice(null);
    try {
      await register({
        name: buyerForm.name,
        email: buyerForm.email,
        password: buyerForm.password,
        role: UserRole.CUSTOMER
      });
      if (nextPath && canAccessPath(UserRole.CUSTOMER, nextPath)) {
        navigate(nextPath);
      } else {
        navigate('/shop');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setNotice(null);

    try {
      const result = await MerchantService.registerSeller(sellerForm);
      setNotice({
        role: UserRole.MERCHANT,
        title: result.action === 'resubmitted' ? 'Seller application resubmitted' : 'Seller application submitted',
        message: 'Application ya seller yakiriwe. Credentials za temporary zizoherezwa kuri email yawe nyuma yo kwemezwa na admin.'
      });
      setSellerForm({
        businessName: '',
        category: 'Fashion',
        email: '',
        phone: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit seller application.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRiderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setNotice(null);

    try {
      const result = await RiderService.registerApplication(riderForm);
      setNotice({
        role: UserRole.DELIVERY,
        title: result.action === 'resubmitted' ? 'Rider application resubmitted' : 'Rider application submitted',
        message: 'Application ya rider yakiriwe. Temporary username na password bizoherezwa kuri email yawe nyuma yo kwemezwa na admin.'
      });
      setRiderForm({
        name: '',
        email: '',
        phone: '',
        vehicleNumber: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit rider application.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRiderStatusCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingRiderStatus(true);
    setError(null);
    try {
      const application = await RiderService.checkApplicationStatus(riderStatusLookup);
      setRiderStatusResult(application);
    } catch (err) {
      setRiderStatusResult(null);
      setError(err instanceof Error ? err.message : 'Unable to check rider application status.');
    } finally {
      setCheckingRiderStatus(false);
    }
  };

  const renderBuyerForm = () => (
    <form onSubmit={handleBuyerSubmit} className="space-y-5">
      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
        <div className="relative">
          <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            autoComplete="name"
            required
            value={buyerForm.name}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:border-orange-500 transition-all"
            placeholder="e.g. Mugisha Jean"
            onChange={(e) => setBuyerForm({ ...buyerForm, name: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="email"
            autoComplete="email"
            required
            value={buyerForm.email}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:border-orange-500 transition-all"
            placeholder="jean@example.com"
            onChange={(e) => setBuyerForm({ ...buyerForm, email: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
        <div className="relative">
          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={buyerForm.password}
            className="w-full pl-14 pr-14 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:border-orange-500 transition-all"
            placeholder="********"
            onChange={(e) => setBuyerForm({ ...buyerForm, password: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={buyerForm.confirmPassword}
            className="w-full pl-14 pr-14 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:border-orange-500 transition-all"
            placeholder="Confirm your password"
            onChange={(e) => setBuyerForm({ ...buyerForm, confirmPassword: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((current) => !current)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-100 flex items-center justify-center space-x-3 hover:bg-orange-600 transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <>
            <span>{t.register.buyerButton}</span>
            <ArrowRight size={20} />
          </>
        )}
      </button>
    </form>
  );

  const renderSellerForm = () => (
    <form onSubmit={handleSellerSubmit} className="space-y-5">
      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Business Name</label>
        <div className="relative">
          <Store className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            required
            value={sellerForm.businessName}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:border-orange-500 transition-all"
            placeholder="e.g. Akagera Style House"
            onChange={(e) => setSellerForm({ ...sellerForm, businessName: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Primary Category</label>
        <select
          value={sellerForm.category}
          onChange={(e) => setSellerForm({ ...sellerForm, category: e.target.value })}
          className="w-full px-5 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:border-orange-500 transition-all"
        >
          <option>Fashion</option>
          <option>Electronics</option>
          <option>Agriculture</option>
          <option>Crafts</option>
          <option>Health & Beauty</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Business Email</label>
        <div className="relative">
          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="email"
            required
            value={sellerForm.email}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:border-orange-500 transition-all"
            placeholder="sales@business.rw"
            onChange={(e) => setSellerForm({ ...sellerForm, email: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Phone</label>
        <div className="relative">
          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="tel"
            required
            value={sellerForm.phone}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:border-orange-500 transition-all"
            placeholder="+250 78x xxx xxx"
            onChange={(e) => setSellerForm({ ...sellerForm, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-amber-50 border border-amber-100 px-5 py-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Admin Approval Required</p>
        <p className="text-sm font-bold text-amber-900 mt-2">
          Seller accounts zibanza kwemezwa na admin. Temporary username na password bizoherezwa kuri email ya business yawe nyuma yo kwemerwa.
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-100 flex items-center justify-center space-x-3 hover:bg-orange-600 transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <>
            <span>{t.register.sellerButton}</span>
            <ArrowRight size={20} />
          </>
        )}
      </button>
    </form>
  );

  const renderRiderForm = () => (
    <div className="space-y-6">
      <form onSubmit={handleRiderSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              required
              value={riderForm.name}
              className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:border-orange-500 transition-all"
              placeholder="e.g. Eric Nshimiyimana"
              onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email"
              required
              value={riderForm.email}
              className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:border-orange-500 transition-all"
              placeholder="rider@example.com"
              onChange={(e) => setRiderForm({ ...riderForm, email: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Phone</label>
          <div className="relative">
            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="tel"
              required
              value={riderForm.phone}
              className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:border-orange-500 transition-all"
              placeholder="+250 78x xxx xxx"
              onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Plate Number</label>
          <div className="relative">
            <Bike className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              required
              value={riderForm.vehicleNumber}
              className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:border-orange-500 transition-all uppercase"
              placeholder="e.g. RAD 123 A"
              onChange={(e) => setRiderForm({ ...riderForm, vehicleNumber: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Approval Workflow</p>
          <p className="text-sm font-bold text-emerald-900 mt-2">
            Rider applicant abanza gusuzumwa na admin. Temporary username na password bizajya kuri email nyuma yo kwemerwa.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-100 flex items-center justify-center space-x-3 hover:bg-orange-600 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
            <span>{t.register.riderButton}</span>
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </form>

      <div className="rounded-[28px] border border-gray-100 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Search size={16} className="text-orange-500" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rider Application Tracker</p>
        </div>
        <form onSubmit={handleRiderStatusCheck} className="space-y-4">
          <input
            required
            type="email"
            value={riderStatusLookup.email}
            onChange={(e) => setRiderStatusLookup((current) => ({ ...current, email: e.target.value }))}
            className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 outline-none transition-all text-black font-bold"
            placeholder="Rider email"
          />
          <input
            required
            type="tel"
            value={riderStatusLookup.phone}
            onChange={(e) => setRiderStatusLookup((current) => ({ ...current, phone: e.target.value }))}
            className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl p-4 outline-none transition-all text-black font-bold"
            placeholder="Contact phone"
          />
          <button
            type="submit"
            disabled={checkingRiderStatus}
            className="inline-flex items-center justify-center px-6 py-4 rounded-2xl bg-black text-white font-black text-sm hover:bg-orange-600 transition-all disabled:opacity-70"
          >
            {checkingRiderStatus ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> : <Search size={18} className="mr-2" />}
            Check Rider Status
          </button>
        </form>

        {riderStatusResult ? (
          <div className="mt-5 rounded-[24px] border border-gray-100 bg-gray-50 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-lg font-black text-gray-900">{riderStatusResult.name}</h3>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                riderStatusResult.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-700'
                  : riderStatusResult.status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
              }`}>
                {riderStatusResult.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="rounded-2xl bg-white px-4 py-4 border border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Plate Number</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{riderStatusResult.vehicleNumber}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-4 border border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Submitted</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{new Date(riderStatusResult.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {riderStatusResult.status === 'pending' ? (
              <div className="mt-4 rounded-2xl bg-yellow-50 border border-yellow-100 px-4 py-4 flex gap-3">
                <Clock3 size={18} className="text-yellow-700 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-yellow-900">Pending Admin Review</p>
                  <p className="text-xs text-yellow-800 mt-1">Your rider application is in queue. We will send the next update by email after review.</p>
                </div>
              </div>
            ) : null}

            {riderStatusResult.status === 'approved' ? (
              <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-4 flex gap-3">
                <BadgeCheck size={18} className="text-emerald-700 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-emerald-900">Approved</p>
                  <p className="text-xs text-emerald-800 mt-1">
                    Your rider account has been approved. {riderStatusResult.temporaryUsername ? `Temporary username: ${riderStatusResult.temporaryUsername}. ` : ''}Check your email for login instructions.
                  </p>
                </div>
              </div>
            ) : null}

            {riderStatusResult.status === 'rejected' ? (
              <div className="mt-4 rounded-2xl bg-red-50 border border-red-100 px-4 py-4 flex gap-3">
                <CircleX size={18} className="text-red-700 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-red-900">Needs Update Before Approval</p>
                  <p className="text-xs text-red-800 mt-1">{riderStatusResult.rejectedReason || 'Your rider application needs additional corrections before approval.'}</p>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative items-center justify-center p-20 overflow-hidden">
        <div className="absolute inset-0 imigongo-bg opacity-10"></div>
        <div className="relative z-10 max-w-lg">
          <Link to="/" className="flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 bg-orange-500 rounded-xl shadow-lg"></div>
            <span className="text-2xl font-black text-white">E-Malla Rwanda</span>
          </Link>
          <h2 className="text-5xl font-black text-white leading-tight mb-8">
            {t.register.title} <span className="text-orange-500">E-Malla</span>.
          </h2>
          <div className="space-y-6">
            {['Fast nationwide logistics', 'Safe escrow payments', 'Youth-driven workforce'].map((item, i) => (
              <div key={i} className="flex items-center space-x-4 text-gray-300">
                <CheckCircle2 size={20} className="text-orange-500" />
                <span className="font-bold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center p-6 md:p-20 bg-gray-50/30">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right duration-500">
          <div>
            <h1 className="text-3xl font-black text-gray-900">{t.register.title}</h1>
            <p className="text-gray-400 mt-2 font-medium">
              {t.register.subtitle}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center">
              <ShieldCheck size={16} className="mr-2" /> {error}
            </div>
          )}

          {notice && notice.role === role && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-sm font-bold">
              <p className="text-[10px] uppercase tracking-widest font-black mb-2">{notice.title}</p>
              <p className="leading-relaxed">{notice.message}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setRole(UserRole.CUSTOMER)}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center sm:items-start sm:text-left ${role === UserRole.CUSTOMER ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
            >
              <ShoppingBag size={20} className={role === UserRole.CUSTOMER ? 'text-orange-500' : 'text-gray-400'} />
              <span className="text-[10px] font-black uppercase tracking-widest mt-3">{t.register.buy}</span>
            </button>
            <button
              type="button"
              onClick={() => setRole(UserRole.MERCHANT)}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center sm:items-start sm:text-left ${role === UserRole.MERCHANT ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
            >
              <Store size={20} className={role === UserRole.MERCHANT ? 'text-orange-500' : 'text-gray-400'} />
              <span className="text-[10px] font-black uppercase tracking-widest mt-3">{t.register.sell}</span>
            </button>
            <button
              type="button"
              onClick={() => setRole(UserRole.DELIVERY)}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center sm:items-start sm:text-left ${role === UserRole.DELIVERY ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
            >
              <Truck size={20} className={role === UserRole.DELIVERY ? 'text-orange-500' : 'text-gray-400'} />
              <span className="text-[10px] font-black uppercase tracking-widest mt-3">{t.register.ride}</span>
            </button>
          </div>

          {role === UserRole.CUSTOMER ? renderBuyerForm() : role === UserRole.MERCHANT ? renderSellerForm() : renderRiderForm()}

          <p className="text-center text-sm text-gray-400 font-medium">
            {t.register.haveAccount}{' '}
            <Link to={`/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`} className="text-orange-500 font-black hover:underline">
              {t.login.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
