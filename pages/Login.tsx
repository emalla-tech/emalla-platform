import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle2, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { apiClient } from '../services/apiClient';

interface LoginProps {
  onLoginSuccess?: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const nextPath = searchParams.get('next') || '';
  const reason = searchParams.get('reason');
  const { t } = useLanguage();

  useEffect(() => {
    apiClient.warmBackend().catch(() => undefined);
  }, []);

  const canAccessPath = (role: UserRole, targetPath: string) => {
    if (!targetPath) return false;
    if (targetPath.startsWith('/buyer')) return role === UserRole.CUSTOMER;
    if (targetPath.startsWith('/seller')) return role === UserRole.MERCHANT;
    if (targetPath.startsWith('/rider')) return role === UserRole.DELIVERY;
    if (targetPath.startsWith('/admin')) return role === UserRole.ADMIN;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const authenticatedUser = await login(email, password);
      const authenticatedRole = authenticatedUser.role;

      if (onLoginSuccess) {
        onLoginSuccess(authenticatedRole);
      }

      if (authenticatedRole === UserRole.MERCHANT && authenticatedUser.mustChangePassword) {
        navigate('/seller/change-password');
      } else if (nextPath && canAccessPath(authenticatedRole, nextPath)) {
        navigate(nextPath);
      } else if (authenticatedRole === UserRole.ADMIN) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 imigongo-bg opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500/20 to-transparent"></div>

        <div className="relative z-10 max-w-lg">
          <Link to="/" className="flex items-center space-x-3 mb-12">
            <div className="w-12 h-12 bg-orange-500 rounded-2xl shadow-xl shadow-orange-500/20"></div>
            <span className="text-3xl font-black text-white">
              E-Malla <span className="font-light">Rwanda</span>
            </span>
          </Link>

          <h2 className="text-5xl font-black text-white leading-tight mb-8">
            {t.login.panelTitle} <br />
            <span className="text-orange-500">{t.login.panelAccent}</span>
          </h2>

          <div className="space-y-6">
            {[
              t.login.point1,
              t.login.point2,
              t.login.point3,
              t.login.point4
            ].map((text, i) => (
              <div key={i} className="flex items-center space-x-4 text-gray-300">
                <div className="p-1 bg-orange-500/20 rounded-full text-orange-500">
                  <CheckCircle2 size={18} />
                </div>
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center p-6 md:p-12 lg:p-20 bg-gray-50/30">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 p-8 md:p-12 animate-in fade-in zoom-in duration-500">
            <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-10">
              <button className="flex-1 py-3 rounded-xl font-black text-sm transition-all bg-white text-gray-900 shadow-sm">
                {t.login.loginTab}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/register${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`)}
                className="flex-1 py-3 rounded-xl font-black text-sm transition-all text-gray-400 hover:text-gray-600"
              >
                {t.login.signupTab}
              </button>
            </div>

            {reason === 'role_mismatch' && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-xs font-bold">
                {t.login.roleMismatch}
              </div>
            )}

            <div className="mb-10 text-center">
              <h1 className="text-3xl font-black text-gray-900 mb-2">{t.login.welcome}</h1>
              <p className="text-gray-400 text-sm">{t.login.subtitle}</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center">
                <ShieldCheck size={16} className="mr-2" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  {t.login.emailLabel}
                  </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors"
                    size={20}
                  />
                  <input
                    type="text"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.login.emailPlaceholder}
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-900 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.login.passwordLabel}</label>
                  <Link to="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:underline">
                    {t.login.forgotPassword}
                  </Link>
                </div>
                <div className="relative group">
                  <Lock
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors"
                    size={20}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    className="w-full pl-14 pr-14 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-900 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center space-x-3 hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 active:scale-95 disabled:opacity-50 group"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{t.login.signIn}</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
