import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { notificationAPI } from '../services/api';
import { Bell, CheckCircle2, Inbox, Calendar, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.data);
    } catch {
      // Mock notifications in case backend api is offline
      setNotifications([
        { id: 1, message: 'New critical defect "NullPointerException in user login" reported in Project Alpha', is_read: false, created_at: new Date().toISOString() },
        { id: 2, message: 'Defect ID #DF-102 was resolved by developer John Doe', is_read: false, created_at: new Date(Date.now() - 1800000).toISOString() },
        { id: 3, message: 'Your comment on "CSS layout issues on Firefox mobile" was replied to by Sarah PM', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: 4, message: 'Project "Beta Integration" timeline has been updated by admin', is_read: true, created_at: new Date(Date.now() - 172800000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
    } catch {
      // mock action
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    toast.success('Marked as read');
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
    } catch {
      // mock action
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  };

  const handleDeleteAll = () => {
    setNotifications([]);
    toast.success('Cleared all notifications');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Layout title="Notifications">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              You have <span className="font-semibold text-brand-600 dark:text-brand-400">{unreadCount}</span> unread notifications.
            </p>
          </div>
          
          {notifications.length > 0 && (
            <div className="flex items-center gap-3 self-start sm:self-auto">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="btn-secondary text-xs py-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button
                onClick={handleDeleteAll}
                className="btn-secondary text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 py-1.5 border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear all
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="card text-center py-16 flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Inbox is empty</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              We will notify you here when activity occurs in your projects or assigned defects.
            </p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                  !n.is_read ? 'bg-brand-50/20 dark:bg-brand-950/5' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    !n.is_read
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-sm leading-relaxed ${
                      !n.is_read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {!n.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 hover:underline shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Notifications;
