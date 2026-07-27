import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { ApiResponse } from '../../types';

export class AnalyticsController {
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await analyticsService.getOverview(req.user!.userId);
      const response: ApiResponse = { success: true, data: overview };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getProjectAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const analytics = await analyticsService.getProjectAnalytics(id, req.user!.userId);
      const response: ApiResponse = { success: true, data: analytics };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getActivityFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { activities, meta } = await analyticsService.getActivityFeed(req.user!.userId, req);
      const response: ApiResponse = { success: true, data: activities, meta };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
