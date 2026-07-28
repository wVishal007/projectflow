import { Request, Response, NextFunction } from 'express';
import { auditsService } from './audits.service';
import { ApiResponse } from '../../types';

export class AuditsController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await auditsService.create(req.body, req.user!.userId);
      if (result.status === 'error') {
        const response: ApiResponse = {
          success: false,
          error: { code: result.errorCode || 'AUDIT_ERROR', message: result.error || 'Audit failed' },
        };
        res.status(422).json(response);
        return;
      }
      const response: ApiResponse = { success: true, data: result };
      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { audits, meta } = await auditsService.list(req.user!.userId, req);
      const response: ApiResponse = { success: true, data: audits, meta };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const audit = await auditsService.getById(req.params.id as string, req.user!.userId);
      const response: ApiResponse = { success: true, data: audit };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await auditsService.delete(req.params.id as string, req.user!.userId);
      const response: ApiResponse = { success: true, data: result };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const auditsController = new AuditsController();
