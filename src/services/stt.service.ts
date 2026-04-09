import { env } from '../config/env';

const WHISPER_MODEL = 'whisper-large-v3';
const SUMMARY_MODEL = 'qwen/qwen3-32b';
const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

const HALLUCINATIONS = new Set([
  'thank you',
  'thanks for watching',
  'subscribe',
  'like and subscribe',
  'you',
  'bye',
  'okay',
  'the end',
  'thank you for watching',
  'please subscribe',
  'see you next time',
  'subtitles by',
  'music',
  'applause',
  'silence',
  'so',
  'uh',
  'um',
  'amara.org',
  'www.mooji.org',
  'satsang',
  'one way from brazil',
  'i am very happy'
]);

const LANG_DISPLAY: Record<string, string> = {
  hindi: 'Hindi',
  english: 'English',
  bengali: 'Bengali',
  punjabi: 'Punjabi',
  tamil: 'Tamil',
  telugu: 'Telugu',
  marathi: 'Marathi',
  gujarati: 'Gujarati',
  kannada: 'Kannada',
  malayalam: 'Malayalam',
  urdu: 'Urdu',
  odia: 'Odia',
  assamese: 'Assamese',
  nepali: 'Nepali',
  chhattisgarhi: 'Hindi',
  'southern sotho': 'Hindi',
  welsh: 'English'
};

type WhisperResponse = {
  text?: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    no_speech_prob?: number;
  }>;
};

type WhisperResult = {
  text: string;
  language: string;
  duration: number;
};

type TranscribeAudioInput = {
  audio: Buffer;
  mimeType: string;
  filename?: string;
  audioSeconds?: number;
  mode?: 'pretranscribe' | 'final';
};

export type PreTranscribeAudioResult = {
  transcript: string;
  language: string;
  audio_seconds: number;
  key_index: {
    whisper: number;
  };
  timestamp: string;
};

export type FinalTranscribeAudioResult = {
  transcript: string;
  language: string;
  summary: string;
  audio_seconds: number;
  used_cache: boolean;
  key_index: {
    whisper: number;
  };
  timestamp: string;
};

export class SttError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message);
  }
}

class KeyRotator {
  private index = 0;
  private readonly rateLimitedUntil: number[];

  constructor(private readonly keys: string[]) {
    this.rateLimitedUntil = new Array(keys.length).fill(0);
  }

  get() {
    if (this.keys.length === 0) return null;

    const now = Date.now();
    for (let offset = 0; offset < this.keys.length; offset += 1) {
      const index = (this.index + offset) % this.keys.length;
      if (this.rateLimitedUntil[index] <= now) {
        this.index = index;
        return { key: this.keys[index], index };
      }
    }

    let earliest = 0;
    for (let index = 1; index < this.keys.length; index += 1) {
      if (this.rateLimitedUntil[index] < this.rateLimitedUntil[earliest]) {
        earliest = index;
      }
    }

    this.index = earliest;
    return { key: this.keys[earliest], index: earliest };
  }

  markRateLimited(index: number, cooldownMs = 60000) {
    if (index >= 0 && index < this.keys.length) {
      this.rateLimitedUntil[index] = Date.now() + cooldownMs;
      this.index = (index + 1) % this.keys.length;
    }
  }

  hasKeys() {
    return this.keys.length > 0;
  }
}

const whisperKeys = new KeyRotator(
  (env.groqWhisperApiKeys || []).filter((key) => typeof key === 'string' && key.trim().length > 10)
);

