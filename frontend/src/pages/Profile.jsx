import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { userAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Save, User, Mail, Lock, Camera, Calendar, Clock, FolderKanban, Activity } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dbUser, setDbUser] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');

  // Form 1: Details Update
  const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: profileErrors }, reset: resetProfile } = useForm({
    defaultValues: { full_name: user?.full_name, email: user?.email },
  });

  // Form 2: Password Security Form
  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: passwordErrors }, reset: resetPassword, watch } = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  });

  const fetchProfile = async () => {
    try {
      const res = await userAPI.getById(user.id);
      const rawUser = res.data.data;
      setDbUser(rawUser);
      setAvatarPreview(rawUser.avatar || '');
      resetProfile({
        full_name: rawUser.full_name,
        email: rawUser.email
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load live profile stats');
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onUpdateProfile = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('full_name', data.full_name);
      formData.append('email', data.email);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await userAPI.update(user.id, formData);
      const updated = res.data.data;
      updateUser(updated);
      setDbUser(updated);
      toast.success('Profile settings updated successfully');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update profile settings');
    } finally {
      setLoading(false);
    }
  };

  const onUpdatePassword = async (data) => {
    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success('Password changed successfully');
      resetPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="User Profile">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Profile Card Summary */}
        <div className="card shadow-xs">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar Preview" 
                  className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-brand-200"
                />
              ) : (
                <div className="w-20 h-20 bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 rounded-2xl flex items-center justify-center font-bold text-3xl shrink-0 shadow-md">
                  {(dbUser?.full_name || user?.full_name)?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              
              <label 
                htmlFor="avatar-upload-file" 
                className="absolute inset-0 bg-black/45 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
              >
                <Camera className="w-5 h-5" />
              </label>
              <input 
                type="file" 
                id="avatar-upload-file" 
                onChange={handleAvatarChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>

            <div className="text-center sm:text-left space-y-1 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight">
                  {dbUser?.full_name || user?.full_name || 'System User'}
                </h3>
                <span className="text-[10px] bg-brand-50 text-brand-700 dark:bg-brand-955/30 dark:text-brand-400 border border-brand-100 dark:border-brand-900/50 font-bold px-2 py-0.5 rounded-full capitalize">
                  {(dbUser?.role || user?.role || 'user').replace('_', ' ')}
                </span>
              </div>
              
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-1">
                <Mail className="w-3.5 h-3.5" /> {dbUser?.email || user?.email || 'no-email@defecttracker.com'}
              </p>
              
              <p className="text-[10px] text-slate-405 dark:text-slate-500 font-semibold tracking-wide uppercase mt-1">
                Account ID: #{dbUser?.id || user?.id || '99'}
              </p>
            </div>
          </div>

          {/* Database Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex flex-col gap-0.5">
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Account Status</span>
              <span className="text-slate-850 dark:text-slate-200 font-black uppercase flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                {dbUser?.status || user?.status || 'Active'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Joined Date</span>
              <span className="text-slate-850 dark:text-slate-200 font-black flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                {dbUser?.created_at ? new Date(dbUser.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Last Login</span>
              <span className="text-slate-850 dark:text-slate-200 font-black flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-500" />
                {dbUser?.last_login ? new Date(dbUser.last_login).toLocaleString() : 'Just now'}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Assigned Projects</span>
              <span className="text-slate-850 dark:text-slate-200 font-black flex items-center gap-1">
                <FolderKanban className="w-3.5 h-3.5 text-indigo-500" />
                {dbUser?.assignedProjects?.length || 0} Projects
              </span>
            </div>
          </div>
        </div>

        {/* Form 1: Edit Details */}
        <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="card space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 uppercase tracking-wider">
            <User className="w-4 h-4 text-brand-605" />
            Edit Personal Details
          </h3>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Full Name</label>
            <input 
              {...registerProfile('full_name', { required: 'Name is required' })} 
              className="input-field text-xs" 
            />
            {profileErrors.full_name && <p className="text-rose-500 text-xs mt-1 font-semibold">{profileErrors.full_name.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Email Address</label>
            <input 
              {...registerProfile('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address format'
                }
              })} 
              className="input-field text-xs" 
            />
            {profileErrors.email && <p className="text-rose-500 text-xs mt-1 font-semibold">{profileErrors.email.message}</p>}
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto font-semibold text-xs flex items-center justify-center gap-1.5 py-2 cursor-pointer shadow-xs">
              <Save className="w-3.5 h-3.5" /> {loading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>

        {/* Form 2: Change Password */}
        <form onSubmit={handleSubmitPassword(onUpdatePassword)} className="card space-y-4 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 uppercase tracking-wider">
            <Lock className="w-4 h-4 text-rose-500" />
            Security settings
          </h3>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Current Password</label>
            <input 
              type="password"
              {...registerPassword('currentPassword', { required: 'Current password is required to save changes' })} 
              className="input-field text-xs" 
              placeholder="••••••••"
            />
            {passwordErrors.currentPassword && <p className="text-rose-500 text-xs mt-1 font-semibold">{passwordErrors.currentPassword.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">New Password</label>
            <input 
              type="password" 
              {...registerPassword('newPassword', { 
                required: 'New Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
                validate: {
                  uppercase: v => /[A-Z]/.test(v) || 'Password must contain at least one uppercase letter',
                  lowercase: v => /[a-z]/.test(v) || 'Password must contain at least one lowercase letter',
                  number: v => /[0-9]/.test(v) || 'Password must contain at least one number',
                  special: v => /[^A-Za-z0-9]/.test(v) || 'Password must contain at least one special character'
                }
              })} 
              className="input-field text-xs" 
              placeholder="New password complexity requirements apply"
            />
            {passwordErrors.newPassword && <p className="text-rose-500 text-xs mt-1 font-semibold">{passwordErrors.newPassword.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Confirm New Password</label>
            <input 
              type="password" 
              {...registerPassword('confirmPassword', { 
                required: 'Confirm password is required',
                validate: v => v === watch('newPassword') || 'Confirm password does not match new password'
              })} 
              className="input-field text-xs" 
              placeholder="••••••••"
            />
            {passwordErrors.confirmPassword && <p className="text-rose-500 text-xs mt-1 font-semibold">{passwordErrors.confirmPassword.message}</p>}
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 py-2 cursor-pointer shadow-xs border-none">
              <Lock className="w-3.5 h-3.5" /> {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>

      </div>
    </Layout>
  );
};

export default Profile;
