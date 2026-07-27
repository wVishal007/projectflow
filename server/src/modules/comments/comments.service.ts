import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../errors/NotFoundError';
import { ForbiddenError } from '../../errors/ForbiddenError';
import { CreateCommentInput } from './comments.schema';
import { getPaginationParams, buildPaginatedMeta } from '../../utils/pagination';
import { Request } from 'express';

export class CommentsService {
  async listByTask(taskId: string, userId: string, req: Request) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { ownerId: true } } },
    });

    if (!task) throw new NotFoundError('Task');
    if (task.project.ownerId !== userId) throw new ForbiddenError('Access denied');

    const { page, limit, skip } = getPaginationParams(req);

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { taskId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      }),
      prisma.comment.count({ where: { taskId } }),
    ]);

    return { comments, meta: buildPaginatedMeta(total, page, limit) };
  }

  async create(taskId: string, userId: string, input: CreateCommentInput) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { ownerId: true } } },
    });

    if (!task) throw new NotFoundError('Task');
    if (task.project.ownerId !== userId) throw new ForbiddenError('Access denied');

    const comment = await prisma.comment.create({
      data: { content: input.content, taskId, authorId: userId },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return comment;
  }

  async delete(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) throw new NotFoundError('Comment');
    if (comment.authorId !== userId) throw new ForbiddenError('Only the author can delete this comment');

    await prisma.comment.delete({ where: { id: commentId } });

    return { id: commentId };
  }
}

export const commentsService = new CommentsService();
