import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { projectAPI, defectAPI } from '../../services/api';
import { Clock, AlertTriangle, Bug, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TesterProjects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectDetails = async () => {
    try {
      const res = await projectAPI.getAll();
      const projList = res.data.data || [];
      
      const enrichedProjects = await Promise.all(projList.map(async (proj) => {
        let stats = { total_defects: 0, open_defects: 0, resolved_defects: 0, critical_defects: 0 };
        let managerName = 'Not Assigned';
        let myReportedCount = 0;
        let pendingVerificationCount = 0;
        let lastUpdatedStr = proj.created_at ? new Date(proj.created_at).toLocaleDateString() : 'N/A';

        try {
          const [statsRes, membersRes, defectsRes] = await Promise.all([
            projectAPI.getStatistics(proj.id),
            projectAPI.getMembers(proj.id),
            defectAPI.getAll({ project_id: proj.id })
          ]);
          
          if (statsRes.data.data.statistics) {
            stats = statsRes.data.data.statistics;
          }
          
          const members = membersRes.data.data || [];
          const managerObj = members.find(m => m.role === 'manager' || m.role === 'project_manager');
          if (managerObj) {
            managerName = managerObj.full_name;
          }

          const defects = defectsRes.data.data || [];
          myReportedCount = defects.filter(d => Number(d.reporter_id) === Number(user.id)).length;
          pendingVerificationCount = defects.filter(d => ['Resolved', 'Testing'].includes(d.status)).length;

          if (defects.length > 0) {
            const timestamps = defects.map(d => new Date(d.updated_at || d.created_at).getTime());
            const maxTimestamp = Math.max(...timestamps);
            lastUpdatedStr = new Date(maxTimestamp).toLocaleDateString();
          }
        } catch (err) {
          console.error('Error enriching project stats:', err);
        }

        return {
          ...proj,
          stats,
          managerName,
          myReportedCount,
          pendingVerificationCount,
          lastUpdatedStr
        };
      }));

      setProjects(enrichedProjects);
    } catch (err) {
      console.error('Error loading projects list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, []);

  return (
    <Layout title="My Projects">
      <div className="flex flex-col gap-4 animate-fadeIn">
        <div className="mb-2">
          <h1 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-wider">My Assigned Projects</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-semibold">Read-only view of projects assigned to your testing workload</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : projects.length === 0 ? (
          <div className="card py-16 text-center space-y-3 shadow-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <span className="text-4xl">📁</span>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">No projects assigned yet.</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">Please ask your manager to assign you to a project to start logging defects.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((proj) => (
              <div 
                key={proj.id} 
                className="card shadow-xs bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[340px]"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xs font-bold text-slate-850 dark:text-white truncate max-w-[70%]" title={proj.project_name}>
                      {proj.project_name}
                    </h3>
                    <StatusBadge status={proj.status} />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 font-medium min-h-[48px]">
                    {proj.description || 'No description provided.'}
                  </p>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-850 space-y-2 text-xs font-semibold">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-bold flex items-center gap-1"><User className="w-3 h-3" /> Manager:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{proj.managerName}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-bold flex items-center gap-1"><Bug className="w-3 h-3" /> Total / Open Defects:</span>
                      <span className="text-slate-800 dark:text-slate-200">{proj.stats.total_defects} / <span className="text-rose-600 font-bold">{proj.stats.open_defects}</span></span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-rose-500" /> Critical Defects:</span>
                      <span className="text-rose-600 font-bold">{proj.stats.critical_defects}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-bold flex items-center gap-1"><Bug className="w-3 h-3 text-brand-600" /> My Reported Defects:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{proj.myReportedCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Pending Verification:</span>
                      <span className="text-emerald-600 font-bold">{proj.pendingVerificationCount}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 uppercase">
                    <Clock className="w-3 h-3" />
                    <span>Updated: {proj.lastUpdatedStr}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/projects/${proj.id}`)}
                    className="btn-primary text-[10px] font-bold py-1 px-3 cursor-pointer"
                  >
                    Open Project
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TesterProjects;
