import crypto from 'crypto';
import type { NextRequest } from 'next/server';

export const PORTAL_COOKIE_NAME = 'bc_portal_token';

function getSessionSecret(): string {
  return (
    process.env.NODE_ENCRYPTION_KEY ||
    'client-node-aes256-secret-key-32-chars'
  );
}

export function createPortalSessionToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      iat: Date.now(),
      exp: Date.now() + 24 * 60 * 60 * 1000,
    }),
    'utf8'
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyPortalSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return false;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as { exp?: number };
    return Boolean(parsed.exp && parsed.exp > Date.now());
  } catch {
    return false;
  }
}

export function isPortalAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get(PORTAL_COOKIE_NAME)?.value;
  return verifyPortalSessionToken(token);
}
