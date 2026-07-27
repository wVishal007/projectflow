import { Router } from 'express';
import { commentsController } from './comments.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { createCommentSchema } from './comments.schema';

const router = Router();

router.use(authenticate);

router.get('/task/:taskId', (req, res, next) => commentsController.listByTask(req, res, next));
router.post('/task/:taskId', validate(createCommentSchema), (req, res, next) => commentsController.create(req, res, next));
router.delete('/:id', (req, res, next) => commentsController.delete(req, res, next));

export { router as commentsRoutes };
