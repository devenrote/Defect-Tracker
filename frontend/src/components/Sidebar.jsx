import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Bug, 
  BarChart3, 
  PlusCircle, 
  User, 
  LogOut, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Bell,
  Edit,
  Activity
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getLinks = () => {
    const role = user?.role;
    
    // Admin Links
    if (role === 'admin') {
      return [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/projects', label: 'Projects', icon: FolderKanban },
        { to: '/defects', label: 'Defects', icon: Bug },
        { to: '/users', label: 'Users', icon: Users },
        { to: '/reports', label: 'Reports', icon: BarChart3 },
      ];
    }
    
    // Project Manager Links
    if (role === 'manager' || role === 'project_manager') {
      return [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/projects', label: 'My Projects', icon: FolderKanban },
        { to: '/defects', label: 'Defects', icon: Bug },
        { to: '/users', label: 'Team Members', icon: Users },
        { to: '/reports', label: 'Reports', icon: BarChart3 },
        { to: '/notifications', label: 'Notifications', icon: Bell },
      ];
    }
    
    // Tester Links
    if (role === 'tester') {
      return [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/projects', label: 'My Projects', icon: FolderKanban },
        { to: '/create-defect', label: 'Report Defect', icon: PlusCircle },
        { to: '/my-defects', label: 'My Defects', icon: Bug },
        { to: '/update-defect', label: 'Update Defect', icon: Edit },
        { to: '/verification-queue', label: 'Verification Queue', icon: Activity },
      ];
    }
    
    // Developer Links
    if (role === 'developer') {
      return [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/projects', label: 'My Projects', icon: FolderKanban },
        { to: '/assigned-defects', label: 'Assigned Defects', icon: Bug },
        { to: '/activity-history', label: 'Activity History', icon: Activity },
      ];
    }

    // Default Fallback
    return [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];
  };

  const links = getLinks();

  return (
    <aside className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 flex flex-col shrink-0 transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 shadow-sm z-50 cursor-pointer"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Header */}
      <div className={`p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md shadow-brand-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        {!isCollapsed && (
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-white leading-tight tracking-tight">DefectTracker</h1>
            <p className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 mt-0.5 tracking-wide uppercase">Enterprise SaaS</p>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 relative group ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                  {!isCollapsed && <span className="truncate">{link.label}</span>}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-md">
                      {link.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Settings & Profile */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-1 mt-auto shrink-0">
        {user?.role === 'admin' && (
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 relative group ${
                isActive
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <Settings className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-md">
                Settings
              </div>
            )}
          </NavLink>
        )}
        
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 relative group ${
              isActive
                ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <User className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
          {!isCollapsed && <span>Profile</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-md">
              Profile
            </div>
          )}
        </NavLink>

        <button
          onClick={logout}
          className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 w-full transition-all duration-150 relative group cursor-pointer"
        >
          <LogOut className="w-5 h-5 text-rose-500 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-md">
              Logout
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
