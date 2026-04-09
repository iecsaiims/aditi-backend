import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import encRoutes from './routes/enc.routes';
import patientRoutes from './routes/patient.routes';
import sttRoutes from './routes/stt.routes';

const app = express();

const allowedOrigins = new Set(env.frontendUrls);

function isAllowedOrigin(origin: string) {
  if (allowedOrigins.has(origin)) {
    return true;
  }

  return env.frontendOriginSuffixes.some((suffix) => origin.endsWith(suffix));
}

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'backend running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/enc', encRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/stt', sttRoutes);

export default app;
