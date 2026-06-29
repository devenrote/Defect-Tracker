import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Users from './pages/Users';
import Defects from './pages/Defects';
import Reports from './pages/Reports';
import CreateDefect from './pages/CreateDefect';
import MyDefects from './pages/MyDefects';
import AssignedDefects from './pages/AssignedDefects';
import Profile from './pages/Profile';
import DefectDetails from './pages/DefectDetails';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

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
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/defects/:id" element={<ProtectedRoute><DefectDetails /></ProtectedRoute>} />

      {/* Admin and Project Manager views */}
      <Route path="/projects" element={<ProtectedRoute roles={['admin', 'manager', 'project_manager']}><Projects /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute roles={['admin', 'manager', 'project_manager']}><ProjectDetails /></ProtectedRoute>} />
      
      {/* Admin-only views */}
      <Route path="/users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
      <Route path="/defects" element={<ProtectedRoute roles={['admin', 'manager', 'project_manager']}><Defects /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute roles={['admin', 'manager', 'project_manager']}><Reports /></ProtectedRoute>} />

      {/* Tester-only views */}
      <Route path="/create-defect" element={<ProtectedRoute roles={['tester']}><CreateDefect /></ProtectedRoute>} />
      <Route path="/my-defects" element={<ProtectedRoute roles={['tester']}><MyDefects /></ProtectedRoute>} />

      {/* Developer-only views */}
      <Route path="/assigned-defects" element={<ProtectedRoute roles={['developer']}><AssignedDefects /></ProtectedRoute>} />

      <Route path="/" element={<Home />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

export default App;
