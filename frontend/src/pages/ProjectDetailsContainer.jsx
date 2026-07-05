import { useAuth } from '../context/AuthContext';
import DeveloperProjectDetails from './developer/DeveloperProjectDetails';
import TesterProjectDetails from './tester/TesterProjectDetails';
import ManagerProjectDetails from './manager/ManagerProjectDetails';
import AdminProjectDetails from './admin/AdminProjectDetails';

const ProjectDetailsContainer = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'developer':
      return <DeveloperProjectDetails />;
    case 'tester':
      return <TesterProjectDetails />;
    case 'manager':
    case 'project_manager':
      return <ManagerProjectDetails />;
    case 'admin':
    default:
      return <AdminProjectDetails />;
  }
};

export default ProjectDetailsContainer;
