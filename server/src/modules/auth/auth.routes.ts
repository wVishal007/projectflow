import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.schema';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), (req, res, next) => authController.register(req, res, next));
router.post('/login', authRateLimiter, validate(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/refresh', validate(refreshTokenSchema), (req, res, next) => authController.refresh(req, res, next));
router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));

export { router as authRoutes };
