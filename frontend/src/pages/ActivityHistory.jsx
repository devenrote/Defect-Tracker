import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Activity, Clock, MessageSquare, Paperclip, CheckCircle, ArrowRightLeft, SlidersHorizontal } from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { activityAPI, projectAPI, defectAPI } from '../services/api';

const ActivityHistory = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting Toolbar States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Collapsible Filter Panel States
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    project: '',
    type: '',
    severity: '',
    status: '',
    performedBy: ''
  });

  const [tempFilters, setTempFilters] = useState({
    dateFrom: '',
    dateTo: '',
    project: '',
    type: '',
    severity: '',
    status: '',
    performedBy: ''
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [actRes, projRes, defectsRes] = await Promise.all([
          activityAPI.getActivities(),
          projectAPI.getAll(),
          defectAPI.getAll()
        ]);
        setActivities(actRes.data.data);
        setProjects(projRes.data.data);
        setDefects(defectsRes.data.data);
      } catch {
        // Fallback offline mockups
        setActivities([
          { id: 1, action: 'Status Changed to In Progress', entity_type: 'issue', entity_id: 1, user_id: 4, user_name: 'Mike Developer', created_at: new Date(Date.now() - 120000).toISOString() },
          { id: 2, action: 'Comment Added on DEF-101', entity_type: 'comment', entity_id: 1, user_id: 1, user_name: 'Admin User', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: 3, action: 'Uploaded attachment: stress_test_log.txt', entity_type: 'attachment', entity_id: 3, user_id: 4, user_name: 'Mike Developer', created_at: new Date(Date.now() - 14400000).toISOString() },
          { id: 4, action: 'Resolution Submitted', entity_type: 'resolution', entity_id: 3, user_id: 4, user_name: 'Mike Developer', created_at: new Date(Date.now() - 28800000).toISOString() }
        ]);
        setProjects([
          { id: 1, project_name: 'Project Alpha Integration' },
          { id: 2, project_name: 'Mobile Gateway API Wrapper' }
        ]);
        setDefects([
          { id: 1, title: 'Database connection pool leakage in heavy throughput scenarios', project_name: 'Project Alpha Integration', project_id: 1, severity: 'Critical', status: 'In Progress' },
          { id: 3, title: 'Auth tokens expire prematurely before 24h limit', project_name: 'Mobile Gateway API Wrapper', project_id: 2, severity: 'High', status: 'Resolved' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRelativeTime = (isoString) => {
    const now = new Date();
    const past = new Date(isoString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  };

  const formatExactDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseActivity = (item, defect) => {
    const act = item.action.toLowerCase();
    let type = 'Activity';
    let title = 'Activity Logged';
    let description = item.action;
    let icon = '⚡';
    let iconColor = 'bg-slate-400 dark:bg-slate-700 text-slate-600 dark:text-slate-350';

    if (act.includes('status changed to') || act.includes('status changed')) {
      type = 'Status Changed';
      title = 'Status Changed';
      const status = item.action.split('to')?.pop()?.trim() || 'Updated';
      description = `Status changed → ${status}`;
      icon = '✔';
      iconColor = 'bg-brand-50 text-brand-650 border border-brand-200/50 dark:bg-brand-950/20 dark:text-brand-400 dark:border-brand-900/30';
    } else if (act.includes('comment added') || act.includes('comment')) {
      type = 'Comment Added';
      title = 'Comment Added';
      description = 'Added a new comment';
      icon = '💬';
      iconColor = 'bg-indigo-50 text-indigo-650 border border-indigo-200/50 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30';
    } else if (act.includes('uploaded attachment') || act.includes('uploaded') || act.includes('attachment')) {
      type = 'Attachment Uploaded';
      title = 'Attachment Uploaded';
      description = item.action;
      icon = '📎';
      iconColor = 'bg-amber-50 text-amber-650 border border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
    } else if (act.includes('resolution submitted') || act.includes('resolution')) {
      type = 'Resolution Submitted';
      title = 'Resolution Submitted';
      description = 'Defect resolution submitted';
      icon = '✔';
      iconColor = 'bg-emerald-50 text-emerald-650 border border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
    } else if (act.includes('reassigned') || act.includes('assigned')) {
      type = 'Defect Assigned';
      title = 'Defect Assigned';
      description = item.action;
      icon = '👤';
      iconColor = 'bg-purple-50 text-purple-650 border border-purple-200/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30';
    } else if (act.includes('reopened')) {
      type = 'Defect Reopened';
      title = 'Reopened';
      description = 'Defect reopened after verification';
      icon = '🔄';
      iconColor = 'bg-rose-50 text-rose-650 border border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
    } else if (act.includes('closed')) {
      type = 'Defect Closed';
      title = 'Defect Closed';
      description = 'Defect verified and closed';
      icon = '🔒';
      iconColor = 'bg-slate-100 text-slate-655 border border-slate-200/50 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700/60';
    } else if (act.includes('priority')) {
      type = 'Priority Updated';
      title = 'Priority Updated';
      description = item.action;
      icon = '⚠';
      iconColor = 'bg-amber-50 text-amber-650 border border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
    } else if (act.includes('severity')) {
      type = 'Severity Updated';
      title = 'Severity Updated';
      description = item.action;
      icon = '🔥';
      iconColor = 'bg-rose-50 text-rose-650 border border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
    }

    return { type, title, description, icon, iconColor };
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getRoleByName = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('tester')) return 'Tester';
    if (n.includes('dev') || n.includes('developer')) return 'Developer';
    if (n.includes('manager') || n.includes('pm')) return 'Manager';
    if (n.includes('admin')) return 'Admin';
    return 'Team Member';
  };

  // Evaluate filters
  const filteredActivities = activities.filter((item) => {
    const defect = defects.find(d => d.id === Number(item.entity_id)) || {};
    const parsed = parseActivity(item, defect);

    // Search input query matching
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchAction = item.action.toLowerCase().includes(q);
      const matchUser = item.user_name?.toLowerCase().includes(q);
      const matchDefect = defect.title?.toLowerCase().includes(q) || `df-${defect.id}`.includes(q);
      const matchProject = defect.project_name?.toLowerCase().includes(q);
      if (!matchAction && !matchUser && !matchDefect && !matchProject) return false;
    }

    // Collapsible Filters
    if (filters.project && defect.project_name !== filters.project) return false;
    
    if (filters.type) {
      if (filters.type === 'status' && !parsed.type.includes('Status')) return false;
      if (filters.type === 'comment' && !parsed.type.includes('Comment')) return false;
      if (filters.type === 'attachment' && !parsed.type.includes('Attachment')) return false;
      if (filters.type === 'resolution' && !parsed.type.includes('Resolution')) return false;
      if (filters.type === 'assignment' && !parsed.type.includes('Assigned')) return false;
      if (filters.type === 'priority' && !parsed.type.includes('Priority')) return false;
    }

    if (filters.severity && defect.severity !== filters.severity) return false;
    if (filters.status && defect.status !== filters.status) return false;
    if (filters.performedBy && !item.user_name?.toLowerCase().includes(filters.performedBy.toLowerCase())) return false;

    if (filters.dateFrom) {
      if (new Date(item.created_at) < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      const dateToLimit = new Date(filters.dateTo);
      dateToLimit.setHours(23, 59, 59, 999);
      if (new Date(item.created_at) > dateToLimit) return false;
    }

    return true;
  });

  // Sorting
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else {
      return new Date(a.created_at) - new Date(b.created_at);
    }
  });

  // Pagination calculation
  const totalRows = sortedActivities.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * rowsPerPage;
  const paginatedActivities = sortedActivities.slice(startIndex, startIndex + rowsPerPage);

  return (
    <Layout title="Activity History">
      <div className="flex flex-col gap-6">
        
        {/* Header section */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Activity History</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium leading-relaxed">
            Track every action performed on your assigned defects, including status updates, comments, assignments, priority changes, attachments, and resolutions.
          </p>
        </div>

        {/* Compact Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`btn-secondary text-xs flex items-center gap-1.5 px-3 py-2 cursor-pointer shadow-xs ${
                isFilterPanelOpen ? 'bg-slate-100 border-slate-355 dark:bg-slate-800' : ''
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-48">
              <input
                type="text"
                placeholder="Search activity..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field text-xs pl-8 pr-3 py-1.5 bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Sort By</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field text-xs py-1.5 px-2 bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 w-32 shrink-0 cursor-pointer font-bold text-slate-605 dark:text-slate-300"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {isFilterPanelOpen && (
          <div className="card p-4 shadow-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Date From */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1 tracking-wide">Date From</label>
                <input 
                  type="date" 
                  value={tempFilters.dateFrom} 
                  onChange={e => setTempFilters({...tempFilters, dateFrom: e.target.value})} 
                  className="input-field text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800" 
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1 tracking-wide">Date To</label>
                <input 
                  type="date" 
                  value={tempFilters.dateTo} 
                  onChange={e => setTempFilters({...tempFilters, dateTo: e.target.value})} 
                  className="input-field text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800" 
                />
              </div>

              {/* Project */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1 tracking-wide">Project</label>
                <select 
                  value={tempFilters.project} 
                  onChange={e => setTempFilters({...tempFilters, project: e.target.value})} 
                  className="input-field text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800"
                >
                  <option value="">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.project_name || p.name}>{p.project_name || p.name}</option>
                  ))}
                </select>
              </div>

              {/* Activity Type */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1 tracking-wide">Activity Type</label>
                <select 
                  value={tempFilters.type} 
                  onChange={e => setTempFilters({...tempFilters, type: e.target.value})} 
                  className="input-field text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800"
                >
                  <option value="">All Types</option>
                  <option value="status">Status Changes</option>
                  <option value="comment">Comments</option>
                  <option value="attachment">Attachments</option>
                  <option value="resolution">Resolutions</option>
                  <option value="assignment">Assignments</option>
                  <option value="priority">Priority Updates</option>
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1 tracking-wide">Severity</label>
                <select 
                  value={tempFilters.severity} 
                  onChange={e => setTempFilters({...tempFilters, severity: e.target.value})} 
                  className="input-field text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800"
                >
                  <option value="">All Severities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1 tracking-wide">Status</label>
                <select 
                  value={tempFilters.status} 
                  onChange={e => setTempFilters({...tempFilters, status: e.target.value})} 
                  className="input-field text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800"
                >
                  <option value="">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Testing">Testing</option>
                  <option value="Closed">Closed</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Reopened">Reopened</option>
                </select>
              </div>

              {/* Performed By */}
              <div>
                <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1 tracking-wide">Performed By</label>
                <input 
                  type="text" 
                  value={tempFilters.performedBy} 
                  onChange={e => setTempFilters({...tempFilters, performedBy: e.target.value})} 
                  className="input-field text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800" 
                  placeholder="Enter name..." 
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-105 dark:border-slate-800">
              <button 
                onClick={() => {
                  const empty = {
                    dateFrom: '',
                    dateTo: '',
                    project: '',
                    type: '',
                    severity: '',
                    status: '',
                    performedBy: ''
                  };
                  setTempFilters(empty);
                  setFilters(empty);
                  setCurrentPage(1);
                  toast.success('Filters reset');
                }} 
                className="btn-secondary text-xs py-1.5 px-4 cursor-pointer"
              >
                Reset
              </button>
              <button 
                onClick={() => {
                  setFilters({...tempFilters});
                  setCurrentPage(1);
                  toast.success('Filters applied');
                }} 
                className="btn-primary text-xs py-1.5 px-4 cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        {loading ? <div className="text-center mt-20"><LoadingSpinner /></div> : (
          <>
            {paginatedActivities.length === 0 ? (
              <div className="card py-16 text-center space-y-3 shadow-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl">
                <span className="text-4xl">⏱️</span>
                <h3 className="text-sm font-black text-slate-850 dark:text-white">No activities found</h3>
                <p className="text-xs text-slate-455 dark:text-slate-550 font-medium">Try changing filters or perform some actions.</p>
              </div>
            ) : (
              <div className="card overflow-hidden shadow-xs border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider bg-slate-50/20 dark:bg-slate-950/20">
                        <th className="py-3 px-4 font-bold">Activity</th>
                        <th className="py-3 px-4 font-bold">Defect</th>
                        <th className="py-3 px-4 font-bold">Project</th>
                        <th className="py-3 px-4 font-bold">Performed By</th>
                        <th className="py-3 px-4 font-bold">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {paginatedActivities.map((item) => {
                        const defect = defects.find(d => d.id === Number(item.entity_id)) || {};
                        const parsed = parseActivity(item, defect);
                        const userInitials = getInitials(item.user_name);
                        const userRole = getRoleByName(item.user_name);

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors"
                          >
                            {/* Activity Column */}
                            <td className="py-3.5 px-4 min-w-[200px]">
                              <div className="flex items-start gap-3">
                                <span className={`w-7 h-7 rounded-lg ${parsed.iconColor} flex items-center justify-center font-semibold text-xs shrink-0 mt-0.5`}>
                                  {parsed.icon}
                                </span>
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-slate-200 leading-snug">{parsed.title}</p>
                                  <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5 leading-relaxed font-medium">{parsed.description}</p>
                                </div>
                              </div>
                            </td>

                            {/* Defect Column */}
                            <td className="py-3.5 px-4 min-w-[180px]">
                              {defect.id ? (
                                <div>
                                  <button
                                    onClick={() => navigate(`/defects/${defect.id}`)}
                                    className="font-bold text-brand-655 dark:text-brand-400 hover:underline cursor-pointer text-left block"
                                  >
                                    DF-{defect.id}
                                  </button>
                                  <p className="text-[10px] text-slate-450 dark:text-slate-450 mt-0.5 font-medium line-clamp-2 max-w-xs leading-normal">
                                    {defect.title}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 font-semibold italic">N/A</span>
                              )}
                            </td>

                            {/* Project Column */}
                            <td className="py-3.5 px-4 min-w-[140px]">
                              <span className="font-semibold text-slate-605 dark:text-slate-350">
                                {defect.project_name || 'Project Alpha'}
                              </span>
                            </td>

                            {/* Performed By Column */}
                            <td className="py-3.5 px-4 min-w-[150px]">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6.5 h-6.5 rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {userInitials}
                                </span>
                                <div>
                                  <p className="font-bold text-slate-700 dark:text-slate-205">{item.user_name || 'System'}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{userRole}</p>
                                </div>
                              </div>
                            </td>

                            {/* Date & Time Column */}
                            <td className="py-3.5 px-4 min-w-[140px]">
                              <p className="font-bold text-slate-750 dark:text-slate-300">{formatExactDate(item.created_at)}</p>
                              <p className="text-[10px] text-slate-455 dark:text-slate-500 font-medium mt-0.5">{getRelativeTime(item.created_at)}</p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10">
                  {/* Rows Per Page */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rows per page</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="input-field text-xs py-1 px-2 bg-white dark:bg-slate-900 border-slate-205 dark:border-slate-800 w-16 cursor-pointer font-semibold text-slate-600 dark:text-slate-300"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  {/* Page Navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      disabled={activePage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-450 hover:text-brand-650 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:text-slate-600 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 text-[11px] font-bold rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                            pageNum === activePage
                              ? 'bg-brand-600 border-brand-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-455 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      disabled={activePage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-455 hover:text-brand-650 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:text-slate-600 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default ActivityHistory;
