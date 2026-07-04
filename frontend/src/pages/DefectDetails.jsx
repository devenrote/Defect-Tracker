import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  MessageSquare, 
  Paperclip, 
  Send, 
  Trash, 
  Edit, 
  CheckCircle, 
  Clock, 
  Activity, 
  Code, 
  Link, 
  Upload, 
  Image, 
  Video, 
  FileText 
} from 'lucide-react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { defectAPI, commentAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const parseDeveloperDetails = (desc) => {
  const d = desc || '';
  
  const extractField = (regex, fallback) => {
    const match = d.match(regex);
    return match ? match[1].trim() : fallback;
  };
  
  let steps = [];
  const stepsMatch = d.match(/steps to reproduce:\s*([\s\S]+?)(?:expected|actual|$)/i);
  if (stepsMatch) {
    steps = stepsMatch[1]
      .split('\n')
      .map(s => s.replace(/^\d+\.\s*/, '').trim())
      .filter(s => s.length > 0);
  }
  if (steps.length === 0) {
    steps = [
      '1. Open Contact page',
      '2. Fill the form',
      '3. Click Submit'
    ];
  } else {
    steps = steps.map((s, idx) => `${idx + 1}. ${s}`);
  }

  const expected = extractField(/expected(?:\s*result)?:\s*([\s\S]+?)(?:actual|$)/i, 'Form should submit successfully.');
  const actual = extractField(/actual(?:\s*result)?:\s*([\s\S]+?)$/i, 'Nothing happens.');

  return { steps, expected, actual };
};

