import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface HeaderProps {
  onMenuToggle: () => void;
}

function getInitials(name: string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-red-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    setShowLogoutConfirm(false);
  }, [logout]);

  const toggleMenu = useCallback(() => setMenuOpen((m) => !m), []);

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 md:py-3.5 sticky top-0 z-20">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex-1 hidden md:block" />

        <div className="flex items-center space-x-3">
          <div
            className="flex items-center space-x-3 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
            onClick={toggleMenu}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white dark:ring-gray-700 shadow-sm ${getAvatarColor(
                user?.name || 'User'
              )}`}
            >
              {getInitials(user?.name || 'User')}
            </div>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="hidden sm:flex text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2.5 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Logout"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Logout"
      />
    </header>
  );
}
