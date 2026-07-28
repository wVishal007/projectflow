import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../errors/NotFoundError';
import { ForbiddenError } from '../../errors/ForbiddenError';
import { getPaginationParams, buildPaginatedMeta } from '../../utils/pagination';
import { Request } from 'express';

export class AnalyticsService {
  async getOverview(userId: string) {
    const [totalProjects, tasksByStatus, recentTasks, overdueTasks] = await Promise.all([
      prisma.project.count({ where: { ownerId: userId } }),
      prisma.task.groupBy({
        by: ['status'],
        where: { project: { ownerId: userId } },
        _count: { status: true },
      }),
      prisma.task.findMany({
        where: { project: { ownerId: userId } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, status: true, priority: true, updatedAt: true },
      }),
      prisma.task.count({
        where: {
          project: { ownerId: userId },
          status: { notIn: ['DONE', 'CANCELLED'] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    const statusMap = Object.fromEntries(tasksByStatus.map((s) => [s.status, s._count.status]));
    const totalTasks = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const completedTasks = statusMap['DONE'] || 0;

    return {
      totalProjects,
      totalTasks,
      tasksByStatus: {
        todo: statusMap['TODO'] || 0,
        inProgress: statusMap['IN_PROGRESS'] || 0,
        inReview: statusMap['IN_REVIEW'] || 0,
        done: completedTasks,
        cancelled: statusMap['CANCELLED'] || 0,
      },
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      overdueTasks,
      recentTasks,
    };
  }

  async getProjectAnalytics(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError('Project');
    if (project.ownerId !== userId) throw new ForbiddenError('Access denied');

    const [tasksByStatus, tasksByPriority, tasksByAssignee, overdueTasks, recentlyCompleted] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { projectId },
        _count: { status: true },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { projectId },
        _count: { priority: true },
      }),
      prisma.task.groupBy({
        by: ['assigneeId'],
        where: { projectId, assigneeId: { not: null } },
        _count: { assigneeId: true },
      }),
      prisma.task.count({
        where: {
          projectId,
          status: { notIn: ['DONE', 'CANCELLED'] },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.task.findMany({
        where: { projectId, status: 'DONE' },
        orderBy: { completedAt: 'desc' },
        take: 5,
        select: { id: true, title: true, completedAt: true, priority: true },
      }),
    ]);

    const statusMap = Object.fromEntries(tasksByStatus.map((s) => [s.status, s._count.status]));
    const totalTasks = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const completedTasks = statusMap['DONE'] || 0;

    const priorityMap = Object.fromEntries(tasksByPriority.map((p) => [p.priority, p._count.priority]));

    return {
      project: { id: project.id, name: project.name },
      totalTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      tasksByStatus: {
        todo: statusMap['TODO'] || 0,
        inProgress: statusMap['IN_PROGRESS'] || 0,
        inReview: statusMap['IN_REVIEW'] || 0,
        done: completedTasks,
        cancelled: statusMap['CANCELLED'] || 0,
      },
      tasksByPriority: {
        low: priorityMap['LOW'] || 0,
        medium: priorityMap['MEDIUM'] || 0,
        high: priorityMap['HIGH'] || 0,
        urgent: priorityMap['URGENT'] || 0,
      },
      tasksByAssignee: tasksByAssignee.length,
      overdueTasks,
      recentlyCompleted,
    };
  }

  async getActivityFeed(userId: string, req: Request) {
    const { page, limit, skip } = getPaginationParams(req);
    const { projectId } = req.query as { projectId?: string };

    const where = {
      task: {
        project: {
          ownerId: userId,
          ...(projectId && { id: projectId }),
        },
      },
    };

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          task: { select: { id: true, title: true, project: { select: { id: true, name: true } } } },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    return { activities, meta: buildPaginatedMeta(total, page, limit) };
  }
}

export const analyticsService = new AnalyticsService();
