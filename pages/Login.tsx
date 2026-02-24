
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Github, 
  Chrome, 
  CheckCircle2,
  Store,
  ShoppingBag,
  ShieldCheck
} from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../auth/AuthContext';

interface LoginProps {
  onLoginSuccess?: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'customer' | 'merchant'>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      let authenticatedRole = UserRole.CUSTOMER;
      
      // Mock validation logic
      if (email === 'admin@emalla.rw' && password === 'admin123') {
        authenticatedRole = UserRole.ADMIN;
      } else if (role === 'merchant' || email.includes('merchant')) {
        authenticatedRole = UserRole.MERCHANT;
      } else if (email.includes('rider') || email.includes('delivery')) {
        authenticatedRole = UserRole.DELIVERY;
      } else {
        authenticatedRole = UserRole.CUSTOMER;
      }
      
      // Perform actual login to update context
      await login(email, authenticatedRole, 'mock_token_' + Date.now());
      
      if (onLoginSuccess) {
        onLoginSuccess(authenticatedRole);
      }
      
      // Redirect based on role
      if (authenticatedRole === UserRole.ADMIN) navigate('/admin');
      else navigate('/dashboard');
      
    } catch (err) {
      setError('Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Side: Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 imigongo-bg opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500/20 to-transparent"></div>
        
        <div className="relative z-10 max-w-lg">
          <Link to="/" className="flex items-center space-x-3 mb-12">
            <div className="w-12 h-12 bg-orange-500 rounded-2xl shadow-xl shadow-orange-500/20"></div>
            <span className="text-3xl font-black text-white">E-Malla <span className="font-light">Rwanda</span></span>
          </Link>
          
          <h2 className="text-5xl font-black text-white leading-tight mb-8">
            The heart of <br/>
            <span className="text-orange-500">Rwandan Commerce.</span>
          </h2>
          
          <div className="space-y-6">
            {[
              "Nationwide delivery to all 30 districts",
              "Secure MTN MoMo & Airtel payments",
              "Verified authentic local products",
              "24/7 dedicated Rwandan support"
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

      {/* Right Side: Form */}
      <div className="flex-grow flex items-center justify-center p-6 md:p-12 lg:p-20 bg-gray-50/30">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 p-8 md:p-12 animate-in fade-in zoom-in duration-500">
            
            <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-10">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Login
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${!isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Sign Up
              </button>
            </div>

            <div className="mb-10 text-center">
              <h1 className="text-3xl font-black text-gray-900 mb-2">
                {isLogin ? 'Welcome Back!' : 'Create Account'}
              </h1>
              <p className="text-gray-400 text-sm">
                {isLogin ? 'Access your dashboard' : 'Join the commerce revolution'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center">
                <ShieldCheck size={16} className="mr-2" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <button 
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col ${role === 'customer' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}
                  >
                    <ShoppingBag size={20} className={role === 'customer' ? 'text-orange-500' : 'text-gray-400'} />
                    <span className="text-xs font-black mt-3 block uppercase tracking-widest">Shopper</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole('merchant')}
                    className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col ${role === 'merchant' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}
                  >
                    <Store size={20} className={role === 'merchant' ? 'text-orange-500' : 'text-gray-400'} />
                    <span className="text-xs font-black mt-3 block uppercase tracking-widest">Seller</span>
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                  <input 
                    type="email" 
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-900 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start space-x-3">
              <ShieldCheck className="text-blue-500 flex-shrink-0" size={18} />
              <p className="text-[10px] font-bold text-blue-700 uppercase leading-tight">
                Demo: admin@emalla.rw / admin123 <br/>
                Or any email containing 'merchant'
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
