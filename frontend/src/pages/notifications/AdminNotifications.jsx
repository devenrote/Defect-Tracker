import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { notificationAPI } from '../../services/api';
import NotificationCard from '../../components/notifications/NotificationCard';
import NotificationEmptyState from '../../components/notifications/NotificationEmptyState';
import NotificationSkeleton from '../../components/notifications/NotificationSkeleton';
import { 
  CheckCircle2, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  AlertTriangle, 
  FolderKanban, 
  UserCheck, 
  Settings, 
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminNotificationService } from '../../services/notificationServices';

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'read', 'unread'
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'unread', 'critical', 'projects', 'users', 'system'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      const raw = res.data.data || [];
      setNotifications(AdminNotificationService.getNotifications(raw));
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, activeCategory, sortBy]);

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

  const handleClearRead = async () => {
    const hasRead = notifications.some(n => n.is_read);
    if (!hasRead) {
      toast.error('No read notifications to clear');
      return;
    }
    if (!confirm('Are you sure you want to delete all read notifications from the database?')) return;
    try {
      await notificationAPI.clearRead();
      setNotifications(prev => prev.filter(n => !n.is_read));
      toast.success('Read notifications cleared successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to clear read notifications');
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

  // ==========================================
  // COUNTERS (CALCULATED FROM DATABASE DATA)
  // ==========================================
  const countAll = notifications.length;
  const countUnread = notifications.filter(n => !n.is_read).length;
  const countCritical = notifications.filter(n => 
    n.type === 'critical_defect' || 
    n.type === 'critical_defect_created' || 
    n.type === 'critical_defect_reopened' || 
    n.message?.includes('CRITICAL')
  ).length;
  const countProjects = notifications.filter(n => 
    n.type?.startsWith('project_') || 
    n.type?.startsWith('manager_')
  ).length;
  const countUsers = notifications.filter(n => 
    n.type?.startsWith('user_') || 
    n.type === 'role_changed'
  ).length;
  const countSystem = notifications.filter(n => 
    n.type === 'server_restart' || 
    n.type === 'database_backup' || 
    n.type === 'storage_warning' || 
    n.type === 'failed_login_attempt' || 
    n.type === 'admin_login' || 
    n.type === 'admin_password_changed' || 
    n.type === 'api_key_regenerated'
  ).length;

  // ==========================================
  // FILTER & SEARCH LOGIC
  // ==========================================
  const processedNotifications = notifications
    .filter(n => {
      // 1. Status Filter
      if (statusFilter === 'unread') return !n.is_read;
      if (statusFilter === 'read') return n.is_read;
      return true;
    })
    .filter(n => {
      // 2. Category Filter
      if (activeCategory === 'unread') return !n.is_read;
      if (activeCategory === 'critical') {
        return n.type === 'critical_defect' || n.type === 'critical_defect_created' || n.type === 'critical_defect_reopened' || n.message?.includes('CRITICAL');
      }
      if (activeCategory === 'projects') {
        return n.type?.startsWith('project_') || n.type?.startsWith('manager_');
      }
      if (activeCategory === 'users') {
        return n.type?.startsWith('user_') || n.type === 'role_changed';
      }
      if (activeCategory === 'system') {
        return n.type === 'server_restart' || n.type === 'database_backup' || n.type === 'storage_warning' || n.type === 'failed_login_attempt' || n.type === 'admin_login' || n.type === 'admin_password_changed' || n.type === 'api_key_regenerated';
      }
      return true;
    })
    .filter(n => {
      // 3. Search Query
      const query = searchTerm.toLowerCase();
      return (
        n.message?.toLowerCase().includes(query) ||
        n.title?.toLowerCase().includes(query) ||
        n.type?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      // 4. Sort order
      if (sortBy === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else {
        return new Date(a.created_at) - new Date(b.created_at);
      }
    });

  // ==========================================
  // PAGINATION LOGIC
  // ==========================================
  const totalItems = processedNotifications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedNotifications.slice(indexOfFirstItem, indexOfLastItem);

  const startRecord = totalItems === 0 ? 0 : indexOfFirstItem + 1;
  const endRecord = Math.min(indexOfLastItem, totalItems);

  return (
    <Layout title="Admin Notifications">
      <div className="max-w-4xl mx-auto animate-fadeIn flex flex-col gap-4">
        
        {/* Header Title & Counters Block */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">Workspace Notification Center</h2>
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                Monitor security events, system diagnostic updates, and workspace tasks.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                disabled={countUnread === 0}
                className="btn-primary text-xs font-bold py-2 px-3.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark All Read
              </button>
              
              <button
                onClick={handleClearRead}
                className="py-2 px-3.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 text-rose-600 dark:text-rose-455 border border-rose-200/50 dark:border-rose-900/50 hover:border-rose-350 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Read
              </button>
            </div>
          </div>

          {/* SaaS Counter Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
            {[
              { id: 'all', label: 'All', count: countAll, icon: Bell, color: 'text-slate-500' },
              { id: 'unread', label: 'Unread', count: countUnread, icon: Bell, color: 'text-brand-600 dark:text-brand-400' },
              { id: 'critical', label: 'Critical', count: countCritical, icon: AlertTriangle, color: 'text-rose-500' },
              { id: 'projects', label: 'Projects', count: countProjects, icon: FolderKanban, color: 'text-blue-500' },
              { id: 'users', label: 'Users', count: countUsers, icon: UserCheck, color: 'text-emerald-500' },
              { id: 'system', label: 'System', count: countSystem, icon: Settings, color: 'text-purple-500' },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center relative ${
                    isActive 
                      ? 'bg-brand-50/50 border-brand-500 dark:bg-brand-950/20 dark:border-brand-500 shadow-xs' 
                      : 'bg-slate-50/50 border-slate-100 dark:bg-slate-950/20 dark:border-slate-800/80 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.color}`} />
                  <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400">{tab.label}</span>
                  <span className="text-xs font-black text-slate-800 dark:text-white mt-0.5">{tab.count}</span>
                  {tab.id === 'unread' && countUnread > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search, Status & Sorting Filter Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs text-xs font-semibold">
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <option value="all">All States</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field text-xs py-1.5 px-2.5 bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Notifications List Container */}
        {loading ? (
          <NotificationSkeleton />
        ) : currentItems.length === 0 ? (
          <NotificationEmptyState 
            title="You're all caught up"
            message={searchTerm ? "No matching notification found." : "No notifications found in this category."}
          />
        ) : (
          <div className="space-y-4">
            <div className="card p-0 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded-2xl">
              {currentItems.map((n) => (
                <NotificationCard 
                  key={n.id}
                  notification={n}
                  onMarkRead={handleMarkAsRead}
                  onView={handleViewDetails}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>
                  Showing <span className="text-slate-800 dark:text-white font-extrabold">{startRecord}</span>–
                  <span className="text-slate-800 dark:text-white font-extrabold">{endRecord}</span> of 
                  <span className="text-slate-800 dark:text-white font-extrabold"> {totalItems}</span> records
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-center flex items-center justify-center transition-all cursor-pointer ${
                        currentPage === page 
                          ? 'bg-brand-500 text-white shadow-xs' 
                          : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-955'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-955 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminNotifications;
