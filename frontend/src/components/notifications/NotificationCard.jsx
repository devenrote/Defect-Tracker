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
  Clock, 
  ArrowRight,
  Eye
} from 'lucide-react';

const NotificationCard = ({ notification, onMarkRead, onView }) => {
  const { id, type, title, message, is_read, created_at, issue_id } = notification;

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

  const getStyleConfig = () => {
    switch (type) {
      case 'defect_resolved':
      case 'defect_verified':
        return {
          icon: Check,
          color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
          badge: 'Resolved'
        };
      case 'comment_added':
      case 'comment':
        return {
          icon: MessageSquare,
          color: 'bg-purple-50 text-purple-700 dark:bg-purple-955/20 dark:text-purple-400 border-purple-100 dark:border-purple-900/30',
          badge: 'Comment'
        };
      case 'attachment_added':
      case 'attachment':
        return {
          icon: Paperclip,
          color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
          badge: 'Attachment'
        };
      case 'defect_assigned':
        return {
          icon: Briefcase,
          color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
          badge: 'Assigned'
        };
      case 'project_created':
      case 'project_updated':
      case 'project_archived':
        return {
          icon: FolderKanban,
          color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
          badge: 'Project'
        };
      case 'role_changed':
      case 'api_key_regenerated':
      case 'admin_password_changed':
      case 'failed_login_attempt':
      case 'admin_login':
        return {
          icon: Shield,
          color: 'bg-teal-50 text-teal-750 dark:bg-teal-950/20 dark:text-teal-400 border border-teal-100 dark:border-teal-900/30',
          badge: 'Security'
        };
      case 'critical_defect':
        return {
          icon: AlertTriangle,
          color: 'bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-455 border border-rose-100 dark:border-rose-900/30 font-bold',
          badge: 'Critical'
        };
      case 'storage_warning':
        return {
          icon: AlertTriangle,
          color: 'bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-455 border border-rose-100 dark:border-rose-900/30 font-bold',
          badge: 'Warning'
        };
      case 'overdue_defect':
      case 'deadline_reminder':
      case 'server_restart':
      case 'database_backup':
        return {
          icon: Clock,
          color: 'bg-orange-50 text-orange-700 dark:bg-orange-955/20 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30',
          badge: 'System'
        };
      default:
        return {
          icon: Bell,
          color: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-350 border-slate-100 dark:border-slate-850',
          badge: 'System'
        };
    }
  };

  const config = getStyleConfig();
  const IconComponent = config.icon;

  return (
    <div
      className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-all duration-150 hover:bg-slate-50/50 dark:hover:bg-slate-850/10 border-b border-slate-100 dark:border-slate-850 animate-fadeIn ${
        !is_read ? 'bg-brand-50/20 dark:bg-brand-950/5' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Type Icon */}
        <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 shadow-xs ${config.color}`}>
          <IconComponent className="w-4 h-4" />
        </div>

        {/* Content details */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase border ${config.color}`}>
              {config.badge}
            </span>
            <h4 className={`text-xs font-bold ${!is_read ? 'text-slate-850 dark:text-white' : 'text-slate-600 dark:text-slate-350'}`}>
              {title}
            </h4>
            {issue_id && (
              <span className="text-[9px] text-slate-400 dark:text-slate-550 font-bold font-mono">
                DF-{issue_id}
              </span>
            )}
          </div>
          
          <p className={`text-xs mt-1.5 leading-relaxed font-medium ${
            !is_read ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'
          }`}>
            {message}
          </p>

          <div className="flex items-center gap-1.5 mt-2.5 text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            <Clock className="w-3 h-3" />
            <span>{new Date(created_at).toLocaleString()}</span>
            <span>•</span>
            <span>{getRelativeTime(created_at)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 shrink-0 mt-0.5">
        {!is_read && (
          <button
            onClick={() => onMarkRead(id)}
            className="text-[10px] font-black text-brand-600 dark:text-brand-400 hover:text-brand-700 hover:underline tracking-wide uppercase"
          >
            Mark Read
          </button>
        )}
        {issue_id && (
          <button
            onClick={() => onView(notification)}
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 border border-slate-200/50 dark:border-slate-800 rounded-lg transition-colors cursor-pointer"
            title="View Defect Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationCard;
