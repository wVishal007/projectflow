import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/ForbiddenError';

export function authorize(ownerIdExtractor: (req: Request) => Promise<string | null>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const ownerId = await ownerIdExtractor(req);

      if (!ownerId) {
        next(new ForbiddenError('Resource not found'));
        return;
      }

      if (req.user?.userId !== ownerId) {
        next(new ForbiddenError('You do not have permission to perform this action'));
        return;
      }

      next();
    } catch {
      next(new ForbiddenError('Authorization check failed'));
    }
  };
}
