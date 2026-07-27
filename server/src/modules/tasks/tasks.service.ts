import { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../errors/NotFoundError';
import { ForbiddenError } from '../../errors/ForbiddenError';
import { CreateTaskInput, UpdateTaskInput, UpdateTaskStatusInput } from './tasks.schema';
import { buildSearchWhere, buildOrderBy } from '../../utils/queryBuilder';
import { getPaginationParams, buildPaginatedMeta } from '../../utils/pagination';
import { Request } from 'express';
import { CONSTANTS } from '../../config/constants';

export class TasksService {
  async listByProject(projectId: string, userId: string, req: Request) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, ownerId: true } });
    if (!project) throw new NotFoundError('Project');
    if (project.ownerId !== userId) throw new ForbiddenError('Access denied');

    const { page, limit, skip } = getPaginationParams(req);
    const { search, sortBy, sortOrder, status, priority, assigneeId } = req.query as {
      search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc';
      status?: string; priority?: string; assigneeId?: string;
    };

    const searchWhere = search ? buildSearchWhere(['title', 'description'], search) : undefined;
    const where: Prisma.TaskWhereInput = {
      projectId,
      ...(searchWhere as any),
      ...(status && { status: status as TaskStatus }),
      ...(priority && { priority: priority as Prisma.EnumTaskPriorityFilter['equals'] }),
      ...(assigneeId && { assigneeId }),
    };

    const orderBy = buildOrderBy(sortBy || 'created_at', sortOrder || 'desc');

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return { tasks, meta: buildPaginatedMeta(total, page, limit) };
  }

  async getById(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true, ownerId: true } },
        _count: { select: { comments: true } },
      },
    });

    if (!task) throw new NotFoundError('Task');
    if (task.project.ownerId !== userId) throw new ForbiddenError('Access denied');

    return task;
  }

  async create(projectId: string, userId: string, input: CreateTaskInput) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, ownerId: true } });
    if (!project) throw new NotFoundError('Project');
    if (project.ownerId !== userId) throw new ForbiddenError('Access denied');

    const task = await prisma.task.create({
      data: {
        ...input,
        projectId,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    await this.logActivity(task.id, userId, CONSTANTS.ACTIVITY_ACTIONS.CREATED, { title: task.title });

    return task;
  }

  async update(taskId: string, userId: string, input: UpdateTaskInput) {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { ownerId: true } } },
    });

    if (!existing) throw new NotFoundError('Task');
    if (existing.project.ownerId !== userId) throw new ForbiddenError('Access denied');

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...input,
        dueDate: input.dueDate ? new Date(input.dueDate) : input.dueDate === null ? null : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    await this.logActivity(taskId, userId, CONSTANTS.ACTIVITY_ACTIONS.UPDATED, { changes: Object.keys(input) });

    return task;
  }

  async updateStatus(taskId: string, userId: string, input: UpdateTaskStatusInput) {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { ownerId: true } } },
    });

    if (!existing) throw new NotFoundError('Task');
    if (existing.project.ownerId !== userId) throw new ForbiddenError('Access denied');

    const updateData: Prisma.TaskUpdateInput = { status: input.status };

    if (input.status === 'DONE' && existing.status !== 'DONE') {
      updateData.completedAt = new Date();
    } else if (input.status !== 'DONE' && existing.status === 'DONE') {
      updateData.completedAt = null;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    const action = input.status === 'DONE' ? CONSTANTS.ACTIVITY_ACTIONS.COMPLETED : CONSTANTS.ACTIVITY_ACTIONS.STATUS_CHANGED;
    await this.logActivity(taskId, userId, action, {
      from: existing.status,
      to: input.status,
    });

    return task;
  }

  async delete(taskId: string, userId: string) {
    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { ownerId: true } } },
    });

    if (!existing) throw new NotFoundError('Task');
    if (existing.project.ownerId !== userId) throw new ForbiddenError('Access denied');

    await prisma.task.delete({ where: { id: taskId } });

    return { id: taskId };
  }

  private async logActivity(taskId: string, userId: string, action: string, details?: object) {
    await prisma.activity.create({
      data: { taskId, userId, action, details },
    });
  }
}

export const tasksService = new TasksService();
