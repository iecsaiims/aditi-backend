import dotenv from 'dotenv';

dotenv.config();

const groqWhisperApiKeys = [
  ...(process.env.GROQ_WHISPER_API_KEYS || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean),
  process.env.WHISPER_KEY_1 || '',
  process.env.WHISPER_KEY_2 || '',
  process.env.WHISPER_KEY_3 || ''
]
  .map((key) => key.trim())
  .filter(Boolean);

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  groqWhisperApiKeys,
  groqQwenApiKey: process.env.GROQ_QWEN_API_KEY || process.env.QWEN_KEY || ''
};
