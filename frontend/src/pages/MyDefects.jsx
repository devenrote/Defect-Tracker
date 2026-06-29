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

const MyDefects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    defectAPI.getAll({ reported_by: user.id })
      .then((res) => setDefects(res.data.data))
      .catch(() => {
        // Mock fallback for testing
        setDefects([
          { id: 1, title: 'Database connection pool leakage in heavy throughput scenarios', project_name: 'Project Alpha Integration', severity: 'Critical', status: 'In Progress', assignee_name: 'John Developer', created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
          { id: 2, title: 'UI alignment layout breaks on iOS safari settings screen', project_name: 'Defect Tracker Pro Client', severity: 'Medium', status: 'Open', assignee_name: 'Unassigned', created_at: new Date().toISOString() },
        ]);
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  const columns = [
    { header: 'ID', render: (row) => <span className="font-bold text-slate-400">DF-{row.id}</span> },
    { header: 'Title', accessor: 'title', render: (row) => <span className="font-bold text-slate-800 dark:text-white">{row.title}</span> },
    { header: 'Project', accessor: 'project_name', render: (row) => <span className="text-slate-500 dark:text-slate-400">{row.project_name}</span> },
    { header: 'Severity', render: (row) => <SeverityBadge severity={row.severity} /> },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Assignee', accessor: 'assignee_name', render: (row) => <span className="text-brand-600 dark:text-brand-400 font-semibold">{row.assignee_name || 'Unassigned'}</span> },
    { header: 'Created', render: (row) => new Date(row.created_at).toLocaleDateString() },
  ];

  return (
    <Layout title="My Defects">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-base font-bold text-slate-800 dark:text-white">Defects Reported By Me</h1>
          <p className="text-xs text-slate-500 mt-0.5">Issues you have logged that are being verified or fixed.</p>
        </div>

        {loading ? <div className="text-center mt-20"><LoadingSpinner /></div> : (
          <div className="card">
            <DataTable 
              columns={columns} 
              data={defects} 
              searchable 
              searchPlaceholder="Search my defects..."
              pagination 
              onRowClick={(row) => navigate(`/defects/${row.id}`)} 
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyDefects;
