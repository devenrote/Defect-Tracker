import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import DeveloperDashboard from './DeveloperDashboard';
import TesterDashboard from './TesterDashboard';

const DashboardContainer = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
    case 'project_manager':
      return <ManagerDashboard />;
    case 'developer':
      return <DeveloperDashboard />;
    case 'tester':
      return <TesterDashboard />;
    default:
      return <ManagerDashboard />;
  }
};

export default DashboardContainer;
