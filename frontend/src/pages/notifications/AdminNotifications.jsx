import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { notificationAPI } from '../../services/api';
import NotificationCard from '../../components/notifications/NotificationCard';
import NotificationEmptyState from '../../components/notifications/NotificationEmptyState';
import NotificationSkeleton from '../../components/notifications/NotificationSkeleton';
import { CheckCircle2, Search, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'read', 'unread'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest'

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      toast.error('Failed to load real-time notifications');
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
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      toast.success('Notification marked as read');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status on server');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark all as read');
    }
  };

  const handleViewDetails = (n) => {
    if (!n.is_read) {
      handleMarkAsRead(n.id);
    }
    if (n.type && (n.type.startsWith('project_') || n.type.startsWith('manager_'))) {
      if (n.issue_id) {
        navigate(`/projects/${n.issue_id}`);
      } else {
        navigate('/projects');
      }
    } else if (n.type && (n.type.startsWith('user_') || n.type === 'role_changed')) {
      navigate('/users');
    } else {
      if (n.issue_id) {
        navigate(`/defects/${n.issue_id}`);
      }
    }
  };

  // Filter, search, and sort notifications locally
  const processedNotifications = notifications
    .filter(n => {
      // 1. Filter status
      if (filterType === 'unread') return !n.is_read;
      if (filterType === 'read') return n.is_read;
      return true;
    })
    .filter(n => {
      // 2. Search query matches
      const query = searchTerm.toLowerCase();
      return (
        n.message?.toLowerCase().includes(query) ||
        n.title?.toLowerCase().includes(query) ||
        n.type?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      // 3. Sorting logic
      if (sortBy === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else {
        return new Date(a.created_at) - new Date(b.created_at);
      }
    });

  const totalUnread = notifications.filter(n => !n.is_read).length;

  return (
    <Layout title="Admin Workspace Notifications">
      <div className="max-w-4xl mx-auto animate-fadeIn flex flex-col gap-4">
        
        {/* Header Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Notification Center</h2>
            <p className="text-xs text-slate-500 mt-1 font-semibold">
              You have <span className="font-extrabold text-brand-600 dark:text-brand-400">{totalUnread}</span> unread workspace activities.
            </p>
          </div>
          
          {totalUnread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-primary text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>

        {/* Filters and Search controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs text-xs font-semibold">
          
          {/* Search Input Box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Filter Status Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field text-xs py-1 px-2.5 bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field text-xs py-1 px-2.5 bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Notifications List Container */}
        {loading ? (
          <NotificationSkeleton />
        ) : processedNotifications.length === 0 ? (
          <NotificationEmptyState 
            title="Inbox is clean"
            message={searchTerm ? "No matching notification found." : "No notifications found."}
          />
        ) : (
          <div className="card p-0 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded-2xl">
            {processedNotifications.map((n) => (
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

export default AdminNotifications;
