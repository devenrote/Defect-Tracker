import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { projectAPI, userAPI } from '../../services/api';
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
  Search,
  Filter,
  FileText,
  Shield,
  ShieldAlert,
  ArrowRightLeft,
  Archive,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const AdminProjectDetails = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  // Project core states
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Members Management States
  const [members, setMembers] = useState([]);
  const [searchMember, setSearchMember] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [allUsersList, setAllUsersList] = useState([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [selectedRoleForNewMember, setSelectedRoleForNewMember] = useState('developer');

  // Timeline State
  const [activities, setActivities] = useState([]);

  // Settings Forms States
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectStatus, setProjectStatus] = useState('active');
  const [projectPriority, setProjectPriority] = useState('Medium');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [projectManagerId, setProjectManagerId] = useState('');
  const [originalManagerId, setOriginalManagerId] = useState('');

  // Permissions Settings
  const [permissions, setPermissions] = useState({
    create_defects: ['admin', 'manager', 'developer', 'tester'],
    assign_defects: ['admin', 'manager'],
    close_defects: ['admin', 'manager', 'tester'],
    reopen_defects: ['admin', 'manager', 'tester'],
    archive_project: ['admin']
  });

  // Modals & Danger Zone States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState('');

  // Relative Time Converter Helper
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
    try {
      const [projRes, statsRes, usersRes, membersRes, actRes] = await Promise.all([
        projectAPI.getById(id),
        projectAPI.getStatistics(id),
        userAPI.getAll(),
        projectAPI.getMembers(id),
        projectAPI.getActivities(id)
      ]);

      const proj = projRes.data.data;
      const stats = statsRes.data.data.statistics || { total_defects: 0, open_defects: 0, resolved_defects: 0, critical_defects: 0, overdue_defects: 0 };
      const projMembers = membersRes.data.data || [];

      const combinedProjectObj = {
        ...proj,
        name: proj.project_name || proj.name || '',
        priority: proj.priority || 'Medium',
        deadline: proj.deadline || '',
        permissions: proj.permissions || permissions,
        stats: {
          totalDefects: Number(stats.total_defects || 0),
          openDefects: Number(stats.open_defects || 0),
          resolvedDefects: Number(stats.resolved_defects || 0),
          criticalDefects: Number(stats.critical_defects || 0),
          overdueDefects: Number(stats.overdue_defects || 0)
        }
      };

      setProject(combinedProjectObj);
      setProjectName(combinedProjectObj.name);
      setProjectDesc(combinedProjectObj.description || '');
      setProjectStatus(combinedProjectObj.status || 'active');
      setProjectPriority(combinedProjectObj.priority);
      setProjectDeadline(combinedProjectObj.deadline ? combinedProjectObj.deadline.split('T')[0] : '');
      setPermissions(combinedProjectObj.permissions);

      setMembers(projMembers);
      setActivities(actRes.data.data || []);
      setAllUsersList(usersRes.data.data || []);

      // Find current project manager
      const currentMgr = projMembers.find(m => m.role === 'manager');
      if (currentMgr) {
        setProjectManagerId(currentMgr.id);
        setOriginalManagerId(currentMgr.id);
      } else {
        setProjectManagerId('');
        setOriginalManagerId('');
      }

    } catch (err) {
      console.error('Error fetching project data:', err);
      toast.error('Failed to load project information from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
    // Live update interval every 15 seconds to ensure statistics are fully fresh
    const interval = setInterval(fetchProjectData, 15000);
    return () => clearInterval(interval);
  }, [id]);

  // Project Progress % calculation
  const totalDefects = project?.stats?.totalDefects || 0;
  const resolvedDefects = project?.stats?.resolvedDefects || 0;
  const progressPercentage = totalDefects > 0 ? Math.round((resolvedDefects / totalDefects) * 100) : 0;

  // Project Health check calculation
  const openDefects = project?.stats?.openDefects || 0;
  const criticalDefects = project?.stats?.criticalDefects || 0;
  const overdueDefects = project?.stats?.overdueDefects || 0;

  let projectHealth = 'Healthy';
  let healthColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50';
  if (criticalDefects > 3 || overdueDefects > 2 || openDefects > 15) {
    projectHealth = 'Critical';
    healthColor = 'text-rose-600 bg-rose-50 dark:bg-rose-955/25 dark:text-rose-400 border border-rose-200/50';
  } else if (criticalDefects > 0 || overdueDefects > 0 || openDefects > 5) {
    projectHealth = 'At Risk';
    healthColor = 'text-amber-600 bg-amber-50 dark:bg-amber-955/25 dark:text-amber-400 border border-amber-200/50';
  }

  // Project Manager name lookup
  const projectManagerName = members.find(m => m.role === 'manager')?.full_name || 'Not Assigned';

  // Last activity timestamp lookup
  const lastUpdatedTime = activities.length > 0 
    ? new Date(activities[0].created_at).toLocaleString() 
    : project?.created_at 
      ? new Date(project.created_at).toLocaleString() 
      : 'N/A';

  // Add Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserToAdd) return;
    try {
      await projectAPI.addMember(id, selectedUserToAdd, selectedRoleForNewMember);
      toast.success('Member added to project successfully');
      setSelectedUserToAdd('');
      await fetchProjectData();
    } catch (err) {
      toast.error('Failed to add project member.');
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member from the project?')) return;
    try {
      await projectAPI.removeMember(id, memberId);
      toast.success('Member removed from project');
      await fetchProjectData();
    } catch (err) {
      toast.error('Failed to remove member.');
    }
  };

  // Change Member Role
  const handleUpdateMemberRole = async (memberId, newRole) => {
    try {
      if (newRole === 'manager') {
        await projectAPI.changeManager(id, memberId);
        toast.success('Project Manager updated successfully');
      } else {
        await projectAPI.addMember(id, memberId, newRole);
        toast.success('Member role updated successfully');
      }
      await fetchProjectData();
    } catch (err) {
      toast.error('Failed to update member role.');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      // 1. Update Project General Settings
      await projectAPI.update(id, {
        project_name: projectName,
        description: projectDesc,
        status: projectStatus,
        priority: projectPriority,
        deadline: projectDeadline || null,
        permissions: permissions
      });

      // 2. Update Manager if changed
      if (projectManagerId && projectManagerId !== originalManagerId) {
        await projectAPI.changeManager(id, projectManagerId);
      }

      toast.success('Settings updated successfully');
      await fetchProjectData();
    } catch (err) {
      toast.error('Failed to update project settings.');
    }
  };

  // Archive Project
  const handleArchiveProject = async () => {
    if (!window.confirm('Are you sure you want to archive this project?')) return;
    try {
      await projectAPI.update(id, { status: 'archived' });
      toast.success('Project archived successfully');
      await fetchProjectData();
    } catch (err) {
      toast.error('Failed to archive project.');
    }
  };

  // Delete Project
  const handleDeleteProject = async () => {
    if (deleteConfirmationText !== project?.name) {
      toast.error('Confirmation project name does not match.');
      return;
    }
    try {
      await projectAPI.delete(id);
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (err) {
      toast.error('Failed to delete project.');
    }
  };

  // Transfer Ownership
  const handleTransferOwnership = async () => {
    if (!newOwnerId) return;
    try {
      await projectAPI.transferOwnership(id, newOwnerId);
      toast.success('Project ownership transferred successfully');
      setShowTransferModal(false);
      await fetchProjectData();
    } catch (err) {
      toast.error('Failed to transfer ownership.');
    }
  };

  // Exports
  const handleExportCSV = () => {
    let csv = 'sep=,\n';
    csv += `PROJECT REPORT: ${project?.name}\n\n`;
    csv += `Project ID,PRJ-${project?.id}\n`;
    csv += `Description,"${project?.description?.replace(/"/g, '""') || 'N/A'}"\n`;
    csv += `Status,${projectStatus}\n`;
    csv += `Priority,${projectPriority}\n`;
    csv += `Deadline,${projectDeadline || 'N/A'}\n`;
    csv += `Manager,${projectManagerName}\n`;
    csv += `Completion percentage,${progressPercentage}%\n`;
    csv += `Total Defects,${totalDefects}\n`;
    csv += `Open Defects,${openDefects}\n`;
    csv += `Resolved Defects,${resolvedDefects}\n`;
    csv += `Critical Defects,${criticalDefects}\n`;
    csv += `Overdue Defects,${overdueDefects}\n\n`;

    csv += 'PROJECT MEMBERS\n';
    csv += 'ID,Name,Email,Role\n';
    members.forEach(m => {
      csv += `${m.id},"${m.full_name}","${m.email}",${m.role}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Project_${project?.project_key || 'Report'}_CSV.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    let excel = 'sep=\t\n';
    excel += `PROJECT REPORT\t${project?.name}\n\n`;
    excel += `Project ID\tPRJ-${project?.id}\n`;
    excel += `Description\t${project?.description || 'N/A'}\n`;
    excel += `Status\t${projectStatus}\n`;
    excel += `Priority\t${projectPriority}\n`;
    excel += `Deadline\t${projectDeadline || 'N/A'}\n`;
    excel += `Manager\t${projectManagerName}\n`;
    excel += `Completion percentage\t${progressPercentage}%\n`;
    excel += `Total Defects\t${totalDefects}\n`;
    excel += `Open Defects\t${openDefects}\n`;
    excel += `Resolved Defects\t${resolvedDefects}\n`;
    excel += `Critical Defects\t${criticalDefects}\n`;
    excel += `Overdue Defects\t${overdueDefects}\n\n`;

    excel += 'MEMBERS LIST\n';
    excel += 'ID\tName\tEmail\tRole\n';
    members.forEach(m => {
      excel += `${m.id}\t${m.full_name}\t${m.email}\t${m.role}\n`;
    });

    const blob = new Blob([excel], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Project_${project?.project_key || 'Report'}_Excel.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${project?.name || 'Project'} Report</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; }
            h1 { color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 24px; font-weight: 800; font-size: 28px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; }
            .kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 32px; }
            .kpi-box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center; background: #f8fafc; }
            .kpi-box h3 { margin: 0; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; font-weight: 700; }
            .kpi-box p { margin: 6px 0 0 0; font-size: 22px; font-weight: 800; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 13px; }
            th { background-color: #f1f5f9; font-weight: 700; color: #475569; }
            .footer { margin-top: 50px; font-size: 11px; text-align: center; color: #94a3b8; }
          </style>
        </head>
        <body>
          <h1>Project Report: ${project?.name}</h1>
          <div class="grid">
            <div class="card">
              <h3 style="margin-top:0; font-size:14px; color:#4f46e5;">General Information</h3>
              <p><strong>Project ID:</strong> PRJ-${project?.id}</p>
              <p><strong>Project Key:</strong> ${project?.project_key}</p>
              <p><strong>Manager:</strong> ${projectManagerName}</p>
              <p><strong>Status:</strong> <span style="text-transform:uppercase; font-weight:700;">${projectStatus}</span></p>
              <p><strong>Priority:</strong> ${projectPriority}</p>
              <p><strong>Deadline:</strong> ${projectDeadline || 'N/A'}</p>
            </div>
            <div class="card">
              <h3 style="margin-top:0; font-size:14px; color:#4f46e5;">Quality & Progress</h3>
              <p><strong>Progress:</strong> ${progressPercentage}% Completion</p>
              <p><strong>Project Health:</strong> <span style="font-weight:700;">${projectHealth}</span></p>
              <p><strong>Total Members:</strong> ${members.length}</p>
              <p><strong>Last Updated:</strong> ${lastUpdatedTime}</p>
            </div>
          </div>
          <div class="kpi">
            <div class="kpi-box">
              <h3>Total Defects</h3>
              <p>${totalDefects}</p>
            </div>
            <div class="kpi-box">
              <h3>Open Defects</h3>
              <p>${openDefects}</p>
            </div>
            <div class="kpi-box">
              <h3>Resolved</h3>
              <p>${resolvedDefects}</p>
            </div>
            <div class="kpi-box">
              <h3>Critical</h3>
              <p>${criticalDefects}</p>
            </div>
          </div>
          <h2>Assigned Project Members</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Project Role</th>
              </tr>
            </thead>
            <tbody>
              ${members.map(m => `
                <tr>
                  <td>${m.id}</td>
                  <td>${m.full_name}</td>
                  <td>${m.email}</td>
                  <td style="text-transform:capitalize;">${m.role}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            Generated automatically via Defect Tracker Pro Enterprise Analytics.
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter members list
  const filteredMembers = members.filter(m => {
    const nameMatch = m.full_name.toLowerCase().includes(searchMember.toLowerCase()) || 
                      m.email.toLowerCase().includes(searchMember.toLowerCase());
    const roleMatch = filterRole === 'all' || m.role === filterRole;
    return nameMatch && roleMatch;
  });

  const handlePermissionChange = (permName, role) => {
    setPermissions(prev => {
      const activeRoles = prev[permName] || [];
      const updatedRoles = activeRoles.includes(role)
        ? activeRoles.filter(r => r !== role)
        : [...activeRoles, role];
      return {
        ...prev,
        [permName]: updatedRoles
      };
    });
  };

  if (loading) return <Layout title="Project Details"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mt-20"></div></Layout>;

  return (
    <Layout title={`Project: ${project?.name}`}>
      <div className="flex flex-col gap-6 animate-fadeIn">
        
        {/* Header Actions row */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
            <span>Projects</span> <ChevronRight className="w-3.5 h-3.5" /> <span>{project?.project_key}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('settings')}
              className="btn-secondary text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
            >
              <SettingsIcon className="w-3.5 h-3.5" /> Edit Project
            </button>
            
            {/* Export Dropdown buttons group */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button 
                onClick={handleExportCSV}
                title="Export to CSV"
                className="p-1 px-2.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-md cursor-pointer transition-colors"
              >
                CSV
              </button>
              <button 
                onClick={handleExportExcel}
                title="Export to Excel"
                className="p-1 px-2.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-md cursor-pointer transition-colors"
              >
                EXCEL
              </button>
              <button 
                onClick={handleExportPDF}
                title="Export to PDF"
                className="p-1 px-2.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-md cursor-pointer transition-colors"
              >
                PDF
              </button>
            </div>

            <button 
              onClick={handleArchiveProject}
              className="btn-danger bg-amber-600 hover:bg-amber-700 text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" /> Archive Project
            </button>
          </div>
        </div>

        {/* Project Header Banner */}
        <div className="card p-6 bg-gradient-to-r from-brand-600 to-indigo-700 dark:from-slate-900 dark:to-indigo-950 text-white relative overflow-hidden border-none shadow-md rounded-2xl">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
            <TrendingUp className="w-96 h-96" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="bg-white/20 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-white/10">
                {projectStatus}
              </span>
              <p className="text-xs text-white/80 font-medium">Created on {new Date(project?.created_at).toLocaleDateString()}</p>
            </div>
            <h2 className="text-2xl font-black mt-3 tracking-tight">{project?.name}</h2>
            <p className="text-sm text-white/80 mt-1 max-w-2xl font-medium leading-relaxed">{project?.description || 'No description provided.'}</p>
            
            {/* Extended Metadata Fields grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mt-6 pt-4 border-t border-white/10 text-xs font-semibold">
              <div>
                <p className="text-white/60 font-bold uppercase tracking-wider text-[9px]">Project ID</p>
                <p className="font-extrabold text-sm mt-1">PRJ-{project?.id}</p>
              </div>
              <div>
                <p className="text-white/60 font-bold uppercase tracking-wider text-[9px]">Project Manager</p>
                <p className="font-extrabold text-sm mt-1">{projectManagerName}</p>
              </div>
              <div>
                <p className="text-white/60 font-bold uppercase tracking-wider text-[9px]">Priority</p>
                <p className="font-extrabold text-sm mt-1 uppercase">{project?.priority || 'Medium'}</p>
              </div>
              <div>
                <p className="text-white/60 font-bold uppercase tracking-wider text-[9px]">Progress</p>
                <p className="font-extrabold text-sm mt-1">{progressPercentage}%</p>
              </div>
              <div>
                <p className="text-white/60 font-bold uppercase tracking-wider text-[9px]">Deadline</p>
                <p className="font-extrabold text-sm mt-1">
                  {project?.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-white/60 font-bold uppercase tracking-wider text-[9px]">Active Status</p>
                <p className="font-extrabold text-sm mt-1 uppercase">{projectStatus}</p>
              </div>
            </div>
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
                <Icon className="w-4 h-4" />
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
              
              {/* First Screen KPI Cards */}
              <StatCard title="Total Defects" value={totalDefects} icon="🐛" color="primary" />
              <StatCard title="Open Defects" value={openDefects} icon="📋" color="yellow" />
              <StatCard title="Resolved Defects" value={resolvedDefects} icon="✅" color="green" />
              <StatCard title="Critical Issues" value={criticalDefects} icon="🔴" color="red" />
              
              {/* Additional Overview Cards */}
              <StatCard title="Total Members" value={members.length} icon="👥" color="primary" />
              <StatCard title="Completion Rate" value={`${progressPercentage}%`} icon="📈" color="green" />
              <StatCard title="Last Updated" value={getRelativeTime(activities[0]?.created_at)} icon="🕒" color="yellow" />
              <div className={`card p-4 flex flex-col justify-center items-center font-bold text-xs ${healthColor}`}>
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4.5 h-4.5" />
                  <span>PROJECT HEALTH</span>
                </div>
                <p className="text-xl font-black uppercase tracking-wider mt-1">{projectHealth}</p>
              </div>

              {/* Dynamic Health Graph details */}
              <div className="card lg:col-span-4 shadow-xs">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white mb-4 uppercase tracking-wider">Project Quality Analytics</h3>
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="50" fill="transparent" stroke="#e2e8f0" strokeWidth="10" className="dark:stroke-slate-800" />
                      <circle cx="64" cy="64" r="50" fill="transparent" stroke="#4f46e5" strokeWidth="10" 
                        strokeDasharray={314}
                        strokeDashoffset={314 - (314 * progressPercentage) / 100} 
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <p className="text-2xl font-black text-slate-850 dark:text-white">
                        {progressPercentage}%
                      </p>
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-wider">Resolved</p>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
                      Project <span className="font-black text-slate-900 dark:text-white">{project?.name}</span> is in <strong className="uppercase">{projectHealth}</strong> health. 
                      A resolution rate of <span className="font-black text-brand-600 dark:text-brand-400">{progressPercentage}%</span> has been registered across {totalDefects} defects.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2 font-bold text-[10px] uppercase">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>Resolved ({resolvedDefects})</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span>Open ({openDefects})</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span>Critical ({criticalDefects})</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                        <span>Overdue ({overdueDefects})</span>
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
              <div className="card lg:col-span-2 space-y-4 shadow-xs">
                
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Assigned Members ({members.length})</h3>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    
                    {/* Search Input */}
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Search name/email..."
                        value={searchMember}
                        onChange={(e) => setSearchMember(e.target.value)}
                        className="input-field text-xs pl-8 py-1.5 w-full sm:w-44 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    {/* Filter Role */}
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="input-field text-xs py-1.5 w-32 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-semibold"
                    >
                      <option value="all">All Roles</option>
                      <option value="manager">Managers</option>
                      <option value="developer">Developers</option>
                      <option value="tester">Testers</option>
                    </select>
                  </div>
                </div>
                
                <div className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredMembers.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No matching project members found.</p>
                  ) : (
                    filteredMembers.map(member => (
                      <div key={member.id} className="py-3 flex items-center justify-between font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 rounded-lg flex items-center justify-center font-black text-xs shrink-0 uppercase border border-brand-100 dark:border-brand-900/50">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white">{member.full_name}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{member.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* Role Updater dropdown */}
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                            className="input-field text-[11px] font-bold py-1 w-28 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          >
                            <option value="manager">Manager</option>
                            <option value="developer">Developer</option>
                            <option value="tester">Tester</option>
                          </select>

                          <button 
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add New Member Sidebar Widget */}
              <div className="card h-fit space-y-4 shadow-xs">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">Add Team Member</h3>
                <form onSubmit={handleAddMember} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Select User</label>
                    <select
                      value={selectedUserToAdd}
                      onChange={(e) => setSelectedUserToAdd(e.target.value)}
                      className="input-field text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      required
                    >
                      <option value="">-- Choose User --</option>
                      {allUsersList.map(u => (
                        <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Project Role</label>
                    <select
                      value={selectedRoleForNewMember}
                      onChange={(e) => setSelectedRoleForNewMember(e.target.value)}
                      className="input-field text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    >
                      <option value="developer">Developer</option>
                      <option value="tester">Tester</option>
                      <option value="manager">Project Manager</option>
                    </select>
                  </div>

                  <button type="submit" className="btn-primary w-full text-xs font-bold py-2 flex items-center justify-center gap-1.5 cursor-pointer">
                    <Plus className="w-4 h-4" /> Add to Project
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TIMELINE TAB (Enterprise Activity Timeline) */}
          {activeTab === 'timeline' && (
            <div className="card space-y-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Project Activity Timeline</h3>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 font-extrabold px-2 py-0.5 rounded-full border border-indigo-200/50 uppercase">
                  Real Activity Logs
                </span>
              </div>
              
              {activities.length === 0 ? (
                <p className="text-xs text-slate-405 text-center py-8">No logged activity timeline logs found for this project.</p>
              ) : (
                <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-6 pb-2">
                  {activities.map((act) => {
                    const relativeTime = getRelativeTime(act.created_at);
                    const localTimeStr = new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const dateStr = new Date(act.created_at).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
                    
                    return (
                      <div key={act.id} className="relative pl-6">
                        {/* Timeline Circle */}
                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-brand-500 bg-white dark:bg-slate-900 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full"></span>
                        </div>
                        <div className="text-xs font-semibold">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            {dateStr} at {localTimeStr} ({relativeTime})
                          </span>
                          <h4 className="text-slate-800 dark:text-slate-200 mt-1 font-bold">
                            <strong className="text-slate-900 dark:text-white font-extrabold">{act.user_name || 'System'}</strong> {act.action}
                          </h4>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              
              {/* Form Settings Wrapper */}
              <form onSubmit={handleSaveSettings} className="space-y-6">
                
                {/* 1. GENERAL */}
                <div className="card space-y-4 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-850 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-805 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand-600" /> General Settings
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Project Name</label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Deadline</label>
                      <input
                        type="date"
                        value={projectDeadline}
                        onChange={(e) => setProjectDeadline(e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Description</label>
                      <textarea
                        rows={3}
                        value={projectDesc}
                        onChange={(e) => setProjectDesc(e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Status</label>
                      <select
                        value={projectStatus}
                        onChange={(e) => setProjectStatus(e.target.value)}
                        className="input-field text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Priority</label>
                      <select
                        value={projectPriority}
                        onChange={(e) => setProjectPriority(e.target.value)}
                        className="input-field text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Project Manager</label>
                      <select
                        value={projectManagerId}
                        onChange={(e) => setProjectManagerId(e.target.value)}
                        className="input-field text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      >
                        <option value="">-- No Manager Assigned --</option>
                        {allUsersList.filter(u => u.role === 'manager' || u.role === 'project_manager' || u.role === 'admin').map(mgr => (
                          <option key={mgr.id} value={mgr.id}>{mgr.full_name} ({mgr.role})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button type="submit" className="btn-primary text-xs font-bold py-2 px-5 flex items-center gap-1.5 cursor-pointer">
                      <Save className="w-4 h-4" /> Save General Settings
                    </button>
                  </div>
                </div>

                {/* 2. PERMISSIONS */}
                <div className="card space-y-4 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-850 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-805 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-brand-655" /> Role Permissions
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-semibold">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-black text-[9px] tracking-wider">
                          <th className="py-2.5 px-4">Action</th>
                          <th className="py-2.5 px-4 text-center">Admin</th>
                          <th className="py-2.5 px-4 text-center">Manager</th>
                          <th className="py-2.5 px-4 text-center">Developer</th>
                          <th className="py-2.5 px-4 text-center">Tester</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {[
                          { key: 'create_defects', label: 'Who can create defects' },
                          { key: 'assign_defects', label: 'Who can assign defects' },
                          { key: 'close_defects', label: 'Who can close defects' },
                          { key: 'reopen_defects', label: 'Who can reopen defects' },
                          { key: 'archive_project', label: 'Who can archive project' }
                        ].map(perm => (
                          <tr key={perm.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                            <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{perm.label}</td>
                            {['admin', 'manager', 'developer', 'tester'].map(role => (
                              <td key={role} className="py-3 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={permissions[perm.key]?.includes(role)}
                                  onChange={() => handlePermissionChange(perm.key, role)}
                                  disabled={role === 'admin'} // Admin always retains permission
                                  className="w-4 h-4 accent-brand-600 rounded text-brand-600 cursor-pointer"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </form>

              {/* 3. DANGER ZONE */}
              <div className="card border border-rose-200 dark:border-rose-955 bg-rose-50/20 dark:bg-rose-955/5 p-4 rounded-xl space-y-4">
                <h3 className="text-xs font-black text-rose-707 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Danger Zone
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  
                  {/* Archive Box */}
                  <div className="p-4 border border-rose-100 dark:border-rose-955/30 bg-white dark:bg-slate-900 rounded-xl flex flex-col justify-between h-40">
                    <div>
                      <h4 className="font-bold text-slate-855 dark:text-white">Archive Project</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Place the project in archive status. All issues and boards will read-only lock.
                      </p>
                    </div>
                    <button 
                      onClick={handleArchiveProject}
                      className="btn-danger w-full bg-amber-600 hover:bg-amber-700 text-xs font-bold py-2 mt-3 cursor-pointer"
                    >
                      Archive Project
                    </button>
                  </div>

                  {/* Transfer Box */}
                  <div className="p-4 border border-rose-100 dark:border-rose-955/30 bg-white dark:bg-slate-900 rounded-xl flex flex-col justify-between h-40">
                    <div>
                      <h4 className="font-bold text-slate-855 dark:text-white">Transfer Ownership</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Grant ownership keys of this project to another user profile.
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowTransferModal(true)}
                      className="btn-secondary w-full border-slate-200 dark:border-slate-800 text-xs font-bold py-2 mt-3 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer Keys
                    </button>
                  </div>

                  {/* Delete Box */}
                  <div className="p-4 border border-rose-150 dark:border-rose-955/30 bg-white dark:bg-slate-900 rounded-xl flex flex-col justify-between h-40">
                    <div>
                      <h4 className="font-bold text-slate-855 dark:text-white">Delete Project</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Permanently purge database entries for this project. This cannot be undone.
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setDeleteConfirmationText('');
                        setShowDeleteModal(true);
                      }}
                      className="btn-danger w-full bg-rose-600 hover:bg-rose-700 text-xs font-bold py-2 mt-3 cursor-pointer"
                    >
                      Delete Project
                    </button>
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* DELETE PROJECT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-100 dark:border-slate-805 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-sm font-black uppercase tracking-wider">Confirm Permanent Delete</h3>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-semibold">
              This action will completely erase the project <strong>{project?.name}</strong> and all linked defects, comments, and attachments. 
              This is permanent and cannot be reversed.
            </p>

            <div className="space-y-3 font-semibold text-xs text-slate-600 dark:text-slate-350">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Type <span className="text-rose-600 font-extrabold">{project?.name}</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type project name..."
                className="input-field border-rose-200 focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 text-xs font-bold">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary py-2 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteProject}
                disabled={deleteConfirmationText !== project?.name}
                className="btn-danger bg-rose-600 hover:bg-rose-700 py-2 px-4 cursor-pointer disabled:opacity-50"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER OWNERSHIP MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-100 dark:border-slate-805 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-brand-600">
              <ArrowRightLeft className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-wider">Transfer Project Keys</h3>
            </div>
            
            <p className="text-xs text-slate-505 dark:text-slate-400 leading-normal font-semibold">
              Select a user profile to transfer ownership of <strong>{project?.name}</strong>. The owner holds the administrative creator keys for settings updates.
            </p>

            <div className="space-y-2 text-xs font-semibold">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Select New Owner</label>
              <select
                value={newOwnerId}
                onChange={(e) => setNewOwnerId(e.target.value)}
                className="input-field bg-white dark:bg-slate-900 border-slate-202 dark:border-slate-800"
              >
                <option value="">-- Choose Profile --</option>
                {allUsersList.filter(u => u.id !== project?.created_by).map(usr => (
                  <option key={usr.id} value={usr.id}>{usr.full_name} ({usr.role})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 text-xs font-bold">
              <button 
                onClick={() => setShowTransferModal(false)}
                className="btn-secondary py-2 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleTransferOwnership}
                disabled={!newOwnerId}
                className="btn-primary py-2 px-4 cursor-pointer disabled:opacity-50"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default AdminProjectDetails;
