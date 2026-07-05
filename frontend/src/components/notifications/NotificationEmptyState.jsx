import React from 'react';
import { Inbox } from 'lucide-react';

const NotificationEmptyState = ({ title = 'Inbox is empty', message = 'No notifications found in this category.' }) => {
  return (
    <div className="card text-center py-16 flex flex-col items-center justify-center shadow-xs border border-slate-100 dark:border-slate-800 animate-fadeIn">
      <div className="w-14 h-14 bg-slate-50 dark:bg-slate-850 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-550 mb-4 shadow-inner">
        <Inbox className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-slate-800 dark:text-white text-base">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm font-medium">
        {message}
      </p>
    </div>
  );
};

export default NotificationEmptyState;
