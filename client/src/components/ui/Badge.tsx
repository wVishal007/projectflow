import React from 'react';
import { TaskStatus, TaskPriority } from '../../types';
import { statusColors, priorityColors, statusLabels, priorityLabels } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  role?: string;
  ariaLabel?: string;
}

export function Badge({ children, className = '', role, ariaLabel }: BadgeProps) {
  return (
    <span
      role={role}
      aria-label={ariaLabel}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge className={statusColors[status]} role="status" ariaLabel={`Status: ${statusLabels[status]}`}>
      {statusLabels[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge className={priorityColors[priority]} role="status" ariaLabel={`Priority: ${priorityLabels[priority]}`}>
      {priorityLabels[priority]}
    </Badge>
  );
}
