import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Search, LogOut, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Layout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/defects?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between h-16 shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white shrink-0">{title}</h2>
            
            {/* Global Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative max-w-md w-full ml-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by ID, title, project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
              />
            </form>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <NotificationBell />

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

            {/* User Profile Info */}
            <div className="flex items-center gap-2.5">
              <div className="w-8.5 h-8.5 bg-brand-100 dark:bg-brand-950/50 rounded-xl flex items-center justify-center text-brand-700 dark:text-brand-400 font-semibold text-sm shadow-sm">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{user?.full_name || 'System User'}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize leading-tight mt-0.5 font-medium">{user?.role?.replace('_', ' ') || 'Guest'}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-200">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
