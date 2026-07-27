import { useAnalyticsOverview, useActivityFeed } from '../hooks/useAnalytics';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { formatRelativeTime } from '../lib/utils';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const STATUS_COLORS = ['#9CA3AF', '#3B82F6', '#EAB308', '#22C55E', '#F87171'];

export function Analytics() {
  const { data: overviewData, isLoading: overviewLoading, error: overviewError, refetch: refetchOverview } = useAnalyticsOverview();
  const { data: activityData, isLoading: activityLoading } = useActivityFeed();

  if (overviewError) return <ErrorState message={overviewError.message} onRetry={refetchOverview} />;

  const overview = overviewData?.data;
  const activities = activityData?.data || [];

  const statusData = overview ? [
    { name: 'To Do', value: overview.tasksByStatus.todo },
    { name: 'In Progress', value: overview.tasksByStatus.inProgress },
    { name: 'In Review', value: overview.tasksByStatus.inReview },
    { name: 'Done', value: overview.tasksByStatus.done },
    { name: 'Cancelled', value: overview.tasksByStatus.cancelled },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Insights into your productivity</p>
      </div>

      {overviewLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : overview && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-bold text-primary-600">{overview.completionRate}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Completion Rate</p>
              <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${overview.completionRate}%` }} />
              </div>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-green-600">{overview.totalProjects}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Projects</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-red-600">{overview.overdueTasks}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overdue Tasks</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Task Distribution</h2>
              {overview.totalTasks > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-12">No tasks to display</p>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tasks by Status</h2>
              {overview.totalTasks > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-12">No tasks to display</p>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Activity Feed</h2>
            {activityLoading ? (
              <TableSkeleton rows={5} />
            ) : activities.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {activities.map((activity: any) => (
                  <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 dark:text-primary-400 text-xs font-bold">
                        {activity.user?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        <span className="font-medium">{activity.user?.name}</span>
                        {' '}{activity.action.replace('_', ' ')}{' '}
                        <span className="font-medium">{activity.task?.title}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(activity.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
