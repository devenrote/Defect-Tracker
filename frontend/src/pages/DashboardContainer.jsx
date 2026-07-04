import { useAuth } from '../context/AuthContext';
import DeveloperDashboard from './developer/DeveloperDashboard';
import TesterDashboard from './tester/TesterDashboard';
import ManagerDashboard from './manager/ManagerDashboard';

const DashboardContainer = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'developer':
      return <DeveloperDashboard />;
    case 'tester':
      return <TesterDashboard />;
    case 'manager':
    case 'project_manager':
    case 'admin':
    default:
      return <ManagerDashboard />;
  }
};

export default DashboardContainer;
