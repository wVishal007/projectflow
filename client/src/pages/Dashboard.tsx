import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAnalyticsOverview } from '../hooks/useAnalytics';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { TaskStatus, TaskPriority } from '../types';
import { formatRelativeTime } from '../lib/utils';

const statCards = [
  { label: 'Total Projects', key: 'totalProjects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', color: 'from-blue-500 to-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-600 dark:text-blue-400' },
  { label: 'Total Tasks', key: 'totalTasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', color: 'from-purple-500 to-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20', textColor: 'text-purple-600 dark:text-purple-400' },
  { label: 'Completion Rate', key: 'completionRate', suffix: '%', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-green-500 to-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20', textColor: 'text-green-600 dark:text-green-400' },
  { label: 'Overdue Tasks', key: 'overdueTasks', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-red-500 to-red-400', bgColor: 'bg-red-50 dark:bg-red-900/20', textColor: 'text-red-600 dark:text-red-400' },
];

export function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const { data, isLoading, error, refetch } = useAnalyticsOverview();

  const handleStatusFilter = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as TaskStatus | 'ALL');
  }, []);

  const handlePriorityFilter = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPriorityFilter(e.target.value as TaskPriority | 'ALL');
  }, []);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const analytics = data?.data;

  const recentTasks = useMemo(() => {
    if (!analytics?.recentTasks) return [];
    return analytics.recentTasks.filter((task: any) => {
      if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
      return true;
    });
  }, [analytics, statusFilter, priorityFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's what's happening with your projects.</p>
        </div>
        <Link to="/projects" className="btn-primary self-start">
          <svg className="w-4.5 h-4.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.key} className={`card card-hover relative overflow-hidden ${stat.bgColor}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/5 dark:to-gray-800/5" />
              <div className="relative flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.color} shadow-lg`}>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.suffix
                      ? `${analytics[stat.key as keyof typeof analytics]}${stat.suffix}`
                      : analytics[stat.key as keyof typeof analytics]}
                  </p>
                </div>
              </div>
              {stat.key === 'completionRate' && (
                <div className="absolute bottom-0 right-0 -translate-x-1/2 translate-y-1/2 w-24 h-24 bg-gradient-to-tl from-primary-500/10 to-transparent rounded-full" />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">Tasks by Status</h2>
          {isLoading ? (
            <TableSkeleton rows={4} />
          ) : analytics && (
            <div className="space-y-4">
              {[
                { label: 'To Do', count: analytics.tasksByStatus.todo, color: 'from-gray-400 to-gray-500', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', border: 'border-l-4 border-gray-400' },
                { label: 'In Progress', count: analytics.tasksByStatus.inProgress, color: 'from-blue-500 to-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-l-4 border-blue-500' },
                { label: 'In Review', count: analytics.tasksByStatus.inReview, color: 'from-yellow-500 to-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-l-4 border-yellow-500' },
                { label: 'Done', count: analytics.tasksByStatus.done, color: 'from-green-500 to-green-400', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', border: 'border-l-4 border-green-500' },
              ].map((item) => {
                const total = analytics.totalTasks || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.label} className={`relative p-4 rounded-xl ${item.bg} ${item.border} transition-all hover:shadow-md`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${item.color}`} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {item.count} <span className="text-gray-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${item.color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Tasks</h2>
            <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-500 font-medium">View all</Link>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className="input-field w-auto min-w-[140px] text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
            <select
              value={priorityFilter}
              onChange={handlePriorityFilter}
              className="input-field w-auto min-w-[140px] text-xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : recentTasks.length ? (
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
              {recentTasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-750/50 rounded-lg px-3 -ml-3 -mr-3 transition-colors">
                  <div className="flex-1 min-w-0 mr-4">
                    <Link to={`/projects/${task.projectId}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors block">
                      {task.title}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatRelativeTime(task.updatedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No matching tasks found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try changing your filters or create a new task</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