function isHallucination(text: string) {
  if (!text) return true;

  const normalized = text
    .toLowerCase()
    .replace(/[.!?,;:'"\u2026\u0964\u200B]/g, '')
    .trim();

  if (normalized.length < 2) return true;
  if (HALLUCINATIONS.has(normalized)) return true;
  return /^(\w+)( \1){2,}$/i.test(normalized);
}

function stripThink(value: string) {
  return (value || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think>/gi, '')
    .trim();
}

function sanitize(value: string) {
  return value
    .replace(/\b[6-9]\d{9}\b/g, '[PHONE]')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[AADHAAR]');
}

function displayLang(whisperLang: string) {
  if (!whisperLang) return 'Unknown';

  const key = whisperLang.toLowerCase().trim();
  return LANG_DISPLAY[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

function buildSummaryPrompt(langName: string, safeText: string) {
  return `You are a clinical documentation system for Emergency Department triage.
TASK: Convert patient speech into a strict clinical chief complaint for ML/AI triage model training.
STRICT RULES:
- Output ONLY symptoms, their duration, onset, and severity
- Use standard medical terminology in English (e.g. "chest pain" not "heart is paining", "vomiting" not "ulti")
- Do NOT mention food, brand names, medications, or suspected causes
- Do NOT include patient names, locations, hospital names, or any PII
- Do NOT fabricate or assume any details not explicitly stated
- Include duration and onset if mentioned (e.g. "since 2 days", "sudden onset")
- Flag RED FLAG symptoms: chest pain, breathlessness, altered sensorium, severe bleeding, high fever >104°F, seizures, poisoning
- Maximum 2 sentences. Be concise.
- Always respond in English regardless of input language
PATIENT SPEECH (${langName}):
"${safeText}"`;
}

function parseWhisperResponse(data: WhisperResponse): WhisperResult {
  let valid = true;
  if (data.segments && data.segments.length > 0) {
    const avg =
      data.segments.reduce((total, segment) => total + (segment.no_speech_prob ?? 0), 0) /
      data.segments.length;
    if (avg > 0.5) valid = false;
  }

  return {
    text: valid ? (data.text || '').trim() : '',
    language: (data.language || '').toLowerCase().trim(),
    duration: data.duration || 0
  };
}

async function callWhisper(audio: Buffer, mimeType: string, filename = 'recording.webm') {
  const keyInfo = whisperKeys.get();
  if (!keyInfo) {
    throw new SttError('Speech-to-text is not configured on the backend.', 503);
  }

  const form = new FormData();
  form.append('file', new Blob([audio], { type: mimeType }), filename);
  form.append('model', WHISPER_MODEL);
  form.append('response_format', 'verbose_json');
  form.append('temperature', '0');
  form.append(
    'prompt',
    'AIIMS Emergency Department Triage. Patient describing symptoms. Transcribe exactly as spoken, do not translate. छाती में दर्द, बुखार, सिर दर्द, पेट दर्द, उल्टी, चोट, सांस फूलना।'
  );

  const attempt = async (key: string, index: number) => {
    const response = await fetch(GROQ_WHISPER_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form
    });

    if (response.status === 429) {
      whisperKeys.markRateLimited(index);
      return { rateLimited: true as const };
    }

    if (!response.ok) {
      const text = await response.text();
      throw new SttError(`Whisper HTTP ${response.status}: ${text.slice(0, 200)}`, 502);
    }

    const result = parseWhisperResponse((await response.json()) as WhisperResponse);
    return { rateLimited: false as const, result, keyIndex: index };
  };

  const firstAttempt = await attempt(keyInfo.key, keyInfo.index);
  if (!firstAttempt.rateLimited) return firstAttempt;

  const retryKeyInfo = whisperKeys.get();
  if (!retryKeyInfo || retryKeyInfo.index === keyInfo.index) {
    throw new SttError('Groq Whisper rate limit reached. Try again shortly.', 429);
  }

  const secondAttempt = await attempt(retryKeyInfo.key, retryKeyInfo.index);
  if (!secondAttempt.rateLimited) return secondAttempt;

  throw new SttError('Groq Whisper rate limit reached. Try again shortly.', 429);
}

async function callSummary(text: string, langName: string) {
  const qwenKey = env.groqQwenApiKey.trim();
  if (!qwenKey) {
    throw new SttError('Clinical summary is not configured on the backend.', 503);
  }

  const prompt = buildSummaryPrompt(langName, sanitize(text));
  let retries = 3;
  let delay = 2000;

  while (retries > 0) {
    const response = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${qwenKey}`
      },
      body: JSON.stringify({
        model: SUMMARY_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Output ONLY the clinical summary. No thinking. No preamble. No labels. No markdown.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 150
      })
    });

    if (response.status === 429) {
      retries -= 1;
      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
      delay *= 2;
      continue;
    }

    if (!response.ok) {
      throw new SttError(`Qwen HTTP ${response.status}`, 502);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const raw = stripThink(data.choices?.[0]?.message?.content || '')
      .replace(/^(Output:|SUMMARY:|Summary:|Chief Complaint:)\s*/i, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    if (!raw) {
      throw new SttError('Empty response from Qwen.', 502);
    }

    return raw;
  }

  throw new SttError('Groq summary rate limit reached. Try again shortly.', 429);
}

export async function transcribeAudio({
  audio,
  mimeType,
  filename,
  audioSeconds,
  mode = 'final'
}: TranscribeAudioInput): Promise<PreTranscribeAudioResult | FinalTranscribeAudioResult> {
  if (!whisperKeys.hasKeys()) {
    throw new SttError('Speech-to-text is not configured on the backend.', 503);
  }

  if (mode === 'final' && !env.groqQwenApiKey.trim()) {
    throw new SttError('Clinical summary is not configured on the backend.', 503);
  }

  if (audio.byteLength < 1000) {
    throw new SttError('No audio recorded.', 400);
  }

  const whisper = await callWhisper(audio, mimeType, filename);

  if (isHallucination(whisper.result.text)) {
    throw new SttError('No clear speech detected.', 400);
  }

  const language = displayLang(whisper.result.language);
  const base = {
    transcript: whisper.result.text,
    language,
    audio_seconds: audioSeconds ?? Math.round(whisper.result.duration || 0),
    key_index: {
      whisper: whisper.keyIndex
    },
    timestamp: new Date().toISOString()
  };

  if (mode === 'pretranscribe') {
    return base;
  }

  const summary = await callSummary(whisper.result.text, language);

  return {
    ...base,
    summary,
    used_cache: false
  };
}
