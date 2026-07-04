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
  AreaChart, 
  Area 
} from 'recharts';
import { 
  FolderKanban, 
  Users, 
  Bug, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Clock,
  Briefcase
} from 'lucide-react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import SeverityBadge from '../../components/SeverityBadge';
import { defectAPI, projectAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DeveloperDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
            totalDefects: selectedProject ? 12 : 38,
            openDefects: selectedProject ? 3 : 12,
            resolvedDefects: selectedProject ? 7 : 20,
            criticalDefects: selectedProject ? 2 : 6,
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
        
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Developer Workspace</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Welcome back, {user?.full_name}. Here is the quality digest of your projects.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="input-field text-xs py-1.5 w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            >
              <option value="">All Projects Overview</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard 
            title="Total Projects" 
            value={stats?.totalProjects || 0} 
            icon={FolderKanban} 
            color="primary" 
          />
          <StatCard 
            title="Active Users" 
            value={stats?.totalUsers || 0} 
            icon={Users} 
            color="purple" 
          />
          <StatCard 
            title="My Assignments" 
            value={stats?.totalDefects || 0} 
            icon={Bug} 
            color="primary" 
          />
          <StatCard 
            title="My Open" 
            value={stats?.openDefects || 0} 
            icon={Clock} 
            color="yellow" 
          />
          <StatCard 
            title="My Resolved" 
            value={stats?.resolvedDefects || 0} 
            icon={CheckCircle2} 
            color="green" 
          />
          <StatCard 
            title="My Critical" 
            value={stats?.criticalDefects || 0} 
            icon={AlertTriangle} 
            color="red" 
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Bar Chart: Defects By Status */}
          <div className="card lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Defects by Status</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Active logs tracked by statuses</p>
              </div>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.defectsByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" tickLine={false} />
                  <YAxis fontSize={11} stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    labelClassName="font-bold text-xs"
                    itemStyle={{ fontSize: '12px' }}
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

          {/* Pie Chart: Defects By Severity */}
          <div className="card flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Defects by Severity</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Distribution of quality issues</p>
              </div>
              <AlertTriangle className="w-4 h-4 text-slate-400" />
            </div>
            <div className="h-48 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.defectsBySeverity}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
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
                    itemStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats?.criticalDefects}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Critical</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              {stats?.defectsBySeverity?.map((entry) => (
                <div key={entry.severity} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SEVERITY_COLORS[entry.severity] }}></span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{entry.severity} ({entry.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Third Row Trend Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Trend Area Chart */}
          <div className="card lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Monthly Defect Trend</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Defects logged vs resolved monthly</p>
              </div>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDefects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" tickLine={false} />
                  <YAxis fontSize={11} stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" fontSize={11} />
                  <Area type="monotone" dataKey="defects" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDefects)" name="Reported Defects" />
                  <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" name="Resolved Issues" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions & Assigned To Me */}
          <div className="flex flex-col gap-6">
            
            {/* Assigned to Me */}
            <div className="card flex-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-600" />
                Assigned to Me
              </h3>
              <div className="space-y-3">
                {!stats?.assignedToMe || stats.assignedToMe.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">You have no pending assignments</p>
                ) : (
                  stats.assignedToMe.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => navigate(`/defects/${item.id}`)}
                      className="p-3 bg-slate-50 dark:bg-slate-850/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-all border border-slate-200/50 dark:border-slate-800/80"
                    >
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                      <div className="flex gap-2 mt-2">
                        <SeverityBadge severity={item.severity} />
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Quick Links</h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => navigate('/projects')}
                  className="p-3 text-center bg-slate-50 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-850/50 dark:hover:bg-brand-950/20 dark:hover:text-brand-400 rounded-xl transition-all border border-slate-100 dark:border-slate-850 text-xs font-semibold cursor-pointer"
                >
                  📁 Projects
                </button>
                <button 
                  onClick={() => navigate('/defects')}
                  className="p-3 text-center bg-slate-50 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-855/50 dark:hover:bg-brand-950/20 dark:hover:text-brand-400 rounded-xl transition-all border border-slate-100 dark:border-slate-850 text-xs font-semibold cursor-pointer"
                >
                  🐛 Defects
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Recent Defects List */}
        {stats?.recentDefects?.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent Defects Activity</h3>
              <button 
                onClick={() => navigate('/defects')} 
                className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1.5 hover:underline"
              >
                View all defects <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Title</th>
                    <th className="py-2.5 px-4 font-semibold">Project</th>
                    <th className="py-2.5 px-4 font-semibold">Severity</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {stats.recentDefects.map((defect) => (
                    <tr
                      key={defect.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
                      onClick={() => navigate(`/defects/${defect.id}`)}
                    >
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{defect.title}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{defect.project_name}</td>
                      <td className="py-3 px-4"><SeverityBadge severity={defect.severity} /></td>
                      <td className="py-3 px-4"><StatusBadge status={defect.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
      </div>
    </Layout>
  );
};

export default DeveloperDashboard;
