import { useAuth } from '../context/AuthContext';
import DeveloperTeamMembers from './developer/DeveloperTeamMembers';
import TesterTeamMembers from './tester/TesterTeamMembers';
import ManagerTeamMembers from './manager/ManagerTeamMembers';
import AdminTeamMembers from './admin/AdminTeamMembers';

const UsersContainer = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'developer':
      return <DeveloperTeamMembers />;
    case 'tester':
      return <TesterTeamMembers />;
    case 'manager':
    case 'project_manager':
      return <ManagerTeamMembers />;
    case 'admin':
    default:
      return <AdminTeamMembers />;
  }
};

export default UsersContainer;
