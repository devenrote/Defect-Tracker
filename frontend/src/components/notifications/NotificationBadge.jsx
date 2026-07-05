import React from 'react';

const NotificationBadge = ({ count, type = 'danger', className = '' }) => {
  if (count === undefined || count === null) return null;

  let colorClasses = 'bg-rose-500 text-white';
  if (type === 'primary') colorClasses = 'bg-brand-600 text-white dark:bg-brand-500';
  if (type === 'success') colorClasses = 'bg-emerald-500 text-white';
  if (type === 'warning') colorClasses = 'bg-amber-500 text-white';
  if (type === 'info') colorClasses = 'bg-blue-500 text-white';
  if (type === 'slate') colorClasses = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  return (
    <span className={`inline-flex items-center justify-center text-[10px] font-black rounded-full h-5 px-1.5 min-w-[20px] ${colorClasses} ${className}`}>
      {count}
    </span>
  );
};

export default NotificationBadge;
