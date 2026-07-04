import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { userAPI, projectAPI, defectAPI } from '../../services/api';
import { 
  Users as UsersIcon, 
  Search, 
  Filter, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  Activity, 
  Eye, 
  Edit as EditIcon, 
  UserPlus, 
  Trash2, 
  Plus, 
  Calendar, 
  X,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ManagerTeamMembers = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters, search, sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals state
  const [selectedUserForView, setSelectedUserForView] = useState(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [selectedUserForAssign, setSelectedUserForAssign] = useState(null);
  const [userToRemoveFromProject, setUserToRemoveFromProject] = useState(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConfirmRemoveModal, setShowConfirmRemoveModal] = useState(false);

  // Modal forms state
  const [assignForm, setAssignForm] = useState({ projectId: '' });
  const [editForm, setEditForm] = useState({ role: '', status: '' });

  // Load user assignments from localStorage
  const [assignments, setAssignments] = useState({});

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [usersRes, projectsRes, defectsRes] = await Promise.all([
        userAPI.getAll(),
        projectAPI.getAll(),
        defectAPI.getAll()
      ]);

      const loadedUsers = usersRes.data.data || [];
      const loadedProjects = projectsRes.data.data || [];
      const loadedDefects = defectsRes.data.data || [];

      setUsers(loadedUsers);
      setProjects(loadedProjects);
      setDefects(loadedDefects);

      // Initialize or load project membership assignments map
      const stored = localStorage.getItem('user_project_assignments');
      if (stored) {
        setAssignments(JSON.parse(stored));
      } else {
        const initial = {};
        loadedUsers.forEach(u => {
          if (u.role === 'manager' || u.role === 'project_manager') {
            initial[u.id] = loadedProjects.map(p => p.id);
          } else if (u.role === 'developer') {
            initial[u.id] = loadedProjects.slice(0, 1).map(p => p.id);
          } else if (u.role === 'tester') {
            initial[u.id] = loadedProjects.slice(0, 2).map(p => p.id);
          } else {
            initial[u.id] = [];
          }
        });
        localStorage.setItem('user_project_assignments', JSON.stringify(initial));
        setAssignments(initial);
      }
    } catch {
      // Mock Fallbacks
      const mockUsers = [
        { id: 1, full_name: 'Admin User', email: 'admin@example.com', role: 'admin', created_at: new Date(Date.now() - 365 * 86400000).toISOString() },
        { id: 2, full_name: 'John Developer', email: 'john@example.com', role: 'developer', created_at: new Date(Date.now() - 100 * 86400000).toISOString() },
        { id: 3, full_name: 'David Tester', email: 'david@example.com', role: 'tester', created_at: new Date(Date.now() - 50 * 86400000).toISOString() },
        { id: 4, full_name: 'Sarah Manager', email: 'sarah@example.com', role: 'manager', created_at: new Date(Date.now() - 30 * 86400000).toISOString() }
      ];
      const mockProjects = [
        { id: 1, project_name: 'Project Alpha Integration', description: 'Next-gen backend microservice integration.', status: 'active' },
        { id: 2, project_name: 'Defect Tracker Pro Client', description: 'React SaaS client rewrite.', status: 'active' }
      ];
      setUsers(mockUsers);
      setProjects(mockProjects);
      setDefects([
        { id: 101, title: 'Database timeout', assignee_id: 2, reporter_id: 3, status: 'In Progress', severity: 'Critical' },
        { id: 102, title: 'Auth tokens expire', assignee_id: 2, reporter_id: 3, status: 'Open', severity: 'High' }
      ]);

      const initial = {
        1: [1, 2],
        2: [1],
        3: [1, 2],
        4: [1, 2]
      };
      localStorage.setItem('user_project_assignments', JSON.stringify(initial));
      setAssignments(initial);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Helpers to retrieve status
  const getUserStatus = (userId) => {
    if (userId === 1 || userId === 4 || userId === 2) return 'Active';
    if (userId === 3) return 'Offline';
    return userId % 2 === 0 ? 'Active' : 'Inactive';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
      case 'Offline': return 'text-slate-400 bg-slate-50 dark:bg-slate-800/30';
      case 'Inactive': return 'text-rose-500 bg-rose-50 dark:bg-rose-955/20';
      default: return 'text-slate-400 bg-slate-50 dark:bg-slate-800/30';
    }
  };

  // Helper to count and list user assigned projects
  const getUserAssignedProjects = (userId) => {
    const userProjIds = assignments[userId] || [];
    return projects.filter(p => userProjIds.includes(p.id) || userProjIds.includes(String(p.id)));
  };

  // Calculate workloads
  const getDeveloperWorkload = (userId) => {
    const devDefects = defects.filter(d => Number(d.assignee_id) === Number(userId));
    const open = devDefects.filter(d => d.status !== 'Resolved' && d.status !== 'Closed').length;
    const resolved = devDefects.filter(d => d.status === 'Resolved' || d.status === 'Closed').length;
    const readyForQA = devDefects.filter(d => d.status === 'Ready For QA' || d.status === 'Testing').length;
    return { assigned: devDefects.length, open, resolved, readyForQA };
  };

  const getTesterWorkload = (userId) => {
    const testDefects = defects.filter(d => Number(d.reporter_id) === Number(userId));
    const reported = testDefects.length;
    const queue = testDefects.filter(d => d.status === 'Ready For QA' || d.status === 'Testing').length;
    const closed = testDefects.filter(d => d.status === 'Closed').length;
    return { reported, queue, closed };
  };

  // Assign project
  const handleAssignProject = (e) => {
    e.preventDefault();
    if (!assignForm.projectId || !selectedUserForAssign) return;

    const userId = selectedUserForAssign.id;
    const projId = Number(assignForm.projectId);

    const userAssigned = assignments[userId] || [];
    if (userAssigned.includes(projId)) {
      toast.error('User is already assigned to this project');
      return;
    }

    const updated = {
      ...assignments,
      [userId]: [...userAssigned, projId]
    };

    localStorage.setItem('user_project_assignments', JSON.stringify(updated));
    setAssignments(updated);
    toast.success(`Assigned ${selectedUserForAssign.full_name} to project successfully`);
    setShowAssignModal(false);
    setAssignForm({ projectId: '' });
  };

  // Remove member from project
  const handleConfirmRemove = () => {
    if (!userToRemoveFromProject) return;

    const { userId, projectId } = userToRemoveFromProject;
    const userAssigned = assignments[userId] || [];
    const updatedIds = userAssigned.filter(pid => Number(pid) !== Number(projectId));

    const updated = {
      ...assignments,
      [userId]: updatedIds
    };

    localStorage.setItem('user_project_assignments', JSON.stringify(updated));
    setAssignments(updated);
    toast.success(`Removed member from project successfully`);
    setShowConfirmRemoveModal(false);
    setUserToRemoveFromProject(null);
  };

  // Edit user role
  const handleEditUser = (e) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    const userId = selectedUserForEdit.id;
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          role: editForm.role
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    toast.success(`User role updated to ${editForm.role}`);
    setShowEditModal(false);
  };

  // Filter & Search & Sort logic
  const filteredUsers = users.filter(u => {
    // Only developers & testers are managed by the manager in team list
    const isTeamMember = u.role === 'developer' || u.role === 'tester';
    if (!isTeamMember) return false;

    // Search query
    const matchesSearch = 
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(u.id).includes(searchQuery);

    // Role filter
    const matchesRole = roleFilter ? u.role === roleFilter : true;

    // Project filter
    const userProjIds = assignments[u.id] || [];
    const matchesProject = projectFilter 
      ? userProjIds.includes(Number(projectFilter)) || userProjIds.includes(String(projectFilter))
      : true;

    // Status filter
    const status = getUserStatus(u.id);
    const matchesStatus = statusFilter ? status.toLowerCase() === statusFilter.toLowerCase() : true;

    return matchesSearch && matchesRole && matchesProject && matchesStatus;
  });

  // Sort
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aVal = '';
    let bVal = '';

    if (sortBy === 'name') {
      aVal = a.full_name.toLowerCase();
      bVal = b.full_name.toLowerCase();
    } else if (sortBy === 'role') {
      aVal = a.role.toLowerCase();
      bVal = b.role.toLowerCase();
    } else if (sortBy === 'date') {
      aVal = new Date(a.created_at).getTime();
      bVal = new Date(b.created_at).getTime();
    } else if (sortBy === 'defects') {
      aVal = a.role === 'developer' ? getDeveloperWorkload(a.id).assigned : getTesterWorkload(a.id).reported;
      bVal = b.role === 'developer' ? getDeveloperWorkload(b.id).assigned : getTesterWorkload(b.id).reported;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <Layout title="Team Members">
      <div className="flex flex-col gap-6">
        
        {/* Welcome Section */}
        <div>
          <h1 className="text-base font-bold text-slate-808 dark:text-white">Manager Team Workspace</h1>
          <p className="text-xs text-slate-500 mt-0.5">Monitor developer workloads, assign projects, edit access roles, and track active resources</p>
        </div>

        {/* summary statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card p-4 text-center bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Users</span>
            <p className="text-xl font-black mt-2 text-slate-800 dark:text-white">
              {users.filter(u => u.role === 'developer' || u.role === 'tester').length}
            </p>
          </div>
          <div className="card p-4 text-center bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Developers</span>
            <p className="text-xl font-black mt-2 text-slate-800 dark:text-white">
              {users.filter(u => u.role === 'developer').length}
            </p>
          </div>
          <div className="card p-4 text-center bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Testers</span>
            <p className="text-xl font-black mt-2 text-slate-800 dark:text-white">
              {users.filter(u => u.role === 'tester').length}
            </p>
          </div>
          <div className="card p-4 text-center bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Managers</span>
            <p className="text-xl font-black mt-2 text-slate-800 dark:text-white">
              {users.filter(u => u.role === 'manager' || u.role === 'project_manager').length}
            </p>
          </div>
          <div className="card p-4 text-center bg-white dark:bg-slate-900 shadow-xs col-span-2 md:col-span-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Users</span>
            <p className="text-xl font-black mt-2 text-emerald-600">
              {users.filter(u => (u.role === 'developer' || u.role === 'tester') && getUserStatus(u.id) === 'Active').length}
            </p>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Sorting */}
        <div className="card bg-white dark:bg-slate-900 p-4 space-y-4 shadow-xs">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Search Input */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, email or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field text-xs pl-9 pr-4 py-2"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input-field text-xs py-1.5 w-32"
              >
                <option value="">All Roles</option>
                <option value="developer">Developer</option>
                <option value="tester">Tester</option>
              </select>

              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="input-field text-xs py-1.5 w-40"
              >
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field text-xs py-1.5 w-32"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="offline">Offline</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Sorting Select */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide shrink-0">Sort By</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field text-xs py-1.5 w-32"
              >
                <option value="name">Name</option>
                <option value="role">Role</option>
                <option value="date">Joined Date</option>
                <option value="defects">Defects Count</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="btn-secondary py-1.5 text-xs font-bold w-12"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

          </div>
        </div>

        {/* Team Table View */}
        {loading ? (
          <div className="card py-16 text-center shadow-xs"><LoadingSpinner /></div>
        ) : (
          <div className="card overflow-x-auto shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Assigned Projects</th>
                  <th className="py-3 px-4">Assigned Defects</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {sortedUsers.map((member) => {
                  const assignedProj = getUserAssignedProjects(member.id);
                  const isDev = member.role === 'developer';
                  const devWork = getDeveloperWorkload(member.id);
                  const testWork = getTesterWorkload(member.id);
                  const status = getUserStatus(member.id);

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white leading-normal">{member.full_name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{member.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isDev 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-amber-55 text-amber-655 dark:bg-amber-955/40 dark:text-amber-400'
                        }`}>
                          {member.role}
                        </span>
                      </td>

                      {/* Assigned Projects list or count */}
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-350">
                        {assignedProj.length > 0 ? (
                          <span 
                            onClick={() => {
                              setSelectedUserForView(member);
                              setShowViewModal(true);
                            }}
                            className="underline cursor-pointer hover:text-brand-600"
                          >
                            {assignedProj.length} Project{assignedProj.length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">None</span>
                        )}
                      </td>

                      {/* Workload Stats */}
                      <td className="py-3 px-4 font-semibold">
                        {isDev ? (
                          <div className="flex gap-2">
                            <span className="text-slate-500" title="Assigned">Asg: {devWork.assigned}</span>
                            <span className="text-amber-605" title="Open">Opn: {devWork.open}</span>
                            <span className="text-emerald-600" title="Resolved">Res: {devWork.resolved}</span>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <span className="text-slate-500" title="Reported">Rpt: {testWork.reported}</span>
                            <span className="text-emerald-650" title="Verified/Closed">Clsd: {testWork.closed}</span>
                          </div>
                        )}
                      </td>

                      {/* User Status */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedUserForView(member);
                              setShowViewModal(true);
                            }}
                            title="View Profile Details"
                            className="p-1 text-slate-400 hover:text-brand-600 rounded hover:bg-slate-105 dark:hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserForEdit(member);
                              setEditForm({ role: member.role, status });
                              setShowEditModal(true);
                            }}
                            title="Edit Role"
                            className="p-1 text-slate-400 hover:text-brand-600 rounded hover:bg-slate-105 dark:hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserForAssign(member);
                              setShowAssignModal(true);
                            }}
                            title="Assign to Project"
                            className="p-1 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}

                {sortedUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      No matching team members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW USER DETAILS MODAL */}
        {showViewModal && selectedUserForView && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-xl relative">
              <button 
                onClick={() => setShowViewModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 rounded-full flex items-center justify-center font-bold text-lg uppercase shrink-0">
                  {selectedUserForView.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedUserForView.full_name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block mt-1 ${
                    selectedUserForView.role === 'developer' 
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-amber-55 text-amber-655 dark:bg-amber-955/40 dark:text-amber-400'
                  }`}>
                    {selectedUserForView.role}
                  </span>
                </div>
              </div>

              <div className="py-4 space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
                
                {/* Basic info */}
                <div>
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Basic Info</h4>
                  <div className="space-y-1.5">
                    <p><span className="text-slate-400">Email:</span> {selectedUserForView.email}</p>
                    <p><span className="text-slate-400">Member Status:</span> {getUserStatus(selectedUserForView.id)}</p>
                    <p><span className="text-slate-400">Joined Workspace:</span> {new Date(selectedUserForView.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Performance Summary */}
                <div>
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Workspace Performance</h4>
                  {selectedUserForView.role === 'developer' ? (
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Developer has resolved <span className="font-bold text-emerald-600">{getDeveloperWorkload(selectedUserForView.id).resolved}</span> of <span className="font-bold text-slate-800 dark:text-white">{getDeveloperWorkload(selectedUserForView.id).assigned}</span> defects successfully.
                    </p>
                  ) : (
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Tester has reported <span className="font-bold text-brand-600">{getTesterWorkload(selectedUserForView.id).reported}</span> defects, with <span className="font-bold text-slate-800 dark:text-white">{getTesterWorkload(selectedUserForView.id).closed}</span> closed verified logs.
                    </p>
                  )}
                </div>

                {/* Assigned projects with remove button option */}
                <div>
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Assigned Projects</h4>
                  <div className="space-y-2">
                    {getUserAssignedProjects(selectedUserForView.id).length === 0 ? (
                      <p className="text-slate-400 italic">No project assignments</p>
                    ) : (
                      getUserAssignedProjects(selectedUserForView.id).map(proj => (
                        <div key={proj.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-105 dark:border-slate-800/80">
                          <span className="font-bold text-slate-800 dark:text-white">{proj.project_name || proj.name}</span>
                          <button
                            onClick={() => {
                              setUserToRemoveFromProject({
                                userId: selectedUserForView.id,
                                projectId: proj.id,
                                projectName: proj.project_name || proj.name,
                                userName: selectedUserForView.full_name
                              });
                              setShowConfirmRemoveModal(true);
                            }}
                            className="text-rose-600 hover:text-rose-700 text-[10px] font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* EDIT USER ROLE MODAL */}
        {showEditModal && selectedUserForEdit && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <EditIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Edit User Project Role: {selectedUserForEdit.full_name}
              </h3>
              
              <form onSubmit={handleEditUser} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 tracking-wide">Project Role</label>
                  <select 
                    value={editForm.role} 
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} 
                    className="input-field text-sm"
                  >
                    <option value="developer">Developer</option>
                    <option value="tester">Tester</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary flex-1 text-xs">Save Changes</button>
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary flex-1 text-xs">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ASSIGN USER TO PROJECT MODAL */}
        {showAssignModal && selectedUserForAssign && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                Assign {selectedUserForAssign.full_name} to Project
              </h3>
              
              <form onSubmit={handleAssignProject} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 tracking-wide">Select Project</label>
                  <select 
                    value={assignForm.projectId} 
                    onChange={(e) => setAssignForm({ projectId: e.target.value })} 
                    className="input-field text-sm"
                    required
                  >
                    <option value="">-- Choose Project --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary flex-1 text-xs">Assign Project</button>
                  <button type="button" onClick={() => setShowAssignModal(false)} className="btn-secondary flex-1 text-xs">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REMOVE MEMBER CONFIRMATION MODAL */}
        {showConfirmRemoveModal && userToRemoveFromProject && (
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Remove Member Confirmation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                Are you sure you want to remove <strong className="text-slate-800 dark:text-white font-extrabold">{userToRemoveFromProject.userName}</strong> from project <strong className="text-slate-850 dark:text-white font-extrabold">{userToRemoveFromProject.projectName}</strong>?
              </p>
              
              <div className="flex gap-3 pt-6">
                <button 
                  onClick={handleConfirmRemove}
                  className="btn-danger bg-rose-650 hover:bg-rose-700 flex-1 text-xs font-bold"
                >
                  Yes, Remove
                </button>
                <button 
                  onClick={() => {
                    setShowConfirmRemoveModal(false);
                    setUserToRemoveFromProject(null);
                  }} 
                  className="btn-secondary flex-1 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default ManagerTeamMembers;
