import { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/http';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.authUser?.role !== 'admin') {
    return sendError(res, 'Admin access required', 403);
  }

  return next();
}
