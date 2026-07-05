import React from 'react';

const NotificationSkeleton = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="card p-4 sm:p-5 flex items-start gap-4 animate-pulse shadow-xs border border-slate-100 dark:border-slate-800">
          <div className="w-9.5 h-9.5 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
            <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/5 mt-3"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSkeleton;
