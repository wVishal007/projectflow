import { Request, Response, NextFunction } from 'express';
import { commentsService } from './comments.service';
import { ApiResponse } from '../../types';

export class CommentsController {
  async listByTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = req.params.taskId as string;
      const { comments, meta } = await commentsService.listByTask(taskId, req.user!.userId, req);
      const response: ApiResponse = { success: true, data: comments, meta };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = req.params.taskId as string;
      const comment = await commentsService.create(taskId, req.user!.userId, req.body);
      const response: ApiResponse = { success: true, data: comment };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await commentsService.delete(id, req.user!.userId);
      const response: ApiResponse = { success: true, data: result };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const commentsController = new CommentsController();
