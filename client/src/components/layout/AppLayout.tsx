import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuToggle={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="animate-fadeIn">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 bg-white dark:bg-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            Built for <a href="https://digitalheroesco.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-500 transition-colors">Digital Heroes Training Task</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
