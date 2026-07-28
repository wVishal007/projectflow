import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { statusLabels } from '../../lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/projects', label: 'Projects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { path: '/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
          role="button"
          aria-label="Close sidebar"
          tabIndex={-1}
        />
      )}

      <aside
        className={`
          fixed md:sticky md:top-0 inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-white via-white to-gray-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-850 border-r border-gray-200 dark:border-gray-700 h-screen
          transform transition-transform duration-300 ease-out
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-3 group" onClick={onClose}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-bold text-lg">PF</span>
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100 block leading-none">ProjectFlow</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 tracking-wide">WORKSPACE</span>
            </div>
          </Link>
        </div>

        <nav className="px-3 mt-2" aria-label="Main navigation">
          <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Menu</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-primary-100 dark:bg-primary-900/40' : 'bg-gray-100 dark:bg-gray-700/40 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'}`}>
                  <svg className={`w-5 h-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                </div>
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span className="block font-medium text-gray-900 dark:text-gray-100">Theme</span>
              <span>Switch appearance</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}

// Re-export labels helper for tests/types that may reference it
export { statusLabels };
