import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { notificationAPI } from '../../services/api';
import NotificationCard from '../../components/notifications/NotificationCard';
import NotificationTabs from '../../components/notifications/NotificationTabs';
import NotificationFilters from '../../components/notifications/NotificationFilters';
import NotificationEmptyState from '../../components/notifications/NotificationEmptyState';
import NotificationSkeleton from '../../components/notifications/NotificationSkeleton';
import { CheckCircle2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ManagerNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [readFilter, setReadFilter] = useState('all');

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.data || []);
    } catch {
      // Mock notifications in case backend api is offline
      setNotifications([
        { id: 1, type: 'critical_defect', title: 'Critical Defect Alert', message: 'New critical defect "NullPointerException in user login" reported in Project Alpha', is_read: false, created_at: new Date().toISOString(), issue_id: 101 },
        { id: 2, type: 'defect_resolved', title: 'Defect Resolved', message: 'Defect ID #DF-102 was resolved by developer John Doe', is_read: false, created_at: new Date(Date.now() - 1800000).toISOString(), issue_id: 102 },
        { id: 3, type: 'comment_added', title: 'Comment Added', message: 'Your comment on "CSS layout issues on Firefox mobile" was replied to by Sarah PM', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString(), issue_id: 103 },
        { id: 4, type: 'project_updated', title: 'Project Updated', message: 'Project "Beta Integration" timeline has been updated by admin', is_read: true, created_at: new Date(Date.now() - 172800000).toISOString() }
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

  // Dynamic filter lists
  const filterByTab = (notifs) => {
    switch (activeTab) {
      case 'unread':
        return notifs.filter(n => !n.is_read);
      case 'critical':
        return notifs.filter(n => n.type === 'critical_defect' || n.title?.toLowerCase().includes('critical') || n.message?.toLowerCase().includes('critical'));
      case 'projects':
        return notifs.filter(n => ['project_created', 'project_updated', 'project_archived'].includes(n.type) || n.message?.toLowerCase().includes('project'));
      case 'defects':
        return notifs.filter(n => [
          'defect_reported', 'new_defect', 'defect_assigned', 'defect_unassigned', 
          'work_started', 'status_changed', 'defect_resolved', 'defect_reopened', 
          'defect_closed', 'comment_added'
        ].includes(n.type) || n.message?.toLowerCase().includes('defect') || n.message?.toLowerCase().includes('issue') || n.issue_id);
      case 'team':
        return notifs.filter(n => ['member_added', 'member_removed', 'role_changed'].includes(n.type) || n.message?.toLowerCase().includes('member') || n.message?.toLowerCase().includes('role'));
      case 'all':
      default:
        return notifs;
    }
  };

  const filterByReadStatus = (notifs) => {
    if (readFilter === 'unread') return notifs.filter(n => !n.is_read);
    if (readFilter === 'read') return notifs.filter(n => n.is_read);
    return notifs;
  };

  const filterBySearch = (notifs) => {
    if (!searchQuery.trim()) return notifs;
    const query = searchQuery.toLowerCase();
    return notifs.filter(n => 
      n.message?.toLowerCase().includes(query) || 
      n.title?.toLowerCase().includes(query)
    );
  };

  const getFilteredNotifications = () => {
    let result = [...notifications];
    result = filterByTab(result);
    result = filterByReadStatus(result);
    result = filterBySearch(result);
    return result;
  };

  const processedNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const tabList = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'critical', label: 'Critical' },
    { id: 'projects', label: 'Projects' },
    { id: 'defects', label: 'Defects' },
    { id: 'team', label: 'Team' }
  ];

  // Tab count indicators
  const getTabCounts = () => {
    return {
      all: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      critical: filterByTab(notifications).filter(n => activeTab === 'critical' || (n.type === 'critical_defect' || n.title?.toLowerCase().includes('critical'))).length,
      projects: notifications.filter(n => ['project_created', 'project_updated', 'project_archived'].includes(n.type) || n.message?.toLowerCase().includes('project')).length,
      defects: notifications.filter(n => [
        'defect_reported', 'new_defect', 'defect_assigned', 'defect_unassigned', 
        'work_started', 'status_changed', 'defect_resolved', 'defect_reopened', 
        'defect_closed', 'comment_added'
      ].includes(n.type) || n.issue_id).length,
      team: notifications.filter(n => ['member_added', 'member_removed', 'role_changed'].includes(n.type) || n.message?.toLowerCase().includes('role') || n.message?.toLowerCase().includes('member')).length
    };
  };

  return (
    <Layout title="Manager Notifications">
      <div className="max-w-4xl mx-auto">
        {/* Header Summary */}
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

        {/* Categories Tab Bar */}
        <NotificationTabs 
          tabs={tabList} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          counts={getTabCounts()} 
        />

        {/* Keyword Filter & Read Status Dropdowns */}
        <NotificationFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          readFilter={readFilter}
          onReadFilterChange={setReadFilter}
        />

        {/* Listing Panel */}
        {loading ? (
          <NotificationSkeleton />
        ) : processedNotifications.length === 0 ? (
          <NotificationEmptyState 
            title="No notifications found"
            message={`No alerts fit your applied filters for "${activeTab}" notifications.`}
          />
        ) : (
          <div className="card p-0 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 shadow-xs">
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

export default ManagerNotifications;
