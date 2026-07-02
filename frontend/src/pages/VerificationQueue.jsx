import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  SlidersHorizontal, 
  Calendar, 
  CheckSquare, 
  User, 
  ChevronRight, 
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { defectAPI, projectAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

const VerificationQueue = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [defects, setDefects] = useState([]);
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    project_id: '',
    developer_id: '',
    priority: '',
    severity: '',
    resolvedDate: ''
  });
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch resolved/testing defects, projects and developers
      const [defectsRes, projectsRes, usersRes] = await Promise.all([
        defectAPI.getAll({ status: 'Resolved' }),
        projectAPI.getAll({ status: 'active' }),
        userAPI.getAll({ role: 'developer' })
      ]);
      
      setDefects(defectsRes.data.data);
      setProjects(projectsRes.data.data);
      setDevelopers(usersRes.data.data);
    } catch (err) {
      // Offline fallback mock data
      setDefects([
        { id: 1, title: 'Database connection pool leakage in heavy throughput scenarios', project_name: 'Project Alpha Integration', project_id: 1, severity: 'Critical', priority: 'High', status: 'Resolved', assignee_name: 'John Developer', assignee_id: 2, reporter_name: 'David Tester', updated_at: new Date(Date.now() - 3600000 * 2).toISOString(), description: 'Pg Pool limits exceeded.' },
        { id: 3, title: 'Auth tokens expire prematurely before 24h limit', project_name: 'Mobile Gateway API Wrapper', project_id: 3, severity: 'High', priority: 'Urgent', status: 'Resolved', assignee_name: 'Alice Dev', assignee_id: 4, reporter_name: 'David Tester', updated_at: new Date(Date.now() - 3600000 * 12).toISOString(), description: 'JWT tokens expire after 2h instead of 24h.' },
      ]);
      setProjects([
        { id: 1, name: 'Project Alpha Integration', project_name: 'Project Alpha Integration' },
        { id: 2, name: 'Defect Tracker Pro Client', project_name: 'Defect Tracker Pro Client' },
        { id: 3, name: 'Mobile Gateway API Wrapper', project_name: 'Mobile Gateway API Wrapper' }
      ]);
      setDevelopers([
        { id: 2, full_name: 'John Developer' },
        { id: 4, full_name: 'Alice Dev' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      project_id: '',
      developer_id: '',
      priority: '',
      severity: '',
      resolvedDate: ''
    });
  };

  // Local filtering covering search and parameters
  const filteredDefects = defects.filter(d => {
    // Only verify defects in status Resolved or Testing
    if (d.status !== 'Resolved' && d.status !== 'Testing') return false;

    // Search matches Defect ID (Key) or Title
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const matchId = String(d.id).includes(s) || `df-${d.id}`.includes(s);
      const matchTitle = String(d.title).toLowerCase().includes(s);
      if (!matchId && !matchTitle) return false;
    }

    // Filter selectors
    if (filters.project_id && String(d.project_id) !== String(filters.project_id)) return false;
    if (filters.developer_id && String(d.assignee_id) !== String(filters.developer_id)) return false;
    if (filters.priority && d.priority !== filters.priority) return false;
    if (filters.severity && d.severity !== filters.severity) return false;
    
    // Filter by resolved date (comparison by date string)
    if (filters.resolvedDate) {
      const dDateStr = new Date(d.updated_at).toDateString();
      const fDateStr = new Date(filters.resolvedDate).toDateString();
      if (dDateStr !== fDateStr) return false;
    }

    return true;
  });

  const columns = [
    { header: 'Defect ID', render: (row) => <span className="font-bold text-slate-400 font-mono">DF-{row.id}</span> },
    { header: 'Title', render: (row) => <span className="font-bold text-slate-800 dark:text-white truncate max-w-xs block">{row.title}</span> },
    { header: 'Project', accessor: 'project_name', render: (row) => <span className="text-slate-500 dark:text-slate-400">{row.project_name}</span> },
    { header: 'Assigned Developer', render: (row) => <span className="text-brand-650 dark:text-brand-450 font-bold">{row.assignee_name || 'Unassigned'}</span> },
    { header: 'Priority', render: (row) => <span className="font-semibold text-slate-700 dark:text-slate-350">{row.priority}</span> },
    { header: 'Severity', render: (row) => <SeverityBadge severity={row.severity} /> },
    { header: 'Resolved Date', render: (row) => new Date(row.updated_at).toLocaleDateString() },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { 
      header: 'Action', 
      render: (row) => (
        <button
          onClick={() => navigate(`/verify-defect/${row.id}`)}
          className="btn-primary text-xs py-1 px-3 flex items-center gap-1 font-bold"
        >
          Verify
        </button>
      ) 
    }
  ];

  return (
    <Layout title="Verification Queue">
      <div className="flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-white">Verification Queue</h1>
            <p className="text-xs text-slate-500 mt-0.5">Review, verify, and close resolved defects reported across projects.</p>
          </div>
          <button 
            onClick={fetchData} 
            className="p-2 text-slate-500 hover:text-brand-650 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsible Filter Toolbar */}
        <div className="card p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by defect ID, title..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input-field pl-9 py-2 text-xs"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> 
                {showAdvancedFilters ? 'Hide Filters' : 'Filters'}
              </button>
              {(filters.project_id || filters.developer_id || filters.priority || filters.severity || filters.resolvedDate || filters.search) && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-semibold underline underline-offset-4 cursor-pointer"
                >
                  Reset All
                </button>
              )}
            </div>
          </div>

          {/* Advanced filter toggles grid */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
              
              {/* Projects dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Project</label>
                <select
                  value={filters.project_id}
                  onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}
                  className="input-field text-xs py-1.5"
                >
                  <option value="">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
                  ))}
                </select>
              </div>

              {/* Developer dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Developer</label>
                <select
                  value={filters.developer_id}
                  onChange={(e) => setFilters({ ...filters, developer_id: e.target.value })}
                  className="input-field text-xs py-1.5"
                >
                  <option value="">All Developers</option>
                  {developers.map(d => (
                    <option key={d.id} value={d.id}>{d.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Severity dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Severity</label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  className="input-field text-xs py-1.5"
                >
                  <option value="">All Severities</option>
                  {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Priority dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="input-field text-xs py-1.5"
                >
                  <option value="">All Priorities</option>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Resolved Date Picker */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Resolved Date</label>
                <input
                  type="date"
                  value={filters.resolvedDate}
                  onChange={(e) => setFilters({ ...filters, resolvedDate: e.target.value })}
                  className="input-field text-xs py-1.5"
                />
              </div>

            </div>
          )}
        </div>

        {/* Data Table / Empty State */}
        {loading ? (
          <div className="text-center mt-20"><LoadingSpinner /></div>
        ) : filteredDefects.length === 0 ? (
          <div className="card text-center py-16 flex flex-col items-center justify-center">
            <span className="text-4xl mb-4">🎉</span>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">No defects are waiting for verification.</h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm">All defects reported are either verified and closed, or currently under developer repair.</p>
          </div>
        ) : (
          <div className="card">
            <DataTable
              columns={columns}
              data={filteredDefects}
              pagination
              pageSize={10}
              onRowClick={(row) => navigate(`/verify-defect/${row.id}`)}
            />
          </div>
        )}

      </div>
    </Layout>
  );
};

export default VerificationQueue;
