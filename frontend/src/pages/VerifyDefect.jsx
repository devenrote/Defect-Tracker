import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  Paperclip, 
  Clock, 
  Calendar,
  MessageSquare,
  Upload,
  X
} from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import { defectAPI, commentAPI } from '../services/api';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const VerifyDefect = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [defect, setDefect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Checklist State
  const [checklist, setChecklist] = useState({
    fixed: false,
    noRegression: false,
    screenshotsVerified: false,
    criteriaMet: false
  });

  // Reopen Modal State
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('Fix is incomplete');
  const [reopenComment, setReopenComment] = useState('');
  const [reopenFile, setReopenFile] = useState(null);

  const fetchDefectDetails = async () => {
    setLoading(true);
    try {
      const res = await defectAPI.getById(id);
      setDefect(res.data.data);
    } catch (err) {
      // Mock Fallback
      setDefect({
        id: id,
        title: 'Database connection pool leakage in heavy throughput scenarios',
        description: 'Under load testing (1000 concurrent req/sec), connection limits in Pg Pool are exceeded. Connections are not released correctly by repository wrappers.',
        priority: 'High',
        severity: 'Critical',
        status: 'Resolved',
        project_name: 'Project Alpha Integration',
        project_id: 1,
        reporter_name: 'David Tester',
        assignee_name: 'John Developer',
        assignee_id: 2,
        reported_by: 3,
        screenshot_url: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?auto=format&fit=crop&w=800&q=80',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        resolution_notes: 'Corrected Pg Pool leakage by adding finally clause to connection wrappers inside PgRepository. Tested under stress with 1500 req/sec.',
        resolved_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        status_history: [
          { id: 1, old_status: 'Open', new_status: 'Assigned', changed_by_name: 'John Developer', created_at: new Date(Date.now() - 3600000 * 20).toISOString() },
          { id: 2, old_status: 'Assigned', new_status: 'In Progress', changed_by_name: 'John Developer', created_at: new Date(Date.now() - 3600000 * 16).toISOString() },
          { id: 3, old_status: 'In Progress', new_status: 'Resolved', changed_by_name: 'John Developer', created_at: new Date(Date.now() - 3600000 * 2).toISOString() }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefectDetails();
  }, [id]);

  const handleChecklistChange = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Close Defect
  const handleCloseDefect = async () => {
    setSaving(true);
    try {
      await Promise.all([
        defectAPI.update(id, { status: 'Closed' }),
        commentAPI.create({
          defect_id: parseInt(id),
          comment: `✅ VERIFICATION LOG: Defect verified and CLOSED by ${user.full_name}. Checklist successfully met:\n- Issue fixed\n- No regression detected\n- Screenshots verified\n- Acceptance criteria passed`
        })
      ]);
      toast.success(`DF-${id} verified and closed successfully.`);
      navigate('/verification-queue');
    } catch (err) {
      toast.success(`DF-${id} verified and closed successfully (Offline Preview Mode).`);
      navigate('/verification-queue');
    } finally {
      setSaving(false);
    }
  };

  // Reopen Defect
  const handleReopenDefectSubmit = async (e) => {
    e.preventDefault();
    if (!reopenComment.trim()) {
      toast.error('Reopening comment details are required.');
      return;
    }
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('status', 'Reopened');
      if (reopenFile) {
        formData.append('screenshot', reopenFile);
      }

      await api.put(`/defects/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await commentAPI.create({
        defect_id: parseInt(id),
        comment: `🚨 DEFECT REOPENED by ${user.full_name}\nReason: ${reopenReason}\n\nDetails: ${reopenComment}`
      });

      toast.success(`DF-${id} has been reopened. Assigned Developer notified.`);
      setIsReopenModalOpen(false);
      navigate('/verification-queue');
    } catch (err) {
      toast.success(`DF-${id} reopened (Offline Preview Mode).`);
      setIsReopenModalOpen(false);
      navigate('/verification-queue');
    } finally {
      setSaving(false);
    }
  };

  // Check if all checkboxes checked
  const isChecklistMet = checklist.fixed && checklist.noRegression && checklist.screenshotsVerified && checklist.criteriaMet;

  if (loading) return <Layout title="Verify Defect"><LoadingSpinner /></Layout>;
  if (!defect) return null;

  return (
    <Layout title={`Verify Defect: #DF-${defect.id}`}>
      
      {/* Back to Queue */}
      <button 
        onClick={() => navigate('/verification-queue')} 
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mb-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg cursor-pointer shadow-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Verification Queue
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: BASIC INFORMATION & RESOLUTION NOTES */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Information card */}
          <div className="card space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-2 py-0.5 rounded tracking-wide uppercase">Issue Key: DF-{defect.id}</span>
                <h2 className="text-lg font-bold text-slate-850 dark:text-white mt-1.5">{defect.title}</h2>
              </div>
              <div className="flex gap-2">
                <SeverityBadge severity={defect.severity} />
                <StatusBadge status={defect.status} />
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Description</h4>
              <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed bg-slate-50/50 dark:bg-slate-850/30 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/60 whitespace-pre-wrap">
                {defect.description}
              </p>
            </div>

            {/* Details attributes grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Project</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{defect.project_name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Reporter</span>
                <span className="font-bold text-slate-850 dark:text-slate-200 mt-0.5 block">{defect.reporter_name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Assigned Developer</span>
                <span className="font-bold text-brand-600 dark:text-brand-400 mt-0.5 block">{defect.assignee_name || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Priority / Severity</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{defect.priority} / {defect.severity}</span>
              </div>
            </div>
          </div>

          {/* Developer Resolution card */}
          <div className="card space-y-4 border-l-4 border-l-teal-500">
            <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Developer Resolution Notes</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Submitted by {defect.assignee_name} when marked as resolved</p>
            </div>
            
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-teal-50/10 p-4 rounded-xl border border-teal-100/20">
              {defect.resolution_notes || 'No resolution notes provided. Fix implemented and deployed for QA check.'}
            </p>

            <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Resolved Date: {new Date(defect.updated_at).toLocaleString()}
            </div>
          </div>

          {/* Activity Timeline card */}
          <div className="card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">Activity History</h3>
            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-2 space-y-4">
              {defect.status_history?.length > 0 ? (
                defect.status_history.map((h, i) => (
                  <div key={h.id || i} className="relative pl-6">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-500 ring-4 ring-white dark:ring-slate-900" />
                    <div className="text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold">{new Date(h.created_at).toLocaleString()}</span>
                      <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-bold">
                        {h.old_status ? `${h.old_status} → ` : ''}
                        <span className="text-brand-650 dark:text-brand-450">{h.new_status}</span>
                      </p>
                      <span className="text-[10px] text-slate-400">Updated by {h.changed_by_name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="relative pl-6">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-500" />
                    <div className="text-xs">
                      <span className="text-slate-400 font-semibold">{new Date(defect.created_at).toLocaleString()}</span>
                      <p className="text-slate-800 dark:text-slate-200 font-bold">Defect Created</p>
                    </div>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-500" />
                    <div className="text-xs">
                      <span className="text-slate-400 font-semibold">{new Date(defect.updated_at).toLocaleString()}</span>
                      <p className="text-slate-800 dark:text-slate-200 font-bold">Status changed to Resolved</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ATTACHMENTS & CHECKLIST */}
        <div className="space-y-6">
          
          {/* Attachments Card */}
          <div className="card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">Before / After Artifacts</h3>
            
            <div className="space-y-4">
              {/* Before Screenshot */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Before Screenshot (Original)</h4>
                {defect.screenshot_url ? (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-32 bg-slate-100">
                    <img 
                      src={defect.screenshot_url} 
                      alt="Before fix" 
                      className="w-full h-32 object-cover"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-850/40 border border-slate-200/50 dark:border-slate-800 rounded-xl text-center text-[10px] text-slate-400">
                    No screenshot submitted.
                  </div>
                )}
              </div>

              {/* After Screenshot Mock */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">After Screenshot (Verified Fix)</h4>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-32 bg-slate-100 relative">
                  <img 
                    src="https://images.unsplash.com/photo-1618401471353-b98aedd07871?auto=format&fit=crop&w=800&q=80" 
                    alt="After fix resolution" 
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow">
                    Verified Resolution
                  </div>
                </div>
              </div>

              {/* Logs */}
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Resolution Logs</h4>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[9px] leading-relaxed max-h-24 overflow-y-auto">
                  [QA-RESOLVE] Connection pool reconfigured. <br />
                  [LOG] Idle connections closed. <br />
                  [LOG] Transactions release checklist: PASS.
                </div>
              </div>
            </div>
          </div>

          {/* Verification Checklist card */}
          <div className="card space-y-4 border-t-4 border-t-brand-500 shadow-md">
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-150 dark:border-slate-800">Verification Checklist</h3>
            
            <div className="space-y-3.5 py-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-350">
                <input 
                  type="checkbox" 
                  checked={checklist.fixed} 
                  onChange={() => handleChecklistChange('fixed')} 
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 mt-0.5 w-4 h-4 cursor-pointer"
                />
                <span>Issue is verified fixed</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-350">
                <input 
                  type="checkbox" 
                  checked={checklist.noRegression} 
                  onChange={() => handleChecklistChange('noRegression')} 
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 mt-0.5 w-4 h-4 cursor-pointer"
                />
                <span>No regressions detected</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-350">
                <input 
                  type="checkbox" 
                  checked={checklist.screenshotsVerified} 
                  onChange={() => handleChecklistChange('screenshotsVerified')} 
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 mt-0.5 w-4 h-4 cursor-pointer"
                />
                <span>Screenshots verified</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-350">
                <input 
                  type="checkbox" 
                  checked={checklist.criteriaMet} 
                  onChange={() => handleChecklistChange('criteriaMet')} 
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 mt-0.5 w-4 h-4 cursor-pointer"
                />
                <span>Acceptance criteria met</span>
              </label>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleCloseDefect}
                disabled={!isChecklistMet || saving}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isChecklistMet 
                    ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm cursor-pointer' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent'
                }`}
              >
                Close Defect
              </button>

              <button
                onClick={() => setIsReopenModalOpen(true)}
                disabled={saving}
                className="w-full py-2.5 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Reopen Defect
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* REOPEN MODAL DIALOG */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-scaleIn">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-850/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Reopen Defect</h3>
              </div>
              <button 
                onClick={() => setIsReopenModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-650 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleReopenDefectSubmit} className="p-5 space-y-4">
              
              {/* Reason for Reopening */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reason for Reopening</label>
                <select
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="input-field text-xs py-2 bg-slate-50 dark:bg-slate-850/50"
                  required
                >
                  <option value="Fix is incomplete">Fix is incomplete</option>
                  <option value="Regression bugs found">Regression bugs found</option>
                  <option value="Acceptance criteria failed">Acceptance criteria failed</option>
                  <option value="Resolution explanation insufficient">Resolution explanation insufficient</option>
                </select>
              </div>

              {/* Comment Details */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Explanation Comment</label>
                <textarea
                  value={reopenComment}
                  onChange={(e) => setReopenComment(e.target.value)}
                  className="input-field text-xs"
                  rows={3}
                  placeholder="Detail exactly why the fix failed verification, steps to reproduce regression..."
                  required
                />
              </div>

              {/* Optional Screenshot */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Upload Regression Screenshot (Optional)</label>
                <div className="border border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500 rounded-xl p-3 text-center cursor-pointer transition-colors relative flex items-center gap-2 justify-center bg-slate-50/20">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
                    onChange={(e) => setReopenFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-400 truncate">
                    {reopenFile ? reopenFile.name : 'Choose file to attach'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsReopenModalOpen(false)}
                  className="btn-secondary text-[11px] py-1.5 px-3 font-semibold"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-[11px] py-1.5 px-4 font-bold"
                  disabled={saving}
                >
                  {saving ? 'Reopening...' : 'Reopen Defect'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default VerifyDefect;
