import React from 'react';
import { useAuth } from '../../context/AuthContext';
import ManagerNotifications from './ManagerNotifications';
import DeveloperNotifications from './DeveloperNotifications';
import TesterNotifications from './TesterNotifications';
import AdminNotifications from './AdminNotifications';

const NotificationContainer = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'developer':
      return <DeveloperNotifications />;
    case 'tester':
      return <TesterNotifications />;
    case 'manager':
    case 'project_manager':
      return <ManagerNotifications />;
    case 'admin':
      return <AdminNotifications />;
    default:
      return <ManagerNotifications />;
  }
};

export default NotificationContainer;
