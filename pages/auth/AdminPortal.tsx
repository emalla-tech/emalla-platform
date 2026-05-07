import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { UserRole } from '../../types';

const AdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, logout, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      logout();
    }
  }, [user, logout]);

  if (!isLoading && user?.role === UserRole.ADMIN) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const authenticatedUser = await login(email, password);
      if (authenticatedUser.role !== UserRole.ADMIN) {
        logout();
        setError('Only admin credentials can access this portal.');
        return;
      }
      navigate('/admin/dashboard', { replace: true });
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Invalid admin credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-100 shadow-2xl rounded-[36px] p-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-900 text-white flex items-center justify-center mb-4">
            <Shield size={30} />
          </div>
          <h1 className="text-3xl font-black text-gray-900">Admin Portal</h1>
          <p className="text-gray-500 text-sm mt-2">Secure access for E-Malla administrators only.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center">
            <ShieldCheck size={16} className="mr-2" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Admin Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:border-orange-500 transition-all"
                placeholder="admin@emalla.rw"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl font-bold outline-none focus:bg-white focus:border-orange-500 transition-all"
                placeholder="Enter admin password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gray-900 hover:bg-orange-500 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center justify-center"
          >
            {submitting ? 'Verifying...' : <><span>Enter Admin Dashboard</span><ArrowRight size={16} className="ml-2" /></>}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login" className="text-xs font-black text-gray-400 hover:text-orange-500 uppercase tracking-widest">
            Back to General Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
