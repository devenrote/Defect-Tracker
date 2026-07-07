import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import NotificationCard from '../../components/notifications/NotificationCard';
import NotificationEmptyState from '../../components/notifications/NotificationEmptyState';
import NotificationSkeleton from '../../components/notifications/NotificationSkeleton';
import { CheckCircle2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI, defectAPI } from '../../services/api';
import { DeveloperNotificationService } from '../../services/notificationServices';

const DeveloperNotifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const [notifRes, defectsRes] = await Promise.all([
        notificationAPI.getAll(),
        defectAPI.getAll()
      ]);
      const raw = notifRes.data.data || [];
      const defects = defectsRes.data.data || [];
      setNotifications(DeveloperNotificationService.getNotifications(raw, user.id, defects));
    } catch {
      // Mock fallback
      setNotifications([
        { id: 1, type: 'defect_assigned', title: 'Defect Assigned', message: 'You have been assigned defect: Sale Issue', is_read: false, created_at: new Date().toISOString(), issue_id: 16 },
        { id: 2, type: 'comment_added', title: 'Comment Added', message: 'Mike Developer commented: "Please verify the latest fix."', is_read: false, created_at: new Date(Date.now() - 720000).toISOString(), issue_id: 15 }
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
      // mock
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    toast.success('Marked as read');
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
    } catch {
      // mock
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  };

  const handleDeleteAll = () => {
    setNotifications([]);
    toast.success('Cleared all notifications');
  };

  const handleViewDetails = (n) => {
    if (!n.is_read) {
      handleMarkAsRead(n.id);
    }
    navigate(`/defects/${n.issue_id}`);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Layout title="Developer Workspace Notifications">
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
                className="btn-secondary text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/20 py-1.5 border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear all
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <NotificationSkeleton />
        ) : notifications.length === 0 ? (
          <NotificationEmptyState 
            title="Inbox is clean"
            message="No alerts or comments found."
          />
        ) : (
          <div className="card p-0 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 shadow-xs">
            {notifications.map((n) => (
              <NotificationCard 
                key={n.id}
                notification={n}
                onMarkRead={handleMarkAsRead}
                onView={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DeveloperNotifications;
