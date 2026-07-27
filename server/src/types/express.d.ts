import { JwtUser } from './api';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
      requestId?: string;
    }
  }
}
