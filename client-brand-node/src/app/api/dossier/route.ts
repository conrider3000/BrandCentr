import { NextRequest, NextResponse } from 'next/server';
import { isPortalAuthenticated } from '@/lib/session';
import { readNodeDb, writeNodeDb } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isPortalAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = readNodeDb();
  return NextResponse.json({ dossier: db.brand_dossier });
}

export async function PUT(req: NextRequest) {
  if (!isPortalAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = readNodeDb();
  if (db.settings.status === 'suspended') {
    return NextResponse.json(
      { error: 'Sistema suspenso pela agência.' },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as { dossier?: string };
    if (!body.dossier || !body.dossier.trim()) {
      return NextResponse.json(
        { error: 'Conteúdo do dossiê não pode ficar vazio.' },
        { status: 400 }
      );
    }
    db.brand_dossier = body.dossier;
    writeNodeDb(db);
    return NextResponse.json({ ok: true, length: db.brand_dossier.length });
  } catch {
    return NextResponse.json(
      { error: 'Erro ao salvar dossiê.' },
      { status: 500 }
    );
  }
}
