import React from 'react';
import { 
  Bell, 
  Check, 
  MessageSquare, 
  Paperclip, 
  Shield, 
  RotateCcw, 
  Briefcase, 
  FolderKanban, 
  AlertTriangle, 
  Clock 
} from 'lucide-react';

const NotificationDropdown = ({ notifications, onNotificationClick }) => {
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

  const getStyleConfig = (type) => {
    switch (type) {
      case 'defect_resolved':
      case 'defect_verified':
        return {
          icon: Check,
          color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30',
          badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400',
          badge: 'Resolved'
        };
      case 'comment_added':
      case 'comment':
        return {
          icon: MessageSquare,
          color: 'bg-purple-50 text-purple-600 dark:bg-purple-955/20 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30',
          badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-955/20 dark:text-purple-400',
          badge: 'Comment'
        };
      case 'attachment_added':
      case 'attachment':
        return {
          icon: Paperclip,
          color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30',
          badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
          badge: 'Attachment'
        };
      case 'defect_assigned':
        return {
          icon: Briefcase,
          color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30',
          badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400',
          badge: 'Assigned'
        };
      case 'project_created':
      case 'project_updated':
      case 'project_archived':
        return {
          icon: FolderKanban,
          color: 'bg-indigo-50 text-indigo-655 dark:bg-indigo-955/20 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/30',
          badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400',
          badge: 'Project'
        };
      case 'role_changed':
        return {
          icon: Shield,
          color: 'bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30',
          badgeColor: 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400',
          badge: 'Security'
        };
      case 'critical_defect':
        return {
          icon: AlertTriangle,
          color: 'bg-rose-50 text-rose-600 dark:bg-rose-955/20 dark:text-rose-455 border border-rose-100 dark:border-rose-900/30',
          badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-455',
          badge: 'Critical'
        };
      case 'overdue_defect':
      case 'deadline_reminder':
        return {
          icon: Clock,
          color: 'bg-orange-50 text-orange-600 dark:bg-orange-955/20 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30',
          badgeColor: 'bg-orange-50 text-orange-700 dark:bg-orange-955/20 dark:text-orange-400',
          badge: 'Deadline'
        };
      default:
        return {
          icon: Bell,
          color: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-100 dark:border-slate-850',
          badgeColor: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-350',
          badge: 'System'
        };
    }
  };

  return (
    <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[380px]">
      {notifications.length === 0 ? (
        <div className="py-12 px-6 text-center space-y-2 animate-fadeIn">
          <span className="text-3xl block">🔔</span>
          <h4 className="text-xs font-bold text-slate-755 dark:text-slate-350">You're all caught up!</h4>
          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">No new notifications.</p>
        </div>
      ) : (
        notifications.map((n) => {
          const parsed = getStyleConfig(n.type);
          const IconComponent = parsed.icon;

          return (
            <div
              key={n.id}
              onClick={() => onNotificationClick(n)}
              className={`p-4 hover:bg-slate-50/60 dark:hover:bg-slate-850/30 cursor-pointer transition-all flex items-start gap-3 relative animate-fadeIn ${
                !n.is_read ? 'bg-brand-50/30 dark:bg-brand-950/10' : 'bg-white dark:bg-slate-900'
              }`}
            >
              {/* Left Icon */}
              <span className={`w-8 h-8 rounded-lg ${parsed.color} flex items-center justify-center font-semibold shrink-0 mt-0.5 shadow-xs`}>
                <IconComponent className="w-4 h-4" />
              </span>

              {/* Right Details */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase border ${parsed.badgeColor}`}>
                    {parsed.badge}
                  </span>
                  {n.issue_id && (
                    <span className="text-[9px] text-slate-400 dark:text-slate-550 font-bold font-mono shrink-0">
                      DF-{n.issue_id}
                    </span>
                  )}
                </div>
                
                <p className="text-[10px] text-slate-455 dark:text-slate-500 font-bold mt-1 truncate" title={n.title}>
                  {n.title}
                </p>
                
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal mt-1 font-medium break-words line-clamp-2">
                  {n.message}
                </p>
                
                <div className="flex items-center gap-1.5 mt-2 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <span>{getRelativeTime(n.created_at)}</span>
                </div>
              </div>

              {/* Unread dot */}
              {!n.is_read && (
                <span className="w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-500 shrink-0 mt-2"></span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default NotificationDropdown;
