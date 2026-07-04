import { useAuth } from '../../context/AuthContext';
import DeveloperReports from './DeveloperReports';
import TesterReports from './TesterReports';
import ManagerReports from './ManagerReports';
import AdminReports from './AdminReports';

const ReportsContainer = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'developer':
      return <DeveloperReports />;
    case 'tester':
      return <TesterReports />;
    case 'manager':
    case 'project_manager':
      return <ManagerReports />;
    case 'admin':
    default:
      return <AdminReports />;
  }
};

export default ReportsContainer;
