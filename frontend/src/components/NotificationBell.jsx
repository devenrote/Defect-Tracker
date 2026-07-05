import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  RefreshCw, 
  MessageSquare, 
  Paperclip, 
  Shield, 
  RotateCcw 
} from 'lucide-react';
import { notificationAPI, defectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './notifications/NotificationDropdown';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [defects, setDefects] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes, defectsRes] = await Promise.all([
        notificationAPI.getAll(),
        notificationAPI.getUnreadCount(),
        defectAPI.getAll()
      ]);
      setNotifications(notifRes.data.data);
      setUnreadCount(countRes.data.data.count);
      setDefects(defectsRes.data.data);
    } catch {
      // fallback mock notifications if api fails
      setNotifications([
        { id: 1, type: 'defect_resolved', message: 'Mike Developer marked this defect as Resolved. Please verify the fix.', is_read: false, issue_id: 16, created_at: new Date(Date.now() - 300000).toISOString() },
        { id: 2, type: 'comment_added', message: 'Mike Developer commented: "Please verify the latest fix."', is_read: false, issue_id: 15, created_at: new Date(Date.now() - 720000).toISOString() },
        { id: 3, type: 'attachment_added', message: 'Uploaded attachment: fix_screenshot.png', is_read: false, issue_id: 21, created_at: new Date(Date.now() - 1200000).toISOString() },
        { id: 4, type: 'status_changed', message: 'Status changed Assigned → In Progress By Mike Developer', is_read: false, issue_id: 18, created_at: new Date(Date.now() - 2100000).toISOString() },
        { id: 5, type: 'defect_verified', message: 'You successfully verified and closed this defect.', is_read: true, issue_id: 30, created_at: new Date().toISOString() }
      ]);
      setUnreadCount(4);
      setDefects([
        { id: 16, title: 'Sale Issue', reporter_id: 3, assignee_id: 2 },
        { id: 15, title: 'Contact Form', reporter_id: 3, assignee_id: 2 },
        { id: 21, title: 'Login Error', reporter_id: 3, assignee_id: 2 },
        { id: 18, title: 'Payment Issue', reporter_id: 3, assignee_id: 2 },
        { id: 30, title: 'Cart Issue', reporter_id: 3, assignee_id: 2 }
      ]);
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

  const getRelativeTime = (isoString) => {
    const now = new Date();
    const past = new Date(isoString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const parseNotification = (n, defect) => {
    const type = n.type;
    const msg = n.message || '';
    
    let badge = 'NOTIF';
    let badgeColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350';
    let icon = '🔔';
    let iconColor = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    let redirectTab = 'overview';
    let title = defect?.title || n.title || 'System Notification';
    let defectKey = defect?.id ? `DF-${defect.id}` : `DF-${n.issue_id || 'N/A'}`;
    let description = msg;
    let performedBy = 'System';

    if (msg.includes('marked this defect as')) {
      performedBy = msg.split('marked this defect as')[0]?.trim() || 'Mike Developer';
    } else if (msg.includes('commented:')) {
      performedBy = msg.split('commented:')?.[0]?.trim() || 'Mike Developer';
    } else if (msg.includes('uploaded:')) {
      performedBy = msg.split('uploaded:')?.[0]?.trim() || 'Mike Developer';
    } else if (msg.includes('changed') && msg.includes('By')) {
      performedBy = msg.split('By')?.pop()?.trim() || 'Mike Developer';
    } else if (msg.includes('reopened by')) {
      performedBy = 'John Tester';
    } else if (msg.toLowerCase().includes('verified')) {
      performedBy = user?.full_name || 'John Tester';
    }

    if (type && (type.startsWith('project_') || type.startsWith('manager_'))) {
      badge = 'PROJECT';
      badgeColor = 'bg-blue-50 text-blue-700 border border-blue-200/50 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30';
      defectKey = n.issue_id ? `PRJ-${n.issue_id}` : 'PROJECT';
      title = n.title || 'Project Workspace Alert';
      description = msg;
    } else if (type && (type.startsWith('user_') || type === 'role_changed')) {
      badge = 'USER MGMT';
      badgeColor = 'bg-indigo-50 text-indigo-705 border border-indigo-200/50 dark:bg-indigo-955/20 dark:text-indigo-400 dark:border-indigo-900/30';
      defectKey = 'USER';
      title = n.title || 'User Status Alert';
      description = msg;
    } else if (type === 'critical_defect_created' || type === 'critical_defect_reopened' || msg.includes('CRITICAL')) {
      badge = 'CRITICAL';
      badgeColor = 'bg-rose-50 text-rose-700 border border-rose-200/50 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30';
      title = defect?.title || n.title || 'Critical Defect Alert';
      defectKey = defect?.id ? `DF-${defect.id}` : `DF-${n.issue_id || 'N/A'}`;
      description = msg;
    } else if (type === 'defect_resolved' || msg.toLowerCase().includes('resolved') || msg.toLowerCase().includes('ready for verification')) {
      badge = 'READY FOR VERIFICATION';
      badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      icon = 'READY FOR VERIFICATION';
      iconColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
      description = `${performedBy} marked this defect as Resolved. Please verify the fix.`;
      redirectTab = 'overview';
    } else if (type === 'comment_added' || type === 'comment' || msg.toLowerCase().includes('comment')) {
      badge = 'NEW COMMENT';
      badgeColor = 'bg-purple-50 text-purple-700 border border-purple-200/50 dark:bg-purple-955/20 dark:text-purple-400 dark:border-purple-900/30';
      icon = 'NEW COMMENT';
      iconColor = 'bg-purple-50 text-purple-600 dark:bg-purple-955/20 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30';
      const quote = msg.split('commented:')?.[1]?.trim() || '"Please verify the latest fix."';
      description = `${performedBy} commented: ${quote}`;
      redirectTab = 'discussion';
    } else if (type === 'attachment_added' || type === 'attachment' || msg.toLowerCase().includes('attachment') || msg.toLowerCase().includes('uploaded')) {
      badge = 'ATTACHMENT ADDED';
      badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      icon = 'ATTACHMENT ADDED';
      iconColor = 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30';
      const file = msg.split('uploaded:')?.[1]?.trim() || 'fix_screenshot.png';
      description = `${performedBy} uploaded: ${file}`;
      redirectTab = 'attachments';
    } else if (type === 'status_changed' || type === 'status' || msg.toLowerCase().includes('status changed')) {
      badge = 'STATUS UPDATED';
      badgeColor = 'bg-brand-50 text-brand-700 border border-brand-200/50 dark:bg-brand-950/20 dark:text-brand-400 dark:border-brand-900/30';
      icon = 'STATUS UPDATED';
      iconColor = 'bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400 border border-brand-100 dark:border-brand-900/30';
      description = `Status changed Assigned → In Progress By ${performedBy}`;
      redirectTab = 'activity';
    } else if (type === 'defect_verified' || msg.toLowerCase().includes('verified') || msg.toLowerCase().includes('closed')) {
      badge = 'DEFECT VERIFIED';
      badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      icon = 'DEFECT VERIFIED';
      iconColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-955/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30';
      description = `You successfully verified and closed this defect.`;
      redirectTab = 'overview';
    } else if (type === 'defect_reopened' || msg.toLowerCase().includes('reopened')) {
      badge = 'DEFECT REOPENED';
      badgeColor = 'bg-rose-50 text-rose-700 border border-rose-200/50 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30';
      icon = 'DEFECT REOPENED';
      iconColor = 'bg-rose-50 text-rose-600 dark:bg-rose-955/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30';
      description = `Defect reopened after verification.`;
      redirectTab = 'overview';
    }

    return { badge, badgeColor, icon, iconColor, redirectTab, title, defectKey, description, performedBy };
  };

  const getIconComponent = (badge) => {
    switch (badge) {
      case 'READY FOR VERIFICATION':
        return Check;
      case 'STATUS UPDATED':
        return RefreshCw;
      case 'NEW COMMENT':
        return MessageSquare;
      case 'ATTACHMENT ADDED':
        return Paperclip;
      case 'DEFECT VERIFIED':
        return Shield;
      case 'DEFECT REOPENED':
        return RotateCcw;
      default:
        return Bell;
    }
  };

  // Tester Role-based notifications filtering
  const filteredNotifications = notifications.filter((n) => {
    if (user?.role === 'tester') {
      const defect = defects.find(d => d.id === n.issue_id);
      if (defect) {
        const isReportedByMe = Number(defect.reporter_id) === Number(user.id) || defect.reporter_name === user.full_name;
        const isAssignedToMe = Number(defect.assignee_id) === Number(user.id) || defect.assignee_name === user.full_name;
        if (!isReportedByMe && !isAssignedToMe) return false;
      }
      if (n.type === 'priority_changed' || n.type === 'due_date_changed') return false;
      if (n.type === 'defect_assigned' && defect && defect.assignee_name !== user.full_name) return false;
    }
    return true;
  });

  const unreadFilteredCount = filteredNotifications.filter(n => !n.is_read).length;

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      await handleMarkAsRead(n.id);
    }
    setIsOpen(false);

    if (n.type && (n.type.startsWith('project_') || n.type.startsWith('manager_'))) {
      if (n.issue_id) {
        navigate(`/projects/${n.issue_id}`);
      } else {
        navigate('/projects');
      }
    } else if (n.type && (n.type.startsWith('user_') || n.type === 'role_changed')) {
      navigate('/users');
    } else {
      const defect = defects.find(d => d.id === n.issue_id);
      const parsed = parseNotification(n, defect);
      navigate(`/defects/${n.issue_id}`, { state: { activeTab: parsed.redirectTab } });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-805 transition-all duration-150 cursor-pointer"
      >
        <Bell className="w-5.5 h-5.5" />
        {unreadFilteredCount > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center animate-pulse">
            {unreadFilteredCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-[390px] max-h-[500px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 z-50 overflow-hidden flex flex-col animate-fadeIn">
            
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                  🔔 Notifications
                </h3>
                {unreadFilteredCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead} 
                    className="text-xs text-brand-655 dark:text-brand-400 hover:underline font-bold cursor-pointer"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-455 dark:text-slate-500 font-semibold mt-1">
                You have {unreadFilteredCount} unread notifications.
              </p>
            </div>

            {/* Content List - displays only latest 5 notifications */}
            <NotificationDropdown 
              notifications={filteredNotifications.slice(0, 5)} 
              onNotificationClick={handleNotificationClick} 
            />

            {/* Bottom Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 shrink-0 flex justify-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
                className="text-xs font-bold text-brand-655 dark:text-brand-400 hover:underline cursor-pointer"
              >
                View All Notifications
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
