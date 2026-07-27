import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { createChildLogger } from '../utils/logger';
import { ApiResponse } from '../types';

const logger = createChildLogger('errorHandler');

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };

    logger.warn({
      requestId: req.requestId,
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      path: req.originalUrl,
      method: req.method,
    }, 'Operational error');

    res.status(err.statusCode).json(response);
    return;
  }

  logger.error({
    requestId: req.requestId,
    err,
    path: req.originalUrl,
    method: req.method,
  }, 'Unexpected error');

  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };

  res.status(500).json(response);
}
