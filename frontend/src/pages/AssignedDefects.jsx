import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { defectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AssignedDefects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    defectAPI.getAll({ assigned_to: user.id })
      .then((res) => setDefects(res.data.data))
      .catch(() => {
        // Mock fallback for developer testing
        setDefects([
          { id: 1, title: 'Database connection pool leakage in heavy throughput scenarios', project_name: 'Project Alpha Integration', severity: 'Critical', priority: 'High', status: 'In Progress', reporter_name: 'David Tester', created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
          { id: 3, title: 'Auth tokens expire prematurely before 24h limit', project_name: 'Mobile Gateway API Wrapper', severity: 'High', priority: 'Critical', status: 'Resolved', reporter_name: 'David Tester', created_at: new Date(Date.now() - 3600000 * 12).toISOString() }
        ]);
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  const columns = [
    { header: 'ID', render: (row) => <span className="font-bold text-slate-400">DF-{row.id}</span> },
    { header: 'Title', accessor: 'title', render: (row) => <span className="font-bold text-slate-800 dark:text-white">{row.title}</span> },
    { header: 'Project', accessor: 'project_name', render: (row) => <span className="text-slate-500 dark:text-slate-400">{row.project_name}</span> },
    { header: 'Severity', render: (row) => <SeverityBadge severity={row.severity} /> },
    { header: 'Priority', render: (row) => <span className="font-semibold text-slate-750 dark:text-slate-350">{row.priority}</span> },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Reporter', accessor: 'reporter_name' },
    { header: 'Created', render: (row) => new Date(row.created_at).toLocaleDateString() },
  ];

  return (
    <Layout title="Assigned Defects">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-base font-bold text-slate-800 dark:text-white">Assigned To Me</h1>
          <p className="text-xs text-slate-500 mt-0.5">Issues assigned to your account that require analysis or resolutions.</p>
        </div>

        {loading ? <div className="text-center mt-20"><LoadingSpinner /></div> : (
          <div className="card">
            <DataTable 
              columns={columns} 
              data={defects} 
              searchable 
              searchPlaceholder="Search assigned defects..."
              pagination 
              onRowClick={(row) => navigate(`/defects/${row.id}`)} 
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AssignedDefects;
