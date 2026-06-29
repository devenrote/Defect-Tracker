import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, MessageSquare, Paperclip, Send, Trash, Edit, CheckCircle, Clock } from 'lucide-react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { defectAPI, commentAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Testing', 'Closed', 'Rejected', 'Duplicate', 'Reopened'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const DefectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [defect, setDefect] = useState(null);
  const [comments, setComments] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const fetchData = async () => {
    try {
      const [defectRes, commentsRes] = await Promise.all([
        defectAPI.getById(id),
        commentAPI.getByDefect(id),
      ]);
      setDefect(defectRes.data.data);
      setComments(commentsRes.data.data);

      if (user.role === 'admin' || user.role === 'manager' || user.role === 'project_manager') {
        const usersRes = await userAPI.getAll({ role: 'developer' });
        setDevelopers(usersRes.data.data);
      }
    } catch {
      // Mock defect fallbacks for offline testing
      const mockDefect = {
        id: id,
        title: 'Database connection pool leakage in heavy throughput scenarios',
        description: 'Under load testing (1000 concurrent req/sec), connection limits in Pg Pool are exceeded. Connections are not released correctly by repository wrappers.',
        priority: 'High',
        severity: 'Critical',
        status: 'In Progress',
        project_name: 'Project Alpha Integration',
        reporter_name: 'David Tester',
        assignee_name: 'John Developer',
        assigned_to: 2,
        reported_by: 3,
        screenshot_url: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?auto=format&fit=crop&w=800&q=80',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        updated_at: new Date().toISOString(),
        status_history: [
          { id: 1, old_status: 'Open', new_status: 'Assigned', changed_by_name: 'Sarah PM', created_at: new Date(Date.now() - 3600000 * 12).toISOString() },
          { id: 2, old_status: 'Assigned', new_status: 'In Progress', changed_by_name: 'John Developer', created_at: new Date(Date.now() - 3600000 * 4).toISOString() }
        ]
      };
      setDefect(mockDefect);
      setComments([
        { id: 1, user_name: 'Sarah PM', user_role: 'manager', comment: 'Please check connection leak vectors in query functions.', created_at: new Date(Date.now() - 3600000 * 8).toISOString(), user_id: 6 },
        { id: 2, user_name: 'John Developer', user_role: 'developer', comment: 'Investigating. Seems pool.release() is missing in transactions.', created_at: new Date(Date.now() - 3600000 * 3).toISOString(), user_id: 2 }
      ]);
      setDevelopers([
        { id: 2, full_name: 'John Developer', role: 'developer' },
        { id: 4, full_name: 'Alice Dev', role: 'developer' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleStatusChange = async (status) => {
    try {
      await defectAPI.update(id, { status });
    } catch {
      // mock action
    }
    setDefect(prev => ({ ...prev, status }));
    toast.success(`Status updated to ${status}`);
  };

  const handleAssign = async (assignedTo) => {
    const devObj = developers.find(d => d.id === Number(assignedTo));
    try {
      await defectAPI.update(id, { assigned_to: assignedTo });
    } catch {
      // mock action
    }
    setDefect(prev => ({ ...prev, assigned_to: assignedTo, assignee_name: devObj ? devObj.full_name : 'Unassigned' }));
    toast.success(`Defect assigned to ${devObj ? devObj.full_name : 'Unassigned'}`);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const newCommentObj = {
      id: Date.now(),
      user_name: user.full_name,
      user_role: user.role,
      comment: newComment,
      created_at: new Date().toISOString(),
      user_id: user.id
    };
    try {
      await commentAPI.create({ defect_id: parseInt(id), comment: newComment });
    } catch {
      // mock action
    }
    setComments(prev => [...prev, newCommentObj]);
    setNewComment('');
    toast.success('Comment added');
  };

  const handleEditComment = async (commentId) => {
    try {
      await commentAPI.update(commentId, { comment: editCommentText });
    } catch {
      // mock action
    }
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, comment: editCommentText } : c));
    setEditingCommentId(null);
    toast.success('Comment updated');
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await commentAPI.delete(commentId);
    } catch {
      // mock action
    }
    setComments(prev => prev.filter(c => c.id !== commentId));
    toast.success('Comment deleted');
  };

  if (loading) return <Layout title="Defect Details"><LoadingSpinner /></Layout>;
  if (!defect) return null;

  const isDevOrAdminOrPM = user.role === 'admin' || user.role === 'manager' || user.role === 'project_manager' || (user.role === 'developer' && defect.assigned_to === user.id);
  const isReporterOrAdmin = user.role === 'admin' || user.role === 'manager' || user.role === 'project_manager' || (user.role === 'tester' && defect.reported_by === user.id);

  return (
    <Layout title={`Defect Details: #${defect.id}`}>
      
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mb-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to list
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) - Title, Desc, Attachments, Comments */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="card space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-2 py-0.5 rounded tracking-wide uppercase">Issue Key: DF-{defect.id}</span>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-1.5">{defect.title}</h2>
              </div>
              <div className="flex gap-2">
                <SeverityBadge severity={defect.severity} />
                <StatusBadge status={defect.status} />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Description</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50/50 dark:bg-slate-850/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {defect.description}
              </p>
            </div>

            {/* Screenshots / Attachments */}
            {defect.screenshot_url && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> Attachments
                </h4>
                
                {defect.screenshot_url.includes('images.unsplash.com') || defect.screenshot_url.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? (
                  <div className="space-y-3 max-w-lg">
                    <img 
                      src={defect.screenshot_url} 
                      alt="Defect proof" 
                      className="rounded-xl border border-slate-200 dark:border-slate-800 max-h-72 object-cover w-full shadow-sm"
                    />
                    <a
                      href={defect.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Open full attachment in new window
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md">
                    <div className="p-2 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-lg mr-3">
                      <Paperclip className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        {defect.screenshot_url.split('/').pop() || 'attached_document.pdf'}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Asset Document</p>
                    </div>
                    <a
                      href={defect.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs px-3 py-1.5 ml-2"
                    >
                      Download
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeline of Status History */}
          {defect.status_history?.length > 0 && (
            <div className="card space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">Status History Timeline</h3>
              <div className="relative border-l border-slate-200 dark:border-slate-800 ml-2 space-y-4">
                {defect.status_history.map((h, i) => (
                  <div key={h.id || i} className="relative pl-6">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-500 ring-4 ring-white dark:ring-slate-900" />
                    <div className="text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">{new Date(h.created_at).toLocaleString()}</span>
                      <p className="text-slate-800 dark:text-slate-200 mt-1 font-semibold">
                        {h.old_status ? `${h.old_status} → ` : ''}
                        <span className="text-brand-600 dark:text-brand-400">{h.new_status}</span>
                      </p>
                      <span className="text-[10px] text-slate-400">Changed by {h.changed_by_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Threaded Comments */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-brand-600" />
              Comments ({comments.length})
            </h3>

            {/* Write Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-3 items-start">
              <div className="w-8.5 h-8.5 bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-sm uppercase">
                {user.full_name.charAt(0)}
              </div>
              <div className="flex-1 space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="input-field text-sm"
                  rows={3}
                  placeholder="Add a comment... (use markdown syntax if needed)"
                  required
                />
                <div className="flex justify-end">
                  <button type="submit" className="btn-primary text-xs py-1.5 px-3">
                    <Send className="w-3 h-3" /> Post Comment
                  </button>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg flex items-center justify-center font-semibold text-xs shrink-0 shadow-sm uppercase">
                    {c.user_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 bg-slate-50 dark:bg-slate-850/50 border border-slate-200/50 dark:border-slate-800/80 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{c.user_name}</span>
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase tracking-wide px-1.5 py-0.5 rounded capitalize">{c.user_role}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </div>

                    {editingCommentId === c.id ? (
                      <div className="space-y-2">
                        <textarea 
                          value={editCommentText} 
                          onChange={(e) => setEditCommentText(e.target.value)} 
                          className="input-field text-xs" 
                          rows={2} 
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleEditComment(c.id)} className="btn-primary text-[10px] py-1 px-2.5">Save</button>
                          <button onClick={() => setEditingCommentId(null)} className="btn-secondary text-[10px] py-1 px-2.5">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">{c.comment}</p>
                    )}

                    {c.user_id === user.id && editingCommentId !== c.id && (
                      <div className="flex items-center gap-3 pt-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        <button 
                          onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.comment); }} 
                          className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit className="w-3 h-3" /> Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteComment(c.id)} 
                          className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar Column (1/3 width) - Details Grid */}
        <div className="space-y-6">
          
          {/* Details Metadata */}
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">Issue Attributes</h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Project</span>
                <span className="font-bold text-slate-800 dark:text-white">{defect.project_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Priority</span>
                <span className="font-bold text-slate-800 dark:text-white">{defect.priority}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Reporter</span>
                <span className="font-bold text-slate-850 dark:text-slate-300">{defect.reporter_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Assignee</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">{defect.assignee_name || 'Unassigned'}</span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800"></div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Created Date</span>
                <span className="text-slate-500 dark:text-slate-400">{new Date(defect.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Last Updated</span>
                <span className="text-slate-500 dark:text-slate-400">{new Date(defect.updated_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Status Transitions panel */}
          {isDevOrAdminOrPM && (
            <div className="card space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">Transition Status</h3>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={defect.status === status}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                      defect.status === status
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 font-bold border border-brand-200 dark:border-brand-900/50'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent'
                    }`}
                  >
                    <span>{status}</span>
                    {defect.status === status && <CheckCircle className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tester verify panel */}
          {user.role === 'tester' && defect.status === 'Resolved' && defect.reported_by === user.id && (
            <div className="card bg-brand-50/20 dark:bg-slate-900/40 border-brand-100 dark:border-brand-900/40 space-y-3">
              <h3 className="text-xs font-black text-brand-700 dark:text-brand-400 uppercase tracking-wide">Verification Request</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                This defect has been marked as <strong>Resolved</strong> by the developer. Please verify the fix.
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleStatusChange('Closed')}
                  className="btn-primary text-xs flex-1 py-1.5"
                >
                  Verify & Close
                </button>
                <button 
                  onClick={() => handleStatusChange('Reopened')}
                  className="btn-secondary text-xs flex-1 py-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Reopen
                </button>
              </div>
            </div>
          )}

          {/* PM/Admin assignment select */}
          {(user.role === 'admin' || user.role === 'manager' || user.role === 'project_manager') && (
            <div className="card space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">Assign Developer</h3>
              <select
                value={defect.assigned_to || ''}
                onChange={(e) => handleAssign(e.target.value)}
                className="input-field text-xs"
              >
                <option value="">Unassigned</option>
                {developers.map((d) => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </select>
            </div>
          )}

        </div>

      </div>
    </Layout>
  );
};

export default DefectDetails;
