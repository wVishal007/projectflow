import { Router } from 'express';
import { projectsController } from './projects.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { createProjectSchema, updateProjectSchema } from './projects.schema';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => projectsController.list(req, res, next));
router.post('/', validate(createProjectSchema), (req, res, next) => projectsController.create(req, res, next));
router.get('/:id', (req, res, next) => projectsController.getById(req, res, next));
router.put('/:id', validate(updateProjectSchema), (req, res, next) => projectsController.update(req, res, next));
router.delete('/:id', (req, res, next) => projectsController.delete(req, res, next));

export { router as projectsRoutes };
