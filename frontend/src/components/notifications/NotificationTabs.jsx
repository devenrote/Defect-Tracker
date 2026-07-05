import React from 'react';
import NotificationBadge from './NotificationBadge';

const NotificationTabs = ({ tabs, activeTab, onTabChange, counts = {} }) => {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all cursor-pointer uppercase tracking-wider shrink-0 ${
            activeTab === tab.id
              ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-250'
          }`}
        >
          {tab.label}
          {counts[tab.id] > 0 && (
            <NotificationBadge 
              count={counts[tab.id]} 
              type={tab.id === 'critical' ? 'danger' : 'primary'} 
              className="ml-1 scale-90"
            />
          )}
        </button>
      ))}
    </div>
  );
};

export default NotificationTabs;
