import { Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { createStaffUser, loginUser } from '../services/auth.service';
import { sendError, sendSuccess } from '../utils/http';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional()
});

const createStaffSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, 'Password must contain at least 8 character(s)'),
  designation: z.string().min(1),
  role: z.enum(['triage_officer', 'emergency_nurse', 'admin']),
});

export async function login(req: Request, res: Response) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return sendSuccess(res, result);
  } catch (error) {
    const message =
      error instanceof ZodError
        ? error.issues[0]?.message || 'Invalid login payload'
        : error instanceof Error
          ? error.message
          : 'Login failed';
    return sendError(res, message, 400);
  }
}

export async function createStaff(req: Request, res: Response) {
  try {
    const payload = createStaffSchema.parse(req.body);
    const result = await createStaffUser(payload);
    return sendSuccess(res, result, 201);
  } catch (error) {
    const message =
      error instanceof ZodError
        ? error.issues[0]?.message || 'Invalid staff account payload'
        : error instanceof Error
          ? error.message
          : 'Could not create staff account';
    return sendError(res, message, 400);
  }
}
