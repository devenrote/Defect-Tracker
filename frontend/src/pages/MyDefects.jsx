import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { defectAPI, projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, SlidersHorizontal, Plus, Calendar } from 'lucide-react';

const MyDefects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [defects, setDefects] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Advanced Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    severity: '',
    priority: '',
    project_id: '',
    startDate: '',
    endDate: ''
  });
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [defectsRes, projectsRes] = await Promise.all([
          defectAPI.getAll({ reported_by: user.id }),
          projectAPI.getAll({ status: 'active' })
        ]);
        setDefects(defectsRes.data.data);
        setProjects(projectsRes.data.data);
      } catch {
        // Mock fallback for testing
        setDefects([
          { id: 10, title: 'backend not worked', project_name: 'E-Commerce Platform', project_id: 1, severity: 'Low', priority: 'Low', status: 'Open', assignee_name: 'Unassigned', created_at: new Date().toISOString() },
          { id: 9, title: 'server issue', project_name: 'E-Commerce Platform', project_id: 1, severity: 'Low', priority: 'Low', status: 'Assigned', assignee_name: 'Mike Developer', created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
          { id: 1, title: 'Login button not responsive on mobile', project_name: 'E-Commerce Platform', project_id: 1, severity: 'High', priority: 'High', status: 'In Progress', assignee_name: 'Mike Developer', created_at: new Date(Date.now() - 3600000 * 48).toISOString() },
          { id: 2, title: 'Cart total calculation error', project_name: 'E-Commerce Platform', project_id: 1, severity: 'Critical', priority: 'Urgent', status: 'Assigned', assignee_name: 'Mike Developer', created_at: new Date(Date.now() - 3600000 * 72).toISOString() },
        ]);
        setProjects([
          { id: 1, name: 'E-Commerce Platform', project_name: 'E-Commerce Platform' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user.id]);

  // Apply filters locally in memory
  const filteredDefects = defects.filter(d => {
    // Search match (by project, defect ID, title, assignee)
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const matchId = String(d.id).includes(s);
      const matchTitle = String(d.title).toLowerCase().includes(s);
      const matchProj = String(d.project_name).toLowerCase().includes(s);
      const matchAss = String(d.assignee_name || 'Unassigned').toLowerCase().includes(s);
      if (!matchId && !matchTitle && !matchProj && !matchAss) return false;
    }
    
    // Dropdowns match
    if (filters.status && d.status !== filters.status) return false;
    if (filters.severity && d.severity !== filters.severity) return false;
    if (filters.priority && d.priority !== filters.priority) return false;
    if (filters.project_id && String(d.project_id) !== String(filters.project_id)) return false;
    
    // Date range match
    if (filters.startDate) {
      const dDate = new Date(d.created_at);
      const sDate = new Date(filters.startDate);
      if (dDate < sDate) return false;
    }
    if (filters.endDate) {
      const dDate = new Date(d.created_at);
      const eDate = new Date(filters.endDate);
      eDate.setHours(23, 59, 59, 999); // include entire end day
      if (dDate > eDate) return false;
    }

    return true;
  });

  const columns = [
    { header: 'Key', render: (row) => <span className="font-bold text-slate-400 font-mono">DF-{row.id}</span> },
    { header: 'Title', accessor: 'title', render: (row) => <span className="font-bold text-slate-800 dark:text-white truncate max-w-xs block hover:text-brand-650 transition-colors">{row.title}</span> },
    { header: 'Project', accessor: 'project_name', render: (row) => <span className="text-slate-500 dark:text-slate-400 truncate max-w-[150px] block">{row.project_name}</span> },
    { header: 'Severity', render: (row) => <SeverityBadge severity={row.severity} /> },
    { header: 'Priority', render: (row) => <span className="font-semibold text-slate-700 dark:text-slate-350">{row.priority || 'Low'}</span> },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Assignee', accessor: 'assignee_name', render: (row) => <span className="text-brand-600 dark:text-brand-400 font-semibold">{row.assignee_name || 'Unassigned'}</span> },
    { header: 'Created', render: (row) => new Date(row.created_at).toLocaleDateString() },
  ];

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: '',
      severity: '',
      priority: '',
      project_id: '',
      startDate: '',
      endDate: ''
    });
  };

  return (
    <Layout title="My Defects">
      <div className="flex flex-col gap-6">
        
        {/* Page title header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-white">Defects Reported By Me</h1>
            <p className="text-xs text-slate-500 mt-0.5">Issues you have logged that are being verified or fixed.</p>
          </div>
          <button 
            onClick={() => navigate('/create-defect')}
            className="btn-primary text-xs"
          >
            <Plus className="w-4 h-4" /> Report Defect
          </button>
        </div>

        {/* Filter Toolbar Container */}
        <div className="card p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by project, ID, title, assignee..."
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
              {(filters.status || filters.severity || filters.priority || filters.project_id || filters.startDate || filters.endDate || filters.search) && (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
              
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

              {/* Status dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="input-field text-xs py-1.5"
                >
                  <option value="">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Testing">Testing</option>
                  <option value="Closed">Closed</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Duplicate">Duplicate</option>
                  <option value="Reopened">Reopened</option>
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
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
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
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              {/* Date Ranges */}
              <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Date Range</label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="input-field text-xs py-1.5 flex-1"
                  />
                  <span className="text-slate-400 text-xs">-</span>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="input-field text-xs py-1.5 flex-1"
                  />
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="text-center mt-20"><LoadingSpinner /></div>
        ) : (
          <div className="card">
            <DataTable
              columns={columns}
              data={filteredDefects}
              pagination
              pageSize={10}
              onRowClick={(row) => navigate(`/defects/${row.id}`)}
            />
          </div>
        )}

      </div>
    </Layout>
  );
};

export default MyDefects;
