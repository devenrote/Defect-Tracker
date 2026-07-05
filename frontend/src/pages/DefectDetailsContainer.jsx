import { useAuth } from '../context/AuthContext';
import DeveloperDefectDetails from './developer/DeveloperDefectDetails';
import TesterDefectDetails from './tester/TesterDefectDetails';
import ManagerDefectDetails from './manager/ManagerDefectDetails';
import AdminDefectDetails from './admin/AdminDefectDetails';

const DefectDetailsContainer = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'developer':
      return <DeveloperDefectDetails />;
    case 'tester':
      return <TesterDefectDetails />;
    case 'manager':
    case 'project_manager':
      return <ManagerDefectDetails />;
    case 'admin':
      return <AdminDefectDetails />;
    default:
      return <ManagerDefectDetails />;
  }
};

export default DefectDetailsContainer;
