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

app.use((req, res, next) => {
  if (req.method !== 'OPTIONS' || !req.path.startsWith('/api/')) {
    next();
    return;
  }

  const origin = req.header('Origin');
  if (origin && !isAllowedOrigin(origin)) {
    res.status(403).json({ message: `Origin not allowed by CORS: ${origin}` });
    return;
  }

  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    req.header('Access-Control-Request-Headers') || 'Content-Type, Authorization'
  );
  res.sendStatus(204);
});

app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'backend running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/enc', encRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/stt', sttRoutes);

export default app;
