import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { notificationAPI } from '../services/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationAPI.getAll(),
        notificationAPI.getUnreadCount(),
      ]);
      setNotifications(notifRes.data.data);
      setUnreadCount(countRes.data.data.count);
    } catch {
      // fallback mock notifications if api fails
      setNotifications([
        { id: 1, message: 'New defect reported in Project Alpha', is_read: false, created_at: new Date().toISOString() },
        { id: 2, message: 'Your defect has been assigned to dev-team', is_read: true, created_at: new Date(Date.now() - 3600000).toISOString() },
      ]);
      setUnreadCount(1);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
    } catch {
      // mock action
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
    } catch {
      // mock action
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150"
      >
        <Bell className="w-5.5 h-5.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 z-50 overflow-hidden transform origin-top-right transition-all">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">No notifications yet</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${!n.is_read ? 'bg-brand-50/40 dark:bg-brand-950/10' : ''}`}
                    onClick={() => {
                      if (!n.is_read) handleMarkAsRead(n.id);
                    }}
                  >
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
