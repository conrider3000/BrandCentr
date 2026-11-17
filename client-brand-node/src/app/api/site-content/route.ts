import { NextRequest, NextResponse } from 'next/server';
import { isPortalAuthenticated } from '@/lib/session';
import {
  applySiteContentPatch,
  readNodeDb,
  rollbackSiteRevision,
} from '@/lib/store';
import type { PublicSiteContent } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = readNodeDb();
  return NextResponse.json({
    status: db.settings.status,
    content: db.public_site_content,
    revisions: db.site_revisions,
  });
}

export async function PATCH(req: NextRequest) {
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
    const body = (await req.json()) as {
      rollbackRevisionId?: string;
      patch?: Partial<PublicSiteContent>;
      summary?: string;
    };

    if (body.rollbackRevisionId) {
      const restored = rollbackSiteRevision(body.rollbackRevisionId);
      if (!restored) {
        return NextResponse.json(
          { error: 'Revisão não encontrada.' },
          { status: 404 }
        );
      }
      return NextResponse.json({ content: restored });
    }

    if (!body.patch) {
      return NextResponse.json(
        { error: 'Envie patch ou rollbackRevisionId.' },
        { status: 400 }
      );
    }

    const updated = applySiteContentPatch(
      body.patch,
      'Portal (Edição Manual)',
      body.summary || 'Atualização manual do site institucional'
    );
    return NextResponse.json({ content: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar site.' },
      { status: 500 }
    );
  }
}
