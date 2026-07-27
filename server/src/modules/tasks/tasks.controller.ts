import { Request, Response, NextFunction } from 'express';
import { tasksService } from './tasks.service';
import { ApiResponse } from '../../types';

export class TasksController {
  async listByProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const { tasks, meta } = await tasksService.listByProject(projectId, req.user!.userId, req);
      const response: ApiResponse = { success: true, data: tasks, meta };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const task = await tasksService.getById(id, req.user!.userId);
      const response: ApiResponse = { success: true, data: task };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const task = await tasksService.create(projectId, req.user!.userId, req.body);
      const response: ApiResponse = { success: true, data: task };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const task = await tasksService.update(id, req.user!.userId, req.body);
      const response: ApiResponse = { success: true, data: task };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const task = await tasksService.updateStatus(id, req.user!.userId, req.body);
      const response: ApiResponse = { success: true, data: task };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await tasksService.delete(id, req.user!.userId);
      const response: ApiResponse = { success: true, data: result };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const tasksController = new TasksController();
