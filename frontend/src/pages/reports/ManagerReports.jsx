import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from 'recharts';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { defectAPI, projectAPI, userAPI } from '../../services/api';
import { FileDown, Calendar, BarChart3, TrendingUp, Users, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ManagerReports = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [projectFilter, setProjectFilter] = useState('');
  const [developerFilter, setDeveloperFilter] = useState('');
  const [testerFilter, setTesterFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [projRes, usersRes, defectsRes] = await Promise.all([
        projectAPI.getAll(),
        userAPI.getAll(),
        defectAPI.getAll()
      ]);

      setProjects(projRes.data.data || []);
      setUsers(usersRes.data.data || []);
      setDefects(defectsRes.data.data || []);
    } catch {
      // Mock fallback data if offline
      setProjects([
        { id: 1, project_name: 'Project Alpha Integration', name: 'Project Alpha Integration' },
        { id: 2, project_name: 'Defect Tracker Pro Client', name: 'Defect Tracker Pro Client' },
        { id: 3, project_name: 'Mobile Gateway API Wrapper', name: 'Mobile Gateway API Wrapper' }
      ]);
      setUsers([
        { id: 2, full_name: 'John Developer', role: 'developer' },
        { id: 5, full_name: 'Alice Dev', role: 'developer' },
        { id: 3, full_name: 'David Tester', role: 'tester' }
      ]);
      setDefects([
        { id: 1, title: 'Database connection pools timeout', project_id: 1, project_name: 'Project Alpha Integration', severity: 'Critical', priority: 'High', status: 'In Progress', assignee_id: 2, assignee_name: 'John Developer', reporter_id: 3, reporter_name: 'David Tester', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
        { id: 2, title: 'Auth tokens expire prematurely', project_id: 3, project_name: 'Mobile Gateway API Wrapper', severity: 'High', priority: 'High', status: 'Open', assignee_id: null, assignee_name: 'Unassigned', reporter_id: 3, reporter_name: 'David Tester', created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
        { id: 3, title: 'UI alignment layout breaks on iOS', project_id: 2, project_name: 'Defect Tracker Pro Client', severity: 'Medium', priority: 'Medium', status: 'Resolved', assignee_id: 5, assignee_name: 'Alice Dev', reporter_id: 3, reporter_name: 'David Tester', created_at: new Date(Date.now() - 2 * 86400000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filter defects list
  const filteredDefects = defects.filter(d => {
    if (projectFilter && String(d.project_id) !== String(projectFilter)) return false;
    if (developerFilter && String(d.assignee_id) !== String(developerFilter)) return false;
    if (testerFilter && String(d.reporter_id) !== String(testerFilter)) return false;
    if (priorityFilter && d.priority !== priorityFilter) return false;
    if (severityFilter && d.severity !== severityFilter) return false;
    if (statusFilter && d.status !== statusFilter) return false;
    if (startDate && new Date(d.created_at) < new Date(startDate)) return false;
    if (endDate && new Date(d.created_at) > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  // Calculate dynamically derived metrics
  const SEVERITY_COLORS = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#f59e0b',
    Low: '#94a3b8'
  };

  // 1. Project stats
  const projectMap = {};
  projects.forEach(p => { projectMap[p.project_name || p.name] = 0; });
  filteredDefects.forEach(d => {
    const name = d.project_name || 'Unknown Project';
    projectMap[name] = (projectMap[name] || 0) + 1;
  });
  const byProject = Object.entries(projectMap).map(([project_name, count]) => ({ project_name, count }));

  // 2. Severity stats
  const severityMap = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  filteredDefects.forEach(d => {
    if (d.severity in severityMap) {
      severityMap[d.severity]++;
    }
  });
  const bySeverity = Object.entries(severityMap).map(([severity, count]) => ({ severity, count }));

  // 3. Developer stats
  const devMap = {};
  users.filter(u => u.role === 'developer').forEach(u => { devMap[u.full_name] = 0; });
  filteredDefects.forEach(d => {
    const name = d.assignee_name || 'Unassigned';
    devMap[name] = (devMap[name] || 0) + 1;
  });
  const byDeveloper = Object.entries(devMap).map(([developer_name, count]) => ({ developer_name, count }));

  // 4. Status stats
  const statusMap = { Open: 0, Assigned: 0, 'In Progress': 0, Resolved: 0, Testing: 0, Closed: 0 };
  filteredDefects.forEach(d => {
    if (d.status in statusMap) {
      statusMap[d.status]++;
    }
  });
  const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  // 5. Monthly Trends stats (last 6 months)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trendMap = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mLabel = months[d.getMonth()];
    trendMap[mLabel] = 0;
  }
  filteredDefects.forEach(d => {
    const date = new Date(d.created_at);
    const mLabel = months[date.getMonth()];
    if (mLabel in trendMap) {
      trendMap[mLabel]++;
    }
  });
  const monthlyTrends = Object.entries(trendMap).map(([month, count]) => ({ month, count }));

  // Reset Filters
  const handleResetFilters = () => {
    setProjectFilter('');
    setDeveloperFilter('');
    setTesterFilter('');
    setPriorityFilter('');
    setSeverityFilter('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    toast.success('Filters reset successfully');
  };

  // Exports
  const handleExport = (format) => {
    if (filteredDefects.length === 0) {
      toast.error('No filtered records available to export');
      return;
    }

    const filename = `defect_report_filtered_${Date.now()}`;

    if (format === 'csv' || format === 'excel') {
      const headers = ['Defect ID', 'Title', 'Project', 'Severity', 'Priority', 'Status', 'Assignee', 'Reporter', 'Created Date'];
      const rows = filteredDefects.map(d => [
        `DEF-${d.id}`,
        `"${d.title?.replace(/"/g, '""')}"`,
        `"${d.project_name?.replace(/"/g, '""')}"`,
        d.severity,
        d.priority || 'N/A',
        d.status,
        d.assignee_name || 'Unassigned',
        d.reporter_name || 'N/A',
        new Date(d.created_at).toLocaleDateString()
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.${format === 'csv' ? 'csv' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Report exported as ${format.toUpperCase()} successfully!`);
    } else if (format === 'pdf') {
      window.print();
      toast.success('Opened PDF print layout');
    }
  };

  if (loading) return <Layout title="Reports"><LoadingSpinner /></Layout>;

  const hasData = filteredDefects.length > 0;

  return (
    <Layout title="Reports">
      
      {/* Screen layout wrapper (hidden print:block resolves printing filters/nav) */}
      <div className="flex flex-col gap-6 print:hidden">
        
        {/* Reports Header Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-white">Workspace Analytics</h1>
            <p className="text-xs text-slate-500 mt-0.5">Filter charts and export data records as CSV, Excel, or PDF</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="btn-secondary text-xs cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="btn-secondary text-xs cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="btn-primary text-xs cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" /> PDF / Print
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="card bg-white dark:bg-slate-900 p-4 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Report Query Filters</h3>
            <button
              onClick={handleResetFilters}
              className="text-[10px] text-brand-600 hover:text-brand-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" /> Clear Filters
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
            
            {/* Project Filter */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Project</label>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="input-field py-1"
              >
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
                ))}
              </select>
            </div>

            {/* Developer Filter */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Developer</label>
              <select
                value={developerFilter}
                onChange={(e) => setDeveloperFilter(e.target.value)}
                className="input-field py-1"
              >
                <option value="">All Devs</option>
                {users.filter(u => u.role === 'developer').map(u => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>

            {/* Tester Filter */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Tester</label>
              <select
                value={testerFilter}
                onChange={(e) => setTesterFilter(e.target.value)}
                className="input-field py-1"
              >
                <option value="">All Testers</option>
                {users.filter(u => u.role === 'tester').map(u => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="input-field py-1"
              >
                <option value="">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Severity</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="input-field py-1"
              >
                <option value="">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field py-1"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Testing">Testing</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field py-1"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field py-1"
              />
            </div>

          </div>
        </div>

        {/* Dynamic empty/filled state handler */}
        {!hasData ? (
          <div className="card py-16 text-center space-y-3 shadow-xs bg-white dark:bg-slate-900 border">
            <span className="text-4xl">📊</span>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">No report data available</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">Try clearing or adjusting your filter query to load analytics records</p>
          </div>
        ) : (
          /* Dashboard Grid Charts */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Defects by Project */}
            <div className="card flex flex-col bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Defects by Project</h3>
                <BarChart3 className="w-4 h-4 text-slate-400" />
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byProject} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="project_name" fontSize={11} stroke="#94a3b8" tickLine={false} />
                    <YAxis fontSize={11} stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar 
                      dataKey="count" 
                      fill="#4f46e5" 
                      radius={[4, 4, 0, 0]} 
                      onClick={(data) => {
                        if (data && data.project_name) {
                          const pObj = projects.find(p => p.project_name === data.project_name || p.name === data.project_name);
                          if (pObj) navigate('/defects', { state: { filter: { project_id: pObj.id } } });
                        }
                      }}
                      className="cursor-pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Defects by Severity */}
            <div className="card flex flex-col bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-slate-808 dark:text-white">Defects by Severity</h3>
                <AlertCircle className="w-4 h-4 text-slate-400" />
              </div>
              <div className="h-64 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bySeverity}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="severity"
                      onClick={(data) => {
                        if (data && data.severity) {
                          navigate('/defects', { state: { filter: { severity: data.severity } } });
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {bySeverity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Metrics</p>
                  <p className="text-base font-black text-slate-850 dark:text-white">Severity</p>
                </div>
              </div>
            </div>

            {/* Defects by Developer */}
            <div className="card flex flex-col bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-slate-808 dark:text-white">Defects by Developer</h3>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDeveloper} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="developer_name" fontSize={11} stroke="#94a3b8" tickLine={false} />
                    <YAxis fontSize={11} stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar 
                      dataKey="count" 
                      fill="#8b5cf6" 
                      radius={[4, 4, 0, 0]} 
                      onClick={(data) => {
                        if (data && data.developer_name) {
                          const uObj = users.find(u => u.full_name === data.developer_name);
                          if (uObj) navigate('/defects', { state: { filter: { assignee_id: uObj.id } } });
                        }
                      }}
                      className="cursor-pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Defects by Status */}
            <div className="card flex flex-col bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-slate-808 dark:text-white">Defects by Status</h3>
                <BarChart3 className="w-4 h-4 text-slate-400" />
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="status" fontSize={11} stroke="#94a3b8" tickLine={false} />
                    <YAxis fontSize={11} stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar 
                      dataKey="count" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]} 
                      onClick={(data) => {
                        if (data && data.status) {
                          navigate('/defects', { state: { filter: { status: data.status } } });
                        }
                      }}
                      className="cursor-pointer"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="card lg:col-span-2 flex flex-col bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-slate-808 dark:text-white">Monthly Defect Trends</h3>
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" tickLine={false} />
                    <YAxis fontSize={11} stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Reported Defects" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* PRINT SUMMARY (Only visible inside PDF layout) */}
      <div className="hidden print:block space-y-6 p-6 text-xs text-slate-800">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-xl font-bold">Defect Tracker Pro Workspace Report</h1>
            <p className="text-xs text-slate-400 mt-1">Workspace Name: Enterprise Hub</p>
          </div>
          <div className="text-right">
            <p>Generated By: {currentUser?.full_name} ({currentUser?.role})</p>
            <p>Generated Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Applied Filters */}
        <div>
          <h3 className="font-bold border-b pb-1">Applied Filters</h3>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <p><span className="text-slate-400">Project:</span> {projectFilter ? projects.find(p => String(p.id) === String(projectFilter))?.project_name : 'All Projects'}</p>
            <p><span className="text-slate-400">Developer:</span> {developerFilter ? users.find(u => String(u.id) === String(developerFilter))?.full_name : 'All Developers'}</p>
            <p><span className="text-slate-400">Status:</span> {statusFilter || 'All Statuses'}</p>
            <p><span className="text-slate-400">Severity:</span> {severityFilter || 'All Severities'}</p>
          </div>
        </div>

        {/* Summary Table */}
        <div>
          <h3 className="font-bold border-b pb-1 mt-4">Summary Statistics</h3>
          <table className="w-full text-left mt-2">
            <thead>
              <tr className="border-b text-slate-400 uppercase font-bold">
                <th className="py-1">Metric</th>
                <th className="py-1">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr><td className="py-1">Total Filtered Defects</td><td className="py-1">{filteredDefects.length}</td></tr>
              <tr><td className="py-1">Critical Defects</td><td className="py-1">{filteredDefects.filter(d => d.severity === 'Critical').length}</td></tr>
              <tr><td className="py-1">Open Defects</td><td className="py-1">{filteredDefects.filter(d => d.status === 'Open').length}</td></tr>
              <tr><td className="py-1">Resolved Defects</td><td className="py-1">{filteredDefects.filter(d => d.status === 'Resolved').length}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Defect List Table */}
        <div>
          <h3 className="font-bold border-b pb-1 mt-4">Defects Registry</h3>
          <table className="w-full text-left mt-2 border-collapse">
            <thead>
              <tr className="border-b text-slate-400 uppercase font-bold">
                <th className="py-1">ID</th>
                <th className="py-1">Title</th>
                <th className="py-1">Severity</th>
                <th className="py-1">Status</th>
                <th className="py-1">Assignee</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredDefects.slice(0, 30).map(d => (
                <tr key={d.id} className="py-1">
                  <td className="py-1">DEF-{d.id}</td>
                  <td className="py-1 truncate max-w-[250px]">{d.title}</td>
                  <td className="py-1">{d.severity}</td>
                  <td className="py-1">{d.status}</td>
                  <td className="py-1">{d.assignee_name || 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDefects.length > 30 && (
            <p className="text-[10px] text-slate-450 mt-2">Showing first 30 of {filteredDefects.length} filtered defects.</p>
          )}
        </div>
      </div>

    </Layout>
  );
};

export default ManagerReports;
