import { useAuth } from '../context/AuthContext';
import DeveloperDefectDetails from './developer/DeveloperDefectDetails';
import TesterDefectDetails from './tester/TesterDefectDetails';
import ManagerDefectDetails from './manager/ManagerDefectDetails';

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
    case 'admin':
    default:
      return <ManagerDefectDetails />;
  }
};

export default DefectDetailsContainer;
