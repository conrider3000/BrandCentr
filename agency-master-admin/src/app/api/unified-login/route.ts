import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
} from '@/lib/session';
import { listClients } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      identifier?: string;
      password?: string;
    };

    const identifier = String(body.identifier || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!identifier) {
      return NextResponse.json(
        { ok: false, error: 'Informe seu e-mail ou domínio da marca.' },
        { status: 400 }
      );
    }

    const adminEmail = (
      process.env.ADMIN_PANEL_USER || 'admin@suaagencia.com.br'
    ).toLowerCase();
    const adminPass =
      process.env.ADMIN_PANEL_PASSWORD || 'TroqueEstaSenhaForte2026!';

    // 1. Se for o administrador da agência -> abre o Command privado
    if (identifier === adminEmail) {
      if (password !== adminPass) {
        return NextResponse.json(
          { ok: false, error: 'Senha incorreta.' },
          { status: 401 }
        );
      }

      const token = createAdminSessionToken(adminEmail);
      const res = NextResponse.json({
        ok: true,
        role: 'admin',
        redirectUrl: '/command',
      });
      res.cookies.set(ADMIN_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 12,
      });
      return res;
    }

    // 2. Se for um cliente (por e-mail corporativo @dominio.com.br ou pelo domínio direto)
    const domainCandidate = identifier.includes('@')
      ? identifier.split('@')[1]
      : identifier.replace(/^https?:\/\//, '').replace(/^marca\./, '').replace(/\/.*$/, '');

    const clients = listClients();
    const matched = clients.find(
      (c) =>
        c.root_domain.toLowerCase() === domainCandidate ||
        c.brand_name.toLowerCase() === identifier
    );

    if (matched) {
      const portalUrl = matched.node_url_override
        ? `${matched.node_url_override.replace(/\/+$/, '')}/portal`
        : `https://marca.${matched.root_domain}`;

      return NextResponse.json({
        ok: true,
        role: 'client',
        brandName: matched.brand_name,
        redirectUrl: portalUrl,
      });
    }

    // Domínio não está na lista local, mas se tiver formato de domínio válido redireciona para marca.{dominio}
    if (domainCandidate.includes('.') && !identifier.includes('@')) {
      return NextResponse.json({
        ok: true,
        role: 'client',
        redirectUrl: `https://marca.${domainCandidate}`,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: 'Credenciais ou marca não encontradas no BrandCentr.',
      },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Erro ao processar acesso.' },
      { status: 400 }
    );
  }
}
