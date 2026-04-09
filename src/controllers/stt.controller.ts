import { Request, Response } from 'express';
import { SttError, transcribeAudio } from '../services/stt.service';
import { sendError, sendSuccess } from '../utils/http';

export async function transcribeSpeech(req: Request, res: Response) {
  try {
    if (!req.file) {
      return sendError(res, "No audio file uploaded. Send multipart/form-data with field name 'audio'.", 400);
    }

    const durationHeader = req.header('x-audio-duration-seconds');
    const duration = durationHeader ? Number(durationHeader) : undefined;
    const modeHeader = req.header('x-stt-mode');
    const mode = modeHeader === 'pretranscribe' ? 'pretranscribe' : 'final';

    const result = await transcribeAudio({
      audio: req.file.buffer,
      mimeType: req.file.mimetype,
      filename: req.file.originalname || 'recording.webm',
      audioSeconds: Number.isFinite(duration) ? duration : undefined,
      mode
    });

    return sendSuccess(res, result);
  } catch (error) {
    const status = error instanceof SttError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Could not transcribe audio';
    return sendError(res, message, status);
  }
}
