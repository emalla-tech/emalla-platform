import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { authService } from '../../services/authService';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    if (!token) {
      setError('Reset token is missing. Open the reset link from your email.');
      return;
    }

    if (password.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await authService.resetPassword(token, password);
      setMessage('Password updated successfully. You can now sign in with the new password.');
      window.setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to reset password right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl bg-white border border-gray-100 shadow-2xl rounded-[40px] p-8 md:p-12">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">Password Reset</p>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4">Set a New Password</h1>
        <p className="text-gray-500 mt-4 leading-relaxed">
          Choose a new password for your E-Malla account. This reset link can only be used once.
        </p>

        {message ? (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600 flex items-center">
            <ShieldCheck size={16} className="mr-2" />
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5 mt-8">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">New Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-2xl bg-gray-50 border-2 border-transparent focus:border-orange-400 px-12 py-4 outline-none font-bold text-gray-900"
                placeholder="At least 8 characters"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Confirm New Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="w-full rounded-2xl bg-gray-50 border-2 border-transparent focus:border-orange-400 px-12 py-4 outline-none font-bold text-gray-900"
                placeholder="Repeat new password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center hover:bg-orange-600 transition-all disabled:opacity-60"
          >
            {loading ? 'Updating Password...' : (
              <>
                Reset Password
                <ArrowRight size={18} className="ml-2" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500">
          Return to <Link to="/login" className="font-black text-orange-500 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
