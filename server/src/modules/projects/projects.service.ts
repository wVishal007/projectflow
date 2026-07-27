import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../errors/NotFoundError';
import { ForbiddenError } from '../../errors/ForbiddenError';
import { CreateProjectInput, UpdateProjectInput } from './projects.schema';
import { buildSearchWhere, buildOrderBy } from '../../utils/queryBuilder';
import { getPaginationParams, buildPaginatedMeta } from '../../utils/pagination';
import { Request } from 'express';

export class ProjectsService {
  async list(userId: string, req: Request) {
    const { page, limit, skip } = getPaginationParams(req);
    const { search, sortBy, sortOrder } = req.query as { search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' };

    const searchWhere = buildSearchWhere(['name', 'description'], search);
    const where: Prisma.ProjectWhereInput = {
      ownerId: userId,
      ...(searchWhere as any),
    };

    const orderBy = buildOrderBy(sortBy || 'created_at', sortOrder || 'desc');

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: { select: { tasks: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    const meta = buildPaginatedMeta(total, page, limit);

    return { projects, meta };
  }

  async getById(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        _count: { select: { tasks: true } },
        tasks: {
          select: { status: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    if (project.ownerId !== userId) {
      throw new ForbiddenError('You do not have access to this project');
    }

    const taskStats = {
      total: project._count.tasks,
      todo: project.tasks.filter((t) => t.status === 'TODO').length,
      inProgress: project.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      inReview: project.tasks.filter((t) => t.status === 'IN_REVIEW').length,
      done: project.tasks.filter((t) => t.status === 'DONE').length,
      cancelled: project.tasks.filter((t) => t.status === 'CANCELLED').length,
    };

    const { tasks, _count, ...projectData } = project;

    return { ...projectData, taskStats };
  }

  async create(userId: string, input: CreateProjectInput) {
    const project = await prisma.project.create({
      data: {
        ...input,
        ownerId: userId,
      },
      include: { _count: { select: { tasks: true } } },
    });

    return project;
  }

  async update(projectId: string, userId: string, input: UpdateProjectInput) {
    const existing = await prisma.project.findUnique({ where: { id: projectId } });

    if (!existing) throw new NotFoundError('Project');
    if (existing.ownerId !== userId) throw new ForbiddenError('Only the owner can update this project');

    const project = await prisma.project.update({
      where: { id: projectId },
      data: input,
      include: { _count: { select: { tasks: true } } },
    });

    return project;
  }

  async delete(projectId: string, userId: string) {
    const existing = await prisma.project.findUnique({ where: { id: projectId } });

    if (!existing) throw new NotFoundError('Project');
    if (existing.ownerId !== userId) throw new ForbiddenError('Only the owner can delete this project');

    await prisma.project.delete({ where: { id: projectId } });

    return { id: projectId };
  }
}

export const projectsService = new ProjectsService();
