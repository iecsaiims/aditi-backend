import { Request, Response } from 'express';
import { z } from 'zod';
import { createPatient, getPatients } from '../services/patient.service';
import { sendError, sendSuccess } from '../utils/http';

const patientSchema = z.object({
  crNo: z.string().min(1),
  name: z.string().min(1),
  age: z.number().int().positive(),
  gender: z.enum(['M', 'F', 'O']),
  category: z.enum(['RED', 'YELLOW', 'GREEN', 'BLACK']),
  area: z.string().min(1),
  complaint: z.string().optional(),
  pathway: z.enum(['NonTrauma', 'Trauma']),
  contactNumber: z.string().optional(),
  triageData: z.unknown().optional(),
  consultationStatus: z.string().optional(),
  dispositionStatus: z.string().optional(),
  time: z.string().min(1),
  timestamp: z.string().datetime()
});

export async function listPatients(_req: Request, res: Response) {
  try {
    const result = await getPatients();
    return sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch patients';
    return sendError(res, message, 500);
  }
}

export async function storePatient(req: Request, res: Response) {
  try {
    const payload = patientSchema.parse(req.body);
    const result = await createPatient(payload as Parameters<typeof createPatient>[0]);
    return sendSuccess(res, result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save patient';
    return sendError(res, message, 400);
  }
}
