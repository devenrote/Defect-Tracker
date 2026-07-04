import { useAuth } from '../context/AuthContext';
import DeveloperProjects from './developer/DeveloperProjects';
import TesterProjects from './tester/TesterProjects';
import ManagerProjects from './manager/ManagerProjects';
import AdminProjects from './admin/AdminProjects';

const ProjectsContainer = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'developer':
      return <DeveloperProjects />;
    case 'tester':
      return <TesterProjects />;
    case 'manager':
    case 'project_manager':
      return <ManagerProjects />;
    case 'admin':
    default:
      return <AdminProjects />;
  }
};

export default ProjectsContainer;
