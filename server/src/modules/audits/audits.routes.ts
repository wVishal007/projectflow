import { Router } from 'express';
import { auditsController } from './audits.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { createAuditSchema, auditFilterSchema } from './audits.schema';

const router = Router();

router.use(authenticate);

router.post('/', validate(createAuditSchema), (req, res, next) => auditsController.create(req, res, next));
router.get('/', validate(auditFilterSchema, 'query'), (req, res, next) => auditsController.list(req, res, next));
router.get('/:id', (req, res, next) => auditsController.getById(req, res, next));
router.delete('/:id', (req, res, next) => auditsController.delete(req, res, next));

export { router as auditsRoutes };
