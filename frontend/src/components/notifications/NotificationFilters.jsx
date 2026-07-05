import React from 'react';
import { Search } from 'lucide-react';

const NotificationFilters = ({ searchQuery, onSearchChange, readFilter, onReadFilterChange }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center mb-5">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search notifications by message keywords..."
          className="input-field pl-9 text-xs py-2 w-full bg-slate-50/50 dark:bg-slate-850/40"
        />
      </div>

      {/* Read Status Dropdown */}
      <div className="w-full sm:w-44">
        <select
          value={readFilter}
          onChange={(e) => onReadFilterChange(e.target.value)}
          className="input-field text-xs py-2 w-full bg-slate-50/50 dark:bg-slate-850/40 cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="unread">Unread Only</option>
          <option value="read">Read Only</option>
        </select>
      </div>
    </div>
  );
};

export default NotificationFilters;
