import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAnalyticsOverview } from '../hooks/useAnalytics';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { TaskStatus, TaskPriority } from '../types';
import { formatRelativeTime } from '../lib/utils';

const statCards = [
  { label: 'Total Projects', key: 'totalProjects', color: 'bg-blue-500' },
  { label: 'Total Tasks', key: 'totalTasks', color: 'bg-purple-500' },
  { label: 'Completion Rate', key: 'completionRate', suffix: '%', color: 'bg-green-500' },
  { label: 'Overdue Tasks', key: 'overdueTasks', color: 'bg-red-500' },
];

export function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const { data, isLoading, error, refetch } = useAnalyticsOverview();

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your projects and tasks</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.key} className="card flex items-center space-x-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-lg">
                  {typeof analytics[stat.key as keyof typeof analytics] === 'number'
                    ? (analytics[stat.key as keyof typeof analytics] as number)
                    : 0}
                  {stat.suffix || ''}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.suffix
                    ? `${analytics[stat.key as keyof typeof analytics]}${stat.suffix}`
                    : analytics[stat.key as keyof typeof analytics]}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tasks by Status</h2>
          </div>
          {isLoading ? (
            <TableSkeleton rows={4} />
          ) : analytics && (
            <div className="space-y-3">
              {[
                { label: 'To Do', count: analytics.tasksByStatus.todo, color: 'bg-gray-400' },
                { label: 'In Progress', count: analytics.tasksByStatus.inProgress, color: 'bg-blue-500' },
                { label: 'In Review', count: analytics.tasksByStatus.inReview, color: 'bg-yellow-500' },
                { label: 'Done', count: analytics.tasksByStatus.done, color: 'bg-green-500' },
              ].map((item) => {
                const total = analytics.totalTasks || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.count} <span className="text-gray-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div className={`${item.color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Tasks</h2>
            <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-500">View all</Link>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'ALL')}
              className="text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1"
            >
              <option value="ALL">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'ALL')}
              className="text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1"
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
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentTasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(task.updatedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No matching tasks</p>
          )}
        </div>
      </div>
    </div>
  );
}
