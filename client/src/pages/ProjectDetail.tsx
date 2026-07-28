import { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProject } from '../hooks/useProjects';
import { useTasks, useCreateTask, useUpdateTaskStatus, useDeleteTask } from '../hooks/useTasks';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { TaskStatus } from '../types';
import { formatDate } from '../lib/utils';

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'];

const statusColors = {
  TODO: 'from-gray-400 to-gray-500',
  IN_PROGRESS: 'from-blue-500 to-blue-400',
  IN_REVIEW: 'from-yellow-500 to-yellow-400',
  DONE: 'from-green-500 to-green-400',
  CANCELLED: 'from-red-500 to-red-400',
};

const statusLabels = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [titleError, setTitleError] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const { data: projectData, isLoading: projectLoading, error: projectError, refetch: refetchProject } = useProject(id!);
  const { data: tasksData, isLoading: tasksLoading, error: tasksError, refetch: refetchTasks } = useTasks(id!);
  const createMutation = useCreateTask();
  const statusMutation = useUpdateTaskStatus();
  const deleteMutation = useDeleteTask();

  const handleCreate = useCallback(async () => {
    if (!title.trim()) {
      setTitleError('Task title is required');
      return;
    }
    setTitleError('');
    await createMutation.mutateAsync({ projectId: id!, data: { title, description, priority } });
    setShowCreate(false);
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
  }, [title, description, priority, id, createMutation]);

  const handleStatusChange = useCallback((taskId: string, newStatus: TaskStatus) => {
    statusMutation.mutate({ id: taskId, status: newStatus });
  }, [statusMutation]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }, [deleteTarget, deleteMutation]);

  const handleOpenCreate = useCallback(() => setShowCreate(true), []);

  if (projectError || tasksError) return <ErrorState message="Failed to load project" onRetry={() => { refetchProject(); refetchTasks(); }} />;

  const project = projectData?.data;
  const allTasks = tasksData?.data || [];
  const tasks = useMemo(
    () => statusFilter === 'ALL' ? allTasks : allTasks.filter((t: any) => t.status === statusFilter),
    [allTasks, statusFilter]
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/projects" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Projects</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">{project?.name || 'Loading...'}</span>
      </div>

      {projectLoading ? (
        <CardSkeleton />
      ) : project && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md" style={{ backgroundColor: project.color }}>
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
          </div>
          <Button onClick={handleOpenCreate} size="lg">
            <svg className="w-4.5 h-4.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </Button>
        </div>
      )}

      {project?.description && (
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{project.description}</p>
      )}

      {allTasks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(['ALL', ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                statusFilter === s
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {s === 'ALL' ? 'All' : statusLabels[s as TaskStatus]}
            </button>
          ))}
        </div>
      )}

      {tasksLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : allTasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Create your first task for this project"
          action={<Button onClick={handleOpenCreate}>Create Task</Button>}
          icon={
            <svg className="w-9 h-9 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No matching tasks"
          description="Try a different filter"
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task: any) => (
            <div key={task.id} className="card flex flex-col sm:flex-row sm:items-center justify-between py-4 group gap-3 border-l-4 transition-all hover:shadow-md" style={{ borderLeftColor: task.status === 'TODO' ? '#9CA3AF' : task.status === 'IN_PROGRESS' ? '#3B82F6' : task.status === 'IN_REVIEW' ? '#EAB308' : task.status === 'DONE' ? '#22C55E' : '#F87171' }}>
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{task.title}</h3>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
                {task.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{task.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
                  {task.assignee && <span>Assigned to {task.assignee.name}</span>}
                  {task.dueDate && <span>Due {formatDate(task.dueDate)}</span>}
                  {task._count?.comments > 0 && <span>{task._count.comments} comments</span>}
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                  className="input-field w-auto min-w-[140px] text-xs py-1.5"
                  aria-label="Task status"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{statusLabels[s]}</option>
                  ))}
                </select>
                <button
                  onClick={() => setDeleteTarget({ id: task.id, title: task.title })}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
                  aria-label="Delete task"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Task" size="md">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(''); }}
              className={`input-field ${titleError ? 'input-field-error' : ''}`}
              placeholder="Task title"
              autoFocus
            />
            {titleError && <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1 animate-slideDown" role="alert">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {titleError}
            </p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-field">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={createMutation.isPending}>Create</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete task"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
