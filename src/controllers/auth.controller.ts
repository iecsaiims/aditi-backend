import { Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { changePassword, createStaffUser, createStaffUsersBatch, loginUser } from '../services/auth.service';
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

const createStaffBatchRowSchema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
  designation: z.string(),
  role: z.string(),
});

const createStaffBatchSchema = z.object({
  users: z.array(createStaffBatchRowSchema).min(1, 'Add at least one staff account to import'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must contain at least 8 character(s)'),
});

function resolveErrorMessage(error: unknown, fallback: string) {
  return error instanceof ZodError
    ? error.issues[0]?.message || fallback
    : error instanceof Error
      ? error.message
      : fallback;
}

export async function login(req: Request, res: Response) {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, resolveErrorMessage(error, 'Login failed'), 400);
  }
}

export async function createStaff(req: Request, res: Response) {
  try {
    const payload = createStaffSchema.parse(req.body);
    const result = await createStaffUser(payload);
    return sendSuccess(res, result, 201);
  } catch (error) {
    return sendError(res, resolveErrorMessage(error, 'Could not create staff account'), 400);
  }
}

export async function createStaffBatch(req: Request, res: Response) {
  try {
    const payload = createStaffBatchSchema.parse(req.body);
    const validUsers = [];
    const validationErrors: Array<{ row: number; email: string; message: string }> = [];

    for (const [index, user] of payload.users.entries()) {
      const parsed = createStaffSchema.safeParse(user);
      if (!parsed.success) {
        validationErrors.push({
          row: index + 1,
          email: user.email,
          message: parsed.error.issues[0]?.message || 'Invalid staff account payload',
        });
        continue;
      }

      validUsers.push(parsed.data);
    }

    if (!validUsers.length) {
      return sendSuccess(
        res,
        {
          createdUsers: [],
          errors: validationErrors,
        },
        201
      );
    }

    const result = await createStaffUsersBatch(validUsers);
    result.errors = [...validationErrors, ...result.errors];
    return sendSuccess(res, result, 201);
  } catch (error) {
    return sendError(res, resolveErrorMessage(error, 'Could not import staff accounts'), 400);
  }
}

export async function updatePassword(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'Authentication required', 401);
  }

  try {
    const payload = changePasswordSchema.parse(req.body);
    const result = await changePassword({
      userId: req.authUser.id,
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
    });
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, resolveErrorMessage(error, 'Could not change password'), 400);
  }
}
