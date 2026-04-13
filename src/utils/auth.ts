import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const TOKEN_HEADER = { alg: 'HS256', typ: 'JWT' } as const;

type AuthTokenPayload = {
  sub: string;
  email: string;
  role: string;
  displayName: string;
  designation: string | null;
  exp: number;
};

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  displayName: string;
  designation: string | null;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, existingHash] = storedHash.split(':');
  if (!salt || !existingHash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const existing = Buffer.from(existingHash, 'hex');

  if (derived.length !== existing.length) {
    return false;
  }

  return timingSafeEqual(derived, existing);
}

export function signAuthToken(user: AuthUser, secret: string, expiresInHours: number) {
  const header = base64UrlEncode(JSON.stringify(TOKEN_HEADER));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      designation: user.designation,
      exp: Math.floor(Date.now() / 1000) + expiresInHours * 60 * 60,
    } satisfies AuthTokenPayload)
  );
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyAuthToken(token: string, secret: string): AuthUser {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) {
    throw new Error('Invalid token');
  }

  const expected = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  if (expected !== signature) {
    throw new Error('Invalid token');
  }

  const parsed = JSON.parse(base64UrlDecode(payload)) as AuthTokenPayload;
  if (parsed.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return {
    id: parsed.sub,
    email: parsed.email,
    role: parsed.role,
    displayName: parsed.displayName,
    designation: parsed.designation ?? null,
  };
}
