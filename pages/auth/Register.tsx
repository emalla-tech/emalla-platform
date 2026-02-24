
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Lock, ArrowRight, Store, 
  ShoppingBag, CheckCircle2, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { UserRole } from '../../types';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Logic would go here in production
      await login(formData.email, role, 'mock_token_' + Date.now());
      navigate(role === UserRole.MERCHANT ? '/dashboard' : '/shop');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
            Empowering <span className="text-orange-500">Rwanda's</span> Digital Economy.
          </h2>
          <div className="space-y-6">
            {["Fast nationwide logistics", "Safe escrow payments", "Youth-driven workforce"].map((t, i) => (
              <div key={i} className="flex items-center space-x-4 text-gray-300">
                <CheckCircle2 size={20} className="text-orange-500" />
                <span className="font-bold">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center p-6 md:p-20 bg-gray-50/30">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right duration-500">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Create Account</h1>
            <p className="text-gray-400 mt-2 font-medium">Join thousands of Rwandans trading today.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setRole(UserRole.CUSTOMER)}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-start ${role === UserRole.CUSTOMER ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
            >
              <ShoppingBag size={20} className={role === UserRole.CUSTOMER ? 'text-orange-500' : 'text-gray-400'} />
              <span className="text-[10px] font-black uppercase tracking-widest mt-3">I want to Buy</span>
            </button>
            <button 
              onClick={() => setRole(UserRole.MERCHANT)}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-start ${role === UserRole.MERCHANT ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
            >
              <Store size={20} className={role === UserRole.MERCHANT ? 'text-orange-500' : 'text-gray-400'} />
              <span className="text-[10px] font-black uppercase tracking-widest mt-3">I want to Sell</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" required
                  className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:border-orange-500 transition-all"
                  placeholder="e.g. Mugisha Jean"
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" required
                  className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:border-orange-500 transition-all"
                  placeholder="jean@example.com"
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" required
                  className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:border-orange-500 transition-all"
                  placeholder="••••••••"
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit" disabled={isLoading}
              className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-100 flex items-center justify-center space-x-3 hover:bg-orange-600 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 font-medium">
            Already have an account? <Link to="/login" className="text-orange-500 font-black hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
