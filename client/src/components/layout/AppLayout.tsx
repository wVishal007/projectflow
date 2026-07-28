import { useState, useRef, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Skip to content
      </a>
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={toggleSidebar} />
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="flex-1 p-4 md:p-6 overflow-auto focus:outline-none"
        >
          <div className="animate-fadeIn max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 bg-white dark:bg-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Built for{' '}
            <a
              href="https://digitalheroesco.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium transition-colors"
            >
              Digital Heroes Training Task
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
