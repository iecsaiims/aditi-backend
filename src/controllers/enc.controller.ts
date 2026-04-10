import { Request, Response } from 'express';
import { z } from 'zod';
import { addEncConsultation, getEncRecord, saveEncDisposition } from '../services/enc.service';
import { sendError, sendSuccess } from '../utils/http';

const consultationSchema = z.object({
  department: z.string().min(1),
  doctorName: z.string().optional(),
  callGivenBy: z.string().optional(),
  time: z.string().optional(),
  completed: z.boolean()
});

const dispositionSchema = z.object({
  department: z.string().min(1),
  status: z.string().min(1),
  time: z.string().min(1),
  notes: z.string().optional()
});

export async function fetchEncRecord(req: Request, res: Response) {
  try {
    const patientId = String(req.params.patientId);
    const result = await getEncRecord(patientId);
    return sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not fetch ENC record';
    return sendError(res, message, 500);
  }
}

export async function storeEncConsultation(req: Request, res: Response) {
  try {
    const payload = consultationSchema.parse(req.body);
    const patientId = String(req.params.patientId);
    const result = await addEncConsultation(patientId, payload);
    return sendSuccess(res, result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save consultation';
    return sendError(res, message, 400);
  }
}

export async function storeEncDisposition(req: Request, res: Response) {
  try {
    const payload = dispositionSchema.parse(req.body);
    const patientId = String(req.params.patientId);
    const result = await saveEncDisposition(patientId, payload);
    return sendSuccess(res, result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save disposition';
    return sendError(res, message, 400);
  }
}
