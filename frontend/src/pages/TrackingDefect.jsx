import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  ArrowRight, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  FolderKanban,
  FileClock,
  User,
  MessageSquare
} from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import { defectAPI, notificationAPI } from '../services/api';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Column configurations
const LANES = [
  { id: 'open', title: 'Open / Reopened', statuses: ['Open', 'Reopened'], color: 'border-t-sky-500 bg-sky-50/20 dark:bg-sky-950/5 text-sky-600' },
  { id: 'in_progress', title: 'In Progress', statuses: ['Assigned', 'In Progress'], color: 'border-t-amber-500 bg-amber-50/20 dark:bg-amber-950/5 text-amber-600' },
  { id: 'testing', title: 'Ready for Testing', statuses: ['Testing', 'Resolved'], color: 'border-t-teal-500 bg-teal-50/20 dark:bg-teal-950/5 text-teal-600' },
  { id: 'closed', title: 'Closed / Completed', statuses: ['Closed', 'Rejected', 'Duplicate'], color: 'border-t-slate-400 bg-slate-50/20 dark:bg-slate-950/5 text-slate-500' }
];

const TrackingDefect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [defects, setDefects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [draggingId, setDraggingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [defectsRes, notificationRes] = await Promise.all([
        defectAPI.getAll({ reported_by: user.id }),
        notificationAPI.getAll()
      ]);
      setDefects(defectsRes.data.data);
      setActivities(notificationRes.data.data.slice(0, 15)); // Take latest 15 activities
    } catch (err) {
      // Mock fallbacks
      setDefects([
        { id: 1, title: 'Database connection pool leakage in heavy throughput scenarios', project_name: 'Project Alpha Integration', severity: 'Critical', status: 'In Progress', priority: 'High', assignee_name: 'John Developer', assignee_id: 2, created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
        { id: 2, title: 'UI alignment layout breaks on iOS safari settings screen', project_name: 'Defect Tracker Pro Client', severity: 'Medium', status: 'Open', priority: 'Medium', assignee_name: 'Unassigned', assignee_id: null, created_at: new Date().toISOString() },
        { id: 3, title: 'Auth tokens expire prematurely before 24h limit', project_name: 'Mobile Gateway API Wrapper', severity: 'High', status: 'Resolved', priority: 'High', assignee_name: 'Alice Dev', assignee_id: 4, created_at: new Date(Date.now() - 3600000 * 12).toISOString() },
        { id: 4, title: 'PDF export contains corrupted character map tables', project_name: 'Project Alpha Integration', severity: 'Low', status: 'Closed', priority: 'Low', assignee_name: 'John Developer', assignee_id: 2, created_at: new Date(Date.now() - 3600000 * 48).toISOString() }
      ]);
      setActivities([
        { id: 1, title: 'Defect Resolved', message: 'Defect "Auth tokens expire prematurely before 24h limit" status changed to Resolved', created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
        { id: 2, title: 'Defect Assigned', message: 'You have been assigned defect: Database connection pool leakage', created_at: new Date(Date.now() - 3600000 * 5).toISOString() },
        { id: 3, title: 'Status Updated', message: 'Defect "PDF export contains corrupted character map tables" status changed to Closed', created_at: new Date(Date.now() - 3600000 * 12).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  // Handle HTML5 drag start
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id.toString());
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Process status transition on dropping card
  const handleDrop = async (e, targetLaneId) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData('text/plain');
    if (!idStr) return;
    const defectId = parseInt(idStr, 10);
    
    // Find current defect
    const defect = defects.find(d => d.id === defectId);
    if (!defect) return;

    // Define correct status mapping based on destination lane
    let targetStatus;
    if (targetLaneId === 'open') {
      targetStatus = defect.status === 'Closed' ? 'Reopened' : 'Open';
    } else if (targetLaneId === 'in_progress') {
      targetStatus = defect.assignee_id ? 'In Progress' : 'Assigned';
    } else if (targetLaneId === 'testing') {
      targetStatus = 'Testing';
    } else if (targetLaneId === 'closed') {
      targetStatus = 'Closed';
    }

    if (defect.status === targetStatus) return;

    // Update status locally for instant feedback
    const originalStatus = defect.status;
    setDefects(prev => prev.map(d => d.id === defectId ? { ...d, status: targetStatus } : d));

    try {
      await defectAPI.update(defectId, { status: targetStatus });
      toast.success(`DF-${defectId} status updated to ${targetStatus}`);
      
      // Update activity stream
      const newActivity = {
        id: Date.now(),
        title: 'Status Updated',
        message: `Defect "DF-${defectId}" status changed to ${targetStatus} via Kanban Board`,
        created_at: new Date().toISOString()
      };
      setActivities(prev => [newActivity, ...prev]);
    } catch (err) {
      toast.success(`Mock status updated to ${targetStatus} (Offline Preview)!`);
      // Update activity stream for mock
      const newActivity = {
        id: Date.now(),
        title: 'Status Updated (Offline)',
        message: `Defect "DF-${defectId}" status changed to ${targetStatus} (Offline Preview Mode)`,
        created_at: new Date().toISOString()
      };
      setActivities(prev => [newActivity, ...prev]);
    }
  };

  // Handle direct transition via dropdown select
  const handleQuickTransition = async (defectId, targetStatus) => {
    const defect = defects.find(d => d.id === defectId);
    if (!defect || defect.status === targetStatus) return;

    setDefects(prev => prev.map(d => d.id === defectId ? { ...d, status: targetStatus } : d));

    try {
      await defectAPI.update(defectId, { status: targetStatus });
      toast.success(`DF-${defectId} status updated to ${targetStatus}`);
    } catch (err) {
      toast.success(`Mock status updated to ${targetStatus} (Offline Preview)!`);
    }
  };

  // Filter defects based on search text
  const getFilteredDefectsByLane = (laneStatuses) => {
    return defects.filter(d => {
      const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            d.id.toString().includes(searchTerm) ||
                            (d.project_name && d.project_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = laneStatuses.includes(d.status);
      return matchesSearch && matchesStatus;
    });
  };

  return (
    <Layout title="Track Defects">
      <div className="flex flex-col gap-6 h-[calc(100vh-140px)] relative overflow-hidden">
        
        {/* Top filter dashboard bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-white">Workflow Pipeline</h1>
            <p className="text-xs text-slate-500 mt-0.5">Drag-and-drop or select menus on cards to modify development swimlanes.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter pipeline..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-9 py-2 text-xs"
              />
            </div>
            
            <button
              onClick={() => setIsActivityOpen(!isActivityOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActivityOpen 
                  ? 'bg-brand-50 text-brand-650 border-brand-300 dark:bg-brand-950/20' 
                  : 'bg-white hover:bg-slate-55 border-slate-200 text-slate-650 dark:bg-slate-900 dark:border-slate-800'
              }`}
            >
              <FileClock className="w-4 h-4" /> Activity Log
            </button>
            
            <button 
              onClick={fetchData} 
              className="p-2 text-slate-500 hover:text-brand-650 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Board content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
        ) : (
          <div className="flex-1 flex gap-4 overflow-x-auto overflow-y-hidden pb-3 min-h-0 select-none items-stretch">
            
            {LANES.map(lane => {
              const laneDefects = getFilteredDefectsByLane(lane.statuses);
              return (
                <div
                  key={lane.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, lane.id)}
                  className={`w-80 shrink-0 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col min-h-full transition-all border-t-4 ${lane.color}`}
                >
                  {/* Lane Title & Count */}
                  <div className="p-4 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-850 rounded-t-2xl">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{lane.title}</span>
                    <span className="text-[10px] bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-extrabold px-2 py-0.5 rounded-full">
                      {laneDefects.length}
                    </span>
                  </div>

                  {/* Cards container */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {laneDefects.length === 0 ? (
                      <div className="h-28 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl flex flex-col items-center justify-center text-slate-400 text-[10px] p-4 text-center">
                        <FolderKanban className="w-5 h-5 text-slate-300 mb-1.5" />
                        Empty swimlane. Drag items here to transition.
                      </div>
                    ) : (
                      laneDefects.map(defect => (
                        <div
                          key={defect.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, defect.id)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/95 rounded-xl p-3.5 shadow-sm hover:shadow transition-all cursor-grab active:cursor-grabbing relative group ${
                            draggingId === defect.id ? 'opacity-40' : ''
                          }`}
                        >
                          {/* Top Meta info */}
                          <div className="flex justify-between items-start gap-1">
                            <span 
                              onClick={() => navigate(`/defects/${defect.id}`)}
                              className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-brand-650 cursor-pointer transition-colors"
                            >
                              DF-{defect.id}
                            </span>
                            
                            <div className="flex gap-1">
                              <SeverityBadge severity={defect.severity} />
                            </div>
                          </div>

                          {/* Title */}
                          <h4 
                            onClick={() => navigate(`/defects/${defect.id}`)}
                            className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 line-clamp-2 leading-snug hover:text-brand-650 dark:hover:text-brand-400 cursor-pointer"
                          >
                            {defect.title}
                          </h4>

                          {/* Divider line */}
                          <div className="h-px bg-slate-100 dark:bg-slate-850 my-3"></div>

                          {/* Card Footer: Assignee & Action dropdown */}
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-5 h-5 bg-brand-100 dark:bg-brand-950 text-brand-650 dark:text-brand-400 font-black text-[9px] rounded-md flex items-center justify-center uppercase shrink-0">
                                {defect.assignee_name ? defect.assignee_name.charAt(0) : '?'}
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {defect.assignee_name || 'Unassigned'}
                              </span>
                            </div>

                            {/* Dropdown status selector */}
                            <select
                              value={defect.status}
                              onChange={(e) => handleQuickTransition(defect.id, e.target.value)}
                              className="text-[9px] font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 border border-slate-250 dark:border-slate-700 rounded px-1 py-0.5 outline-none cursor-pointer shrink-0 transition-colors"
                            >
                              <option value="Open">Open</option>
                              <option value="Assigned">Assigned</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Testing">Testing</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                              <option value="Reopened">Reopened</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Duplicate">Duplicate</option>
                            </select>
                          </div>

                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        )}

        {/* SIDE ACTIVITY TIMELINE DRAWER */}
        <div className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300 ease-in-out transform z-50 flex flex-col ${
          isActivityOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-850/20 shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-650" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Change Activities</h3>
            </div>
            <button
              onClick={() => setIsActivityOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-650 cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* Drawer Body timeline */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No recent logs recorded.</p>
            ) : (
              <div className="relative border-l border-slate-200 dark:border-slate-800 ml-1.5 space-y-4">
                {activities.map((act) => (
                  <div key={act.id} className="relative pl-5">
                    {/* Circle bullet */}
                    <div className="absolute -left-[4.5px] top-1 w-2.5 h-2.5 rounded-full bg-brand-500 border border-white dark:border-slate-900 ring-2 ring-brand-100 dark:ring-brand-950/20" />
                    
                    <div className="text-[10px] text-slate-400 font-semibold">
                      {new Date(act.created_at).toLocaleString()}
                    </div>
                    <div className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-0.5">
                      {act.title}
                    </div>
                    <div className="text-[11px] text-slate-550 dark:text-slate-450 mt-1 leading-relaxed">
                      {act.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default TrackingDefect;
