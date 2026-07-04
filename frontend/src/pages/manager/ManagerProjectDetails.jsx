import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { projectAPI, userAPI, defectAPI } from '../../services/api';
import { 
  Users, 
  Calendar, 
  BarChart3, 
  Settings as SettingsIcon, 
  TrendingUp,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Clock,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ManagerProjectDetails = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Project defects state for workloads and lists
  const [projectDefects, setProjectDefects] = useState([]);

  // Mock states for members management
  const [members, setMembers] = useState([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [selectedRoleForNewMember, setSelectedRoleForNewMember] = useState('developer');

  // Project Edit settings
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectStatus, setProjectStatus] = useState('active');

  const renderPriorityBadge = (priority) => {
    let color = 'bg-slate-105 text-slate-705 dark:bg-slate-800 dark:text-slate-355';
    if (priority === 'Critical') color = 'bg-rose-50 text-rose-655 dark:bg-rose-955/40 dark:text-rose-400';
    else if (priority === 'High') color = 'bg-orange-55 text-orange-655 dark:bg-orange-955/40 dark:text-orange-400';
    else if (priority === 'Medium') color = 'bg-amber-55 text-amber-655 dark:bg-amber-955/40 dark:text-amber-400';
    
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

  const fetchProjectData = async () => {
    setLoading(true);

    try {
      const projRes = await projectAPI.getById(id);
      const proj = projRes.data.data;
      const combinedProjectObj = {
        ...proj,
        name: proj.project_name || proj.name || '',
        stats: {
          totalDefects: 0,
          openDefects: 0,
          resolvedDefects: 0,
          criticalDefects: 0
        }
      };
      setProject(combinedProjectObj);
      setProjectName(combinedProjectObj.name);
      setProjectDesc(combinedProjectObj.description || '');
      setProjectStatus(combinedProjectObj.status || 'active');
      setMembers(proj.members || [
        { id: 1, full_name: 'Sarah Manager', email: 'sarah@example.com', role: 'manager' },
        { id: 2, full_name: 'John Developer', email: 'john@example.com', role: 'developer' },
        { id: 3, full_name: 'Dave Tester', email: 'dave@example.com', role: 'tester' }
      ]);
    } catch {
      const mockProject = {
        id: id,
        name: 'Project Alpha Integration',
        description: 'Next-generation system integration modules and microservice orchestrator quality check.',
        status: 'active',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        stats: {
          totalDefects: 24,
          openDefects: 8,
          resolvedDefects: 12,
          criticalDefects: 4
        }
      };
      setProject(mockProject);
      setProjectName(mockProject.name);
      setProjectDesc(mockProject.description);
      setProjectStatus(mockProject.status);
      setMembers([
        { id: 1, full_name: 'Sarah Manager', email: 'sarah@example.com', role: 'manager' },
        { id: 2, full_name: 'John Developer', email: 'john@example.com', role: 'developer' },
        { id: 3, full_name: 'Dave Tester', email: 'dave@example.com', role: 'tester' }
      ]);
    }

    try {
      const statsRes = await projectAPI.getStatistics(id);
      const stats = statsRes.data.data.statistics || { total_defects: 0, open_defects: 0, resolved_defects: 0, critical_defects: 0 };
      setProject(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          stats: {
            totalDefects: Number(stats.total_defects || 0),
            openDefects: Number(stats.open_defects || 0),
            resolvedDefects: Number(stats.resolved_defects || 0),
            criticalDefects: Number(stats.critical_defects || 0)
          }
        };
      });
    } catch {
      // Ignored
    }

    try {
      const defectsRes = await defectAPI.getAll({ project_id: id });
      setProjectDefects(defectsRes.data.data || []);
    } catch {
      setProjectDefects([
        { id: 101, title: 'Database connection pools timeout under high load', priority: 'High', status: 'In Progress', assignee_name: 'John Developer', assignee_id: 2, updated_at: new Date().toISOString() },
        { id: 102, title: 'Auth tokens expire prematurely before 24h limit', priority: 'Critical', status: 'Open', assignee_name: 'Unassigned', assignee_id: null, updated_at: new Date().toISOString() },
        { id: 103, title: 'UI alignment layout breaks on iOS Safari settings screen', priority: 'Medium', status: 'Resolved', assignee_name: 'Dave Tester', assignee_id: 3, updated_at: new Date().toISOString() }
      ]);
    }

    try {
      const usersRes = await userAPI.getAll();
      setUsers(usersRes.data.data || []);
    } catch {
      setUsers([
        { id: 4, full_name: 'Alice Dev', email: 'alice@example.com', role: 'developer' },
        { id: 5, full_name: 'Bob Tester', email: 'bob@example.com', role: 'tester' },
        { id: 6, full_name: 'Robert Manager', email: 'robert@example.com', role: 'manager' }
      ]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!selectedUserToAdd) return;
    const userObj = users.find(u => u.id === Number(selectedUserToAdd) || u.id === selectedUserToAdd);
    if (userObj) {
      if (members.some(m => m.id === userObj.id)) {
        toast.error('User is already a member of this project');
        return;
      }
      setMembers(prev => [...prev, { ...userObj, role: selectedRoleForNewMember }]);
      toast.success(`${userObj.full_name} added to project`);
      setSelectedUserToAdd('');
    }
  };

  const handleRemoveMember = (memberId) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
    toast.success('Member removed from project');
  };

  const handleUpdateProjectSettings = (e) => {
    e.preventDefault();
    setProject(prev => ({
      ...prev,
      name: projectName,
      description: projectDesc,
      status: projectStatus
    }));
    toast.success('Project details updated successfully');
  };

  const handleArchiveProject = () => {
    setProjectStatus('archived');
    toast.success('Project archived');
  };

  if (loading) return <Layout title="Project Details"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mt-20"></div></Layout>;

  return (
    <Layout title={`Project: ${project?.name}`}>
      <div className="flex flex-col gap-6">
        
        {/* Project Header Banner with compact metadata badges */}
        <div className="card p-6 bg-gradient-to-r from-brand-600 to-indigo-700 dark:from-slate-900 dark:to-indigo-950 text-white relative overflow-hidden border-none shadow-xs">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
            <TrendingUp className="w-96 h-96" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="bg-white/20 text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {projectStatus}
              </span>
              <span className="bg-white/15 text-white text-[10px] px-2.5 py-1 rounded-full font-semibold">
                📊 {Math.round(((project?.stats?.resolvedDefects || 0) / (project?.stats?.totalDefects || 1)) * 100)}% Completed
              </span>
              <span className="bg-white/15 text-white text-[10px] px-2.5 py-1 rounded-full font-semibold">
                💻 {members.filter(m => m.role === 'developer').length} Devs
              </span>
              <span className="bg-white/15 text-white text-[10px] px-2.5 py-1 rounded-full font-semibold">
                🧪 {members.filter(m => m.role === 'tester').length} Testers
              </span>
              <span className="bg-white/15 text-white text-[10px] px-2.5 py-1 rounded-full font-semibold">
                🐛 {project?.stats?.totalDefects || 0} Defects
              </span>
            </div>
            <h2 className="text-2xl font-black mt-4 tracking-tight">{project?.name}</h2>
            <p className="text-sm text-white/80 mt-1.5 max-w-2xl font-medium leading-relaxed">{project?.description}</p>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-205 dark:border-slate-800">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'members', label: 'Members', icon: Users },
            { id: 'timeline', label: 'Timeline', icon: Calendar },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              
              {/* Left Column: KPI cards, Summary, Health, and Recent Defects */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                
                {/* 4 KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="Total Defects" value={project?.stats?.totalDefects || 0} icon="🐛" color="primary" />
                  <StatCard title="Open Defects" value={project?.stats?.openDefects || 0} icon="📋" color="yellow" />
                  <StatCard title="Resolved Defects" value={project?.stats?.resolvedDefects || 0} icon="✅" color="green" />
                  <StatCard title="Critical Issues" value={project?.stats?.criticalDefects || 0} icon="🔴" color="red" />
                </div>

                {/* Project Summary Card (Enterprise two-column details layout) */}
                <div className="card grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white dark:bg-slate-900 shadow-xs">
                  <div>
                    <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider mb-3">General Information</h4>
                    <div className="space-y-2.5 text-xs font-semibold">
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="text-slate-400">Project Status</span>
                        <span className="text-slate-800 dark:text-white capitalize">{projectStatus}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="text-slate-400">Project Manager</span>
                        <span className="text-slate-800 dark:text-white">
                          {members.find(m => m.role === 'manager' || m.role === 'project_manager')?.full_name || 'Sarah Manager'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-105 dark:border-slate-800 pb-2">
                        <span className="text-slate-400">Created Date</span>
                        <span className="text-slate-800 dark:text-white">
                          {project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="text-slate-400">Project Deadline</span>
                        <span className="text-slate-808 dark:text-white">
                          {project?.created_at ? new Date(new Date(project.created_at).getTime() + 90 * 86400000).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider mb-3">Workload & Completion</h4>
                    <div className="space-y-2.5 text-xs font-semibold">
                      <div className="flex justify-between border-b border-slate-105 dark:border-slate-800 pb-2">
                        <span className="text-slate-400">Developers Count</span>
                        <span className="text-slate-808 dark:text-white">{members.filter(m => m.role === 'developer').length} Members</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-105 dark:border-slate-800 pb-2">
                        <span className="text-slate-400">Testers Count</span>
                        <span className="text-slate-808 dark:text-white">{members.filter(m => m.role === 'tester').length} Members</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="text-slate-400">Completion Percentage</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {Math.round(((project?.stats?.resolvedDefects || 0) / (project?.stats?.totalDefects || 1)) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Health Card (Vertical spacing reduced, fits all stats) */}
                <div className="card bg-white dark:bg-slate-900 p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-808 dark:text-white uppercase tracking-wider mb-4">Project Health Overview</h3>
                  <div className="flex items-center gap-6">
                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="26" fill="transparent" stroke="#e2e8f0" strokeWidth="6" className="dark:stroke-slate-800" />
                        <circle cx="32" cy="32" r="26" fill="transparent" stroke="#10b981" strokeWidth="6" 
                          strokeDasharray={163}
                          strokeDashoffset={163 - (163 * (project?.stats?.resolvedDefects || 0)) / (project?.stats?.totalDefects || 1)} 
                        />
                      </svg>
                      <div className="absolute text-center">
                        <p className="text-[11px] font-black text-slate-808 dark:text-white">
                          {Math.round(((project?.stats?.resolvedDefects || 0) / (project?.stats?.totalDefects || 1)) * 100)}%
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold">Open Defects</span>
                        <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">{project?.stats?.openDefects || 0}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Resolved Defects</span>
                        <p className="text-lg font-black text-slate-805 dark:text-white mt-0.5">{project?.stats?.resolvedDefects || 0}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Critical Issues</span>
                        <p className="text-lg font-black text-rose-600 mt-0.5">{project?.stats?.criticalDefects || 0}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Pending Defects</span>
                        <p className="text-lg font-black text-slate-805 dark:text-white mt-0.5">
                          {(project?.stats?.totalDefects || 0) - (project?.stats?.resolvedDefects || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Defects (Latest 5 defects list) */}
                {projectDefects?.length > 0 && (
                  <div className="card bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-105 dark:border-slate-800">
                      <h3 className="text-xs font-bold text-slate-805 dark:text-white uppercase tracking-wider">Recent Defects</h3>
                      <button 
                        onClick={() => navigate('/defects', { state: { filter: { project_id: id } } })}
                        className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline"
                      >
                        View All Defects <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                            <th className="py-2 px-3">ID</th>
                            <th className="py-2 px-3">Title</th>
                            <th className="py-2 px-3">Priority</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Developer</th>
                            <th className="py-2 px-3">Updated</th>
                            <th className="py-2 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-105 dark:divide-slate-850">
                          {projectDefects.slice(0, 5).map((def) => (
                            <tr key={def.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                              <td className="py-2.5 px-3 font-bold text-slate-400">DEF-{def.id}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-808 dark:text-slate-205 truncate max-w-[200px]">{def.title}</td>
                              <td className="py-2.5 px-3">{renderPriorityBadge(def.priority || def.severity)}</td>
                              <td className="py-2.5 px-3"><StatusBadge status={def.status} /></td>
                              <td className="py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-300">{def.assignee_name || 'Unassigned'}</td>
                              <td className="py-2.5 px-3 text-slate-400">{getRelativeTime(def.updated_at)}</td>
                              <td className="py-2.5 px-3 text-right">
                                <button 
                                  onClick={() => navigate(`/defects/${def.id}`)}
                                  className="text-brand-600 hover:underline font-bold"
                                >
                                  Open
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Quick Actions Card */}
              <div className="flex flex-col gap-6">
                <div className="card bg-white dark:bg-slate-900 p-4 space-y-4 h-fit shadow-xs">
                  <h3 className="text-xs font-bold text-slate-805 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">Quick Actions</h3>
                  <div className="flex flex-col gap-2 text-xs font-bold">
                    <button 
                      onClick={() => navigate('/create-defect')}
                      className="w-full text-left p-2.5 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-850 dark:hover:bg-brand-950/20 dark:hover:text-brand-400 rounded-xl transition-all border border-slate-100 dark:border-slate-850 cursor-pointer"
                    >
                      🐛 Create Defect
                    </button>
                    <button 
                      onClick={() => setActiveTab('members')}
                      className="w-full text-left p-2.5 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-850 dark:hover:bg-brand-950/20 dark:hover:text-brand-400 rounded-xl transition-all border border-slate-100 dark:border-slate-855 cursor-pointer"
                    >
                      👥 Assign Team Member
                    </button>
                    <button 
                      onClick={() => navigate('/defects', { state: { filter: { project_id: id } } })}
                      className="w-full text-left p-2.5 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-850 dark:hover:bg-brand-950/20 dark:hover:text-brand-400 rounded-xl transition-all border border-slate-100 dark:border-slate-855 cursor-pointer"
                    >
                      📋 View All Defects
                    </button>
                    <button 
                      onClick={() => navigate('/reports', { state: { project_id: id } })}
                      className="w-full text-left p-2.5 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-850 dark:hover:bg-brand-950/20 dark:hover:text-brand-400 rounded-xl transition-all border border-slate-100 dark:border-slate-855 cursor-pointer"
                    >
                      📊 Generate Report
                    </button>
                    <button 
                      onClick={handleArchiveProject}
                      className="w-full text-left p-2.5 bg-rose-50 text-rose-600 dark:bg-rose-955/20 dark:hover:bg-rose-950/30 rounded-xl transition-all border border-rose-100/50 dark:border-rose-900/30 cursor-pointer"
                    >
                      📦 Archive Project
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* MEMBERS TAB */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Members List */}
                <div className="card space-y-4 lg:col-span-2 shadow-xs bg-white dark:bg-slate-900 p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-808 dark:text-white">Assigned Project Members</h3>
                    <span className="text-xs bg-slate-100 dark:bg-slate-850 px-2.5 py-0.5 rounded-full font-bold text-slate-500">{members.length} Members</span>
                  </div>
                  
                  <div className="divide-y divide-slate-100 dark:divide-slate-855">
                    {members.map(member => (
                      <div key={member.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{member.full_name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 dark:text-slate-300 capitalize">
                            {member.role?.replace('_', ' ')}
                          </span>
                          <button 
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add New Member Widget */}
                <div className="card h-fit space-y-4 shadow-xs bg-white dark:bg-slate-900 p-5">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">Add Team Member</h3>
                  <form onSubmit={handleAddMember} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 tracking-wide">Select User</label>
                      <select
                        value={selectedUserToAdd}
                        onChange={(e) => setSelectedUserToAdd(e.target.value)}
                        className="input-field text-sm"
                        required
                      >
                        <option value="">-- Choose User --</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 tracking-wide">Project Role</label>
                      <select
                        value={selectedRoleForNewMember}
                        onChange={(e) => setSelectedRoleForNewMember(e.target.value)}
                        className="input-field text-sm"
                      >
                        <option value="developer">Developer</option>
                        <option value="tester">Tester</option>
                        <option value="manager">Project Manager</option>
                      </select>
                    </div>
                    <button type="submit" className="btn-primary w-full cursor-pointer">
                      <Plus className="w-4 h-4" /> Add to Project
                    </button>
                  </form>
                </div>
              </div>

              {/* Developer Workload Table Section */}
              <div className="card bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
                <h3 className="text-xs font-bold text-slate-808 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-105 dark:border-slate-800">Developer Workload Tracker</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                        <th className="py-2 px-3">Developer Name</th>
                        <th className="py-2 px-3">Assigned Defects</th>
                        <th className="py-2 px-3">Open Defects</th>
                        <th className="py-2 px-3">Resolved Defects</th>
                        <th className="py-2 px-3">Current Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-105 dark:divide-slate-850">
                      {members.filter(m => m.role === 'developer').map((dev, idx) => {
                        const devDefects = projectDefects.filter(d => Number(d.assignee_id) === Number(dev.id));
                        const openCount = devDefects.filter(d => d.status !== 'Resolved' && d.status !== 'Closed').length;
                        const resolvedCount = devDefects.filter(d => d.status === 'Resolved' || d.status === 'Closed').length;
                        const status = openCount > 2 ? 'Busy' : (openCount > 0 ? 'Active' : 'Idle');

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{dev.full_name}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-600 dark:text-slate-450">{devDefects.length}</td>
                            <td className="py-2.5 px-3 text-amber-600 font-extrabold">{openCount}</td>
                            <td className="py-2.5 px-3 text-emerald-600 font-extrabold">{resolvedCount}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                status === 'Busy' ? 'bg-red-50 text-red-655 dark:bg-red-955/40 dark:text-red-400' :
                                status === 'Active' ? 'bg-amber-50 text-amber-655 dark:bg-amber-955/40 dark:text-amber-400' :
                                'bg-slate-105 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {members.filter(m => m.role === 'developer').length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-455 italic">No developers assigned to this project</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TIMELINE TAB (Vertical activity feed timeline) */}
          {activeTab === 'timeline' && (
            <div className="card space-y-6 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-805 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">Project Timeline Activities</h3>
              
              <div className="relative border-l border-slate-205 dark:border-slate-800 ml-3.5 space-y-6 pb-2">
                {[
                  { title: 'Project Initiated', desc: 'Project configuration database schema build initialized.', date: 'Jun 01, 2026', user: 'System Admin', type: 'created' },
                  { title: 'Member Added', desc: 'Sarah Manager added John Developer to the project.', date: 'Jun 10, 2026', user: 'Sarah Manager', type: 'member_added' },
                  { title: 'Defect Reported', desc: 'Dave Tester logged DEF-101: Database pool connection timeouts.', date: 'Jun 22, 2026', user: 'Dave Tester', type: 'defect_reported' },
                  { title: 'Developer Assigned', desc: 'Sarah Manager assigned DEF-101 to John Developer.', date: 'Jun 23, 2026', user: 'Sarah Manager', type: 'assigned' },
                  { title: 'Project Status Updated', desc: 'Project status transitioned to active quality sandbox check.', date: 'Jul 01, 2026', user: 'Sarah Manager', type: 'updated' }
                ].map((item, index) => (
                  <div key={index} className="relative pl-7">
                    <div className="absolute -left-[14px] top-0.5 p-1 rounded-full border bg-white dark:bg-slate-900 border-brand-500 text-brand-500 shadow-xs">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs font-semibold">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-slate-880 dark:text-white">{item.title}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">{item.date}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">By: {item.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS TAB (Settings grouped into clear sections) */}
          {activeTab === 'settings' && (
            <div className="card space-y-6 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-805 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">Project Settings</h3>
              
              <form onSubmit={handleUpdateProjectSettings} className="space-y-6 text-xs">
                
                {/* General Section */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-slate-805 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase text-[10px] tracking-wider text-slate-400">General Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-400 uppercase mb-1.5 tracking-wide">Project Name</label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-400 uppercase mb-1.5 tracking-wide">Status</label>
                      <select
                        value={projectStatus}
                        onChange={(e) => setProjectStatus(e.target.value)}
                        className="input-field"
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-400 uppercase mb-1.5 tracking-wide">Description</label>
                      <textarea
                        rows={3}
                        value={projectDesc}
                        onChange={(e) => setProjectDesc(e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Project Dates Section */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-slate-805 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase text-[10px] tracking-wider text-slate-400">Project Timeline Dates</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-400 uppercase mb-1.5 tracking-wide">Created Date</label>
                      <input
                        type="text"
                        disabled
                        value={project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                        className="input-field bg-slate-50 dark:bg-slate-850 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-400 uppercase mb-1.5 tracking-wide">Estimated Deadline</label>
                      <input
                        type="text"
                        disabled
                        value={project?.created_at ? new Date(new Date(project.created_at).getTime() + 90 * 86400000).toLocaleDateString() : 'N/A'}
                        className="input-field bg-slate-50 dark:bg-slate-855 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Notifications Section */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-slate-805 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase text-[10px] tracking-wider text-slate-400">Notifications Settings</h4>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-705 dark:text-slate-300">
                      <input type="checkbox" defaultChecked className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4" />
                      <span>Enable In-App Notifications</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-705 dark:text-slate-300">
                      <input type="checkbox" defaultChecked className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4" />
                      <span>Send Daily Email digests</span>
                    </label>
                  </div>
                </div>

                {/* Danger Zone Section */}
                <div className="space-y-4 p-4 border border-rose-200/50 dark:border-rose-900/30 rounded-xl bg-rose-50/20 dark:bg-rose-955/10">
                  <h4 className="font-extrabold text-rose-650 uppercase text-[10px] tracking-wider">Danger Zone</h4>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">Archive this Project</p>
                      <p className="text-[11px] text-slate-450 mt-0.5">Archiving this project hides it from current workspaces. This action can be undone by changing status.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleArchiveProject}
                      className="btn-danger bg-rose-650 hover:bg-rose-700 px-4 py-2 text-xs shrink-0 font-bold"
                    >
                      Archive Project
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-105 dark:border-slate-800">
                  <button type="submit" className="btn-primary font-bold px-6 py-2 text-xs">
                    <Save className="w-4 h-4" /> Save Settings
                  </button>
                </div>
              </form>
            </div>
          )}
          
        </div>
      </div>
    </Layout>
  );
};

export default ManagerProjectDetails;
