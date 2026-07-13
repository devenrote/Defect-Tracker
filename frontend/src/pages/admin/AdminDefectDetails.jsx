import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  MessageSquare, 
  Paperclip, 
  Send, 
  Clock, 
  Activity, 
  Upload, 
  Image, 
  Video, 
  FileText,
  User,
  Calendar,
  ShieldAlert,
  Printer,
  ChevronRight,
  UserCheck,
  Download,
  X 
} from 'lucide-react';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import SeverityBadge from '../../components/SeverityBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { defectAPI, commentAPI, projectAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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
      '1. Open application workspace',
      '2. Navigate to module section',
      '3. Recreate original workflow logs'
    ];
  } else {
    steps = steps.map((s, idx) => `${idx + 1}. ${s}`);
  }

  const expected = extractField(/expected(?:\s*result)?:\s*([\s\S]+?)(?:actual|$)/i, 'Feature operates correctly.');
  const actual = extractField(/actual(?:\s*result)?:\s*([\s\S]+?)$/i, 'Null pointer exception or incorrect response.');

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
  return text;
};

const AdminDefectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [defect, setDefect] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [loadingText, setLoadingText] = useState(false);

  const handlePreview = async (attachment) => {
    const ext = attachment.file_name.split('.').pop().toLowerCase();
    
    // For Office files, behave exactly like Open (open original Cloudinary URL in a new tab)
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
      window.open(attachment.file_url, '_blank');
      return;
    }
    
    setPreviewAttachment(attachment);
    
    if (['txt', 'log', 'json', 'xml', 'csv'].includes(ext)) {
      setLoadingText(true);
      setTextContent('');
      try {
        const res = await fetch(attachment.file_url);
        if (res.ok) {
          const text = await res.text();
          setTextContent(text);
        } else {
          setTextContent('Failed to fetch file content. You can still open the file directly.');
        }
      } catch (err) {
        setTextContent('Could not preview file content inline due to network/CORS restrictions. Please click "Open in New Window" to view the content directly.');
      } finally {
        setLoadingText(false);
      }
    }
  };

  const handleOpen = (attachment) => {
    const ext = attachment.file_name.split('.').pop().toLowerCase();
    const openInTabExtensions = [
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp',
      'pdf',
      'txt', 'log', 'csv', 'json', 'xml',
      'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'zip', 'rar', '7z'
    ];
    if (openInTabExtensions.includes(ext)) {
      window.open(attachment.file_url, '_blank');
    } else {
      handleDownload(attachment);
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const response = await fetch(attachment.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.file_name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(attachment.file_url, '_blank');
    }
  };
  
  // Project Context states
  const [projectStats, setProjectStats] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  
  const [newComment, setNewComment] = useState('');
  const [replyToUserId, setReplyToUserId] = useState(null);
  const [replyToUserName, setReplyToUserName] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const fetchData = async () => {
    try {
      const [defectRes, commentsRes] = await Promise.all([
        defectAPI.getById(id),
        commentAPI.getByDefect(id),
      ]);
      const dData = defectRes.data.data;
      setDefect(dData);
      setComments(commentsRes.data.data || []);

      if (dData.project_id) {
        const [statsRes, membersRes] = await Promise.all([
          projectAPI.getStatistics(dData.project_id),
          projectAPI.getMembers(dData.project_id)
        ]);
        setProjectStats(statsRes.data.data?.statistics || null);
        setProjectMembers(membersRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching defect details:', err);
      toast.error('Failed to retrieve defect record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    let commentText = newComment;
    if (replyToUserId) {
      commentText = `@${replyToUserName} ${commentText}`;
    }

    try {
      await commentAPI.create({ defect_id: parseInt(id), comment: commentText });
      toast.success('Comment added successfully');
      setNewComment('');
      setReplyToUserId(null);
      setReplyToUserName('');
      fetchData();
    } catch {
      toast.error('Failed to post comment.');
    }
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
      toast.error('Failed to upload attachment.');
    } finally {
      setUploadingFile(false);
    }
  };

  if (loading) return <Layout title="Defect Details"><LoadingSpinner /></Layout>;
  if (!defect) return <Layout title="Defect Details"><p className="text-center mt-20 text-xs font-bold text-slate-400">Defect record not found.</p></Layout>;

  // Calculations
  const defectAgeDays = Math.floor((new Date() - new Date(defect.created_at)) / (1000 * 60 * 60 * 24));
  const defectAgeStr = defectAgeDays < 1 ? 'Less than a day' : `${defectAgeDays} Days`;

  const getResolutionTime = () => {
    if (!['Resolved', 'Verified', 'Closed'].includes(defect.status)) return 'N/A';
    const start = new Date(defect.created_at);
    const end = new Date(defect.updated_at);
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays > 0) return `${diffDays}d ${diffHrs % 24}h`;
    return `${diffHrs}h`;
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) return Image;
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return Video;
    return FileText;
  };

  const combinedAttachments = defect.attachments || [];

  const getAuditTimeline = () => {
    const feed = [];
    
    // 1. History Changes (from status_history)
    if (defect.status_history) {
      defect.status_history.forEach(h => {
        feed.push({
          id: `hist-${h.id}`,
          timestamp: new Date(h.changed_at || h.created_at),
          user: h.changed_by_name || 'System',
          action: h.field_name || 'status',
          oldVal: h.old_value || h.old_status || 'None',
          newVal: h.new_value || h.new_status || 'None',
          icon: Clock,
          color: 'bg-indigo-500'
        });
      });
    }

    // 2. Comments Added
    comments.forEach(c => {
      feed.push({
        id: `comm-${c.id}`,
        timestamp: new Date(c.created_at),
        user: c.user_name || 'System',
        action: 'Comment Added',
        oldVal: 'N/A',
        newVal: c.comment.substring(0, 60) + (c.comment.length > 60 ? '...' : ''),
        icon: MessageSquare,
        color: 'bg-emerald-500'
      });
    });

    // 3. Attachments Uploaded
    combinedAttachments.forEach(att => {
      feed.push({
        id: `att-${att.id}`,
        timestamp: new Date(att.uploaded_at || att.created_at),
        user: att.uploaded_by_name || 'System',
        action: 'Attachment Uploaded',
        oldVal: 'N/A',
        newVal: att.file_name,
        icon: Paperclip,
        color: 'bg-amber-500'
      });
    });

    // 4. Initial Creation
    feed.push({
      id: 'creation',
      timestamp: new Date(defect.created_at),
      user: defect.reporter_name || 'Reporter',
      action: 'Created',
      oldVal: 'N/A',
      newVal: 'Defect reported in system',
      icon: Activity,
      color: 'bg-slate-500'
    });

    // Sort descending by timestamp
    return feed.sort((a, b) => b.timestamp - a.timestamp);
  };

  const auditTimeline = getAuditTimeline();
  const devDetails = parseDeveloperDetails(defect.description);
  const projectManagerName = projectMembers.find(m => m.role === 'manager')?.full_name || 'Not Assigned';

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'assignment', label: 'Assignment' },
    { id: 'activity', label: `Timeline Activity (${auditTimeline.length})` },
    { id: 'discussion', label: `Discussion (${comments.length})` },
    { id: 'attachments', label: `Attachments (${combinedAttachments.length})` }
  ];

  // Print Page handler
  const handlePrint = () => {
    window.print();
  };

  // Export PDF layout
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Defect Report: DF-${defect.id}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; }
            h1 { color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; font-weight: 800; font-size: 26px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; }
            .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #4f46e5; margin-bottom: 12px; }
            p { margin: 6px 0; font-size: 13px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 12px; }
            th { background-color: #f1f5f9; font-weight: 700; }
            .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #94a3b8; }
          </style>
        </head>
        <body>
          <h1>Defect Audit: DF-${defect.id} - ${defect.title}</h1>
          <div class="grid">
            <div class="card">
              <div class="section-title">Defect Metadata</div>
              <p><strong>Defect ID:</strong> DF-${defect.id}</p>
              <p><strong>Project:</strong> ${defect.project_name}</p>
              <p><strong>Module:</strong> ${defect.module || 'No Data Available'}</p>
              <p><strong>Environment:</strong> ${defect.environment || 'No Data Available'}</p>
              <p><strong>Category:</strong> ${defect.defect_category || 'No Data Available'}</p>
              <p><strong>Priority:</strong> ${defect.priority}</p>
              <p><strong>Severity:</strong> ${defect.severity}</p>
              <p><strong>Status:</strong> ${defect.status}</p>
            </div>
            <div class="card">
              <div class="section-title">Audit Log</div>
              <p><strong>Reporter:</strong> ${defect.reporter_name}</p>
              <p><strong>Assigned Developer:</strong> ${defect.assignee_name || 'Unassigned'}</p>
              <p><strong>Created At:</strong> ${new Date(defect.created_at).toLocaleString()}</p>
              <p><strong>Last Updated At:</strong> ${new Date(defect.updated_at).toLocaleString()}</p>
              <p><strong>Defect Age:</strong> ${defectAgeStr}</p>
              <p><strong>Resolution Time:</strong> ${getResolutionTime()}</p>
            </div>
          </div>
          
          <div class="card" style="margin-bottom: 24px;">
            <div class="section-title">Description</div>
            <p>${defect.description || 'No description provided.'}</p>
          </div>

          <h2>Audit Log Actions History</h2>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Old Value</th>
                <th>New Value</th>
              </tr>
            </thead>
            <tbody>
              ${auditTimeline.map(item => `
                <tr>
                  <td>${item.timestamp.toLocaleString()}</td>
                  <td>${item.user}</td>
                  <td style="text-transform:capitalize;">${item.action.replace('_', ' ')}</td>
                  <td>${item.oldVal}</td>
                  <td>${item.newVal}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            Generated via Defect Tracker Pro Administrative Audit Portal.
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

  return (
    <Layout title={`Defect Audit: DF-${defect.id}`}>
      <div className="flex flex-col gap-6 animate-fadeIn">
        
        {/* Top bar Actions */}
        <div className="flex justify-between items-center gap-4">
          <button 
            onClick={() => navigate(`/projects/${defect.project_id}`)} 
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Project
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportPDF}
              className="btn-secondary text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
            >
              <FileText className="w-3.5 h-3.5" /> Export PDF
            </button>
            <button 
              onClick={handlePrint}
              className="btn-secondary text-xs font-bold py-1.5 px-3 flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900 text-slate-707 dark:text-slate-200"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>

        {/* Audit Header Banner */}
        <div className="card p-5 bg-gradient-to-r from-slate-800 to-indigo-950 text-white relative overflow-hidden border-none shadow-md rounded-2xl">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
            <ShieldAlert className="w-96 h-96" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="bg-white/20 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-white/10">
                {defect.status}
              </span>
              <p className="text-xs text-white/80 font-medium">Issue Key: DF-{defect.id}</p>
            </div>
            <h2 className="text-lg font-black mt-2 tracking-tight">{defect.title}</h2>
          </div>
        </div>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Left Content Column */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* Tabs Selector */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-5 bg-white dark:bg-slate-900 px-3 rounded-xl shadow-xs overflow-x-auto scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2.5 pt-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-brand-600 text-brand-655 dark:text-brand-400 dark:border-brand-450 font-black'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB PANELS */}
            <div className="space-y-4">
              
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-5 animate-fadeIn">
                  
                  {/* Detailed Metadata Grid */}
                  <div className="card p-4 space-y-4 bg-white dark:bg-slate-900 shadow-xs">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                      Defect Metadata Info
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-xs font-semibold text-slate-707 dark:text-slate-300">
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Defect ID</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">DF-{defect.id}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Project</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">{defect.project_name}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Module</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">{defect.module || 'No Data Available'}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Environment</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">{defect.environment || 'No Data Available'}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Defect Category</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">{defect.defect_category || 'No Data Available'}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Reporter</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">{defect.reporter_name}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Assigned Developer</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">{defect.assignee_name || 'Unassigned'}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Assigned Manager</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">{defect.assigned_by_name || 'Unassigned'}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Priority</span>
                        <span className="text-slate-900 dark:text-white font-extrabold uppercase">{defect.priority}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Severity</span>
                        <SeverityBadge severity={defect.severity} />
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Status</span>
                        <StatusBadge status={defect.status} />
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Defect Age</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">{defectAgeStr}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Resolution Time</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">{getResolutionTime()}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Created Date</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">{new Date(defect.created_at).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Due Date</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">
                          {defect.due_date ? new Date(defect.due_date).toLocaleDateString() : 'No Data Available'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Last Updated</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">{new Date(defect.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="card p-4 space-y-4 bg-white dark:bg-slate-900 shadow-xs">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Description</h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50/50 dark:bg-slate-855/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        {defect.description || 'No description provided.'}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Steps to Reproduce</h4>
                      <div className="bg-slate-50/50 dark:bg-slate-855/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold space-y-1">
                        {devDetails.steps.map((step, idx) => (
                          <p key={idx}>{step}</p>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Expected Result</span>
                        <div className="bg-emerald-50/30 dark:bg-emerald-955/5 p-3 rounded-xl border border-emerald-100 dark:border-emerald-950/30 text-xs text-emerald-600 dark:text-emerald-400 font-semibold leading-relaxed">
                          {devDetails.expected}
                        </div>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Actual Result</span>
                        <div className="bg-rose-50/30 dark:bg-rose-955/5 p-3 rounded-xl border border-rose-100 dark:border-rose-950/30 text-xs text-rose-600 dark:text-rose-400 font-semibold leading-relaxed">
                          {devDetails.actual}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* ASSIGNMENT TAB (Read-Only) */}
              {activeTab === 'assignment' && (
                <div className="card p-4 space-y-4 bg-white dark:bg-slate-900 shadow-xs animate-fadeIn">
                  <h3 className="text-xs font-bold text-slate-850 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                    Defect Assignment Summary
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-707 dark:text-slate-300">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Assigned Developer</span>
                      <p className="text-slate-900 dark:text-white font-extrabold">{defect.assignee_name || 'Unassigned'}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{defect.assignee_email || 'No email available'}</p>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Assigned By</span>
                      <p className="text-slate-900 dark:text-white font-extrabold">{defect.assigned_by_name || 'Unassigned'}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {defect.assigned_date ? `Assigned on ${new Date(defect.assigned_date).toLocaleDateString()}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Due Date</span>
                      <p className="text-slate-900 dark:text-white font-extrabold">
                        {defect.due_date ? new Date(defect.due_date).toLocaleDateString() : 'No Data Available'}
                      </p>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Sprint Milestone</span>
                      <p className="text-slate-900 dark:text-white font-extrabold">{defect.sprint || 'No Sprint Assigned'}</p>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Story Points</span>
                      <p className="text-slate-900 dark:text-white font-extrabold">{defect.story_points || 'Unestimated'}</p>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Estimated Effort</span>
                      <p className="text-slate-900 dark:text-white font-extrabold">{defect.estimated_effort || 'Unestimated'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Assignment Notes</span>
                      <p className="text-xs text-slate-700 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-855/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed font-semibold mt-1">
                        {defect.assignment_notes || 'No assignment notes provided by manager.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="card p-4 space-y-4 bg-white dark:bg-slate-900 shadow-xs animate-fadeIn">
                  <h3 className="text-xs font-bold text-slate-805 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                    Administrative Audit Trail
                  </h3>
                  
                  <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-5 pt-1">
                    {auditTimeline.map((item, index) => {
                      const Icon = item.icon;
                      const dateStr = item.timestamp.toLocaleDateString();
                      const timeStr = item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <div key={item.id} className="relative animate-fadeIn text-xs font-semibold">
                          <span className={`absolute -left-[33px] top-0.5 rounded-full p-1 text-white shrink-0 ${item.color} shadow-sm ring-4 ring-white dark:ring-slate-900`}>
                            <Icon className="w-2.5 h-2.5" />
                          </span>
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 dark:bg-brand-500 text-white font-bold text-[11px] shrink-0">
                              {index + 1}
                            </div>
                            <div className="space-y-0.5 text-slate-707 dark:text-slate-300 flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-slate-900 dark:text-white">
                                  {item.user} <span className="font-medium text-slate-500">logged:</span> <strong className="text-indigo-600 dark:text-indigo-400 capitalize">{item.action.replace('_', ' ')}</strong>
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{dateStr} {timeStr}</span>
                              </div>
                              <div className="bg-slate-50/50 dark:bg-slate-855/15 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 mt-1 space-y-0.5 text-[11px]">
                                {item.action !== 'Comment Added' && item.action !== 'Attachment Uploaded' && item.action !== 'Created' && (
                                  <p className="text-slate-450 dark:text-slate-500 font-bold">
                                    OLD VALUE: <span className="text-slate-707 dark:text-slate-300 font-semibold">{item.oldVal}</span>
                                  </p>
                                )}
                                <p className="text-slate-450 dark:text-slate-500 font-bold">
                                  {item.action === 'Comment Added' ? 'COMMENT:' : item.action === 'Attachment Uploaded' ? 'FILE:' : 'NEW VALUE:'}{' '}
                                  <span className="text-slate-707 dark:text-slate-300 font-semibold">{item.newVal}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DISCUSSION TAB */}
              {activeTab === 'discussion' && (
                <div className="card p-4 space-y-4 bg-white dark:bg-slate-900 shadow-xs animate-fadeIn">
                  <h3 className="text-xs font-bold text-slate-855 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
                    Discussion Portal
                  </h3>

                  <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-850">
                    {comments.length === 0 ? (
                      <p className="text-xs text-slate-405 text-center py-6">No discussions logged for this defect.</p>
                    ) : (
                      comments.map(c => (
                        <div key={c.id} className="pt-3 flex gap-3 items-start text-xs font-semibold">
                          <div className="w-8 h-8 bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-400 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-brand-100 dark:border-brand-900/50">
                            {c.user_name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-slate-850 dark:text-white">
                                {c.user_name} <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">({c.user_role})</span>
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold">{getRelativeTime(c.created_at)}</span>
                            </div>
                            <p className="text-slate-707 dark:text-slate-300 mt-1 font-semibold leading-relaxed">
                              {formatCommentText(c.comment)}
                            </p>
                            <button
                              onClick={() => {
                                setReplyToUserId(c.user_id);
                                setReplyToUserName(c.user_name);
                                document.getElementById('comment-input')?.focus();
                              }}
                              className="text-[10px] font-bold text-brand-600 hover:text-brand-700 hover:underline mt-1.5 cursor-pointer block"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-3 items-start pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {user.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 space-y-2">
                      {replyToUserId && (
                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded text-[10px] font-bold text-slate-500">
                          <span>Replying to @{replyToUserName}</span>
                          <button onClick={() => { setReplyToUserId(null); setReplyToUserName(''); }} className="text-rose-600 hover:underline">Cancel</button>
                        </div>
                      )}
                      <textarea
                        id="comment-input"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="input-field text-xs bg-white dark:bg-slate-900 border-slate-205"
                        rows={2}
                        placeholder="Add a governance comment..."
                        required
                      />
                      <div className="flex justify-end">
                        <button type="submit" className="btn-primary text-xs py-1.5 px-4 cursor-pointer shadow-sm flex items-center gap-1.5 font-bold">
                          <Send className="w-3 h-3" /> Comment
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* ATTACHMENTS TAB */}
              {activeTab === 'attachments' && (
                <div className="card p-4 space-y-4 bg-white dark:bg-slate-900 shadow-xs animate-fadeIn">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-855 dark:text-white uppercase tracking-wider">
                      Defect Evidence Logs ({combinedAttachments.length})
                    </h3>
                    
                    <label className="btn-secondary text-[11px] font-bold py-1 px-3 flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                      <Upload className="w-3.5 h-3.5" /> Upload File
                      <input 
                        type="file" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        disabled={uploadingFile} 
                      />
                    </label>
                  </div>

                  {combinedAttachments.length === 0 ? (
                    <p className="text-xs text-slate-405 text-center py-6">No attachments uploaded for this defect.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {combinedAttachments.map((att) => {
                        const Icon = getFileIcon(att.file_name);
                        return (
                          <div 
                            key={att.id} 
                            className="p-3 bg-slate-50 dark:bg-slate-855/35 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-semibold"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 bg-slate-200/50 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                                <Icon className="w-4.5 h-4.5 text-slate-505 dark:text-slate-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-slate-805 dark:text-white font-bold truncate" title={att.file_name}>{att.file_name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">By {att.uploaded_by_name || 'Reporter'}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0 ml-3">
                              {att.file_url && att.file_url !== '#' && (
                                <>
                                  <button 
                                    type="button"
                                    onClick={() => handlePreview(att)} 
                                    className="p-1 text-slate-400 hover:text-brand-600 rounded hover:bg-white dark:hover:bg-slate-800 font-bold"
                                    title="Preview"
                                  >
                                    👁
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleOpen(att)} 
                                    className="p-1 text-slate-400 hover:text-brand-600 rounded hover:bg-white dark:hover:bg-slate-800 font-bold"
                                    title="Open"
                                  >
                                    🔗
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleDownload(att)} 
                                    className="p-1 text-slate-400 hover:text-brand-600 rounded hover:bg-white dark:hover:bg-slate-800"
                                    title="Download File"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>

          {/* Right Sidebar Column */}
          <div className="flex flex-col gap-6">
            
            {/* PROJECT CONTEXT CARD (NEW) */}
            <div className="card shadow-xs bg-white dark:bg-slate-900 p-4 space-y-3.5">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                Project Context
              </h3>
              
              <div className="space-y-3 text-xs font-semibold text-slate-707 dark:text-slate-350">
                <div className="flex items-center justify-between">
                  <span className="text-slate-450 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide">Project Name</span>
                  <span className="text-slate-900 dark:text-white font-extrabold text-right">{defect.project_name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-450 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide">Project Manager</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{projectManagerName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-450 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide">Total Defects</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{projectStats?.total_defects ?? 'No Data'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-450 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide">Open Defects</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{projectStats?.open_defects ?? 'No Data'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-450 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide">Critical Defects</span>
                  <span className="text-slate-900 dark:text-white font-extrabold text-rose-600 dark:text-rose-400">{projectStats?.critical_defects ?? 'No Data'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-450 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide">Project Status</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-250/20">
                    {defect.project_status || 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* AUDIT INFORMATION CARD (NEW) */}
            <div className="card shadow-xs bg-white dark:bg-slate-900 p-4 space-y-3.5">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                Audit Information
              </h3>
              
              <div className="space-y-3 text-xs font-semibold text-slate-707 dark:text-slate-350">
                <div className="flex items-center justify-between">
                  <span className="text-slate-450 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide">Created By</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{defect.reporter_name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-450 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide">Last Updated By</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">
                    {defect.status_history?.[0]?.changed_by_name || defect.reporter_name}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-450 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide">Last Updated</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">
                    {defect.updated_at ? new Date(defect.updated_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-450 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide">Defect Age</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{defectAgeStr}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-450 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide">Total Comments</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{comments.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-450 dark:text-slate-500 font-bold uppercase text-[9px] tracking-wide">Total Attachments</span>
                  <span className="text-slate-900 dark:text-white font-extrabold">{combinedAttachments.length}</span>
                </div>
              </div>
            </div>

            {/* Workflow Progress card */}
            <div className="card shadow-xs bg-white dark:bg-slate-900 p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                Workflow Progress
              </h3>
              
              <div className="relative border-l border-slate-200 dark:border-slate-800 ml-2.5 pl-5 space-y-4 text-xs font-semibold">
                {[
                  { label: 'Reported', status: 'Open' },
                  { label: 'Reviewed', status: 'Reviewed' },
                  { label: 'Assigned', status: 'Assigned' },
                  { label: 'In Progress', status: 'In Progress' },
                  { label: 'Ready For QA', status: 'Ready For QA' },
                  { label: 'Verified', status: 'Verified' },
                  { label: 'Closed', status: 'Closed' }
                ].map((s, idx) => {
                  // Determine status styling
                  const workflowSteps = ['Open', 'Reviewed', 'Assigned', 'In Progress', 'Ready For QA', 'Verified', 'Closed'];
                  const currentStepIdx = workflowSteps.indexOf(
                    ['Resolved', 'Testing'].includes(defect.status) ? 'Ready For QA' : defect.status
                  );
                  const stepIdx = workflowSteps.indexOf(s.status);
                  
                  const isDone = stepIdx <= currentStepIdx;
                  const isActive = stepIdx === currentStepIdx;
                  
                  return (
                    <div key={idx} className="relative">
                      <span className={`absolute -left-[25px] top-1.5 w-2 h-2 rounded-full ring-4 ${
                        isActive 
                          ? 'bg-brand-600 ring-brand-100 dark:ring-brand-950/40' 
                          : isDone 
                            ? 'bg-emerald-500 ring-emerald-50' 
                            : 'bg-slate-300 ring-slate-100 dark:bg-slate-800 dark:ring-slate-855'
                      }`}></span>
                      <span className={`${
                        isActive 
                          ? 'text-brand-655 dark:text-brand-400 font-extrabold' 
                          : isDone 
                            ? 'text-slate-800 dark:text-slate-200 font-bold' 
                            : 'text-slate-400 font-medium'
                      }`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
      {previewAttachment && (() => {
        const ext = previewAttachment.file_name.split('.').pop().toLowerCase();
        const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext);
        const isPdf = ext === 'pdf';
        const isText = ['txt', 'log', 'json', 'xml', 'csv'].includes(ext);
        const isArchive = ['zip', 'rar', '7z'].includes(ext);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800 animate-slideUp">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                    Preview: {previewAttachment.file_name}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">
                    Format: {ext}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-auto flex-1 flex items-center justify-center min-h-[300px] bg-slate-50/50 dark:bg-slate-950/20">
                {isImage && (
                  <img
                    src={previewAttachment.file_url}
                    alt={previewAttachment.file_name}
                    className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm"
                  />
                )}

                {isPdf && (
                  <iframe
                    src={previewAttachment.file_url}
                    title={previewAttachment.file_name}
                    className="w-full h-[60vh] rounded-lg border border-slate-200 dark:border-slate-800"
                  />
                )}

                {isText && (
                  <div className="w-full">
                    {loadingText ? (
                      <div className="text-center py-8">
                        <LoadingSpinner className="w-6 h-6 mx-auto text-brand-500" />
                        <p className="text-xs text-slate-400 mt-2 font-medium">Loading content...</p>
                      </div>
                    ) : (
                      <pre className="p-4 bg-slate-955 text-slate-202 rounded-xl text-[11px] font-mono overflow-auto max-h-[55vh] border border-slate-800 leading-relaxed whitespace-pre-wrap break-all">
                        <code>{textContent}</code>
                      </pre>
                    )}
                  </div>
                )}

                {isArchive && (
                  <div className="text-center py-10 max-w-md">
                    <div className="w-16 h-16 bg-amber-50 dark:bg-amber-955/30 text-amber-550 rounded-2xl flex items-center justify-center mx-auto shadow-xs mb-4">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Preview not available</h4>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed">
                      Preview is not available for archive files. Please download the file.
                    </p>
                  </div>
                )}

                {!isImage && !isPdf && !isText && !isArchive && (
                  <div className="text-center py-10 max-w-md">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Preview not supported</h4>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed">
                      This file type cannot be previewed directly. Please use Open or Download.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  onClick={() => handleOpen(previewAttachment)}
                  className="btn-secondary text-xs px-4 py-1.5 font-semibold"
                >
                  Open in New Window
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(previewAttachment)}
                  className="btn-primary text-xs px-4 py-1.5 font-bold bg-brand-600 hover:bg-brand-700 text-white"
                >
                  Download File
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </Layout>
  );
};

export default AdminDefectDetails;
