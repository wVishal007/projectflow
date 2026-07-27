import { Request, Response, NextFunction } from 'express';
import { projectsService } from './projects.service';
import { ApiResponse } from '../../types';

export class ProjectsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projects, meta } = await projectsService.list(req.user!.userId, req);
      const response: ApiResponse = { success: true, data: projects, meta };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const project = await projectsService.getById(id, req.user!.userId);
      const response: ApiResponse = { success: true, data: project };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectsService.create(req.user!.userId, req.body);
      const response: ApiResponse = { success: true, data: project };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const project = await projectsService.update(id, req.user!.userId, req.body);
      const response: ApiResponse = { success: true, data: project };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await projectsService.delete(id, req.user!.userId);
      const response: ApiResponse = { success: true, data: result };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const projectsController = new ProjectsController();
