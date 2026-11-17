import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  OpenRouterGuardError,
  runBrandGuardianChat,
} from '@/lib/openrouter';
import { isPortalAuthenticated } from '@/lib/session';
import { readNodeDb, writeNodeDb } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isPortalAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = readNodeDb();
  return NextResponse.json({ messages: db.chat_history });
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
      message?: string;
      simulationMode?: boolean;
    };
    const userMessage = String(body.message || '').trim();
    if (!userMessage) {
      return NextResponse.json(
        { error: 'Mensagem vazia.' },
        { status: 400 }
      );
    }

    const result = await runBrandGuardianChat({
      userMessage,
      simulationMode: Boolean(body.simulationMode),
    });

    const freshDb = readNodeDb();
    const now = new Date().toISOString();
    freshDb.chat_history.push(
      {
        id: `usr_${crypto.randomBytes(4).toString('hex')}`,
        role: 'user',
        content: userMessage,
        created_at: now,
      },
      {
        id: `bot_${crypto.randomBytes(4).toString('hex')}`,
        role: 'assistant',
        content: result.reply,
        citations: result.citations,
        proposed_site_patch: result.proposedSitePatch,
        created_at: new Date().toISOString(),
      }
    );
    freshDb.chat_history = freshDb.chat_history.slice(-60);
    writeNodeDb(freshDb);

    return NextResponse.json({
      reply: result.reply,
      citations: result.citations,
      proposedSitePatch: result.proposedSitePatch,
      simulated: result.simulated,
      messages: freshDb.chat_history,
    });
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
          err instanceof Error ? err.message : 'Erro no Guardião da Marca.',
      },
      { status: 500 }
    );
  }
}
