import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Bell, Shield, User, Key, Save } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser } = useAuth();
  
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    defectAssigned: true,
    defectResolved: true,
    commentAdded: true,
    weeklyReport: false,
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateUser({ ...user, ...profileForm });
    toast.success('Profile updated successfully');
  };

  const handleNotifToggle = (key) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification settings saved');
  };

  return (
    <Layout title="Settings">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Profile Settings */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Profile Settings</h3>
          </div>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
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
                checked={notificationSettings.defectAssigned}
                onChange={() => handleNotifToggle('defectAssigned')}
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
                checked={notificationSettings.defectResolved}
                onChange={() => handleNotifToggle('defectResolved')}
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
                checked={notificationSettings.commentAdded}
                onChange={() => handleNotifToggle('commentAdded')}
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
                checked={notificationSettings.weeklyReport}
                onChange={() => handleNotifToggle('weeklyReport')}
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
};

export default Settings;
