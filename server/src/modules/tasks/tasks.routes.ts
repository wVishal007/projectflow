import { Router } from 'express';
import { tasksController } from './tasks.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema } from './tasks.schema';

const router = Router();

router.use(authenticate);

router.get('/project/:projectId', (req, res, next) => tasksController.listByProject(req, res, next));
router.post('/project/:projectId', validate(createTaskSchema), (req, res, next) => tasksController.create(req, res, next));

router.get('/:id', (req, res, next) => tasksController.getById(req, res, next));
router.put('/:id', validate(updateTaskSchema), (req, res, next) => tasksController.update(req, res, next));
router.patch('/:id/status', validate(updateTaskStatusSchema), (req, res, next) => tasksController.updateStatus(req, res, next));
router.delete('/:id', (req, res, next) => tasksController.delete(req, res, next));

export { router as tasksRoutes };
