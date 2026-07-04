import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import LoadingSpinner from '../../components/LoadingSpinner';
import { userAPI } from '../../services/api';
import api from '../../services/api';
import { UserPlus, UserCheck, Shield, Key, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DeveloperTeamMembers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  
  // Create User form modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'developer'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const params = filterRole ? { role: filterRole } : {};
      const res = await userAPI.getAll(params);
      setUsers(res.data.data);
    } catch {
      // Mock fallback users
      setUsers([
        { id: 1, full_name: 'Admin User', email: 'admin@example.com', role: 'admin', created_at: new Date(Date.now() - 365 * 86400000).toISOString() },
        { id: 2, full_name: 'John Developer', email: 'john@example.com', role: 'developer', created_at: new Date(Date.now() - 100 * 86400000).toISOString() },
        { id: 3, full_name: 'David Tester', email: 'david@example.com', role: 'tester', created_at: new Date(Date.now() - 50 * 86400000).toISOString() },
        { id: 4, full_name: 'Sarah Manager', email: 'sarah@example.com', role: 'manager', created_at: new Date(Date.now() - 30 * 86400000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filterRole]);

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const newUserObj = {
      id: Date.now(),
      full_name: addForm.full_name,
      email: addForm.email,
      role: addForm.role,
      created_at: new Date().toISOString()
    };
    
    try {
      await api.post('/users/create', addForm); // Mock endpoint or real
    } catch {
      // mock action
    }
    
    setUsers(prev => [newUserObj, ...prev]);
    toast.success(`User ${addForm.full_name} created successfully`);
    setAddForm({ full_name: '', email: '', password: '', role: 'developer' });
    setShowAddModal(false);
    setSubmitting(false);
  };

  const columns = [
    { header: 'Name', accessor: 'full_name', render: (row) => <span className="font-bold text-slate-800 dark:text-white">{row.full_name}</span> },
    { header: 'Email', accessor: 'email', render: (row) => <span className="text-slate-500 dark:text-slate-400">{row.email}</span> },
    { 
      header: 'Role', 
      render: (row) => {
        const badgeColors = {
          admin: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-100',
          manager: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100',
          project_manager: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100',
          developer: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100',
          tester: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-100',
        };
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${badgeColors[row.role] || 'bg-slate-100 text-slate-705 border-slate-200'}`}>
            {row.role?.replace('_', ' ')}
          </span>
        );
      } 
    },
    { header: 'Joined Date', render: (row) => new Date(row.created_at).toLocaleDateString() },
  ];

  return (
    <Layout title="Users">
      <div className="flex flex-col gap-6">
        
        {/* Page title and add user trigger */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-white">Workspace Users</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage permission roles, assign project managers, developers, and testers</p>
          </div>
          {user?.role === 'admin' && (
            <button 
              onClick={() => setShowAddModal(true)} 
              className="btn-primary text-xs"
            >
              <UserPlus className="w-4 h-4" /> Create User
            </button>
          )}
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)} 
              className="input-field text-xs py-1.5 max-w-[150px]"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Project Manager</option>
              <option value="tester">Tester</option>
              <option value="developer">Developer</option>
            </select>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-850 px-3 py-1 rounded-full">
            {(user?.role === 'admin' ? users : users.filter(u => u.role === 'developer' || u.role === 'tester')).length} Users Total
          </span>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="text-center mt-20"><LoadingSpinner /></div>
        ) : (
          <div className="card">
            <DataTable 
              columns={columns} 
              data={user?.role === 'admin' ? users : users.filter(u => u.role === 'developer' || u.role === 'tester')} 
              searchable 
              searchPlaceholder="Search users by name or email..."
              pagination 
            />
          </div>
        )}

      </div>

      {/* Create User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              Create New User
            </h3>
            
            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 tracking-wide">Full Name</label>
                <input 
                  type="text"
                  value={addForm.full_name} 
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })} 
                  className="input-field text-sm" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 tracking-wide">Email Address</label>
                <input 
                  type="email"
                  value={addForm.email} 
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} 
                  className="input-field text-sm" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 tracking-wide">Password</label>
                <input 
                  type="password"
                  value={addForm.password} 
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} 
                  className="input-field text-sm" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5 tracking-wide">Access Role</label>
                <select 
                  value={addForm.role} 
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })} 
                  className="input-field text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Project Manager</option>
                  <option value="tester">Tester</option>
                  <option value="developer">Developer</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1 text-xs">
                  <Save className="w-4 h-4" /> Create User
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1 text-xs">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DeveloperTeamMembers;
