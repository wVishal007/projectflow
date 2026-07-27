import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/overview', (req, res, next) => analyticsController.getOverview(req, res, next));
router.get('/projects/:id', (req, res, next) => analyticsController.getProjectAnalytics(req, res, next));
router.get('/activity', (req, res, next) => analyticsController.getActivityFeed(req, res, next));

export { router as analyticsRoutes };
