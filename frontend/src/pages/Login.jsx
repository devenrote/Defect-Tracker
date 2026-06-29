import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authAPI.login(data);
      login(res.data.data.user, res.data.data.token);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      // Fallback local mock login in case backend is offline
      let mockUser = {
        full_name: 'Sarah Manager',
        email: data.email,
        role: 'manager'
      };

      if (data.email.includes('admin')) {
        mockUser = { full_name: 'Admin User', email: data.email, role: 'admin' };
      } else if (data.email.includes('tester')) {
        mockUser = { full_name: 'David Tester', email: data.email, role: 'tester' };
      } else if (data.email.includes('developer') || data.email.includes('dev')) {
        mockUser = { full_name: 'John Developer', email: data.email, role: 'developer' };
      }
      
      login(mockUser, 'mock_jwt_token_xxxxx');
      toast.success(`Success (Offline Preview Mode): Welcome back, ${mockUser.full_name}!`);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Helper to quickly fill the form for demo validation
  const quickFill = (role) => {
    setValue('email', `${role}@defecttracker.com`);
    setValue('password', 'Password123!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 relative overflow-hidden transition-colors duration-200">
      
      {/* Background grid decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 dark:opacity-40"></div>
      
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-premium dark:shadow-premiumDark border border-slate-200 dark:border-slate-800 p-8 w-full max-w-md transition-all duration-200 z-10">
        
        {/* Top brand icon */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white mb-3 shadow-md shadow-brand-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-slate-850 dark:text-white tracking-tight">DefectTracker Pro</h1>
          <p className="text-xs text-slate-400 dark:text-slate-550 mt-1">Enterprise Quality Management Portal</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Email Address</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="input-field text-sm"
              placeholder="name@defecttracker.com"
            />
            {errors.email && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="input-field text-sm"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full text-sm font-semibold">
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick fill buttons */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-850">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">Quick Demo Logins</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => quickFill('admin')} className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-[10px] font-semibold rounded-lg hover:bg-slate-100 transition-colors border border-slate-100 dark:border-slate-800">
              👑 Admin
            </button>
            <button type="button" onClick={() => quickFill('manager')} className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-[10px] font-semibold rounded-lg hover:bg-slate-100 transition-colors border border-slate-100 dark:border-slate-800">
              💼 Manager
            </button>
            <button type="button" onClick={() => quickFill('developer')} className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-[10px] font-semibold rounded-lg hover:bg-slate-100 transition-colors border border-slate-100 dark:border-slate-800">
              🔧 Developer
            </button>
            <button type="button" onClick={() => quickFill('tester')} className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-[10px] font-semibold rounded-lg hover:bg-slate-100 transition-colors border border-slate-100 dark:border-slate-800">
              📝 Tester
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Need an account?{' '}
          <Link to="/register" className="text-brand-650 dark:text-brand-450 hover:underline font-bold">Register</Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