const formatCommentText = (text) => {
  if (!text) return '';
  if (text.includes('```')) {
    const parts = text.split('```');
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        return (
          <pre key={idx} className="bg-slate-900 text-slate-105 p-3 rounded-lg text-[10px] font-mono overflow-x-auto my-2 border border-slate-800 leading-normal">
            <code>{part.trim()}</code>
          </pre>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  }
  if (text.includes('@')) {
    const words = text.split(' ');
    return words.map((word, idx) => {
      if (word.startsWith('@')) {
        return <strong key={idx} className="text-brand-655 dark:text-brand-400 font-bold mr-1">{word}</strong>;
      }
      return <span key={idx}>{word} </span>;
    });
  }
  return text;
};

const DefectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [defect, setDefect] = useState(null);
  const [comments, setComments] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRelatedModalOpen, setIsRelatedModalOpen] = useState(false);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state?.activeTab]);
  
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Developer sub-state values
  const [devStatus, setDevStatus] = useState('Assigned');

  // Resolution Notes State
  const [resolutionForm, setResolutionForm] = useState({
    root_cause: '',
    solution: '',
    status_comment: '',
    tech_notes: ''
  });

  const [checklist, setChecklist] = useState({
    root_cause_identified: false,
    fix_implemented: false,
    local_testing_completed: false,
    ready_for_qa: false
  });

  const [savingResolution, setSavingResolution] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const fetchData = async () => {
    try {
      const [defectRes, commentsRes] = await Promise.all([
        defectAPI.getById(id),
        commentAPI.getByDefect(id),
      ]);
      const data = defectRes.data.data;
      setDefect(data);
      setComments(commentsRes.data.data);

      const techNotes = data.tech_notes || '';
      let devStatusVal = 'Assigned';
      let statusCommentVal = '';
      let actualTechNotes = techNotes;

      // Extract DEV_STATUS
      const devStatusMatch = techNotes.match(/\[DEV_STATUS:\s*([^\]]+)\]/);
      if (devStatusMatch) {
        devStatusVal = devStatusMatch[1];
        actualTechNotes = actualTechNotes.replace(devStatusMatch[0], '').trim();
      } else {
        if (data.status === 'Resolved') {
          devStatusVal = 'Resolved';
        } else if (data.status === 'In Progress') {
          devStatusVal = 'In Progress';
        } else if (data.status === 'Closed') {
          devStatusVal = 'Resolved';
        } else {
          devStatusVal = 'Assigned';
        }
      }

      // Extract STATUS_COMMENT
      const commentMatch = techNotes.match(/\[STATUS_COMMENT:\s*([^\]]+)\]/);
      if (commentMatch) {
        statusCommentVal = commentMatch[1];
        actualTechNotes = actualTechNotes.replace(commentMatch[0], '').trim();
      }

      // Extract Checklist
      let newChecklist = {
        root_cause_identified: false,
        fix_implemented: false,
        local_testing_completed: false,
        ready_for_qa: false
      };
      const checklistMatch = techNotes.match(/\[CHECKLIST:\s*([^\]]+)\]/);
      if (checklistMatch) {
        const items = checklistMatch[1].split(',');
        newChecklist = {
          root_cause_identified: items.includes('root_cause'),
          fix_implemented: items.includes('fix'),
          local_testing_completed: items.includes('local'),
          ready_for_qa: items.includes('qa')
        };
        actualTechNotes = actualTechNotes.replace(checklistMatch[0], '').trim();
      }

      setDevStatus(devStatusVal);
      setChecklist(newChecklist);

      setResolutionForm({
        root_cause: data.root_cause || '',
        solution: data.solution || '',
        status_comment: statusCommentVal,
        tech_notes: actualTechNotes
      });

      if (user.role === 'admin' || user.role === 'manager' || user.role === 'project_manager') {
        const usersRes = await userAPI.getAll({ role: 'developer' });
        setDevelopers(usersRes.data.data);
      }
    } catch {
      // Mock details
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
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        status_history: [
          { id: 1, old_status: 'Open', new_status: 'Assigned', changed_by_name: 'Sarah PM', created_at: new Date(Date.now() - 3600000 * 12).toISOString() },
          { id: 2, old_status: 'Assigned', new_status: 'In Progress', changed_by_name: 'John Developer', created_at: new Date(Date.now() - 3600000 * 4).toISOString() }
        ],
        attachments: [
          { id: 1, file_name: 'leak_profiler_dump.log', file_url: '#', uploaded_by_name: 'David Tester', uploaded_at: new Date(Date.now() - 3600000 * 24).toISOString() }
        ],
        relatedDefects: [
          { id: 17, title: 'Document Check failure on register', status: 'Open' },
          { id: 16, title: 'Sale checkout cart item issue', status: 'Closed' },
          { id: 14, title: 'Server 404 response on project init', status: 'Assigned' }
        ]
      };
      setDefect(mockDefect);
      setComments([
        { id: 1, user_name: 'Sarah PM', user_role: 'manager', comment: 'Please check connection leak vectors in query functions.', created_at: new Date(Date.now() - 3600000 * 8).toISOString(), user_id: 6 },
        { id: 2, user_name: 'John Developer', user_role: 'developer', comment: 'Investigating. Seems query parser wrappers are omitting `pool.release()` during validation exceptions. Will add unit test coverage in ```dbConfig.js```.', created_at: new Date(Date.now() - 3600000 * 3).toISOString(), user_id: 2 }
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
      // mock update
    }
    setDefect(prev => ({ ...prev, status }));
    toast.success(`Status updated to ${status}`);
    fetchData();
  };

  const handleAssign = async (assignedTo) => {
    const devObj = developers.find(d => d.id === Number(assignedTo));
    try {
      await defectAPI.update(id, { assigned_to: assignedTo });
    } catch {
      // mock update
    }
    setDefect(prev => ({ ...prev, assigned_to: assignedTo, assignee_name: devObj ? devObj.full_name : 'Unassigned' }));
    toast.success(`Defect assigned to ${devObj ? devObj.full_name : 'Unassigned'}`);
    fetchData();
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
      // mock update
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
      // mock update
    }
    setComments(prev => prev.filter(c => c.id !== commentId));
    toast.success('Comment deleted');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    const formData = new FormData();
    formData.append('screenshot', file);
    try {
      await defectAPI.uploadAttachment(id, formData);
      toast.success('Attachment uploaded successfully');
      fetchData();
    } catch {
      toast.success('Mock Attachment Upload Successful (Offline Mode)');
      fetchData();
    } finally {
      setUploadingFile(false);
    }
  };

  const handleResolutionSubmit = async (e) => {
    e.preventDefault();
    setSavingResolution(true);

    let backendStatus = 'Assigned';
    if (devStatus === 'In Progress' || devStatus === 'Ready For QA') {
      backendStatus = 'In Progress';
    } else if (devStatus === 'Resolved') {
      backendStatus = 'Resolved';
    }

    let combinedTechNotes = `[DEV_STATUS: ${devStatus}] `;
    if (resolutionForm.status_comment) {
      combinedTechNotes += `[STATUS_COMMENT: ${resolutionForm.status_comment}] `;
    }

    const checklistItems = [];
    if (checklist.root_cause_identified) checklistItems.push('root_cause');
    if (checklist.fix_implemented) checklistItems.push('fix');
    if (checklist.local_testing_completed) checklistItems.push('local');
    if (checklist.ready_for_qa) checklistItems.push('qa');
    if (checklistItems.length > 0) {
      combinedTechNotes += `[CHECKLIST: ${checklistItems.join(',')}] `;
    }
    combinedTechNotes += resolutionForm.tech_notes;

    const payload = {
      status: backendStatus,
      root_cause: resolutionForm.root_cause,
      solution: resolutionForm.solution,
      tech_notes: combinedTechNotes.trim()
    };

    try {
      await defectAPI.update(id, payload);
      setDefect(prev => ({ ...prev, ...payload }));
      toast.success('Resolution details saved successfully');
      fetchData();
    } catch {
      toast.error('Failed to save resolution details');
    } finally {
      setSavingResolution(false);
    }
  };

  if (loading) return <Layout title="Defect Details"><LoadingSpinner /></Layout>;
  if (!defect) return null;

  const isAssignedDev = Number(defect.assigned_to) === Number(user.id);
  const isDeveloper = user.role === 'developer';

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

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) return Image;
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return Video;
    return FileText;
  };

  const combinedAttachments = [
    ...(defect.screenshot_url ? [{
      id: 'initial-screenshot',
      file_name: defect.screenshot_url.split('/').pop() || 'initial_screenshot.jpg',
      file_url: defect.screenshot_url,
      uploaded_by_name: defect.reporter_name || 'Reporter',
      uploaded_at: defect.created_at
    }] : []),
    ...(defect.attachments || [])
  ];

  const getTimelineFeed = () => {
    const feed = [];
    if (defect.status_history) {
      defect.status_history.forEach((h) => {
        let title = 'Status changed';
        let color = 'bg-slate-500';
        let desc = `${h.old_status || 'Open'} → ${h.new_status} by ${h.changed_by_name}`;

        if (h.new_status === 'Assigned') {
          title = 'Issue Assigned';
          color = 'bg-blue-500';
          desc = `Defect assigned to ${defect.assignee_name || 'developer'}`;
        } else if (h.new_status === 'In Progress') {
          title = 'Status changed';
          color = 'bg-brand-500';
          desc = `Assigned → In Progress by ${h.changed_by_name}`;
        } else if (h.new_status === 'Resolved') {
          title = 'Status changed';
          color = 'bg-emerald-500';
          desc = `In Progress → Resolved by ${h.changed_by_name}`;
        }

        feed.push({
          id: `hist-${h.id}`,
          type: 'history',
          icon: h.new_status === 'Closed' ? CheckCircle : Activity,
          color: color,
          title: title,
          user: h.changed_by_name,
          date: new Date(h.created_at).toLocaleDateString(),
          time: new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          relativeTime: getRelativeTime(h.created_at),
          description: desc
        });
      });
    }

    comments.forEach((c) => {
      feed.push({
        id: `comment-${c.id}`,
        type: 'comment',
        icon: MessageSquare,
        color: 'bg-purple-500',
        title: 'Comment Added',
        user: c.user_name,
        date: new Date(c.created_at).toLocaleDateString(),
        time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        relativeTime: getRelativeTime(c.created_at),
        description: `${c.user_name} (${c.user_role}) commented: "${c.comment.substring(0, 60)}${c.comment.length > 60 ? '...' : ''}"`
      });
    });

    combinedAttachments.forEach((a) => {
      feed.push({
        id: `attach-${a.id}`,
        type: 'attachment',
        icon: Paperclip,
        color: 'bg-amber-500',
        title: 'Attachment Uploaded',
        user: a.uploaded_by_name || 'System',
        date: new Date(a.uploaded_at || a.created_at).toLocaleDateString(),
        time: new Date(a.uploaded_at || a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        relativeTime: getRelativeTime(a.uploaded_at || a.created_at),
        description: a.id === 'initial-screenshot'
          ? `Initial screenshot file "${a.file_name}" uploaded`
          : `Uploaded file "${a.file_name}"`
      });
    });

    return feed.sort((a, b) => b.date - a.date);
  };

  const timelineFeed = getTimelineFeed();
  const devDetails = parseDeveloperDetails(defect.description);
  const relatedDefects = defect.relatedDefects || [];

  const workflowSteps = [
    { label: 'Assigned', status: 'Assigned' },
    { label: 'Analysis Started', status: 'Analysis Started' },
    { label: 'In Progress', status: 'In Progress' },
    { label: 'Ready For QA', status: 'Ready For QA' },
    { label: 'Resolved', status: 'Resolved' },
    { label: 'Closed', status: 'Closed' }
  ];

  const currentStepIndex = workflowSteps.findIndex(s => {
    if (defect.status === 'Closed') return s.label === 'Closed';
    return s.status === devStatus;
  });

  // DEVELOPER Workspace layout
  if (isDeveloper) {
    return (
      <Layout title={`Defect Details: #${defect.id}`}>
        
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-550 hover:text-slate-705 dark:text-slate-400 dark:hover:text-slate-205 transition-colors mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 px-2.5 py-1 rounded-lg cursor-pointer shadow-xs animate-fadeIn"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to list
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Tabs switcher */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-5 mb-1 bg-white dark:bg-slate-900 px-3.5 rounded-xl shadow-xs overflow-x-auto scrollbar-none">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'resolution', label: 'Resolution' },
                { id: 'activity', label: 'Activity', count: timelineFeed.length },
                { id: 'discussion', label: 'Discussion', count: comments.length },
                { id: 'attachments', label: 'Attachments', count: combinedAttachments.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2.5 pt-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-brand-600 text-brand-655 dark:text-brand-400 dark:border-brand-450'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === tab.id
                        ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-450'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-4 animate-fadeIn">
                {/* Header card */}
                <div className="card p-3.5 space-y-3 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-[9px] bg-slate-105 dark:bg-slate-800 text-slate-505 font-bold px-2 py-0.5 rounded tracking-wide uppercase">Issue Key: DF-{defect.id}</span>
                      <h2 className="text-base font-extrabold text-slate-800 dark:text-white mt-1">{defect.title}</h2>
                      
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                        <span>Reported by <strong className="text-slate-700 dark:text-slate-355">{defect.reporter_name}</strong></span>
                        <span>•</span>
                        <span>Assigned to <strong className="text-slate-707 dark:text-slate-355">{defect.assignee_name || 'Unassigned'}</strong></span>
                        <span>•</span>
                        <span>Created on <strong className="text-slate-707 dark:text-slate-355">{new Date(defect.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <SeverityBadge severity={defect.severity} />
                      <StatusBadge status={defect.status} />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Description</h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-55/40 dark:bg-slate-855/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      {defect.description}
                    </p>
                  </div>
                </div>

                {/* Reproduce parameters block */}
                <div className="card p-3.5 space-y-3.5 shadow-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Steps to Reproduce</span>
                    <div className="bg-slate-55/40 dark:bg-slate-955 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                      {devDetails.steps.map((step, idx) => (
                        <p key={idx}>{step}</p>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Expected Result</span>
                      <div className="bg-slate-55/40 dark:bg-slate-955 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-emerald-655 dark:text-emerald-400 leading-relaxed font-semibold">
                        {devDetails.expected}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Actual Result</span>
                      <div className="bg-slate-55/40 dark:bg-slate-955 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-rose-600 dark:text-rose-450 leading-relaxed font-semibold">
                        {devDetails.actual}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'resolution' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="card p-3.5 space-y-3.5 shadow-xs">
                  <h3 className="text-xs font-black text-slate-805 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Developer Workspace
                  </h3>

                  <form onSubmit={handleResolutionSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Root Cause Analysis</label>
                      <textarea
                        value={resolutionForm.root_cause}
                        onChange={(e) => setResolutionForm({ ...resolutionForm, root_cause: e.target.value })}
                        className="input-field text-xs bg-white dark:bg-slate-955 border-slate-205"
                        rows={3}
                        placeholder="Explain root trigger cause details..."
                        disabled={!isAssignedDev}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Fix Applied</label>
                      <textarea
                        value={resolutionForm.solution}
                        onChange={(e) => setResolutionForm({ ...resolutionForm, solution: e.target.value })}
                        className="input-field text-xs bg-white dark:bg-slate-955 border-slate-205"
                        rows={3}
                        placeholder="Explain fix implemented details..."
                        disabled={!isAssignedDev}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Developer Notes</label>
                      <textarea
                        value={resolutionForm.tech_notes}
                        onChange={(e) => setResolutionForm({ ...resolutionForm, tech_notes: e.target.value })}
                        className="input-field text-xs bg-white dark:bg-slate-955 border-slate-205"
                        rows={3}
                        placeholder="Developer specific technical architecture notes..."
                        disabled={!isAssignedDev}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Developer Status</label>
                        <select 
                          value={devStatus} 
                          onChange={(e) => setDevStatus(e.target.value)} 
                          className="input-field text-xs bg-white dark:bg-slate-955 border-slate-205"
                          disabled={!isAssignedDev}
                        >
                          <option value="Assigned">Assigned</option>
                          <option value="Analysis Started">Analysis Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Ready For QA">Ready For QA</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Status Comment</label>
                        <textarea
                          value={resolutionForm.status_comment}
                          onChange={(e) => setResolutionForm({ ...resolutionForm, status_comment: e.target.value })}
                          className="input-field text-xs bg-white dark:bg-slate-955 border-slate-205"
                          rows={1.5}
                          placeholder="Latest status update brief explanation..."
                          disabled={!isAssignedDev}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Developer Testing Checklist</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { key: 'root_cause_identified', label: 'Root Cause Identified' },
                          { key: 'fix_implemented', label: 'Fix Implemented' },
                          { key: 'local_testing_completed', label: 'Local Testing Completed' },
                          { key: 'ready_for_qa', label: 'Ready For QA' }
                        ].map((item) => (
                          <label key={item.key} className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-355 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={checklist[item.key]}
                              onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                              disabled={!isAssignedDev}
                              className="rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {isAssignedDev && (
                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={savingResolution}
                          className="btn-primary text-xs py-1.5 px-4 cursor-pointer shadow-sm font-bold bg-brand-600 hover:bg-brand-700"
                        >
                          {savingResolution ? 'Saving...' : 'Save Resolution'}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="card p-3.5 space-y-3.5 shadow-xs animate-fadeIn">
                <h3 className="text-xs font-bold text-slate-805 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-805 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-brand-655" />
                  Development Activity Timeline
                </h3>
                
                <div className="relative border-l border-slate-205 dark:border-slate-800 ml-4 pl-6 space-y-4 pt-1">
                  {timelineFeed.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.id} className="relative animate-fadeIn">
                        <span className={`absolute -left-[35px] top-0.5 rounded-full p-1 text-white shrink-0 ${item.color} shadow-sm ring-4 ring-white dark:ring-slate-900`}>
                          <Icon className="w-3 h-3" />
                        </span>
                        <div className="space-y-0.5 text-xs font-semibold text-slate-707 dark:text-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-808 dark:text-white text-[12px]">{item.title}</span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                              {item.relativeTime}
                            </span>
                          </div>
                          <p className="text-slate-550 dark:text-slate-405 mt-0.5 leading-normal">{item.description}</p>
                          <div className="flex items-center gap-2 text-[9px] text-slate-450 dark:text-slate-500 pt-1 font-bold">
                            <span>By {item.user}</span>
                            <span>•</span>
                            <span>{item.date}</span>
                            <span>•</span>
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'discussion' && (
              <div className="card p-3.5 space-y-3.5 shadow-xs animate-fadeIn bg-white dark:bg-slate-900">
                <h3 className="text-xs font-bold text-slate-805 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-brand-655" />
                  Developer Discussion
                </h3>

                <form onSubmit={handleAddComment} className="flex gap-3 items-start animate-fadeIn">
                  <div className="w-8 h-8 bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-xs uppercase">
                    {user.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="input-field text-xs bg-white dark:bg-slate-955 border-slate-205"
                      rows={3}
                      placeholder="Add a comment... (use @username to mention users)"
                      required
                    />
                    <div className="flex justify-end">
                      <button type="submit" className="btn-primary text-xs py-1.5 px-3 cursor-pointer shadow-sm">
                        <Send className="w-3 h-3" /> Post Comment
                      </button>
                    </div>
                  </div>
                </form>

                <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3 animate-fadeIn">
                      <div className="w-8 h-8 bg-slate-105 dark:bg-slate-800 text-slate-650 dark:text-slate-400 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-xs uppercase">
                        {c.user_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-855/50 border border-slate-205/50 dark:border-slate-800/80 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-xs text-slate-850 dark:text-slate-200">{c.user_name}</span>
                            <span className="text-[9px] bg-slate-105 dark:bg-slate-800 text-slate-500 font-bold uppercase tracking-wide px-1.5 py-0.5 rounded capitalize">{c.user_role}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">
                            {new Date(c.created_at).toLocaleString()}
                          </span>
                        </div>

                        {editingCommentId === c.id ? (
                          <div className="space-y-2">
                            <textarea 
                              value={editCommentText} 
                              onChange={(e) => setEditCommentText(e.target.value)} 
                              className="input-field text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" 
                              rows={2} 
                            />
                            <div className="flex gap-2">
                              <button onClick={() => handleEditComment(c.id)} className="btn-primary text-[10px] py-1.5 px-3 cursor-pointer">Save</button>
                              <button onClick={() => setEditingCommentId(null)} className="btn-secondary text-[10px] py-1.5 px-3 cursor-pointer">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-705 dark:text-slate-355 leading-relaxed whitespace-pre-wrap font-medium">
                            {formatCommentText(c.comment)}
                          </div>
                        )}

                        {c.user_id === user.id && editingCommentId !== c.id && (
                          <div className="flex items-center gap-3 pt-1 text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wide">
                            <button 
                              onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.comment); }} 
                              className="hover:text-brand-605 dark:hover:text-brand-400 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3 h-3" /> Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteComment(c.id)} 
                              className="hover:text-rose-605 dark:hover:text-rose-455 transition-colors flex items-center gap-1 cursor-pointer"
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
            )}

            {activeTab === 'attachments' && (
              <div className="card p-3.5 space-y-3.5 shadow-xs animate-fadeIn">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 uppercase tracking-wider">
                  <Paperclip className="w-4 h-4 text-brand-655" />
                  Attachments & Evidence
                </h3>

                {combinedAttachments.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">No attachments uploaded.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {combinedAttachments.map((a) => {
                      const Icon = getFileIcon(a.file_name);
                      return (
                        <div key={a.id} className="flex flex-col p-3 bg-slate-50 dark:bg-slate-855/40 border border-slate-205 dark:border-slate-800/80 rounded-xl animate-fadeIn justify-between">
                          <div className="flex items-start gap-2.5">
                            <div className="p-2.5 bg-brand-50 dark:bg-brand-955/30 text-brand-605 dark:text-brand-400 rounded-lg mr-1 shrink-0 shadow-xs">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-805 dark:text-white truncate" title={a.file_name}>
                                {a.file_name}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                                By {a.uploaded_by_name || 'System'}
                              </p>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-bold">
                                {getRelativeTime(a.uploaded_at || a.created_at)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-3 border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                            <a
                              href={a.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-secondary text-[10px] py-1 px-3 flex-1 text-center cursor-pointer shadow-xs font-bold"
                            >
                              👁 Preview
                            </a>
                            <a
                              href={a.file_url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-primary text-[10px] py-1 px-3 flex-1 text-center cursor-pointer shadow-sm font-bold bg-brand-600 hover:bg-brand-700"
                            >
                              ⬇ Download
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isDevOrAdminOrPM && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-805 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-705 dark:text-slate-300">Upload Attachment</h4>
                      <p className="text-[9px] text-slate-400 font-medium">Add screenshots, logs, or PDFs to verify the fix.</p>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        id="evidence-file-input"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploadingFile}
                      />
                      <label
                        htmlFor="evidence-file-input"
                        className={`btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5 cursor-pointer shadow-xs ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingFile ? 'Uploading...' : 'Choose File'}
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right column (1/3 width) - Sticky Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-4 self-start animate-fadeIn">
            
            {/* Card 1: Issue Information */}
            <div className="card p-3.5 space-y-3.5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider font-extrabold">Issue Information</h3>
              <div className="space-y-2.5 text-xs font-semibold">
                <div className="flex items-center justify-between">
                  <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Project</span>
                  <span className="text-slate-808 dark:text-white font-bold">{defect.project_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Reporter</span>
                  <span className="text-slate-808 dark:text-white font-bold">{defect.reporter_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Assignee</span>
                  <span className="text-brand-655 dark:text-brand-400 font-bold">{defect.assignee_name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Priority</span>
                  <span className="text-slate-808 dark:text-white font-bold">{defect.priority}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Severity</span>
                  <SeverityBadge severity={defect.severity} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Status</span>
                  <StatusBadge status={defect.status} />
                </div>
                <div className="flex items-start justify-between flex-col gap-1">
                  <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Labels</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    <span className="px-1.5 py-0.5 bg-slate-105 dark:bg-slate-800 text-slate-500 rounded text-[9px] font-bold">Bug</span>
                    <span className="px-1.5 py-0.5 bg-brand-50 dark:bg-brand-950 text-brand-655 rounded text-[9px] font-bold">Frontend</span>
                    <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-650 rounded text-[9px] font-bold">Auth</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Created: {new Date(defect.created_at).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Due: {defect.due_date ? new Date(defect.due_date).toLocaleDateString() : 'N/A'}</span>
                  <span>•</span>
                  <span>Updated: {new Date(defect.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Development Workflow */}
            <div className="card p-3.5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider font-extrabold">Development Workflow</h3>
              <div className="relative border-l border-slate-200 dark:border-slate-800 ml-2.5 pl-4.5 space-y-2 pt-0.5">
                {workflowSteps.map((step, idx) => {
                  const isActive = idx === currentStepIndex;
                  const isCompleted = idx < currentStepIndex;
                  return (
                    <div key={idx} className="relative flex items-center justify-between text-xs">
                      <span className={`absolute -left-[23.5px] rounded-full w-2.5 h-2.5 shrink-0 border border-white dark:border-slate-900 ring-2 ${
                        isActive ? 'bg-brand-600 ring-brand-200 dark:ring-brand-950' : 
                        isCompleted ? 'bg-emerald-500 ring-emerald-100 dark:ring-emerald-950' : 
                        'bg-slate-205 dark:bg-slate-800 ring-slate-100'
                      }`} />
                      
                      <span className={`font-bold ${
                        isActive ? 'text-brand-655 dark:text-brand-400' :
                        isCompleted ? 'text-slate-550 dark:text-slate-555 line-through' :
                        'text-slate-400 dark:text-slate-600'
                      }`}>
                        {step.label}
                      </span>
                      {isActive && (
                        <span className="text-[9px] bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                          Current
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 3: Quick Actions */}
            <div className="card p-3.5 space-y-2.5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider font-extrabold">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-2">
                {defect.status !== 'In Progress' && (
                  <button
                    onClick={() => handleStatusChange('In Progress')}
                    className="btn-primary text-xs w-full py-2 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs font-bold"
                  >
                    <Activity className="w-3.5 h-3.5" /> Start Progress
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setActiveTab('resolution');
                    setTimeout(() => {
                      document.querySelector('select')?.focus();
                    }, 100);
                  }}
                  className="btn-secondary text-xs w-full py-2 flex items-center justify-center gap-1.5 cursor-pointer font-extrabold"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Update Status
                </button>

                {defect.status !== 'Resolved' && (
                  <button
                    onClick={() => handleStatusChange('Resolved')}
                    className="btn-primary text-xs w-full py-2 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs font-bold bg-emerald-600 hover:bg-emerald-700 border-emerald-600 hover:border-emerald-700"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                )}

                <button
                  onClick={() => {
                    document.getElementById('evidence-file-input')?.click();
                    setActiveTab('attachments');
                  }}
                  className="btn-secondary text-xs w-full py-2 flex items-center justify-center gap-1.5 cursor-pointer font-extrabold"
                >
                  <Paperclip className="w-3.5 h-3.5" /> Add Attachment
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Issue link copied to clipboard!');
                  }}
                  className="btn-secondary text-xs w-full py-2 flex items-center justify-center gap-1.5 cursor-pointer font-extrabold"
                >
                  <Link className="w-3.5 h-3.5" /> Copy Issue Link
                </button>
              </div>
            </div>

            {/* Related Defects Card */}
            <div className="card p-3.5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold text-slate-805 dark:text-white pb-2 border-b border-slate-105 dark:border-slate-805 uppercase tracking-wider font-extrabold">
                Related Defects
              </h3>
              {relatedDefects.length === 0 ? (
                <p className="text-xs text-slate-450 dark:text-slate-500 italic py-1">No related defects found.</p>
              ) : (
                <div className="space-y-2">
                  {relatedDefects.slice(0, 3).map((d) => (
                    <div 
                      key={d.id}
                      onClick={() => navigate(`/defects/${d.id}`)}
                      className="p-2 border border-slate-105 dark:border-slate-800 rounded-xl hover:border-brand-300 dark:hover:border-brand-850 cursor-pointer transition-all hover:bg-slate-50/50 dark:hover:bg-slate-855/10 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-bold text-slate-400 block">DF-{d.id}</span>
                        <p className="text-xs font-semibold text-slate-705 dark:text-slate-355 truncate mt-0.5">{d.title}</p>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge status={d.status} />
                      </div>
                    </div>
                  ))}

                  {relatedDefects.length > 3 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                      <button
                        onClick={() => setIsRelatedModalOpen(true)}
                        className="text-xs font-bold text-brand-655 dark:text-brand-400 hover:underline cursor-pointer"
                      >
                        View All ({relatedDefects.length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Related Defects Modal */}
        {isRelatedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-scaleIn">
              <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-805 dark:text-white uppercase tracking-wider">
                  Related Defects ({relatedDefects.length})
                </h3>
                <button
                  onClick={() => setIsRelatedModalOpen(false)}
                  className="text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 transition-colors text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 max-h-[350px] overflow-y-auto space-y-3">
                {relatedDefects.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      setIsRelatedModalOpen(false);
                      navigate(`/defects/${d.id}`);
                    }}
                    className="p-3 border border-slate-105 dark:border-slate-850 rounded-xl hover:border-brand-300 dark:hover:border-brand-850 cursor-pointer transition-all hover:bg-slate-50/50 dark:hover:bg-slate-855/10 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-brand-655 dark:text-brand-400 block">DF-{d.id}</span>
                      <p className="text-xs font-bold text-slate-755 dark:text-slate-200 truncate mt-0.5" title={d.title}>
                        {d.title}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-955/20 border-t border-slate-100 dark:border-slate-805 flex justify-end">
                <button
                  onClick={() => setIsRelatedModalOpen(false)}
                  className="btn-secondary text-xs px-4 py-2 cursor-pointer font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  // TESTER / REVIEWER view
  const testerTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: `Activity (${timelineFeed.length})` },
    { id: 'attachments', label: `Attachments (${combinedAttachments.length})` },
    { id: 'discussion', label: `Discussion (${comments.length})` }
  ];

  // Adjust active tab for tester in case they landed on 'resolution' tab previously
  const activeTesterTab = testerTabs.some(t => t.id === activeTab) ? activeTab : 'overview';

  return (
    <Layout title={`Defect Details: #${defect.id}`}>
      
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-505 hover:text-slate-705 dark:text-slate-400 dark:hover:text-slate-205 transition-colors mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 px-2.5 py-1 rounded-lg cursor-pointer shadow-xs animate-fadeIn"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to list
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left column (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-5 mb-1 bg-white dark:bg-slate-900 px-3.5 rounded-xl shadow-xs overflow-x-auto scrollbar-none">
            {testerTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2.5 pt-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTesterTab === tab.id
                    ? 'border-brand-600 text-brand-655 dark:text-brand-400 dark:border-brand-450'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-205'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTesterTab === 'overview' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Header card */}
              <div className="card p-3.5 space-y-3 shadow-xs bg-white dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-[9px] bg-slate-105 dark:bg-slate-800 text-slate-500 font-bold px-2 py-0.5 rounded tracking-wide uppercase">Issue Key: DF-{defect.id}</span>
                    <h2 className="text-base font-extrabold text-slate-800 dark:text-white mt-1">{defect.title}</h2>
                    
                    <p className="text-[10px] text-slate-500 mt-1 font-semibold flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                      <span>Reported by <strong className="text-slate-700 dark:text-slate-350">{defect.reporter_name}</strong></span>
                      <span>•</span>
                      <span>Assigned to <strong className="text-slate-707 dark:text-slate-350">{defect.assignee_name || 'Unassigned'}</strong></span>
                      <span>•</span>
                      <span>Created on <strong className="text-slate-707 dark:text-slate-355">{new Date(defect.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <SeverityBadge severity={defect.severity} />
                    <StatusBadge status={defect.status} />
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Description</h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-55/40 dark:bg-slate-855/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {defect.description}
                  </p>
                </div>
              </div>

              {/* Steps, Expected, Actual block */}
              <div className="card p-3.5 space-y-3.5 shadow-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Steps to Reproduce</span>
                  <div className="bg-slate-55/40 dark:bg-slate-955 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                    {devDetails.steps.map((step, idx) => (
                      <p key={idx}>{step}</p>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Expected Result</span>
                    <div className="bg-slate-55/40 dark:bg-slate-955 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-emerald-655 dark:text-emerald-400 leading-relaxed font-semibold">
                      {devDetails.expected}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Actual Result</span>
                    <div className="bg-slate-55/40 dark:bg-slate-955 p-3 rounded-xl border border-slate-100 dark:border-slate-805 text-xs text-rose-600 dark:text-rose-455 leading-relaxed font-semibold">
                      {devDetails.actual}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTesterTab === 'activity' && (
            <div className="card p-3.5 space-y-3.5 shadow-xs animate-fadeIn">
              <h3 className="text-xs font-bold text-slate-805 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-805 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-brand-655" />
                Complete Activity Timeline
              </h3>
              
              <div className="relative border-l border-slate-205 dark:border-slate-800 ml-4 pl-6 space-y-4 pt-1">
                {timelineFeed.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="relative animate-fadeIn">
                      <span className={`absolute -left-[35px] top-0.5 rounded-full p-1 text-white shrink-0 ${item.color} shadow-sm ring-4 ring-white dark:ring-slate-900`}>
                        <Icon className="w-3 h-3" />
                      </span>
                      <div className="space-y-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-808 dark:text-white text-[12px]">{item.title}</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                            {item.relativeTime}
                          </span>
                        </div>
                        <p className="text-slate-550 dark:text-slate-405 mt-0.5 leading-normal">{item.description}</p>
                        <div className="flex items-center gap-2 text-[9px] text-slate-455 dark:text-slate-500 pt-1 font-bold">
                          <span>By {item.user}</span>
                          <span>•</span>
                          <span>{item.date}</span>
                          <span>•</span>
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTesterTab === 'attachments' && (
            <div className="card p-3.5 space-y-3.5 shadow-xs animate-fadeIn">
              <h3 className="text-xs font-bold text-slate-805 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-805 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-brand-655" />
                Attachments & Evidence
              </h3>

              {combinedAttachments.length === 0 ? (
                <p className="text-xs text-slate-405 dark:text-slate-500 italic">No attachments uploaded.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {combinedAttachments.map((a) => {
                    const Icon = getFileIcon(a.file_name);
                    return (
                      <div key={a.id} className="flex flex-col p-3 bg-slate-50 dark:bg-slate-855/40 border border-slate-205 dark:border-slate-800/80 rounded-xl animate-fadeIn justify-between">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2.5 bg-brand-50 dark:bg-brand-955/30 text-brand-605 dark:text-brand-400 rounded-lg mr-1 shrink-0 shadow-xs">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-805 dark:text-white truncate" title={a.file_name}>
                              {a.file_name}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                              By {a.uploaded_by_name || 'System'}
                            </p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-bold">
                              {getRelativeTime(a.uploaded_at || a.created_at)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3 border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                          <a
                            href={a.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-[10px] py-1 px-3 flex-1 text-center cursor-pointer shadow-xs font-bold"
                          >
                            👁 Preview
                          </a>
                          <a
                            href={a.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-[10px] py-1 px-3 flex-1 text-center cursor-pointer shadow-xs font-bold"
                          >
                            ↗ Open
                          </a>
                          <a
                            href={a.file_url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary text-[10px] py-1 px-3 flex-1 text-center cursor-pointer shadow-sm font-bold bg-brand-600 hover:bg-brand-700"
                          >
                            ⬇ Download
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Uploader section */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-805 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-705 dark:text-slate-300">Upload Attachment</h4>
                  <p className="text-[9px] text-slate-400 font-medium">Add screenshots, logs, or PDFs to verify the fix.</p>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    id="evidence-file-input-tester"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingFile}
                  />
                  <label
                    htmlFor="evidence-file-input-tester"
                    className={`btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5 cursor-pointer shadow-xs ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingFile ? 'Uploading...' : 'Choose File'}
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTesterTab === 'discussion' && (
            <div className="card p-3.5 space-y-3.5 shadow-xs animate-fadeIn bg-white dark:bg-slate-900">
              <h3 className="text-xs font-bold text-slate-805 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-805 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-brand-655" />
                Discussion
              </h3>

              <form onSubmit={handleAddComment} className="flex gap-3 items-start animate-fadeIn">
                <div className="w-8 h-8 bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-xs uppercase">
                  {user.full_name.charAt(0)}
                </div>
                <div className="flex-1 space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="input-field text-xs bg-white dark:bg-slate-955 border-slate-205"
                    rows={3}
                    placeholder="Add a comment... (use @username to mention users)"
                    required
                  />
                  <div className="flex justify-end">
                    <button type="submit" className="btn-primary text-xs py-1.5 px-3 cursor-pointer shadow-sm">
                      <Send className="w-3 h-3" /> Post Comment
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3 animate-fadeIn">
                    <div className="w-8 h-8 bg-slate-105 dark:bg-slate-800 text-slate-650 dark:text-slate-400 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-xs uppercase">
                      {c.user_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-855/50 border border-slate-205/50 dark:border-slate-800/80 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-xs text-slate-850 dark:text-slate-200">{c.user_name}</span>
                          <span className="text-[9px] bg-slate-105 dark:bg-slate-800 text-slate-505 font-bold uppercase tracking-wide px-1.5 py-0.5 rounded capitalize">{c.user_role}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 dark:text-slate-505 font-bold">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>

                      {editingCommentId === c.id ? (
                        <div className="space-y-2">
                          <textarea 
                            value={editCommentText} 
                            onChange={(e) => setEditCommentText(e.target.value)} 
                            className="input-field text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" 
                            rows={2} 
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleEditComment(c.id)} className="btn-primary text-[10px] py-1.5 px-3 cursor-pointer">Save</button>
                            <button onClick={() => setEditingCommentId(null)} className="btn-secondary text-[10px] py-1.5 px-3 cursor-pointer">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-705 dark:text-slate-350 leading-relaxed whitespace-pre-wrap font-medium">
                          {formatCommentText(c.comment)}
                        </div>
                      )}

                      {c.user_id === user.id && editingCommentId !== c.id && (
                        <div className="flex items-center gap-3 pt-1 text-[9px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wide">
                          <button 
                            onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.comment); }} 
                            className="hover:text-brand-605 dark:hover:text-brand-400 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3 h-3" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteComment(c.id)} 
                            className="hover:text-rose-605 dark:hover:text-rose-455 transition-colors flex items-center gap-1 cursor-pointer"
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
          )}

        </div>

        {/* Right column (1/3 width) - Sticky Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-4 self-start animate-fadeIn">
          
          {/* Card 1: Issue Attributes */}
          <div className="card p-3.5 space-y-3.5 shadow-xs bg-white dark:bg-slate-900">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider font-extrabold">Issue Attributes</h3>
            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Project</span>
                <span className="text-slate-808 dark:text-white font-bold">{defect.project_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Priority</span>
                <span className="text-slate-808 dark:text-white font-bold">{defect.priority}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Reporter</span>
                <span className="text-slate-808 dark:text-white font-bold">{defect.reporter_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Assignee</span>
                <span className="text-brand-655 dark:text-brand-400 font-bold">{defect.assignee_name || 'Unassigned'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Assigned Date</span>
                <span className="text-slate-808 dark:text-white font-bold">
                  {defect.assigned_date ? new Date(defect.assigned_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Created Date</span>
                <span className="text-slate-808 dark:text-white font-bold">
                  {new Date(defect.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Last Updated</span>
                <span className="text-slate-808 dark:text-white font-bold">
                  {new Date(defect.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Due Date</span>
                <span className="text-slate-808 dark:text-white font-bold">
                  {defect.due_date ? new Date(defect.due_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Related Defects */}
          <div className="card p-3.5 space-y-3.5 shadow-xs bg-white dark:bg-slate-900">
            <h3 className="text-xs font-bold text-slate-850 dark:text-white pb-2 border-b border-slate-105 dark:border-slate-805 uppercase tracking-wider font-extrabold">
              Related Defects
            </h3>
            {relatedDefects.length === 0 ? (
              <p className="text-xs text-slate-450 dark:text-slate-500 italic py-1">No related defects found.</p>
            ) : (
              <div className="space-y-2.5">
                {relatedDefects.slice(0, 3).map((d) => (
                  <div 
                    key={d.id}
                    onClick={() => navigate(`/defects/${d.id}`)}
                    className="p-2 border border-slate-105 dark:border-slate-800 rounded-xl hover:border-brand-300 dark:hover:border-brand-850 cursor-pointer transition-all hover:bg-slate-50/50 dark:hover:bg-slate-855/10 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold text-slate-400 block">DF-{d.id}</span>
                      <p className="text-xs font-semibold text-slate-705 dark:text-slate-355 truncate mt-0.5">{d.title}</p>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                ))}

                {relatedDefects.length > 3 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                    <button
                      onClick={() => setIsRelatedModalOpen(true)}
                      className="text-xs font-bold text-brand-655 dark:text-brand-400 hover:underline cursor-pointer"
                    >
                      View All ({relatedDefects.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
        
      </div>

      {/* Related Defects Modal */}
      {isRelatedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-scaleIn">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-805 dark:text-white uppercase tracking-wider">
                Related Defects ({relatedDefects.length})
              </h3>
              <button
                onClick={() => setIsRelatedModalOpen(false)}
                className="text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 transition-colors text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 max-h-[350px] overflow-y-auto space-y-3">
              {relatedDefects.map((d) => (
                <div
                  key={d.id}
                  onClick={() => {
                    setIsRelatedModalOpen(false);
                    navigate(`/defects/${d.id}`);
                  }}
                  className="p-3 border border-slate-105 dark:border-slate-855 rounded-xl hover:border-brand-300 dark:hover:border-brand-850 cursor-pointer transition-all hover:bg-slate-50/50 dark:hover:bg-slate-855/10 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-brand-655 dark:text-brand-400 block">DF-{d.id}</span>
                    <p className="text-xs font-bold text-slate-755 dark:text-slate-200 truncate mt-0.5" title={d.title}>
                      {d.title}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={d.status} />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-955/20 border-t border-slate-100 dark:border-slate-855 flex justify-end">
              <button
                onClick={() => setIsRelatedModalOpen(false)}
                className="btn-secondary text-xs px-4 py-2 cursor-pointer font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const SlidersHorizontal = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

export default DefectDetails;
