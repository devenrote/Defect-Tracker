import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import SeverityBadge from '../../components/SeverityBadge';
import DataTable from '../../components/DataTable';
import { projectAPI, defectAPI } from '../../services/api';
import { 
  Clock, 
  AlertTriangle, 
  Bug, 
  User, 
  CheckCircle2, 
  Users, 
  Activity, 
  FileText, 
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TesterProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Stats & Lists
  const [members, setMembers] = useState([]);
  const [defects, setDefects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [projectStats, setProjectStats] = useState({
    total_defects: 0,
    open_defects: 0,
    resolved_defects: 0,
    critical_defects: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, statsRes, membersRes, defectsRes, activitiesRes] = await Promise.all([
        projectAPI.getById(id),
        projectAPI.getStatistics(id),
        projectAPI.getMembers(id),
        defectAPI.getAll({ project_id: id }),
        projectAPI.getActivities(id)
      ]);

      setProject(projRes.data.data);
      if (statsRes.data.data.statistics) {
        setProjectStats(statsRes.data.data.statistics);
      }
      setMembers(membersRes.data.data || []);
      setDefects(defectsRes.data.data || []);
      setActivities(activitiesRes.data.data || []);
    } catch (err) {
      console.error('Error fetching tester project details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <Layout title="Project Details">
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout title="Project Details">
        <div className="card py-16 text-center shadow-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <span className="text-4xl">📁</span>
          <h3 className="text-sm font-black text-slate-850 dark:text-white mt-3">Project not found</h3>
          <button onClick={() => navigate('/projects')} className="btn-secondary text-xs mt-4">
            Back to Projects
          </button>
        </div>
      </Layout>
    );
  }

  // Manager Name Lookup
  const managerName = members.find(m => m.role === 'manager' || m.role === 'project_manager')?.full_name || 'Not Assigned';

  // Last activity timestamp lookup
  let lastUpdatedStr = project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A';
  if (defects.length > 0) {
    const timestamps = defects.map(d => new Date(d.updated_at || d.created_at).getTime());
    const maxTimestamp = Math.max(...timestamps);
    lastUpdatedStr = new Date(maxTimestamp).toLocaleString();
  }

  // Derived filter arrays
  const myReportedDefects = defects.filter(d => Number(d.reporter_id) === Number(user.id));
  const verificationQueueDefects = defects.filter(d => ['Resolved', 'Testing'].includes(d.status));

  // Team segmentation lists
  const managerList = members.filter(m => m.role === 'manager' || m.role === 'project_manager');
  const developersList = members.filter(m => m.role === 'developer');
  const testersList = members.filter(m => m.role === 'tester');

  // DataTable columns configurations
  const myDefectsColumns = [
    {
      header: 'Defect ID',
      accessor: 'id',
      render: (row) => <span className="font-mono font-bold text-slate-400">DF-{row.id}</span>
    },
    {
      header: 'Title',
      accessor: 'title',
      render: (row) => <span className="font-bold text-slate-800 dark:text-white">{row.title}</span>
    },
    {
      header: 'Priority',
      render: (row) => <span className="text-xs font-semibold">{row.priority}</span>
    },
    {
      header: 'Severity',
      render: (row) => <SeverityBadge severity={row.severity} />
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Assigned Developer',
      accessor: 'assignee_name',
      render: (row) => <span className="font-bold text-slate-655 dark:text-slate-350">{row.assignee_name || 'Unassigned'}</span>
    },
    {
      header: 'Created Date',
      render: (row) => new Date(row.created_at).toLocaleDateString()
    },
    {
      header: 'Last Updated',
      render: (row) => new Date(row.updated_at || row.created_at).toLocaleDateString()
    }
  ];

  const verificationQueueColumns = [
    {
      header: 'Defect ID',
      accessor: 'id',
      render: (row) => <span className="font-mono font-bold text-slate-400">DF-{row.id}</span>
    },
    {
      header: 'Title',
      accessor: 'title',
      render: (row) => <span className="font-bold text-slate-800 dark:text-white">{row.title}</span>
    },
    {
      header: 'Priority',
      render: (row) => <span className="text-xs font-semibold">{row.priority}</span>
    },
    {
      header: 'Assigned Developer',
      accessor: 'assignee_name',
      render: (row) => <span className="font-bold text-slate-655 dark:text-slate-350">{row.assignee_name || 'Unassigned'}</span>
    },
    {
      header: 'Current Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Due Date',
      render: (row) => row.due_date ? new Date(row.due_date).toLocaleDateString() : 'N/A'
    }
  ];

  const teamColumns = [
    {
      header: 'Name',
      accessor: 'full_name',
      render: (row) => <span className="font-bold text-slate-800 dark:text-white">{row.full_name}</span>
    },
    {
      header: 'Email Address',
      accessor: 'email',
      render: (row) => <span className="text-slate-500 dark:text-slate-400 font-mono">{row.email}</span>
    },
    {
      header: 'Project Role',
      accessor: 'role',
      render: (row) => <span className="text-xs font-extrabold tracking-wide uppercase px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 text-slate-500 dark:bg-slate-950/20">{row.role}</span>
    }
  ];

  return (
    <Layout title={`Project Details: ${project.project_name || project.name}`}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </button>
        </div>

        {/* Project Header Card Banner */}
        <div className="card p-6 bg-gradient-to-r from-brand-600 to-indigo-700 dark:from-slate-900 dark:to-indigo-950 text-white relative overflow-hidden border-none shadow-xs rounded-2xl">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="bg-white/20 text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {project.status || 'active'}
              </span>
              <p className="text-xs text-white/80 font-medium">Created on {new Date(project.created_at).toLocaleDateString()}</p>
            </div>
            <h2 className="text-2xl font-black mt-3 tracking-tight">{project.project_name || project.name}</h2>
            <p className="text-sm text-white/80 mt-1 max-w-2xl font-medium leading-relaxed">{project.description || 'No description provided.'}</p>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'team', label: 'Team', icon: Users },
            { id: 'my_defects', label: 'My Defects', icon: Bug },
            { id: 'verification_queue', label: 'Verification Queue', icon: ShieldAlert },
            { id: 'activity', label: 'Activity', icon: Activity }
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

        {/* Tab Components Render */}
        <div className="animate-fadeIn">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Core Attributes */}
              <div className="card space-y-4">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">
                  Project Metadata
                </h3>
                <div className="space-y-3 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Project Name:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{project.project_name || project.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Manager:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{managerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Updated:</span>
                    <span className="text-slate-600 dark:text-slate-355">{lastUpdatedStr}</span>
                  </div>
                </div>
              </div>

              {/* Quality Metrics */}
              <div className="card space-y-4">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">
                  Defect Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-955/20 border border-slate-100 dark:border-slate-850 p-3.5 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Defects</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{projectStats.total_defects}</p>
                  </div>
                  <div className="bg-rose-50/20 dark:bg-rose-955/5 border border-rose-100 dark:border-rose-900/10 p-3.5 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-rose-500 uppercase">Open Defects</p>
                    <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">{projectStats.open_defects}</p>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-3.5 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-rose-600 dark:text-rose-455 uppercase">Critical Severity</p>
                    <p className="text-lg font-black text-rose-600 dark:text-rose-455 mt-1">{projectStats.critical_defects}</p>
                  </div>
                  <div className="bg-brand-50/20 dark:bg-brand-950/5 border border-brand-100 dark:border-brand-900/10 p-3.5 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-brand-655 dark:text-brand-400 uppercase">My Reported</p>
                    <p className="text-lg font-black text-brand-655 dark:text-brand-400 mt-1">{myReportedDefects.length}</p>
                  </div>
                  <div className="col-span-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-3.5 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase">Pending Verification</p>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-450 mt-1">{verificationQueueDefects.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEAM */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Project Manager Section */}
              <div className="card space-y-3">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Project Manager</h3>
                {managerList.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold italic">No manager assigned yet.</p>
                ) : (
                  <DataTable columns={teamColumns} data={managerList} />
                )}
              </div>

              {/* Developers Section */}
              <div className="card space-y-3">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Developers</h3>
                {developersList.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold italic">No developers assigned.</p>
                ) : (
                  <DataTable columns={teamColumns} data={developersList} />
                )}
              </div>

              {/* Testers Section */}
              <div className="card space-y-3">
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">QA Testers</h3>
                {testersList.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold italic">No testers assigned.</p>
                ) : (
                  <DataTable columns={teamColumns} data={testersList} />
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MY DEFECTS */}
          {activeTab === 'my_defects' && (
            <div className="card p-0 overflow-hidden shadow-xs border border-slate-100 dark:border-slate-800 rounded-2xl">
              <DataTable 
                columns={myDefectsColumns} 
                data={myReportedDefects} 
                searchable
                searchPlaceholder="Search my defects..."
                pagination
                onRowClick={(row) => navigate(`/defects/${row.id}`)}
              />
            </div>
          )}

          {/* TAB 4: VERIFICATION QUEUE */}
          {activeTab === 'verification_queue' && (
            <div className="card p-0 overflow-hidden shadow-xs border border-slate-100 dark:border-slate-800 rounded-2xl">
              <DataTable 
                columns={verificationQueueColumns} 
                data={verificationQueueDefects} 
                searchable
                searchPlaceholder="Search verification queue..."
                pagination
                onRowClick={(row) => navigate(`/defects/${row.id}`)}
              />
            </div>
          )}

          {/* TAB 5: ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="card space-y-4">
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">
                Project Audit Timeline
              </h3>
              {activities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-semibold">No activity logs recorded for this project.</div>
              ) : (
                <div className="space-y-4 mt-2">
                  {activities.map((act) => (
                    <div key={act.id} className="flex gap-3 text-xs border-l-2 border-slate-200 dark:border-slate-850 pl-4 py-1">
                      <div className="flex-1">
                        <p className="text-slate-800 dark:text-white font-semibold">
                          <span className="font-black text-brand-655 dark:text-brand-400">{act.user_name || 'System'}</span> {act.action}
                        </p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase mt-1">
                          {new Date(act.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </Layout>
  );
};

export default TesterProjectDetails;
