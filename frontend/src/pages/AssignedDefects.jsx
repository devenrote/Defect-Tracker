import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SlidersHorizontal, Search, X, Inbox } from 'lucide-react';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { defectAPI, notificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Testing', 'Closed', 'Rejected', 'Duplicate', 'Reopened'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

const AssignedDefects = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [defects, setDefects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Drawer States
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: '',
    priority: '',
    severity: '',
    project: '',
    reporter: '',
    dueDate: '',
    createdDate: '',
    lastUpdated: '',
    unreadComments: false
  });
  const [tempFilters, setTempFilters] = useState({
    status: '',
    priority: '',
    severity: '',
    project: '',
    reporter: '',
    dueDate: '',
    createdDate: '',
    lastUpdated: '',
    unreadComments: false
  });

  useEffect(() => {
    Promise.all([
      defectAPI.getAll({ assigned_to: user.id }),
      notificationAPI.getAll()
    ])
      .then(([defectsRes, notifRes]) => {
        setDefects(defectsRes.data.data);
        setNotifications(notifRes.data.data);
      })
      .catch(() => {
        // Fallback mockup
        setDefects([
          { id: 1, title: 'Database connection pool leakage in heavy throughput scenarios', project_name: 'Project Alpha Integration', severity: 'Critical', priority: 'High', status: 'In Progress', reporter_name: 'David Tester', created_at: new Date(Date.now() - 3600000 * 24).toISOString(), updated_at: new Date(Date.now() - 3600000 * 2).toISOString(), due_date: new Date(Date.now() + 86400000 * 2).toISOString() },
          { id: 3, title: 'Auth tokens expire prematurely before 24h limit', project_name: 'Mobile Gateway API Wrapper', severity: 'High', priority: 'Critical', status: 'Resolved', reporter_name: 'David Tester', created_at: new Date(Date.now() - 3600000 * 12).toISOString(), updated_at: new Date(Date.now() - 3600000 * 1).toISOString(), due_date: new Date(Date.now() + 86400000 * 5).toISOString() },
          { id: 4, title: 'Expired sessions cleanup cron task', project_name: 'Background Jobs Engine', severity: 'Low', priority: 'Medium', status: 'Closed', reporter_name: 'David Tester', created_at: new Date(Date.now() - 3600000 * 48).toISOString(), updated_at: new Date(Date.now() - 3600000 * 5).toISOString(), due_date: new Date(Date.now() - 86400000 * 1).toISOString() }
        ]);
        setNotifications([
          { id: 3, issue_id: 1, type: 'comment_added', is_read: false }
        ]);
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  useEffect(() => {
    if (location.state?.filter) {
      setActiveFilters(prev => ({
        ...prev,
        ...location.state.filter
      }));
      setTempFilters(prev => ({
        ...prev,
        ...location.state.filter
      }));
    }
  }, [location.state]);

  const projectNames = [...new Set(defects.map(d => d.project_name))].filter(Boolean);

  const handleOpenDrawer = () => {
    setTempFilters({ ...activeFilters });
    setIsFilterDrawerOpen(true);
  };

  const handleApply = () => {
    setActiveFilters({ ...tempFilters });
    setIsFilterDrawerOpen(false);
    toast.success('Filters applied successfully');
  };

  const handleReset = () => {
    const empty = {
      status: '',
      priority: '',
      severity: '',
      project: '',
      reporter: '',
      dueDate: '',
      createdDate: '',
      lastUpdated: '',
      unreadComments: false
    };
    setTempFilters(empty);
    setActiveFilters(empty);
    setIsFilterDrawerOpen(false);
    toast.success('Filters reset');
  };

  const handleRemoveFilter = (key) => {
    const updated = { ...activeFilters, [key]: key === 'unreadComments' ? false : '' };
    setActiveFilters(updated);
    setTempFilters(updated);
  };

  const handleClearAll = () => {
    const empty = {
      status: '',
      priority: '',
      severity: '',
      project: '',
      reporter: '',
      dueDate: '',
      createdDate: '',
      lastUpdated: '',
      unreadComments: false
    };
    setActiveFilters(empty);
    setTempFilters(empty);
  };

  // Evaluate matches
  const filteredDefects = defects.filter((row) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = row.title?.toLowerCase().includes(q);
      const matchProject = row.project_name?.toLowerCase().includes(q);
      const matchId = `df-${row.id}`.includes(q);
      if (!matchTitle && !matchProject && !matchId) return false;
    }

    if (activeFilters.status) {
      if (row.status !== activeFilters.status) return false;
    } else {
      if (row.status === 'Closed') return false;
    }
    if (activeFilters.priority && row.priority !== activeFilters.priority) return false;
    if (activeFilters.severity && row.severity !== activeFilters.severity) return false;
    if (activeFilters.project && row.project_name !== activeFilters.project) return false;
    if (activeFilters.reporter && !row.reporter_name?.toLowerCase().includes(activeFilters.reporter.toLowerCase())) return false;
    
    if (activeFilters.dueDate) {
      if (!row.due_date) return false;
      const rowDate = new Date(row.due_date).toDateString();
      const filterDate = new Date(activeFilters.dueDate).toDateString();
      if (rowDate !== filterDate) return false;
    }
    if (activeFilters.createdDate) {
      if (!row.created_at) return false;
      const rowDate = new Date(row.created_at).toDateString();
      const filterDate = new Date(activeFilters.createdDate).toDateString();
      if (rowDate !== filterDate) return false;
    }
    if (activeFilters.lastUpdated) {
      if (!row.updated_at) return false;
      const rowDate = new Date(row.updated_at).toDateString();
      const filterDate = new Date(activeFilters.lastUpdated).toDateString();
      if (rowDate !== filterDate) return false;
    }
    if (activeFilters.unreadComments) {
      const hasUnreadComment = notifications.some(
        (n) => n.issue_id === row.id && n.type === 'comment_added' && !n.is_read
      );
      if (!hasUnreadComment) return false;
    }

    return true;
  });

  const columns = [
    { header: 'Defect ID', render: (row) => <span className="font-bold text-slate-400">DF-{row.id}</span> },
    { header: 'Title', accessor: 'title', render: (row) => <span className="font-bold text-slate-800 dark:text-white">{row.title}</span> },
    { header: 'Project', accessor: 'project_name', render: (row) => <span className="text-slate-500 dark:text-slate-400">{row.project_name}</span> },
    { header: 'Severity', render: (row) => <SeverityBadge severity={row.severity} /> },
    { header: 'Priority', render: (row) => <span className="font-semibold text-slate-700 dark:text-slate-300">{row.priority}</span> },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Reporter', accessor: 'reporter_name' },
    { header: 'Created Date', render: (row) => new Date(row.created_at).toLocaleDateString() },
    { header: 'Due Date', render: (row) => row.due_date ? new Date(row.due_date).toLocaleDateString() : <span className="text-slate-400">N/A</span> },
    { header: 'Last Updated', render: (row) => new Date(row.updated_at).toLocaleDateString() },
    { 
      header: 'Actions', 
      render: (row) => (
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(`/defects/${row.id}`); }} 
          className="btn-primary py-1 px-3 text-[10px] cursor-pointer shadow-sm"
        >
          Open
        </button>
      )
    }
  ];

  return (
    <Layout title="Assigned Defects">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-base font-bold text-slate-800 dark:text-white">Assigned To Me</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Issues assigned to your account that require analysis or resolutions.</p>
        </div>

        {loading ? <div className="text-center mt-20"><LoadingSpinner /></div> : (
          <>
            {defects.length === 0 ? (
              <div className="card py-16 text-center space-y-3 shadow-xs">
                <span className="text-4xl">🎉</span>
                <h3 className="text-sm font-black text-slate-800 dark:text-white">You have no assigned defects.</h3>
                <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">Great job! Enjoy your clean workspace.</p>
              </div>
            ) : (
              <>
                {/* Search & Filter Toolbar */}
                <div className="flex items-center justify-between gap-4">
                  <div className="relative max-w-sm flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search defects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-field pl-9 py-2 text-xs"
                    />
                  </div>

                  <button 
                    onClick={handleOpenDrawer}
                    className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-2 cursor-pointer shadow-xs"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
                  </button>
                </div>

                {/* Filter Chips */}
                {Object.keys(activeFilters).some(key => activeFilters[key]) && (
                  <div className="flex flex-wrap items-center gap-2 mb-1 animate-fadeIn">
                    {Object.entries(activeFilters).map(([key, value]) => {
                      if (!value) return null;
                      return (
                        <span 
                          key={key} 
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 text-[10px] font-bold uppercase rounded-lg border border-brand-200/50 dark:border-brand-900/40"
                        >
                          <span>{key}: {key.toLowerCase().includes('date') ? new Date(value).toLocaleDateString() : value}</span>
                          <button 
                            onClick={() => handleRemoveFilter(key)} 
                            className="text-brand-655 dark:text-brand-400 font-black cursor-pointer hover:text-brand-850"
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                    <button 
                      onClick={handleClearAll} 
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer ml-1"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}

                {/* Table card */}
                <div className="card shadow-xs">
                  {filteredDefects.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <Inbox className="w-8 h-8 opacity-40 mx-auto text-slate-400" />
                      <p className="text-xs font-bold text-slate-500">No defects match the selected filters.</p>
                    </div>
                  ) : (
                    <DataTable 
                      columns={columns} 
                      data={filteredDefects} 
                      searchable={false}
                      pagination 
                      onRowClick={(row) => navigate(`/defects/${row.id}`)} 
                    />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Collapse Slide-out Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div 
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsFilterDrawerOpen(false)}
          />
          
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl p-6 flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 animate-slideIn">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">Filter Defects</h2>
                <button 
                  onClick={() => setIsFilterDrawerOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                {/* Status */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Status</label>
                  <select 
                    value={tempFilters.status} 
                    onChange={e => setTempFilters({...tempFilters, status: e.target.value})} 
                    className="input-field text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800"
                  >
                    <option value="">All Statuses</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Priority</label>
                  <select 
                    value={tempFilters.priority} 
                    onChange={e => setTempFilters({...tempFilters, priority: e.target.value})} 
                    className="input-field text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800"
                  >
                    <option value="">All Priorities</option>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Severity */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">Severity</label>
                  <select 
                    value={tempFilters.severity} 
                    onChange={e => setTempFilters({...tempFilters, severity: e.target.value})} 
                    className="input-field text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800"
                  >
                    <option value="">All Severities</option>
                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Project */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wide">Project</label>
                  <select 
                    value={tempFilters.project} 
                    onChange={e => setTempFilters({...tempFilters, project: e.target.value})} 
                    className="input-field text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800"
                  >
                    <option value="">All Projects</option>
                    {projectNames.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Reporter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wide">Reporter</label>
                  <input 
                    type="text" 
                    value={tempFilters.reporter} 
                    onChange={e => setTempFilters({...tempFilters, reporter: e.target.value})} 
                    className="input-field text-xs" 
                    placeholder="Search reporter..." 
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wide">Due Date</label>
                  <input 
                    type="date" 
                    value={tempFilters.dueDate} 
                    onChange={e => setTempFilters({...tempFilters, dueDate: e.target.value})} 
                    className="input-field text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800" 
                  />
                </div>

                {/* Created Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wide">Created Date</label>
                  <input 
                    type="date" 
                    value={tempFilters.createdDate} 
                    onChange={e => setTempFilters({...tempFilters, createdDate: e.target.value})} 
                    className="input-field text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800" 
                  />
                </div>

                {/* Last Updated */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wide">Last Updated</label>
                  <input 
                    type="date" 
                    value={tempFilters.lastUpdated} 
                    onChange={e => setTempFilters({...tempFilters, lastUpdated: e.target.value})} 
                    className="input-field text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800" 
                  />
                </div>

                {/* Unread Comments */}
                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox"
                    id="unreadComments"
                    checked={tempFilters.unreadComments} 
                    onChange={e => setTempFilters({...tempFilters, unreadComments: e.target.checked})} 
                    className="w-4 h-4 text-brand-600 border-slate-200 rounded" 
                  />
                  <label htmlFor="unreadComments" className="text-[11px] font-bold text-slate-455 uppercase tracking-wide cursor-pointer select-none">Unread Comments Only</label>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
              <button 
                onClick={() => setIsFilterDrawerOpen(false)} 
                className="btn-secondary flex-1 text-xs py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleReset} 
                className="btn-secondary flex-1 text-xs py-2 text-rose-600 hover:bg-rose-50/20 border-rose-100 hover:border-rose-250 cursor-pointer"
              >
                Reset
              </button>
              <button 
                onClick={handleApply} 
                className="btn-primary flex-1 text-xs py-2 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AssignedDefects;
