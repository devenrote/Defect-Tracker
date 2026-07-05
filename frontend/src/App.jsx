import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/dashboard/DashboardContainer';
import Projects from './pages/ProjectsContainer';
import ProjectDetails from './pages/ProjectDetailsContainer';
import Users from './pages/UsersContainer';
import Defects from './pages/Defects';
import Reports from './pages/reports/ReportsContainer';
import CreateDefect from './pages/CreateDefect';
import MyDefects from './pages/MyDefects';
import UpdateDefect from './pages/UpdateDefect';
import VerificationQueue from './pages/VerificationQueue';
import VerifyDefect from './pages/VerifyDefect';
import AssignedDefects from './pages/AssignedDefects';
import Profile from './pages/Profile';
import DefectDetails from './pages/DefectDetailsContainer';
import Settings from './pages/Settings';
import Notifications from './pages/notifications/NotificationContainer';
import ActivityHistory from './pages/ActivityHistory';

const App = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />

      {/* Pages accessible by all logged-in roles */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute roles={['admin', 'manager', 'project_manager']}><Settings /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/defects/:id" element={<ProtectedRoute><DefectDetails /></ProtectedRoute>} />

      {/* Projects views - Developers can view projects they are assigned to */}
      <Route path="/projects" element={<ProtectedRoute roles={['admin', 'manager', 'project_manager', 'developer', 'tester']}><Projects /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute roles={['admin', 'manager', 'project_manager', 'developer', 'tester']}><ProjectDetails /></ProtectedRoute>} />
      
      {/* Admin and Project Manager Team View */}
      <Route path="/users" element={<ProtectedRoute roles={['admin', 'manager', 'project_manager']}><Users /></ProtectedRoute>} />
      <Route path="/defects" element={<ProtectedRoute roles={['admin', 'manager', 'project_manager']}><Defects /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute roles={['admin', 'manager', 'project_manager']}><Reports /></ProtectedRoute>} />

      {/* Tester-only views */}
      <Route path="/create-defect" element={<ProtectedRoute roles={['tester']}><CreateDefect /></ProtectedRoute>} />
      <Route path="/my-defects" element={<ProtectedRoute roles={['tester']}><MyDefects /></ProtectedRoute>} />
      <Route path="/update-defect" element={<ProtectedRoute roles={['tester']}><UpdateDefect /></ProtectedRoute>} />
      <Route path="/verification-queue" element={<ProtectedRoute roles={['tester']}><VerificationQueue /></ProtectedRoute>} />
      <Route path="/verify-defect/:id" element={<ProtectedRoute roles={['tester']}><VerifyDefect /></ProtectedRoute>} />

      {/* Developer-only views */}
      <Route path="/assigned-defects" element={<ProtectedRoute roles={['developer']}><AssignedDefects /></ProtectedRoute>} />
      <Route path="/activity-history" element={<ProtectedRoute roles={['developer']}><ActivityHistory /></ProtectedRoute>} />

      <Route path="/" element={<Home />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

export default App;
