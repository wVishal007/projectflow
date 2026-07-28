import { useAnalyticsOverview, useActivityFeed } from '../hooks/useAnalytics';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { formatRelativeTime } from '../lib/utils';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const STATUS_COLORS = ['#9CA3AF', '#3B82F6', '#EAB308', '#22C55E', '#F87171'];

const customTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 p-3 min-w-[140px]">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.value} {entry.name}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

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
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Insights into your productivity</p>
      </div>

      {overviewLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : overview && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card card-hover relative overflow-hidden bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-400/20 to-transparent rounded-full blur-2xl" />
              <div className="relative text-center">
                <p className="text-4xl md:text-5xl font-bold text-green-600 dark:text-green-400">{overview.completionRate}%</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Completion Rate</p>
                <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${overview.completionRate}%` }} />
                </div>
              </div>
            </div>
            <div className="card card-hover relative overflow-hidden bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-400/20 to-transparent rounded-full blur-2xl" />
              <div className="relative text-center">
                <p className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400">{overview.totalProjects}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Projects</p>
              </div>
            </div>
            <div className="card card-hover relative overflow-hidden bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-400/20 to-transparent rounded-full blur-2xl" />
              <div className="relative text-center">
                <p className="text-4xl md:text-5xl font-bold text-red-600 dark:text-red-400">{overview.overdueTasks}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overdue Tasks</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">Task Distribution</h2>
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
                      label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip content={customTooltip} />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      iconType="circle"
                      iconSize={8}
                      formatter={(name: string) => name}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No tasks to display</p>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">Tasks by Status</h2>
              {overview.totalTasks > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={statusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip content={customTooltip} />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      iconType="circle"
                      iconSize={8}
                      formatter={(name: string) => name}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} layout="vertical">
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No tasks to display</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">Activity Feed</h2>
            {activityLoading ? (
              <TableSkeleton rows={5} />
            ) : activities.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin">
                {activities.map((activity: any) => (
                  <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 dark:text-primary-400 text-xs font-bold">
                        {activity.user?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{activity.user?.name}</span>
                        {' '}{activity.action.replace('_', ' ')}{' '}
                        <span className="font-medium text-primary-600 dark:text-primary-400">{activity.task?.title}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(activity.createdAt)}</p>
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
