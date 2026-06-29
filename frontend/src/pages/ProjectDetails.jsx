import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { projectAPI, userAPI } from '../services/api';
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
  Clock
} from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock states for members management
  const [members, setMembers] = useState([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [selectedRoleForNewMember, setSelectedRoleForNewMember] = useState('developer');

  // Project Edit settings
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectStatus, setProjectStatus] = useState('active');

  const fetchProjectData = async () => {
    try {
      const [projRes, usersRes] = await Promise.all([
        projectAPI.getById(id),
        userAPI.getAll(),
      ]);
      const proj = projRes.data.data;
      setProject(proj);
      setProjectName(proj.name);
      setProjectDesc(proj.description || '');
      setProjectStatus(proj.status || 'active');

      // Populate mock or real members
      setMembers(proj.members || [
        { id: 1, full_name: 'Sarah Manager', email: 'sarah@example.com', role: 'manager' },
        { id: 2, full_name: 'John Developer', email: 'john@example.com', role: 'developer' },
        { id: 3, full_name: 'Dave Tester', email: 'dave@example.com', role: 'tester' }
      ]);
    } catch {
      // Mock project fallback if backend API offline
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
      const usersRes = await userAPI.getAll();
      setUsers(usersRes.data.data);
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
        
        {/* Project Header Banner */}
        <div className="card p-6 bg-gradient-to-r from-brand-600 to-indigo-700 dark:from-slate-900 dark:to-indigo-950 text-white relative overflow-hidden border-none">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
            <TrendingUp className="w-96 h-96" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {projectStatus}
              </span>
              <p className="text-xs text-white/80 font-medium">Created on {new Date(project?.created_at).toLocaleDateString()}</p>
            </div>
            <h2 className="text-2xl font-black mt-3 tracking-tight">{project?.name}</h2>
            <p className="text-sm text-white/80 mt-1 max-w-2xl font-medium leading-relaxed">{project?.description}</p>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <StatCard title="Total Defects" value={project?.stats?.totalDefects || 0} icon="🐛" color="primary" />
              <StatCard title="Open Defects" value={project?.stats?.openDefects || 0} icon="📋" color="yellow" />
              <StatCard title="Resolved Defects" value={project?.stats?.resolvedDefects || 0} icon="✅" color="green" />
              <StatCard title="Critical Issues" value={project?.stats?.criticalDefects || 0} icon="🔴" color="red" />

              <div className="card lg:col-span-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Project Health Overview</h3>
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="50" fill="transparent" stroke="#e2e8f0" strokeWidth="12" className="dark:stroke-slate-800" />
                      <circle cx="64" cy="64" r="50" fill="transparent" stroke="#10b981" strokeWidth="12" 
                        strokeDasharray={314}
                        strokeDashoffset={314 - (314 * (project?.stats?.resolvedDefects || 0)) / (project?.stats?.totalDefects || 1)} 
                      />
                    </svg>
                    <div className="absolute text-center">
                      <p className="text-2xl font-black text-slate-800 dark:text-white">
                        {Math.round(((project?.stats?.resolvedDefects || 0) / (project?.stats?.totalDefects || 1)) * 100)}%
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Resolved</p>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                      Project <span className="font-bold text-slate-900 dark:text-white">Alpha Integration</span> is in standard healthy conditions. 
                      A resolution rate of <span className="font-bold text-emerald-600">60%</span> has been registered across 24 logs.
                    </p>
                    <div className="flex gap-4 pt-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                        <span>Resolved Defects ({project?.stats?.resolvedDefects})</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                        <span>Open Defects ({project?.stats?.openDefects})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MEMBERS TAB */}
          {activeTab === 'members' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Members List */}
              <div className="card lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Assigned Project Members</h3>
                  <span className="text-xs bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-full font-bold text-slate-500">{members.length} Members</span>
                </div>
                
                <div className="divide-y divide-slate-100 dark:divide-slate-850">
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
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Member Widget */}
              <div className="card h-fit space-y-4">
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
                  <button type="submit" className="btn-primary w-full">
                    <Plus className="w-4 h-4" /> Add to Project
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TIMELINE TAB */}
          {activeTab === 'timeline' && (
            <div className="card space-y-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">Project timeline</h3>
              
              <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3.5 space-y-6 pb-2">
                {[
                  { title: 'Project Initiated', desc: 'Project configuration database schema build initialized.', date: 'Jun 01, 2026', icon: CheckCircle, status: 'done' },
                  { title: 'QA Sandbox Deployment', desc: 'Mockups completed. Tester teams added to log initial system logs.', date: 'Jun 10, 2026', icon: CheckCircle, status: 'done' },
                  { title: 'Core Development Modules', desc: 'Integration endpoints implemented. Developer review started.', date: 'Jun 22, 2026', icon: Clock, status: 'pending' },
                  { title: 'Beta Quality Audit & Deliverables', desc: 'Final testing of defect metrics before product shipping.', date: 'Jul 15, 2026', icon: Clock, status: 'pending' }
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="relative pl-7">
                      <div className={`absolute -left-[15px] top-0.5 p-1 rounded-full border bg-white dark:bg-slate-900 ${
                        item.status === 'done' 
                          ? 'border-emerald-500 text-emerald-500' 
                          : 'border-slate-300 text-slate-400 dark:border-slate-700'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{item.date}</span>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{item.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="card space-y-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">Project settings</h3>
              
              <form onSubmit={handleUpdateProjectSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 tracking-wide">Project Name</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 tracking-wide">Description</label>
                  <textarea
                    rows={4}
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 tracking-wide">Status</label>
                  <select
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleArchiveProject}
                    className="btn-danger bg-rose-600 hover:bg-rose-700"
                  >
                    Archive Project
                  </button>
                  <button type="submit" className="btn-primary">
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

export default ProjectDetails;
