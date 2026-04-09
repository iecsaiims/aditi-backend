import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { transcribeSpeech } from '../controllers/stt.controller';
import { sendError } from '../utils/http';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = new Set([
      'audio/webm',
      'audio/wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/ogg',
      'audio/flac',
      'audio/x-m4a',
      'video/webm'
    ]);

    if (allowedTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Unsupported audio format: ${file.mimetype}`));
  }
});

function uploadAudio(req: Request, res: Response, next: NextFunction) {
  upload.single('audio')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    const message = error instanceof Error ? error.message : 'Could not upload audio';
    sendError(res, message, 400);
  });
}

router.post('/transcribe', uploadAudio, transcribeSpeech);

export default router;
