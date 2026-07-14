import { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from 'recharts';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { defectAPI } from '../../services/api';
import { FileDown, Calendar, BarChart3, TrendingUp, Users, AlertCircle } from 'lucide-react';

const TesterReports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReportType, setSelectedReportType] = useState('project');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await defectAPI.getReports();
        setReports(res.data.data);
      } catch (err) {
        console.error('Error fetching tester reports:', err);
        toast.error('Failed to load reports from database.');
        setReports({
          byProject: [],
          bySeverity: [],
          byDeveloper: [],
          byStatus: [],
          monthlyTrends: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExport = (format) => {
    let dataToExport = [];
    let filename = `defect_report_${selectedReportType}`;

    if (selectedReportType === 'project') {
      dataToExport = reports?.byProject || [];
    } else if (selectedReportType === 'developer') {
      dataToExport = reports?.byDeveloper || [];
    } else if (selectedReportType === 'severity') {
      dataToExport = reports?.bySeverity || [];
    } else {
      dataToExport = reports?.monthlyTrends || [];
    }

    if (dataToExport.length === 0) {
      toast.error('No data available to export');
      return;
    }

    if (format === 'csv' || format === 'excel') {
      // Build CSV
      const keys = Object.keys(dataToExport[0]);
      const csvContent = [
        keys.join(','),
        ...dataToExport.map(row => keys.map(k => `"${row[k]}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.${format === 'csv' ? 'csv' : 'csv'}`); // Excel can read csv direct
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Report exported as ${format.toUpperCase()} successfully!`);
    } else if (format === 'pdf') {
      window.print();
      toast.success('System print dialog opened');
    }
  };

  if (loading) return <Layout title="Reports"><LoadingSpinner /></Layout>;

  const SEVERITY_COLORS = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#f59e0b',
    Low: '#94a3b8'
  };

  return (
    <Layout title="Reports">
      <div className="flex flex-col gap-6">
        
        {/* Reports Header Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-white">Workspace Analytics</h1>
            <p className="text-xs text-slate-500 mt-0.5">Filter charts and export data records as CSV, Excel, or PDF</p>
          </div>
          
          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="input-field text-xs py-1.5 max-w-[160px]"
            >
              <option value="project">Project Reports</option>
              <option value="developer">Developer Reports</option>
              <option value="severity">Severity Reports</option>
              <option value="monthly">Monthly Trends</option>
            </select>
            
            <button
              onClick={() => handleExport('csv')}
              className="btn-secondary text-xs"
              title="Export to CSV format"
            >
              <FileDown className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="btn-secondary text-xs"
              title="Export to Excel spreadsheet format"
            >
              <FileDown className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="btn-primary text-xs"
              title="Print / Save as PDF document"
            >
              <FileDown className="w-3.5 h-3.5" /> PDF / Print
            </button>
          </div>
        </div>

        {/* Dashboard Grid Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Defects by Project */}
          <div className="card flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Defects by Project</h3>
              <BarChart3 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reports?.byProject} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="project_name" fontSize={11} stroke="#94a3b8" tickLine={false} />
                  <YAxis fontSize={11} stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Defects by Severity */}
          <div className="card flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Defects by Severity</h3>
              <AlertCircle className="w-4 h-4 text-slate-400" />
            </div>
            <div className="h-64 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reports?.bySeverity}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="severity"
                  >
                    {reports?.bySeverity?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Metrics</p>
                <p className="text-lg font-bold text-slate-850 dark:text-white">Severity</p>
              </div>
            </div>
          </div>

          {/* Defects by Developer */}
          <div className="card flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Defects by Developer</h3>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reports?.byDeveloper} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="developer_name" fontSize={11} stroke="#94a3b8" tickLine={false} />
                  <YAxis fontSize={11} stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Defects by Status */}
          <div className="card flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Defects by Status</h3>
              <BarChart3 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reports?.byStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="status" fontSize={11} stroke="#94a3b8" tickLine={false} />
                  <YAxis fontSize={11} stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="card lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Monthly Defect Trends</h3>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reports?.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" tickLine={false} />
                  <YAxis fontSize={11} stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Reported Defects" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
        
      </div>
    </Layout>
  );
};

export default TesterReports;
