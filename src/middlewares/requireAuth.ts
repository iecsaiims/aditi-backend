import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { verifyAuthToken } from '../utils/auth';
import { sendError } from '../utils/http';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    req.authUser = verifyAuthToken(token, env.authSecret);
    return next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token';
    return sendError(res, message, 401);
  }
}
