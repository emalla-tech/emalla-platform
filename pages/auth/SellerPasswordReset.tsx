import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { getRoleHome, isStaffRole } from '../../auth/roleRouting';

const SellerPasswordReset: React.FC = () => {
  const navigate = useNavigate();
  const { changePassword, user } = useAuth();
  const staffAccount = isStaffRole(user?.role);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password confirmation does not match.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await changePassword(currentPassword, newPassword);
      navigate(getRoleHome(user?.role), { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl bg-white border border-gray-100 shadow-2xl rounded-[40px] p-8 md:p-12">
        <div className="w-16 h-16 rounded-[24px] bg-orange-50 text-orange-600 flex items-center justify-center mb-6">
          <KeyRound size={30} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-orange-500">
          {staffAccount ? 'Staff Security' : 'Seller Security'}
        </p>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4">Change Your Temporary Password</h1>
        <p className="text-gray-500 mt-4 leading-relaxed">
          {user?.name ? `${user.name}, ` : ''}for security, {staffAccount ? 'your staff workspace' : 'Seller Hub'} requires a new password before your first session can continue.
        </p>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600 flex items-center">
            <ShieldCheck size={16} className="mr-2" />
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5 mt-8">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Temporary Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                className="w-full rounded-2xl bg-gray-50 border-2 border-transparent focus:border-orange-400 px-12 py-4 outline-none font-bold text-gray-900"
                placeholder="Enter temporary password"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">New Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
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
                placeholder="Repeat the new password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center hover:bg-orange-600 transition-all disabled:opacity-60"
          >
            {saving ? 'Updating Password...' : (
              <>
                Save New Password
                <ArrowRight size={18} className="ml-2" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SellerPasswordReset;
