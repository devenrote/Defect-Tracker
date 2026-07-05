import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { userAPI, projectAPI } from '../../services/api';
import { 
  UserPlus, 
  UserCheck, 
  Shield, 
  Key, 
  Save, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  UserMinus, 
  CheckCircle, 
  XCircle,
  FolderOpen,
  Briefcase,
  X,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Pagination = ({ currentPage, totalCount, limit, onPageChange }) => {
  const totalPages = Math.ceil(totalCount / limit);
  if (totalPages <= 1) return null;

  const startRecord = (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalCount);

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-805 text-xs font-semibold">
      <p className="text-slate-500 dark:text-slate-400">
        Showing <span className="font-bold text-slate-850 dark:text-white">{startRecord}</span> to{' '}
        <span className="font-bold text-slate-850 dark:text-white">{endRecord}</span> of{' '}
        <span className="font-extrabold text-brand-600 dark:text-brand-400">{totalCount}</span> records
      </p>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
        >
          Previous
        </button>

        {pageNumbers.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-7 h-7 rounded-lg border text-center flex items-center justify-center text-xs transition-all cursor-pointer ${
              currentPage === page
                ? 'bg-brand-600 border-brand-600 text-white font-extrabold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const AdminTeamMembers = () => {
  const { user: currentUser } = useAuth();
  
  // States
  const [users, setUsers] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  // Modals / Drawer Control
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewDrawer, setShowViewDrawer] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Project list popup helper
  const [activeProjectsPopup, setActiveProjectsPopup] = useState(null);

  // Forms
  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'developer',
    status: 'Active'
  });
  const [submitting, setSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    id: '',
    full_name: '',
    role: 'developer',
    status: 'Active',
    assignedProjects: [] // list of project IDs
  });

  const fetchProjects = async () => {
    try {
      const projRes = await projectAPI.getAll();
      setProjectsList(projRes.data.data || []);
    } catch (err) {
      console.error('Error fetching projects list:', err);
    }
  };

  const fetchWorkspaceData = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
        search: searchQuery,
        role: filterRole,
        status: filterStatus,
        sortBy
      };
      const res = await userAPI.getAll(params);
      
      const resData = res.data.data || [];
      const resTotal = res.data.pagination?.total || 0;

      // Handle post-delete boundary cases
      if (currentPage > 1 && resData.length === 0 && resTotal > 0) {
        const newMaxPage = Math.ceil(resTotal / limit);
        setCurrentPage(newMaxPage);
        return;
      }

      if (res.data.pagination) {
        setUsers(resData);
        setTotalCount(resTotal);
      } else {
        setUsers(resData);
        setTotalCount(resData.length);
      }
    } catch (err) {
      console.error('Error fetching workspace directory data:', err);
      toast.error('Failed to load users list from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchWorkspaceData();
  }, [currentPage, searchQuery, filterRole, filterStatus, sortBy]);

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await userAPI.create(addForm);
      toast.success(`User account ${addForm.full_name} created`);
      setAddForm({ full_name: '', email: '', password: '', role: 'developer', status: 'Active' });
      setShowAddModal(false);
      await fetchWorkspaceData();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to create workspace user.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Update basic user details
      await userAPI.update(editForm.id, {
        full_name: editForm.full_name,
        role: editForm.role,
        status: editForm.status
      });

      // 2. Diff project assignments
      const originalAssignedIds = selectedUser.assignedProjects?.map(p => Number(p.id)) || [];
      const newAssignedIds = editForm.assignedProjects.map(Number);

      const toAdd = newAssignedIds.filter(id => !originalAssignedIds.includes(id));
      const toRemove = originalAssignedIds.filter(id => !newAssignedIds.includes(id));

      // Execute project updates sequentially
      await Promise.all([
        ...toAdd.map(projectId => projectAPI.addMember(projectId, editForm.id, editForm.role)),
        ...toRemove.map(projectId => projectAPI.removeMember(projectId, editForm.id))
      ]);

      toast.success('User profiles and assignments updated successfully');
      setShowEditDrawer(false);
      await fetchWorkspaceData();
    } catch (err) {
      toast.error('Failed to update user assignments.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserStatus = async (userRecord) => {
    const nextStatus = userRecord.status === 'Disabled' ? 'Active' : 'Disabled';
    try {
      await userAPI.update(userRecord.id, { status: nextStatus });
      toast.success(`User is now ${nextStatus}`);
      await fetchWorkspaceData();
    } catch (err) {
      toast.error('Failed to change user status.');
    }
  };

  // Date Formatting Helper
  const formatLastLogin = (isoString) => {
    if (!isoString) return 'Never Logged In';
    const loginDate = new Date(isoString);
    if (isNaN(loginDate.getTime())) return 'Not Available';
    
    const now = new Date();
    const diffMs = now - loginDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const timeString = loginDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const isToday = now.toDateString() === loginDate.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = yesterday.toDateString() === loginDate.toDateString();

    if (isToday) {
      return `Today, ${timeString}`;
    }
    if (isYesterday) {
      return `Yesterday, ${timeString}`;
    }
    if (diffDays > 1 && diffDays < 30) {
      return `${diffDays} days ago`;
    }
    
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return loginDate.toLocaleDateString('en-GB', options);
  };

  // Open Drawer Helpers
  const openViewDrawer = (usr) => {
    setSelectedUser(usr);
    setShowViewDrawer(true);
  };

  const openEditDrawer = (usr) => {
    setSelectedUser(usr);
    setEditForm({
      id: usr.id,
      full_name: usr.full_name,
      role: usr.role,
      status: usr.status || 'Active',
      assignedProjects: usr.assignedProjects?.map(p => p.id) || []
    });
    setShowEditDrawer(true);
  };

  // Multi-select project handlers
  const handleProjectToggle = (projectId) => {
    setEditForm(prev => {
      const activeIds = prev.assignedProjects || [];
      const updated = activeIds.includes(projectId)
        ? activeIds.filter(id => id !== projectId)
        : [...activeIds, projectId];
      return { ...prev, assignedProjects: updated };
    });
  };

  const filteredUsers = users;

  return (
    <Layout title="User Management">
      <div className="flex flex-col gap-6 animate-fadeIn">
        
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider">Enterprise Workspace Directory</h1>
            <p className="text-xs text-slate-500 mt-0.5 font-semibold">Manage system keys, role hierarchy, assignments, and status checks</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn-primary text-xs font-bold py-2 px-4 flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Create User Profile
          </button>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xs border border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="input-field text-xs pl-8 py-1.5 w-full sm:w-48 bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 font-semibold"
              />
            </div>

            {/* Filter Role */}
            <select 
              value={filterRole} 
              onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }} 
              className="input-field text-xs py-1.5 w-32 bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 font-semibold"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="developer">Developer</option>
              <option value="tester">Tester</option>
            </select>

            {/* Filter Status */}
            <select 
              value={filterStatus} 
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} 
              className="input-field text-xs py-1.5 w-32 bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 font-semibold"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Disabled">Disabled</option>
            </select>

            {/* Sort Dropdown */}
            <select 
              value={sortBy} 
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }} 
              className="input-field text-xs py-1.5 w-36 bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800 font-semibold"
            >
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="joined_desc">Joined Date</option>
              <option value="login_desc">Last Login</option>
            </select>
          </div>

          <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-850 px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
            {totalCount} Directory Entries
          </span>
        </div>

        {/* Directory Grid/Table */}
        {loading ? (
          <div className="text-center mt-20"><LoadingSpinner /></div>
        ) : (
          <>
            <div className="card overflow-x-auto shadow-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-black text-[9px] uppercase tracking-wider bg-slate-50/50 dark:bg-slate-855/10">
                    <th className="p-3.5">User Profile</th>
                    <th className="p-3.5">System Access Role</th>
                    <th className="p-3.5">State Status</th>
                    <th className="p-3.5">Assigned Projects</th>
                    <th className="p-3.5">Last Active Connection</th>
                    <th className="p-3.5">Creation Joined</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-855">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-xs font-bold text-slate-400">
                        No matching user profile directory logs found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(usr => {
                      const statusVal = usr.status || 'Active';
                      let statusBadgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50';
                      let statusDot = '🟢';
                      if (statusVal === 'Disabled') {
                        statusBadgeColor = 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50';
                        statusDot = '🔴';
                      } else if (statusVal === 'Pending') {
                        statusBadgeColor = 'bg-amber-50 text-amber-750 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50';
                        statusDot = '🟡';
                      }

                      const roleBadgeColors = {
                        admin: 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455 border-rose-100 dark:border-rose-900/50',
                        manager: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50',
                        project_manager: 'bg-indigo-50 text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50',
                        developer: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
                        tester: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
                      };

                      const projCount = usr.assignedProjects?.length || 0;

                      return (
                        <tr key={usr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                          
                          {/* Profile Info */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center font-bold text-xs uppercase text-slate-600 dark:text-slate-300">
                                {usr.full_name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-850 dark:text-white leading-none">{usr.full_name}</p>
                                <p className="text-[10px] text-slate-400 mt-1 font-semibold">{usr.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* System Access Role */}
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${roleBadgeColors[usr.role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {usr.role?.replace('_', ' ')}
                            </span>
                          </td>

                          {/* State Status */}
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1.5 w-fit ${statusBadgeColor}`}>
                              <span>{statusDot}</span>
                              <span>{statusVal}</span>
                            </span>
                          </td>

                          {/* Assigned Projects */}
                          <td className="p-3.5 relative">
                            {usr.role === 'admin' || usr.role === 'super_admin' ? (
                              <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-200/50 px-2 py-0.5 rounded uppercase">
                                Full Workspace Access
                              </span>
                            ) : projCount === 0 ? (
                              <span className="text-[10px] text-slate-400 italic">No Project Assigned</span>
                            ) : (
                              <div>
                                <button 
                                  onClick={() => setActiveProjectsPopup(activeProjectsPopup === usr.id ? null : usr.id)}
                                  className="px-2 py-0.5 rounded bg-brand-50 text-brand-655 dark:bg-brand-950/20 dark:text-brand-400 border border-brand-200/50 hover:bg-brand-100/50 text-[10px] font-bold cursor-pointer transition-colors"
                                >
                                  {projCount} {projCount === 1 ? 'Project' : 'Projects'}
                                </button>
                                
                                {/* Popover */}
                                {activeProjectsPopup === usr.id && (
                                  <div className="absolute left-3.5 top-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 w-48 shadow-lg z-20 space-y-1.5 animate-fadeIn">
                                    <div className="flex justify-between items-center pb-1 border-b border-slate-100 dark:border-slate-850">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Assigned Projects</span>
                                      <button onClick={() => setActiveProjectsPopup(null)} className="text-slate-400 hover:text-slate-650"><X className="w-3 h-3" /></button>
                                    </div>
                                    <ul className="space-y-1 max-h-32 overflow-y-auto text-[10px] font-semibold text-slate-707 dark:text-slate-300">
                                      {usr.assignedProjects.map(p => (
                                        <li key={p.id} className="truncate">• {p.project_name}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Last active login */}
                          <td className="p-3.5 text-slate-555 dark:text-slate-400">
                            {formatLastLogin(usr.last_login)}
                          </td>

                          {/* Creation joined */}
                          <td className="p-3.5 text-slate-555 dark:text-slate-400">
                            {new Date(usr.created_at).toLocaleDateString()}
                          </td>

                          {/* Action column */}
                          <td className="p-3.5 text-right space-x-1.5 shrink-0">
                            <button 
                              onClick={() => openViewDrawer(usr)}
                              className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                              title="View Info"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            <button 
                              onClick={() => openEditDrawer(usr)}
                              className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                              title="Edit Profile"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button 
                              onClick={() => toggleUserStatus(usr)}
                              disabled={usr.id === currentUser?.id} // Cannot disable yourself
                              className={`p-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-30 ${
                                statusVal === 'Disabled' 
                                  ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20' 
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                              }`}
                              title={statusVal === 'Disabled' ? 'Enable Profile' : 'Disable Profile'}
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalCount={totalCount}
              limit={limit}
              onPageChange={setCurrentPage}
            />
          </>
        )}

      </div>

      {/* CREATE USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-5 h-5 text-brand-600" /> Create Workspace User
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleAddUserSubmit} className="space-y-4 text-xs font-semibold text-slate-707 dark:text-slate-350">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Full Name</label>
                <input 
                  type="text"
                  value={addForm.full_name} 
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })} 
                  className="input-field text-sm" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Email Address</label>
                <input 
                  type="email"
                  value={addForm.email} 
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} 
                  className="input-field text-sm" 
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Password</label>
                <input 
                  type="password"
                  value={addForm.password} 
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} 
                  className="input-field text-sm" 
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Access Role</label>
                <select 
                  value={addForm.role} 
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })} 
                  className="input-field bg-white dark:bg-slate-900 border-slate-205"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="tester">Tester</option>
                  <option value="developer">Developer</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 text-xs font-bold">
                <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2 cursor-pointer shadow-sm">
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1 py-2 cursor-pointer">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW USER DETAILS DRAWER */}
      {showViewDrawer && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full p-6 shadow-2xl border-l border-slate-100 dark:border-slate-805 space-y-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">User Directory Profile</h3>
                <button onClick={() => setShowViewDrawer(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              {/* Profile Card Header */}
              <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-855/15 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-lg font-black rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 uppercase">
                  {selectedUser.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-none">{selectedUser.full_name}</h4>
                  <p className="text-xs text-slate-400 mt-1.5 font-medium">{selectedUser.email}</p>
                  <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 mt-1 uppercase">Role: {selectedUser.role}</p>
                </div>
              </div>

              {/* Data parameters list */}
              <div className="space-y-4 text-xs font-semibold text-slate-707 dark:text-slate-350">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Detailed Properties</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Joined Date</span>
                    <p className="text-slate-900 dark:text-white font-extrabold">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Last Logged Connection</span>
                    <p className="text-slate-900 dark:text-white font-extrabold">{formatLastLogin(selectedUser.last_login)}</p>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Status Check</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-250/20">
                      {selectedUser.status || 'Active'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Projects Count</span>
                    <p className="text-slate-900 dark:text-white font-extrabold">{selectedUser.assignedProjects?.length || 0} Projects</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase mb-2">Assigned Project Names</span>
                  {selectedUser.assignedProjects?.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">No Project Assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.assignedProjects?.map(p => (
                        <span key={p.id} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-[10px] text-slate-600 dark:text-slate-300">
                          {p.project_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowViewDrawer(false)}
              className="btn-secondary w-full py-2 cursor-pointer font-bold text-xs"
            >
              Close Profile Drawer
            </button>
          </div>
        </div>
      )}

      {/* EDIT USER DETAILS DRAWER */}
      {showEditDrawer && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full p-6 shadow-2xl border-l border-slate-100 dark:border-slate-805 space-y-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-brand-600" /> Edit User Profile
                </h3>
                <button onClick={() => setShowEditDrawer(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleEditUserSubmit} id="edit-user-form" className="space-y-4 text-xs font-semibold text-slate-707 dark:text-slate-350">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Full Name</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="input-field text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Access Role</label>
                  <select 
                    value={editForm.role} 
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} 
                    className="input-field bg-white dark:bg-slate-900 border-slate-205"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="tester">Tester</option>
                    <option value="developer">Developer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Profile Status</label>
                  <select 
                    value={editForm.status} 
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} 
                    className="input-field bg-white dark:bg-slate-900 border-slate-205"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">Project Membership Assignments</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-855/10">
                    {projectsList.length === 0 ? (
                      <p className="text-[10px] text-slate-405 italic">No active projects available in workspace.</p>
                    ) : (
                      projectsList.map(proj => {
                        const isChecked = editForm.assignedProjects.includes(proj.id);
                        return (
                          <label key={proj.id} className="flex items-center gap-2.5 py-1 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 rounded px-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleProjectToggle(proj.id)}
                              className="w-4 h-4 text-brand-600 border-slate-200 accent-brand-600 rounded"
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-800 dark:text-white truncate">{proj.project_name}</p>
                              <p className="text-[9px] text-slate-400 font-semibold uppercase">{proj.project_key}</p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </form>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-150 dark:border-slate-800 text-xs font-bold">
              <button 
                type="submit" 
                form="edit-user-form"
                disabled={submitting} 
                className="btn-primary flex-1 py-2 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" /> {submitting ? 'Saving...' : 'Save Settings'}
              </button>
              <button 
                type="button" 
                onClick={() => setShowEditDrawer(false)} 
                className="btn-secondary flex-1 py-2 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default AdminTeamMembers;
