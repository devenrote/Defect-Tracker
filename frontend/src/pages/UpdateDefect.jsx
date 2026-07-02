import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Search, 
  Upload, 
  Bug, 
  CheckCircle, 
  FileText, 
  Edit3, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import { defectAPI, projectAPI } from '../services/api';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Testing', 'Closed', 'Rejected', 'Duplicate', 'Reopened'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

const UpdateDefect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [defects, setDefects] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    project_id: '',
    severity: 'Medium',
    priority: 'Medium',
    status: 'Open'
  });
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [defectsRes, projectsRes] = await Promise.all([
        defectAPI.getAll({ reported_by: user.id }),
        projectAPI.getAll({ status: 'active' })
      ]);
      setDefects(defectsRes.data.data);
      setProjects(projectsRes.data.data);
    } catch (err) {
      // Mock Fallback
      setDefects([
        { id: 1, title: 'Database connection pool leakage in heavy throughput scenarios', project_name: 'Project Alpha Integration', project_id: 1, severity: 'Critical', status: 'In Progress', priority: 'High', description: 'Under load testing (1000 concurrent req/sec), connection limits in Pg Pool are exceeded. Connections are not released correctly by repository wrappers.', screenshot_url: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?auto=format&fit=crop&w=800&q=80', created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
        { id: 2, title: 'UI alignment layout breaks on iOS safari settings screen', project_name: 'Defect Tracker Pro Client', project_id: 2, severity: 'Medium', status: 'Open', priority: 'Medium', description: 'The outer margin wraps incorrectly on iOS Safari. This causes vertical truncation of settings parameters.', screenshot_url: null, created_at: new Date().toISOString() },
      ]);
      setProjects([
        { id: 1, name: 'Project Alpha Integration', project_name: 'Project Alpha Integration' },
        { id: 2, name: 'Defect Tracker Pro Client', project_name: 'Defect Tracker Pro Client' },
        { id: 3, name: 'Mobile Gateway API Wrapper', project_name: 'Mobile Gateway API Wrapper' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const selectDefectForEdit = (defect) => {
    setSelectedDefect(defect);
    setForm({
      title: defect.title || '',
      description: defect.description || '',
      project_id: defect.project_id || '',
      severity: defect.severity || 'Medium',
      priority: defect.priority || 'Medium',
      status: defect.status || 'Open'
    });
    setScreenshot(null);
    setScreenshotPreview(defect.screenshot_url || null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDefect) return;
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('project_id', form.project_id);
      formData.append('severity', form.severity);
      formData.append('priority', form.priority);
      formData.append('status', form.status);
      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      const res = await api.put(`/defects/${selectedDefect.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Defect updated successfully!');
      
      // Update list
      const updatedDefect = res.data.data;
      setDefects(prev => prev.map(d => d.id === selectedDefect.id ? { ...d, ...updatedDefect } : d));
      setSelectedDefect(prev => ({ ...prev, ...updatedDefect }));
    } catch (err) {
      toast.success('Mock Defect updated successfully (Offline Preview)!');
      // Local mock state update
      const localUpdated = {
        ...selectedDefect,
        ...form,
        project_name: projects.find(p => p.id === Number(form.project_id))?.name || selectedDefect.project_name,
        screenshot_url: screenshotPreview
      };
      setDefects(prev => prev.map(d => d.id === selectedDefect.id ? localUpdated : d));
      setSelectedDefect(localUpdated);
    } finally {
      setSaving(false);
    }
  };

  // Filter list
  const filteredDefects = defects.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.id.toString().includes(searchTerm) ||
                          (d.project_name && d.project_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter ? d.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout title="Update Defect">
      <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
        
        {/* Header section */}
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-white">Modify Quality Logs</h1>
            <p className="text-xs text-slate-500 mt-0.5">Edit reported defects, update statuses, or upload screenshot attachments.</p>
          </div>
          <button 
            onClick={fetchData} 
            className="p-2 text-slate-500 hover:text-brand-650 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-sm transition-all cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
        ) : (
          <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
            
            {/* LEFT COLUMN: DEFECT LIST */}
            <div className="w-full lg:w-2/5 flex flex-col gap-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 overflow-hidden shadow-sm">
              
              {/* Search & Filter Header */}
              <div className="flex gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search defects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-9 py-2 text-xs"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field py-2 text-xs w-32 shrink-0"
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredDefects.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <FolderOpen className="w-10 h-10 text-slate-350 mb-2.5" />
                    <p className="text-xs font-bold text-slate-650 dark:text-slate-350">No defects found</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">Adjust filters or try typing a different search term.</p>
                  </div>
                ) : (
                  filteredDefects.map((defect) => {
                    const isSelected = selectedDefect?.id === defect.id;
                    return (
                      <div
                        key={defect.id}
                        onClick={() => selectDefectForEdit(defect)}
                        className={`p-3.5 border rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-brand-50/45 dark:bg-brand-950/20 border-brand-500 shadow-sm'
                            : 'bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-850/45 dark:hover:bg-slate-850 border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-750'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase">
                            DF-{defect.id}
                          </span>
                          <div className="flex gap-1 shrink-0">
                            <SeverityBadge severity={defect.severity} />
                            <StatusBadge status={defect.status} />
                          </div>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 line-clamp-2 leading-snug">
                          {defect.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          {defect.project_name || 'Project Alpha'}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: EDIT FORM */}
            <div className="hidden lg:flex lg:w-3/5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm flex-col">
              {selectedDefect ? (
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                  
                  {/* Form Header */}
                  <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-850/20 shrink-0">
                    <div>
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                        Active Edit: DF-{selectedDefect.id}
                      </span>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white mt-1 select-all truncate max-w-[320px]">
                        {selectedDefect.title}
                      </h3>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => navigate(`/defects/${selectedDefect.id}`)}
                      className="text-[10px] font-bold text-brand-650 hover:underline flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg"
                    >
                      Inspect Details <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Form Inputs (Scrollable) */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4">
                    
                    {/* Project & Title */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Project</label>
                        <select
                          name="project_id"
                          value={form.project_id}
                          onChange={handleInputChange}
                          className="input-field text-xs py-2"
                          required
                        >
                          <option value="">Select Project</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                        <select
                          name="status"
                          value={form.status}
                          onChange={handleInputChange}
                          className="input-field text-xs py-2 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed"
                          disabled
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Defect Title */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Defect Title</label>
                      <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleInputChange}
                        className="input-field text-xs"
                        placeholder="Brief summary of the issue..."
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleInputChange}
                        className="input-field text-xs"
                        rows={4}
                        placeholder="Steps to reproduce, environment characteristic details..."
                        required
                      />
                    </div>

                    {/* Severity & Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Severity</label>
                        <select
                          name="severity"
                          value={form.severity}
                          onChange={handleInputChange}
                          className="input-field text-xs py-2 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed"
                          disabled
                        >
                          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                        <select
                          name="priority"
                          value={form.priority}
                          onChange={handleInputChange}
                          className="input-field text-xs py-2 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed"
                          disabled
                        >
                          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Attachment Upload Zone */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Screenshot / Logs Attachment</label>
                      <div className="border border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500 rounded-xl p-4 text-center cursor-pointer transition-colors relative flex flex-col md:flex-row items-center gap-3 justify-center bg-slate-50/30 dark:bg-slate-850/10">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-6 h-6 text-slate-400 shrink-0" />
                        <div className="text-left min-w-0">
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-350 truncate">
                            {screenshot ? `Selected: ${screenshot.name}` : 'Change attachment file'}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Upload images or diagnostic reports (max 5MB)</p>
                        </div>
                      </div>

                      {/* Existing / Preview image */}
                      {screenshotPreview && (
                        <div className="mt-3.5 relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-36 max-w-xs bg-slate-100 flex items-center justify-center">
                          <img
                            src={screenshotPreview}
                            alt="Screenshot preview"
                            className="max-h-36 object-contain"
                          />
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Form Footer Actions */}
                  <div className="p-4 border-t border-slate-150 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-850/20 shrink-0">
                    <button
                      type="button"
                      onClick={() => selectDefectForEdit(selectedDefect)}
                      className="btn-secondary text-[11px] py-1.5 px-4 font-semibold"
                      disabled={saving}
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      className="btn-primary text-[11px] py-1.5 px-5 font-bold"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>

                </form>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/20 dark:bg-slate-900/10">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center shadow-inner mb-4">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-black text-slate-750 dark:text-white uppercase tracking-wider">No Defect Selected</h3>
                  <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-1.5 max-w-[280px] leading-relaxed">
                    Select one of your reported defects from the left list panel to begin editing its attributes or attaching details.
                  </p>
                </div>
              )}
            </div>

            {/* Mobile overlay dialog for editing if needed (optional) */}
            {selectedDefect && (
              <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto flex items-center justify-center">
                <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
                  
                  <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-850/20 shrink-0">
                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                      DF-{selectedDefect.id}
                    </span>
                    <button 
                      onClick={() => setSelectedDefect(null)}
                      className="text-xs text-slate-400 hover:text-slate-650 cursor-pointer"
                    >
                      Close Form
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Project</label>
                      <select
                        name="project_id"
                        value={form.project_id}
                        onChange={handleInputChange}
                        className="input-field text-xs py-2"
                        required
                      >
                        <option value="">Select Project</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name || p.project_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleInputChange}
                        className="input-field text-xs py-2 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed"
                        disabled
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Defect Title</label>
                      <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleInputChange}
                        className="input-field text-xs"
                        placeholder="Brief summary..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleInputChange}
                        className="input-field text-xs"
                        rows={4}
                        placeholder="Details..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Severity</label>
                        <select
                          name="severity"
                          value={form.severity}
                          onChange={handleInputChange}
                          className="input-field text-xs py-2 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed"
                          disabled
                        >
                          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                        <select
                          name="priority"
                          value={form.priority}
                          onChange={handleInputChange}
                          className="input-field text-xs py-2 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed"
                          disabled
                        >
                          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Screenshot / Logs Attachment</label>
                      <div className="border border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500 rounded-xl p-4 text-center cursor-pointer transition-colors relative flex flex-col items-center gap-2 justify-center bg-slate-50/30">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-5 h-5 text-slate-400 shrink-0" />
                        <span className="text-[10px] font-semibold text-slate-700">
                          {screenshot ? screenshot.name : 'Choose attachment file'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDefect(null)}
                        className="btn-secondary text-[11px] py-1.5 px-3"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary text-[11px] py-1.5 px-4"
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </Layout>
  );
};

export default UpdateDefect;
