import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  isAdminAuthenticated,
} from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return NextResponse.json({ authenticated: isAdminAuthenticated(req) });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const expectedUser =
      process.env.ADMIN_PANEL_USER || 'admin@suaagencia.com.br';
    const expectedPass =
      process.env.ADMIN_PANEL_PASSWORD || 'TroqueEstaSenhaForte2026!';

    if (
      body.email?.trim().toLowerCase() === expectedUser.toLowerCase() &&
      body.password === expectedPass
    ) {
      const token = createAdminSessionToken(expectedUser);
      const res = NextResponse.json({ ok: true, user: expectedUser });
      res.cookies.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 12,
      });
      return res;
    }
    return NextResponse.json(
      { ok: false, error: 'Credenciais inválidas.' },
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
  res.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
