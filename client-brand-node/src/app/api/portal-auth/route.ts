import { NextRequest, NextResponse } from 'next/server';
import {
  createPortalSessionToken,
  isPortalAuthenticated,
  PORTAL_COOKIE_NAME,
} from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return NextResponse.json({ authenticated: isPortalAuthenticated(req) });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const expectedEmail =
      process.env.PORTAL_CLIENT_EMAIL || 'equipe@auroracafe.com.br';
    const expectedPass =
      process.env.PORTAL_CLIENT_PASSWORD || 'MarcaAurora2026!';

    if (
      body.email?.trim().toLowerCase() === expectedEmail.toLowerCase() &&
      body.password === expectedPass
    ) {
      const token = createPortalSessionToken(expectedEmail);
      const res = NextResponse.json({ ok: true, email: expectedEmail });
      res.cookies.set(PORTAL_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24,
      });
      return res;
    }
    return NextResponse.json(
      { ok: false, error: 'E-mail ou senha incorretos.' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Requisição inválida.' },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PORTAL_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
