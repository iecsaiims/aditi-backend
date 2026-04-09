import dotenv from 'dotenv';

dotenv.config();

function parseCsvEnv(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const groqWhisperApiKeys = [
  ...parseCsvEnv(process.env.GROQ_WHISPER_API_KEYS),
  process.env.WHISPER_KEY_1 || '',
  process.env.WHISPER_KEY_2 || '',
  process.env.WHISPER_KEY_3 || ''
]
  .map((key) => key.trim())
  .filter(Boolean);

const frontendUrls = [
  ...parseCsvEnv(process.env.FRONTEND_URLS),
  process.env.FRONTEND_URL || 'http://localhost:5173'
].filter(Boolean);

const frontendOriginSuffixes = parseCsvEnv(process.env.FRONTEND_ORIGIN_SUFFIXES);

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || '',
  frontendUrl: frontendUrls[0] || 'http://localhost:5173',
  frontendUrls,
  frontendOriginSuffixes,
  groqWhisperApiKeys,
  groqQwenApiKey: process.env.GROQ_QWEN_API_KEY || process.env.QWEN_KEY || ''
};
