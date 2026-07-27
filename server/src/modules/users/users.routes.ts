import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authController } from '../auth/auth.controller';

const router = Router();

router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));

export { router as usersRoutes };
