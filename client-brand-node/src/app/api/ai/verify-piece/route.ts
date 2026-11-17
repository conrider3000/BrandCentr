import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { OpenRouterGuardError, verifyBrandPiece } from '@/lib/openrouter';
import { isPortalAuthenticated } from '@/lib/session';
import { readNodeDb, writeNodeDb } from '@/lib/store';
import type { BrandApprovalItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isPortalAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = readNodeDb();
  return NextResponse.json({ approvals: db.brand_approvals });
}

export async function POST(req: NextRequest) {
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
      title?: string;
      piece_type?: string;
      piece_text?: string;
      image_data_url?: string;
      file_name?: string;
      simulationMode?: boolean;
    };

    const title = String(body.title || body.file_name || 'Peça para Aprovação').trim();
    const piece_type = String(body.piece_type || 'Post / Arte').trim();

    const audit = await verifyBrandPiece({
      title,
      piece_type,
      piece_text: body.piece_text,
      image_data_url: body.image_data_url,
      simulationMode: Boolean(body.simulationMode),
    });

    const freshDb = readNodeDb();
    const now = new Date().toISOString();
    const item: BrandApprovalItem = {
      id: `apr_${crypto.randomBytes(5).toString('hex')}`,
      title,
      source_type: 'upload',
      piece_type,
      preview_data_url: body.image_data_url,
      file_name: body.file_name,
      overall_score: audit.overall_score,
      decision: audit.decision,
      summary: audit.summary,
      checklist: audit.checklist,
      created_at: now,
      updated_at: now,
    };

    freshDb.brand_approvals.unshift(item);
    writeNodeDb(freshDb);

    return NextResponse.json(
      { approval: item, simulated: audit.simulated },
      { status: 201 }
    );
  } catch (err) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'aiPaused' in err &&
      (err as OpenRouterGuardError).aiPaused
    ) {
      return NextResponse.json(err, { status: 402 });
    }
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Erro ao auditar peça.',
      },
      { status: 500 }
    );
  }
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
      id?: string;
      decision?: BrandApprovalItem['decision'];
      designer_notes?: string;
    };
    const idx = db.brand_approvals.findIndex((a) => a.id === body.id);
    if (idx === -1) {
      return NextResponse.json(
        { error: 'Item de aprovação não encontrado.' },
        { status: 404 }
      );
    }

    if (body.decision) {
      db.brand_approvals[idx].decision = body.decision;
    }
    if (body.designer_notes !== undefined) {
      db.brand_approvals[idx].designer_notes = body.designer_notes;
    }
    db.brand_approvals[idx].updated_at = new Date().toISOString();
    writeNodeDb(db);

    return NextResponse.json({ approval: db.brand_approvals[idx] });
  } catch {
    return NextResponse.json(
      { error: 'Erro ao atualizar decisão.' },
      { status: 500 }
    );
  }
}
