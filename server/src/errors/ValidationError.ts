import { AppError } from './AppError';

export class ValidationError extends AppError {
  constructor(details: Array<{ field?: string; message: string }>) {
    super('Validation failed', 400, 'VALIDATION_ERROR', true, details);
  }
}
