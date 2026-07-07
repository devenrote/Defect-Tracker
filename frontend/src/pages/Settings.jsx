import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { 
  Bell, 
  Shield, 
  User, 
  Key, 
  Save, 
  Lock, 
  Activity, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertTriangle,
  Server,
  Laptop
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI, userAPI } from '../services/api';

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  
  // ==========================================
  // SHARED STATES
  // ==========================================
  const [loading, setLoading] = useState(false);

  // ==========================================
  // LEGACY (NON-ADMIN) STATES & HANDLERS
  // ==========================================
  const [legacyProfileForm, setLegacyProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });

  const [legacyNotificationSettings, setLegacyNotificationSettings] = useState({
    defectAssigned: true,
    defectResolved: true,
    commentAdded: true,
    weeklyReport: false,
  });

  const handleLegacyProfileSubmit = (e) => {
    e.preventDefault();
    updateUser({ ...user, ...legacyProfileForm });
    toast.success('Profile updated successfully');
  };

  const handleLegacyNotifToggle = (key) => {
    setLegacyNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification settings saved');
  };

  // ==========================================
  // ENHANCED (ADMIN) STATES & HANDLERS
  // ==========================================
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  
  const [notificationSettings, setNotificationSettings] = useState({
    defectAssigned: true,
    defectResolved: true,
    commentAdded: true,
    weeklyReport: false,
    newProjectCreated: true,
    projectAssigned: true,
    newUserAdded: true,
    criticalDefect: true,
    defectClosed: true,
    weeklySummary: true,
  });

  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [submittingNotif, setSubmittingNotif] = useState(false);
  const [submittingKey, setSubmittingKey] = useState(false);
  const [submittingSecurity, setSubmittingSecurity] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const res = await userAPI.getById(user.id);
      const dbUser = res.data.data;
      updateUser(dbUser);
      setProfileForm({
        full_name: dbUser.full_name || '',
        email: dbUser.email || '',
      });
      if (dbUser.notification_settings) {
        try {
          const parsed = typeof dbUser.notification_settings === 'string'
            ? JSON.parse(dbUser.notification_settings)
            : dbUser.notification_settings;
          setNotificationSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error(e);
        }
      }
      if (dbUser.api_key) {
        setApiKey(dbUser.api_key);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessionInfo = async () => {
    try {
      const res = await authAPI.getSessionInfo();
      setSessionInfo(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUserProfile();
      fetchSessionInfo();
    }
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmittingProfile(true);
    try {
      const res = await userAPI.update(user.id, {
        full_name: profileForm.full_name,
        email: profileForm.email
      });
      updateUser(res.data.data);
      toast.success('Profile settings updated in database');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile settings');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const validatePasswordStrength = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return 'Password must contain at least one special character.';
    return '';
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'newPassword') {
        setPasswordError(validatePasswordStrength(value));
      } else if (name === 'confirmPassword' && value !== prev.newPassword) {
        setPasswordError('New password and confirm password do not match.');
      } else if (name === 'confirmPassword' && value === prev.newPassword) {
        setPasswordError('');
      }
      return updated;
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }
    const strengthError = validatePasswordStrength(passwordForm.newPassword);
    if (strengthError) {
      setPasswordError(strengthError);
      return;
    }

    setSubmittingPassword(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password updated successfully. Old session invalidated.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordError('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password. Verify current password.');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleNotifToggle = async (key) => {
    const updatedSettings = { ...notificationSettings, [key]: !notificationSettings[key] };
    setNotificationSettings(updatedSettings);
    setSubmittingNotif(true);
    try {
      const res = await userAPI.update(user.id, {
        notification_settings: JSON.stringify(updatedSettings)
      });
      updateUser(res.data.data);
      toast.success('Notification settings saved in database');
    } catch (err) {
      toast.error('Failed to save notification settings');
      // Revert local state
      setNotificationSettings(notificationSettings);
    } finally {
      setSubmittingNotif(false);
    }
  };

  const handleGenerateKey = async () => {
    setSubmittingKey(true);
    try {
      const res = await userAPI.generateApiKey();
      setApiKey(res.data.api_key);
      toast.success('API Key generated successfully');
    } catch (err) {
      toast.error('Failed to generate API key');
    } finally {
      setSubmittingKey(false);
    }
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success('API Key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogoutAll = async () => {
    if (!confirm('Are you sure you want to terminate all other device sessions? You will be asked to log in again on this device.')) return;
    setSubmittingSecurity(true);
    try {
      await authAPI.logoutAll();
      toast.success('All device sessions terminated. Logging out...');
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (err) {
      toast.error('Failed to terminate active device sessions.');
      setSubmittingSecurity(false);
    }
  };

  // ==========================================
  // RENDER ORIGINAL VIEW FOR NON-ADMIN
  // ==========================================
  if (user?.role !== 'admin') {
    return (
      <Layout title="Settings">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Profile Settings */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Profile Settings</h3>
            </div>
            <form onSubmit={handleLegacyProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                  <input
                    type="text"
                    value={legacyProfileForm.full_name}
                    onChange={(e) => setLegacyProfileForm({ ...legacyProfileForm, full_name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email Address</label>
                  <input
                    type="email"
                    value={legacyProfileForm.email}
                    onChange={(e) => setLegacyProfileForm({ ...legacyProfileForm, email: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" className="btn-primary">
                  <Save className="w-4 h-4" /> Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* Notifications Config */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Bell className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Email Notifications</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">Defect Assigned</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Receive an email when a defect is assigned to you.</p>
                </div>
                <input
                  type="checkbox"
                  checked={legacyNotificationSettings.defectAssigned}
                  onChange={() => handleLegacyNotifToggle('defectAssigned')}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">Defect Status Update</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Receive an email when defects you report are updated or fixed.</p>
                </div>
                <input
                  type="checkbox"
                  checked={legacyNotificationSettings.defectResolved}
                  onChange={() => handleLegacyNotifToggle('defectResolved')}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">Comments & Thread Updates</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Receive email notification when someone comments on your defect.</p>
                </div>
                <input
                  type="checkbox"
                  checked={legacyNotificationSettings.commentAdded}
                  onChange={() => handleLegacyNotifToggle('commentAdded')}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">Weekly Performance Digest</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">A weekly review of your open, closed, and pending quality metrics.</p>
                </div>
                <input
                  type="checkbox"
                  checked={legacyNotificationSettings.weeklyReport}
                  onChange={() => handleLegacyNotifToggle('weeklyReport')}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Security / System Stats */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">System & Credentials</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">Security Keys & Tokens</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Generate developer API tokens to access system defects programmatically.</p>
                </div>
                <button 
                  onClick={() => toast.success('API Key generated: dt_live_xxxx837482')}
                  className="btn-secondary text-xs"
                >
                  <Key className="w-3.5 h-3.5" /> Generate Key
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ==========================================
  // RENDER ENHANCED VIEW FOR ADMIN
  // ==========================================
  return (
    <Layout title="Enterprise Settings">
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
        
        {/* 1. Profile Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Profile Settings</h3>
          </div>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-707 dark:text-slate-350">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Full Name</label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="input-field text-sm"
                  required
                  disabled={submittingProfile}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="input-field text-sm"
                  required
                  disabled={submittingProfile}
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 disabled:opacity-50"
                disabled={submittingProfile}
              >
                <Save className="w-4 h-4" /> 
                {submittingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* 2. Change Password */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Lock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Change Password</h3>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-707 dark:text-slate-350">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className="input-field text-sm"
                  required
                  disabled={submittingPassword}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="input-field text-sm"
                  required
                  disabled={submittingPassword}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="input-field text-sm"
                  required
                  disabled={submittingPassword}
                />
              </div>
            </div>
            
            {passwordError && (
              <p className="text-[10px] font-bold text-rose-500 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {passwordError}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 disabled:opacity-50"
                disabled={submittingPassword || !!passwordError || !passwordForm.currentPassword || !passwordForm.newPassword}
              >
                <Lock className="w-4 h-4" /> 
                {submittingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* 3. Email & System Notification Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Bell className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Email & System Notifications</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            
            {/* Left column options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Defect Assigned</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">Receive notification when a defect is assigned to you.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.defectAssigned}
                  onChange={() => handleNotifToggle('defectAssigned')}
                  disabled={submittingNotif}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Defect Status Update</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">Receive notification when defects you report are updated or resolved.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.defectResolved}
                  onChange={() => handleNotifToggle('defectResolved')}
                  disabled={submittingNotif}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Comments & Thread Updates</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">Receive notification when comments are posted on your issues.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.commentAdded}
                  onChange={() => handleNotifToggle('commentAdded')}
                  disabled={submittingNotif}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Weekly Performance Digest</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">A weekly review of your open, closed, and pending quality metrics.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.weeklyReport}
                  onChange={() => handleNotifToggle('weeklyReport')}
                  disabled={submittingNotif}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50 md:border-b-0">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">New Project Created</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">Receive notification when a new project is created in the workspace.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.newProjectCreated}
                  onChange={() => handleNotifToggle('newProjectCreated')}
                  disabled={submittingNotif}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Right column options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Project Assigned</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">Receive notification when you are assigned to a new project.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.projectAssigned}
                  onChange={() => handleNotifToggle('projectAssigned')}
                  disabled={submittingNotif}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">New User Added</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">Receive notification when a new member joins the workspace directory.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.newUserAdded}
                  onChange={() => handleNotifToggle('newUserAdded')}
                  disabled={submittingNotif}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Critical Defect Raised</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">Receive immediate notifications for critical or blocker defects.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.criticalDefect}
                  onChange={() => handleNotifToggle('criticalDefect')}
                  disabled={submittingNotif}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Defect Closed</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">Receive notification when a defect you assigned or watch is closed.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.defectClosed}
                  onChange={() => handleNotifToggle('defectClosed')}
                  disabled={submittingNotif}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Weekly Quality Summary</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">A weekly diagnostic digest of workspace health, logs, and server stats.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.weeklySummary}
                  onChange={() => handleNotifToggle('weeklySummary')}
                  disabled={submittingNotif}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                />
              </div>
            </div>

          </div>
        </div>

        {/* 4. System & API Credentials */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">System & API Credentials</h3>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">API Key</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Generate developer API tokens to access system defects programmatically.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold select-all min-w-[200px] text-slate-600 dark:text-slate-300 text-center sm:text-left">
                  {apiKey ? (copied ? apiKey : '************************') : 'No Key Generated'}
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleGenerateKey}
                    disabled={submittingKey}
                    className="btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer flex-1 sm:flex-initial"
                  >
                    <Key className="w-3.5 h-3.5" />
                    {apiKey ? 'Regenerate' : 'Generate'}
                  </button>

                  {apiKey && (
                    <button 
                      onClick={handleCopyKey}
                      className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1 cursor-pointer flex-1 sm:flex-initial"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Session Information */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Laptop className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Session Information</h3>
          </div>
          {sessionInfo ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs font-semibold text-slate-707 dark:text-slate-355">
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Current Login</span>
                <p className="font-extrabold text-slate-800 dark:text-white">{new Date(sessionInfo.currentLogin).toLocaleString()}</p>
              </div>
              
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Last Login</span>
                <p className="font-extrabold text-slate-800 dark:text-white">{new Date(sessionInfo.lastLogin).toLocaleString()}</p>
              </div>

              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Operating System</span>
                <p className="font-extrabold text-slate-800 dark:text-white">{sessionInfo.os || 'Unavailable'}</p>
              </div>

              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Browser</span>
                <p className="font-extrabold text-slate-800 dark:text-white">{sessionInfo.browser || 'Unavailable'}</p>
              </div>

              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Current Device</span>
                <p className="font-extrabold text-slate-800 dark:text-white">{sessionInfo.currentDevice || 'Unavailable'}</p>
              </div>

              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">IP Address</span>
                <p className="font-extrabold text-slate-800 dark:text-white">{sessionInfo.ipAddress || 'Unavailable'}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-slate-400">Loading session information...</div>
          )}
        </div>

        {/* 6. Security (Logout From All Devices) */}
        <div className="card border-l-4 border-rose-500">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Shield className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Security & Active Sessions</h3>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Terminated Active Sessions</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Logs out of all active connections, client devices, and browser sessions instantly.</p>
            </div>
            
            <button 
              onClick={handleLogoutAll}
              disabled={submittingSecurity}
              className="py-2 px-4 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50 hover:border-rose-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              {submittingSecurity ? 'Logging out...' : 'Logout From All Devices'}
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Settings;
