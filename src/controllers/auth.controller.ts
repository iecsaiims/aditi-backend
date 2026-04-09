import { Request, Response } from 'express';
import { z } from 'zod';
import { loginUser } from '../services/auth.service';
import { sendError, sendSuccess } from '../utils/http';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.string().min(1),
  rememberMe: z.boolean().optional()
});

export async function login(req: Request, res: Response) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return sendError(res, message, 400);
  }
}
