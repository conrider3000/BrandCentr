import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  OpenRouterGuardError,
  precheckCreationBrief,
} from '@/lib/openrouter';
import { isPortalAuthenticated } from '@/lib/session';
import { readNodeDb, writeNodeDb } from '@/lib/store';
import type { BrandCreationItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isPortalAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = readNodeDb();
  return NextResponse.json({ creations: db.brand_creations });
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
      piece_type?: string;
      intention?: string;
      draft_copy?: string;
      visual_idea?: string;
      simulationMode?: boolean;
    };

    const piece_type = String(body.piece_type || 'Post Feed Instagram (4:5)').trim();
    const intention = String(body.intention || '').trim();
    const draft_copy = String(body.draft_copy || '').trim();
    const visual_idea = String(body.visual_idea || '').trim();

    if (!intention && !draft_copy) {
      return NextResponse.json(
        {
          error:
            'Informe ao menos a intenção da peça ou o texto desejado antes de gerar.',
        },
        { status: 400 }
      );
    }

    const { result, simulated } = await precheckCreationBrief({
      piece_type,
      intention,
      draft_copy,
      visual_idea,
      simulationMode: Boolean(body.simulationMode),
    });

    const freshDb = readNodeDb();
    const now = new Date().toISOString();
    const item: BrandCreationItem = {
      id: `cr_${crypto.randomBytes(5).toString('hex')}`,
      piece_type,
      intention,
      draft_copy,
      visual_idea,
      precheck: result,
      chosen_copy: result.refined_copy_options[0] || draft_copy || intention,
      generated_by: null,
      status: 'prechecked',
      created_at: now,
      updated_at: now,
    };

    freshDb.brand_creations.unshift(item);
    writeNodeDb(freshDb);

    return NextResponse.json(
      { creation: item, simulated },
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
            : 'Erro no pré-verificador de criação.',
      },
      { status: 500 }
    );
  }
}
