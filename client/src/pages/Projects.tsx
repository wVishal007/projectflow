import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useProjects, useCreateProject, useDeleteProject } from '../hooks/useProjects';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { FormField } from '../components/ui/FormField';
import { formatDate } from '../lib/utils';

const searchIcon = (
  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export function Projects() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const { data, isLoading, error, refetch } = useProjects();
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      setNameError('Project name is required');
      return;
    }
    setNameError('');
    await createMutation.mutateAsync({ name, description });
    setShowCreate(false);
    setName('');
    setDescription('');
  }, [name, description, createMutation]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }, [deleteTarget, deleteMutation]);

  const handleCloseCreate = useCallback(() => {
    setShowCreate(false);
    setNameError('');
  }, []);

  const handleOpenCreate = useCallback(() => setShowCreate(true), []);

  const emptyAction = useMemo(() => (
    <Button onClick={handleOpenCreate} size="lg">Create Project</Button>
  ), [handleOpenCreate]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const projects = data?.data || [];
  const filtered = useMemo(
    () =>
      projects.filter((p: any) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      ),
    [projects, search]
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and organize your projects</p>
        </div>
        <Button onClick={handleOpenCreate} size="md">
          <svg className="w-4.5 h-4.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Button>
      </div>

      {projects.length > 0 && (
        <div className="relative max-w-md">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{searchIcon}</div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="input-field pl-10"
            aria-label="Search projects"
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start organizing your work"
          action={emptyAction}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching projects"
          description="Try a different search term or create a new project"
          action={emptyAction}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project: any) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="card card-interactive group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r" style={{ background: project.color }} />
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors truncate">
                    {project.name}
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteTarget({ id: project.id, name: project.name });
                  }}
                  className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 flex-shrink-0"
                  aria-label="Delete project"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              {project.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{project.description}</p>
              )}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {project._count?.tasks || 0} tasks
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(project.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={handleCloseCreate} title="New Project" size="md">
        <div className="space-y-4">
          <FormField label="Name" required error={nameError} hint="Enter a descriptive name">
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); if (nameError) setNameError(''); }}
              className={`input-field ${nameError ? 'input-field-error' : ''}`}
              placeholder="Project name"
              autoFocus
            />
          </FormField>
          <FormField label="Description" hint="Optional description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Optional description"
            />
          </FormField>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={handleCloseCreate}>Cancel</Button>
            <Button onClick={handleCreate} loading={createMutation.isPending}>Create Project</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all tasks in this project. This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
