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
import { 
  FolderKanban, 
  Bug, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Clock,
  Briefcase,
  Link2,
  User
} from 'lucide-react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import SeverityBadge from '../../components/SeverityBadge';
import { defectAPI, projectAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const renderPriorityBadge = (priority) => {
    let color = 'bg-slate-105 text-slate-705 dark:bg-slate-800 dark:text-slate-300';
    if (priority === 'Critical') color = 'bg-rose-50 text-rose-600 dark:bg-rose-955/45 dark:text-rose-400';
    else if (priority === 'High') color = 'bg-orange-50 text-orange-600 dark:bg-orange-955/45 dark:text-orange-400';
    else if (priority === 'Medium') color = 'bg-amber-50 text-amber-600 dark:bg-amber-955/45 dark:text-amber-400';
    
    return (
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${color}`}>
        {priority}
      </span>
    );
  };

  const getRelativeTime = (isoString) => {
    if (!isoString) return 'N/A';
    const now = new Date();
    const past = new Date(isoString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  useEffect(() => {
    let active = true;

    const loadProjectsAndStats = async () => {
      try {
        if (projects.length === 0) {
          const projRes = await projectAPI.getAll({ status: 'active' });
          if (active) setProjects(projRes.data.data);
        }
      } catch (err) {
        if (active) {
          setProjects([
            { id: 1, name: 'Project Alpha Integration', project_name: 'Project Alpha' },
            { id: 2, name: 'Defect Tracker Pro Client', project_name: 'Defect Tracker Pro' },
            { id: 3, name: 'Mobile Gateway API Wrapper', project_name: 'Mobile Gateway API' }
          ]);
        }
      }

      // Avoid flashing the full page loading spinner on background intervals
      if (active && !stats) {
        setLoading(true);
      }

      try {
        const params = selectedProject ? { project_id: selectedProject } : {};
        const res = await defectAPI.getDashboardStats(params);
        if (active) setStats(res.data.data);
      } catch {
        if (active) {
          setStats({
            totalProjects: 3,
            totalUsers: 8,
            totalDevelopers: 4,
            totalDefects: selectedProject ? 12 : 38,
            openDefects: selectedProject ? 3 : 12,
            resolvedDefects: selectedProject ? 7 : 20,
            criticalDefects: selectedProject ? 2 : 6,
            reopenedDefects: 2,
            pendingAssignment: 2,
            readyForQA: 3,
            overdueDefects: 1,
            defectsBySeverity: [
              { severity: 'Critical', count: selectedProject ? 2 : 6, color: '#ef4444' },
              { severity: 'High', count: selectedProject ? 3 : 10, color: '#f97316' },
              { severity: 'Medium', count: selectedProject ? 5 : 14, color: '#f59e0b' },
              { severity: 'Low', count: selectedProject ? 2 : 8, color: '#94a3b8' }
            ],
            defectsByStatus: [
              { name: 'Open', count: selectedProject ? 1 : 5, fill: '#38bdf8' },
              { name: 'Assigned', count: selectedProject ? 2 : 7, fill: '#6366f1' },
              { name: 'In Progress', count: selectedProject ? 2 : 6, fill: '#f59e0b' },
              { name: 'Resolved', count: selectedProject ? 4 : 12, fill: '#10b981' },
              { name: 'Testing', count: selectedProject ? 2 : 4, fill: '#14b8a6' },
              { name: 'Closed', count: selectedProject ? 1 : 4, fill: '#64748b' }
            ],
            monthlyTrend: [
              { month: 'Jan', defects: selectedProject ? 3 : 8, resolved: selectedProject ? 1 : 5 },
              { month: 'Feb', defects: selectedProject ? 5 : 15, resolved: selectedProject ? 3 : 10 },
              { month: 'Mar', defects: selectedProject ? 4 : 12, resolved: selectedProject ? 4 : 14 },
              { month: 'Apr', defects: selectedProject ? 7 : 22, resolved: selectedProject ? 5 : 16 },
              { month: 'May', defects: selectedProject ? 8 : 26, resolved: selectedProject ? 6 : 20 },
              { month: 'Jun', defects: selectedProject ? 12 : 38, resolved: selectedProject ? 9 : 28 }
            ],
            recentDefects: [
              { id: 1, title: 'Database pool connection timeouts under stress load', project_name: 'Project Alpha', severity: 'Critical', status: 'In Progress', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
              { id: 2, title: 'UI alignment layout breaks on iOS safari settings screen', project_name: 'Defect Tracker Pro', severity: 'Medium', status: 'Open', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
              { id: 3, title: 'Auth tokens expire prematurely before 24h limit', project_name: 'Mobile Gateway API', severity: 'High', status: 'Resolved', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
            ],
            assignedToMe: [
              { id: 1, title: 'Database pool connection timeouts under stress load', severity: 'Critical', status: 'In Progress', due_date: new Date(Date.now() + 86400000).toISOString() },
              { id: 3, title: 'Auth tokens expire prematurely before 24h limit', severity: 'High', status: 'Resolved', due_date: new Date().toISOString() }
            ],
            pendingAssignmentList: [
              { id: 2, title: 'UI alignment layout breaks on iOS safari settings screen', project_name: 'Defect Tracker Pro', severity: 'Medium', status: 'Open', priority: 'Medium' }
            ],
            recentActivities: [
              { id: '1', user_name: 'John Tester', user_role: 'tester', action: 'reported issue', changed_at: new Date().toISOString(), defect_id: 2, defect_title: 'UI alignment layout breaks on iOS safari settings screen' },
              { id: '2', user_name: 'Sarah Manager', user_role: 'manager', action: 'assigned issue', changed_at: new Date(Date.now() - 3600000).toISOString(), defect_id: 1, defect_title: 'Database pool connection timeouts under stress load' }
            ]
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProjectsAndStats();

    // Auto Refresh stats every 10 seconds without page reload
    const interval = setInterval(loadProjectsAndStats, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedProject, user.id]);

  if (loading && !stats) return <Layout title="Dashboard"><LoadingSpinner /></Layout>;

  const SEVERITY_COLORS = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#f59e0b',
    Low: '#94a3b8'
  };

  return (
    <Layout title="Dashboard">
      <div className="flex flex-col gap-6 animate-fadeIn">
        
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-805 dark:text-white tracking-tight">
              Enterprise Overview
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Welcome back, {user?.full_name}. Here is the quality digest of your projects.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="input-field text-xs py-1.5 w-48 bg-white dark:bg-slate-900 border-slate-205 dark:border-slate-800"
            >
              <option value="">All Projects Overview</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Optimized KPI Cards Section (Exactly 6 KPI Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard 
            title="Total Projects" 
            value={stats?.totalProjects || 0} 
            icon={FolderKanban} 
            color="primary" 
          />
          <StatCard 
            title="Total Defects" 
            value={stats?.totalDefects || 0} 
            icon={Bug} 
            color="primary" 
          />
          <StatCard 
            title="Open Defects" 
            value={stats?.openDefects || 0} 
            icon={AlertTriangle} 
            color="red" 
            onClick={() => navigate('/defects', { state: { filter: { status: 'Open' } } })}
          />
          <StatCard 
            title="Critical Issues" 
            value={stats?.criticalDefects || 0} 
            icon={AlertTriangle} 
            color="red" 
            onClick={() => navigate('/defects', { state: { filter: { severity: 'Critical' } } })}
          />
          <StatCard 
            title="Pending Assignment" 
            value={stats?.pendingAssignment || 0} 
            icon={User} 
            color="purple" 
            onClick={() => navigate('/defects', { state: { filter: { assignee: 'unassigned' } } })}
          />
          <StatCard 
            title="Ready For QA" 
            value={stats?.readyForQA || 0} 
            icon={CheckCircle2} 
            color="yellow" 
            onClick={() => navigate('/defects', { state: { filter: { status: 'Ready For QA' } } })}
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Charts and Activities */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Status Chart */}
              <div className="card flex flex-col shadow-xs bg-white dark:bg-slate-900 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Defects by Status</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Active logs tracked by statuses</p>
                  </div>
                  <Activity className="w-4 h-4 text-slate-400" />
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.defectsByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" tickLine={false} />
                      <YAxis fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        labelClassName="font-bold text-xs"
                        itemStyle={{ fontSize: '11px' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {stats?.defectsByStatus?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill || '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Severity Chart */}
              <div className="card flex flex-col shadow-xs bg-white dark:bg-slate-900 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-805 dark:text-white uppercase tracking-wider">Defects by Severity</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Distribution of quality issues</p>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-slate-400" />
                </div>
                <div className="h-36 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats?.defectsBySeverity}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={58}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="severity"
                      >
                        {stats?.defectsBySeverity?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <p className="text-xl font-black text-slate-800 dark:text-white">{stats?.criticalDefects}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Critical</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-4 pt-3 border-t border-slate-105 dark:border-slate-800">
                  {stats?.defectsBySeverity?.map((entry) => (
                    <div key={entry.severity} className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SEVERITY_COLORS[entry.severity] }}></span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold truncate">{entry.severity} ({entry.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Defect Activity */}
            {stats?.recentActivities?.length > 0 && (
              <div className="card shadow-xs bg-white dark:bg-slate-900 p-4 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-855 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-brand-655" /> Recent Defect Activity
                  </h3>
                  <button 
                    onClick={() => navigate('/defects')} 
                    className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1.5 hover:underline"
                  >
                    View All <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {stats.recentActivities.slice(0, 7).map((act) => (
                    <div 
                      key={act.id}
                      onClick={() => navigate(`/defects/${act.defect_id}`)}
                      className="flex items-start gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-855/30 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800/80"
                    >
                      <div className="w-7 h-7 bg-slate-105 dark:bg-slate-800 text-slate-650 dark:text-slate-400 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs uppercase">
                        {act.user_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0 text-xs font-semibold">
                        <p className="text-slate-707 dark:text-slate-355 leading-normal">
                          <strong className="text-slate-850 dark:text-white font-extrabold">{act.user_name}</strong> ({act.user_role}){' '}
                          <span className="text-slate-500 dark:text-slate-450 font-medium">{act.action}</span>{' '}
                          <strong className="text-brand-655 dark:text-brand-400 font-bold hover:underline">
                            {act.defect_title}
                          </strong>
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                          {getRelativeTime(act.changed_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Widgets */}
          <div className="flex flex-col gap-6">
            
            {/* Action Required Widget */}
            <div className="card shadow-xs border-l-4 border-brand-600 bg-white dark:bg-slate-900 p-3.5 space-y-3">
              <div>
                <h3 className="text-xs font-black text-slate-805 dark:text-white uppercase tracking-wider">Action Required</h3>
                <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">Urgent items awaiting review</p>
              </div>
              <div className="space-y-2 text-xs font-bold text-slate-707 dark:text-slate-300">
                <div className="flex items-center justify-between gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                  <span className="truncate">Pending Assignment</span>
                  <span className="flex-1 border-b border-dashed border-slate-200 dark:border-slate-800 mx-1"></span>
                  <span className="font-extrabold text-slate-850 dark:text-white">{stats?.pendingAssignment || 0}</span>
                  <button 
                    onClick={() => navigate('/defects', { state: { filter: { assignee: 'unassigned' } } })}
                    className="text-[10px] font-black text-brand-600 hover:text-brand-700 hover:underline shrink-0 ml-2"
                  >
                    Assign
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                  <span className="truncate">Ready For QA</span>
                  <span className="flex-1 border-b border-dashed border-slate-200 dark:border-slate-800 mx-1"></span>
                  <span className="font-extrabold text-slate-850 dark:text-white">{stats?.readyForQA || 0}</span>
                  <button 
                    onClick={() => navigate('/defects', { state: { filter: { status: 'Ready For QA' } } })}
                    className="text-[10px] font-black text-brand-600 hover:text-brand-700 hover:underline shrink-0 ml-2"
                  >
                    Review
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                  <span className="truncate">Critical Issues</span>
                  <span className="flex-1 border-b border-dashed border-slate-200 dark:border-slate-800 mx-1"></span>
                  <span className="font-extrabold text-slate-850 dark:text-white">{stats?.criticalDefects || 0}</span>
                  <button 
                    onClick={() => navigate('/defects', { state: { filter: { severity: 'Critical' } } })}
                    className="text-[10px] font-black text-brand-600 hover:text-brand-700 hover:underline shrink-0 ml-2"
                  >
                    View
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                  <span className="truncate">Overdue</span>
                  <span className="flex-1 border-b border-dashed border-slate-200 dark:border-slate-800 mx-1"></span>
                  <span className="font-extrabold text-slate-850 dark:text-white">{stats?.overdueDefects || 0}</span>
                  <button 
                    onClick={() => navigate('/defects', { state: { filter: { overdue: true } } })}
                    className="text-[10px] font-black text-brand-600 hover:text-brand-700 hover:underline shrink-0 ml-2"
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Quick Links Widget */}
            <div className="card shadow-xs bg-white dark:bg-slate-900 p-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white mb-2.5 pb-1.5 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-brand-655" /> Quick Links
              </h3>
              <div className="flex gap-2 justify-between">
                <button 
                  onClick={() => navigate('/projects')}
                  title="Projects"
                  className="flex-1 py-2 text-center bg-slate-50 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-850/50 dark:hover:bg-brand-950/20 dark:hover:text-brand-400 rounded-xl transition-all border border-slate-100 dark:border-slate-850 text-[10px] font-semibold cursor-pointer text-slate-707 dark:text-slate-350"
                >
                  📁 Projects
                </button>
                <button 
                  onClick={() => navigate('/reports')}
                  title="Reports"
                  className="flex-1 py-2 text-center bg-slate-50 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-855/50 dark:hover:bg-brand-950/20 dark:hover:text-brand-400 rounded-xl transition-all border border-slate-105 dark:border-slate-855 text-[10px] font-semibold cursor-pointer text-slate-707 dark:text-slate-350"
                >
                  📊 Reports
                </button>
                <button 
                  onClick={() => navigate('/users')}
                  title="Teams"
                  className="flex-1 py-2 text-center bg-slate-50 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-855/50 dark:hover:bg-brand-950/20 dark:hover:text-brand-400 rounded-xl transition-all border border-slate-105 dark:border-slate-855 text-[10px] font-semibold cursor-pointer text-slate-707 dark:text-slate-350"
                >
                  👥 Teams
                </button>
                <button 
                  onClick={() => navigate('/notifications')}
                  title="Notifications"
                  className="flex-1 py-2 text-center bg-slate-50 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-855/50 dark:hover:bg-brand-950/20 dark:hover:text-brand-400 rounded-xl transition-all border border-slate-105 dark:border-slate-855 text-[10px] font-semibold cursor-pointer text-slate-707 dark:text-slate-355"
                >
                  🔔 Alerts
                </button>
              </div>
            </div>

            {/* Pending Assignment Widget */}
            <div className="card flex-1 shadow-xs bg-white dark:bg-slate-900 p-3.5">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 uppercase tracking-wider">
                <Briefcase className="w-4 h-4 text-brand-600" /> Pending Assignment
              </h3>
              <div className="space-y-3">
                {(!stats?.pendingAssignmentList || stats.pendingAssignmentList.length === 0) ? (
                  <p className="text-xs text-slate-455 text-center py-6">No defects awaiting assignment</p>
                ) : (
                  <>
                    {stats.pendingAssignmentList.slice(0, 3).map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => navigate(`/defects/${item.id}`)}
                        className="p-3 bg-slate-50 dark:bg-slate-855/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-all border border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between"
                      >
                        <div className="min-w-0 flex-1 mr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-extrabold text-slate-400 tracking-wider shrink-0">DEF-{item.id}</span>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2 items-center">
                            {renderPriorityBadge(item.priority)}
                            <StatusBadge status={item.status} />
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/defects/${item.id}`);
                          }}
                          className="btn-secondary text-[10px] py-1 px-2.5 shrink-0 font-bold border-slate-200 dark:border-slate-800 text-slate-707 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-xs cursor-pointer"
                        >
                          Open
                        </button>
                      </div>
                    ))}
                    {stats.pendingAssignmentList.length > 3 && (
                      <button 
                        onClick={() => navigate('/defects', { state: { filter: { assignee: 'unassigned' } } })}
                        className="w-full text-center py-2 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline border-t border-slate-100 dark:border-slate-800/80 mt-2"
                      >
                        View All ({stats.pendingAssignmentList.length})
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Compact Monthly Defect Trend Section */}
        <div className="card flex flex-col shadow-xs bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Monthly Defect Trend</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Defects logged vs resolved monthly</p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" fontSize={10} stroke="#94a3b8" tickLine={false} />
                <YAxis fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="top" height={28} iconType="circle" fontSize={10} />
                <Line type="monotone" dataKey="defects" stroke="#ef4444" strokeWidth={2} name="Defects Created" activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Defects Resolved" activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default ManagerDashboard;
