import { useState, useMemo } from 'react';
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

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const { data: projectData, isLoading: projectLoading, error: projectError, refetch: refetchProject } = useProject(id!);
  const { data: tasksData, isLoading: tasksLoading, error: tasksError, refetch: refetchTasks } = useTasks(id!);
  const createMutation = useCreateTask();
  const statusMutation = useUpdateTaskStatus();
  const deleteMutation = useDeleteTask();

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createMutation.mutateAsync({ projectId: id!, data: { title, description, priority } });
    setShowCreate(false);
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    statusMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  if (projectError || tasksError) return <ErrorState message="Failed to load project" onRetry={() => { refetchProject(); refetchTasks(); }} />;

  const project = projectData?.data;
  const allTasks = tasksData?.data || [];
  const tasks = useMemo(
    () => statusFilter === 'ALL' ? allTasks : allTasks.filter((t: any) => t.status === statusFilter),
    [allTasks, statusFilter]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/projects" className="hover:text-primary-600">Projects</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">{project?.name || 'Loading...'}</span>
      </div>

      {projectLoading ? (
        <CardSkeleton />
      ) : project && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color }} />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
          </div>
          <Button onClick={() => setShowCreate(true)}>New Task</Button>
        </div>
      )}

      {project?.description && (
        <p className="text-gray-600 dark:text-gray-400">{project.description}</p>
      )}

      {allTasks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(['ALL', ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
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
          action={<Button onClick={() => setShowCreate(true)}>Create Task</Button>}
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No matching tasks"
          description="Try a different filter"
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task: any) => (
            <div key={task.id} className="card flex flex-col sm:flex-row sm:items-center justify-between py-4 group gap-3">
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
                  className="text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1"
                  aria-label="Task status"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
                <button
                  onClick={() => setDeleteTarget({ id: task.id, title: task.title })}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
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

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Task">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Task title"
              autoFocus
            />
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
          <div className="flex justify-end space-x-3">
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
