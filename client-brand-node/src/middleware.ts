import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') || '').toLowerCase();
  const { pathname } = req.nextUrl;

  // Nunca reescreve APIs, arquivos internos ou rotas já sob /portal
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/portal') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Se o acesso vier pelo subdomínio marca.{DOMAIN}, roteia para o Portal Privado
  if (host.startsWith('marca.')) {
    const url = req.nextUrl.clone();
    url.pathname = `/portal${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
