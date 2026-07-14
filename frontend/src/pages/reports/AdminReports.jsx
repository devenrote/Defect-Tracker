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
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from 'recharts';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { defectAPI, projectAPI } from '../../services/api';
import { 
  FileDown, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  RefreshCcw,
  Clock
} from 'lucide-react';

const AdminReports = () => {
  const navigate = useNavigate();

  // Core loading & data states
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projectsList, setProjectsList] = useState([]);

  // Filter States
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [dateRangeOption, setDateRangeOption] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const getFilterParams = () => {
    const params = {};
    if (selectedProjectId) {
      params.project_id = selectedProjectId;
    }

    const now = new Date();
    let start = null;
    let end = null;

    if (dateRangeOption === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (dateRangeOption === '7days') {
      start = new Date(now.getTime() - 7 * 86400000);
    } else if (dateRangeOption === '30days') {
      start = new Date(now.getTime() - 30 * 86400000);
    } else if (dateRangeOption === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateRangeOption === '90days') {
      start = new Date(now.getTime() - 90 * 86400000);
    } else if (dateRangeOption === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
    } else if (dateRangeOption === 'custom') {
      if (customStartDate) start = new Date(customStartDate);
      if (customEndDate) {
        const endDay = new Date(customEndDate);
        endDay.setHours(23, 59, 59, 999);
        end = endDay;
      }
    }

    if (start) params.startDate = start.toISOString();
    if (end) params.endDate = end.toISOString();

    return params;
  };

  const fetchReports = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    else setRefreshing(true);
    
    try {
      const params = getFilterParams();
      const [reportsRes, projRes] = await Promise.all([
        defectAPI.getReports(params),
        projectAPI.getAll()
      ]);
      setReports(reportsRes.data.data);
      setProjectsList(projRes.data.data || []);
    } catch (err) {
      console.error('Error fetching dashboard reports:', err);
      toast.error('Failed to load real-time analytics from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch reports automatically on filter changes
  useEffect(() => {
    fetchReports(true);
  }, [selectedProjectId, dateRangeOption, customStartDate, customEndDate]);

  // Exports handler
  const handleExport = (format) => {
    const list = reports?.filteredDefects || [];
    if (list.length === 0) {
      toast.error('No report records available to export');
      return;
    }

    if (format === 'csv' || format === 'excel') {
      let content = 'sep=,\n';
      content += 'Defect ID,Title,Project,Priority,Severity,Status,Reporter,Assigned Developer,Created Date,Resolved Date,Resolution Time\n';
      
      list.forEach(d => {
        let resTime = 'N/A';
        if (['Resolved', 'Verified', 'Closed'].includes(d.status) && d.updated_at) {
          const start = new Date(d.created_at);
          const end = new Date(d.updated_at);
          const diffHrs = Math.floor((end - start) / 3600000);
          resTime = `${diffHrs} hrs`;
        }

        const safeTitle = `"${d.title?.replace(/"/g, '""') || ''}"`;
        const safeProj = `"${d.project_name?.replace(/"/g, '""') || ''}"`;
        const devName = d.assignee_name || 'Unassigned';
        const repName = d.reporter_name || 'Reporter';
        
        content += `DF-${d.id},${safeTitle},${safeProj},${d.priority},${d.severity},${d.status},"${repName}","${devName}",${new Date(d.created_at).toLocaleDateString()},${d.updated_at && ['Resolved', 'Verified', 'Closed'].includes(d.status) ? new Date(d.updated_at).toLocaleDateString() : 'N/A'},${resTime}\n`;
      });

      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Workspace_Defects_Report_${Date.now()}.${format === 'csv' ? 'csv' : 'xls'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported filtered spreadsheet as ${format.toUpperCase()} successfully!`);
    } else if (format === 'pdf') {
      window.print();
      toast.success('Print page triggered');
    }
  };

  const SEVERITY_COLORS = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#f59e0b',
    Low: '#94a3b8'
  };

  // Check empty state parameters
  const hasSeverityData = reports?.bySeverity?.some(item => item.count > 0);
  const hasTrendData = reports?.monthlyTrends?.some(item => item.defects > 0 || item.resolved > 0);
  const hasProjectData = reports?.byProject?.some(item => item.count > 0);
  const hasStatusData = reports?.byStatus?.some(item => item.count > 0);

  const formatResolutionTime = (avgHrs, resolvedCount) => {
    if (!resolvedCount || resolvedCount === 0 || !avgHrs || avgHrs === 0) {
      return 'No resolved defects';
    }
    const hrs = Number(avgHrs);
    if (hrs < 24) {
      return `${Math.round(hrs)} hrs`;
    }
    const days = (hrs / 24).toFixed(1);
    return `${days} days`;
  };

  if (loading) return <Layout title="Reports"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mt-20"></div></Layout>;

  return (
    <Layout title="Reports">
      <div className="flex flex-col gap-4 animate-fadeIn">
        
        {/* Reports Header Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider">Enterprise Reporting Analytics</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-semibold">Real-time workspace statistics, severity filters, and developer audit charts</p>
          </div>
          
          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fetchReports(false)}
              disabled={refreshing}
              className="btn-secondary text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
              title="Refresh database report records"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> 
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            
            <button
              onClick={() => handleExport('csv')}
              className="btn-secondary text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900"
              title="Export filtered records as CSV format"
            >
              <FileDown className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="btn-secondary text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900"
              title="Export filtered records as Excel spreadsheet format"
            >
              <FileDown className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="btn-primary text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
              title="Print filtered reports audit view"
            >
              <FileDown className="w-3.5 h-3.5" /> PDF / Print
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="input-field text-xs py-1 px-2.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            >
              <option value="">All Projects</option>
              {projectsList.map(p => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Date Range:</span>
            <select
              value={dateRangeOption}
              onChange={(e) => setDateRangeOption(e.target.value)}
              className="input-field text-xs py-1 px-2.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            >
              <option value="all">All-Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRangeOption === 'custom' && (
            <div className="flex items-center gap-2 animate-fadeIn">
              <input 
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="input-field text-xs py-1 px-2.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
              <span className="text-slate-400">to</span>
              <input 
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="input-field text-xs py-1 px-2.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
          )}
        </div>

        {/* Dashboard Grid Charts (Compact layout to reduce scrolling) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Defects by Project */}
          <div className="card p-4 flex flex-col justify-between shadow-xs h-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-xs font-bold text-slate-805 dark:text-white uppercase tracking-wider">Defects by Project</h3>
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            
            <div className="flex-1 min-h-0 relative flex items-center justify-center">
              {!hasProjectData ? (
                <div className="flex flex-col items-center justify-center text-slate-400 text-[10px] font-bold gap-1.5 uppercase">
                  <AlertCircle className="w-4 h-4 text-slate-350" />
                  <span>No project report data available</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reports?.byProject} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="project_name" fontSize={9} stroke="#94a3b8" tickLine={false} />
                    <YAxis fontSize={9} stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Defects by Severity */}
          <div className="card p-4 flex flex-col justify-between shadow-xs h-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-xs font-bold text-slate-805 dark:text-white uppercase tracking-wider">Defects by Severity</h3>
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            </div>
            
            <div className="flex-1 min-h-0 relative flex items-center justify-center">
              {!hasSeverityData ? (
                <div className="flex flex-col items-center justify-center text-slate-400 text-[10px] font-bold gap-1.5 uppercase">
                  <AlertCircle className="w-4 h-4 text-slate-350" />
                  <span>No severity data available</span>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reports?.bySeverity}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="severity"
                      >
                        {reports?.bySeverity?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Level</p>
                    <p className="text-xs font-black text-slate-850 dark:text-white">Severity</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="card p-4 flex flex-col justify-between shadow-xs h-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-xs font-bold text-slate-805 dark:text-white uppercase tracking-wider">Monthly Defect Trends</h3>
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            </div>
            
            <div className="flex-1 min-h-0 relative flex items-center justify-center">
              {!hasTrendData ? (
                <div className="flex flex-col items-center justify-center text-slate-400 text-[10px] font-bold gap-1.5 uppercase">
                  <TrendingUp className="w-4 h-4 text-slate-350" />
                  <span>No trend data available</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reports?.monthlyTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="month" fontSize={9} stroke="#94a3b8" tickLine={false} />
                    <YAxis fontSize={9} stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="defects" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Created" />
                    <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Resolved" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Developer Performance metrics report */}
          <div className="card p-4 flex flex-col justify-between shadow-xs h-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-y-auto">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-xs font-bold text-slate-805 dark:text-white uppercase tracking-wider">Developer Performance Stats</h3>
              <Users className="w-3.5 h-3.5 text-slate-400" />
            </div>
            
            <div className="flex-1 min-h-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[9px] uppercase tracking-wide">
                      <th className="py-2 px-2">Developer</th>
                      <th className="py-2 px-2 text-center">Assigned</th>
                      <th className="py-2 px-2 text-center">Resolved</th>
                      <th className="py-2 px-2 text-center">Open</th>
                      <th className="py-2 px-2 text-right">Avg Res. Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reports?.developerPerformance?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-[10px] text-slate-400 italic">
                          No developer analytics data available.
                        </td>
                      </tr>
                    ) : (
                       reports.developerPerformance.map((dev, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                          <td className="py-2 px-2 text-slate-800 dark:text-slate-200 font-bold truncate max-w-[80px]">{dev.developer}</td>
                          <td className="py-2 px-2 text-center">{dev.assignedDefects}</td>
                          <td className="py-2 px-2 text-center text-emerald-600 font-extrabold">{dev.resolvedDefects}</td>
                          <td className="py-2 px-2 text-center text-amber-605 font-extrabold">{dev.openDefects}</td>
                          <td className="py-2 px-2 text-right text-indigo-600 font-bold">
                            {formatResolutionTime(dev.avgResolutionTime, dev.resolvedDefects)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Defects by Status */}
          <div className="card p-4 flex flex-col justify-between shadow-xs h-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl md:col-span-2">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-xs font-bold text-slate-805 dark:text-white uppercase tracking-wider">Defects by Status</h3>
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            
            <div className="flex-1 min-h-0 relative flex items-center justify-center">
              {!hasStatusData ? (
                <div className="flex flex-col items-center justify-center text-slate-400 text-[10px] font-bold gap-1.5 uppercase">
                  <AlertCircle className="w-4 h-4 text-slate-350" />
                  <span>No status analytics available</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reports?.byStatus} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="status" fontSize={9} stroke="#94a3b8" tickLine={false} />
                    <YAxis fontSize={9} stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top 5 Critical Defects Box */}
          <div className="card p-4 flex flex-col justify-between shadow-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl md:col-span-2">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-850">
              <h3 className="text-xs font-bold text-slate-805 dark:text-white uppercase tracking-wider">Top Critical Defects (Unresolved)</h3>
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-805 text-slate-400 text-[9px] uppercase tracking-wide">
                    <th className="py-2 px-2">Defect ID</th>
                    <th className="py-2 px-2">Title</th>
                    <th className="py-2 px-2">Project</th>
                    <th className="py-2 px-2">Assigned Developer</th>
                    <th className="py-2 px-2">Priority</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Created Date</th>
                    <th className="py-2 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {reports?.topCriticalDefects?.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-6 text-[10px] text-slate-400 italic">
                        No critical unresolved defects.
                      </td>
                    </tr>
                  ) : (
                    reports.topCriticalDefects.map((def) => (
                      <tr key={def.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="py-2.5 px-2 font-extrabold text-slate-900 dark:text-white">DF-{def.id}</td>
                        <td className="py-2.5 px-2 truncate max-w-[200px]" title={def.title}>{def.title}</td>
                        <td className="py-2.5 px-2 font-bold">{def.project_name}</td>
                        <td className="py-2.5 px-2">{def.assignee_name || 'Unassigned'}</td>
                        <td className="py-2.5 px-2 uppercase text-rose-600 font-extrabold">{def.priority}</td>
                        <td className="py-2.5 px-2"><StatusBadge status={def.status} /></td>
                        <td className="py-2.5 px-2">{new Date(def.created_at).toLocaleDateString()}</td>
                        <td className="py-2.5 px-2 text-right">
                          <button 
                            onClick={() => navigate(`/defects/${def.id}`)}
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200 text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
};

export default AdminReports;
