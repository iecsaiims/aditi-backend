import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import encRoutes from './routes/enc.routes';
import patientRoutes from './routes/patient.routes';
import sttRoutes from './routes/stt.routes';

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'backend running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/enc', encRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/stt', sttRoutes);

export default app;
