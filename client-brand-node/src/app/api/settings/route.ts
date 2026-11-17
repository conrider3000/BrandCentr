import { NextRequest, NextResponse } from 'next/server';
import { maskApiKey } from '@/lib/crypto';
import { isPortalAuthenticated } from '@/lib/session';
import { getOpenRouterPlainKey, readNodeDb, updateSettings } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isPortalAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = readNodeDb();
  const plain = getOpenRouterPlainKey();
  return NextResponse.json({
    status: db.settings.status,
    has_openrouter_key: Boolean(plain),
    openrouter_key_masked: maskApiKey(plain),
    openrouter_credits_exhausted: db.settings.openrouter_credits_exhausted,
    openrouter_last_error: db.settings.openrouter_last_error,
    selected_model: db.settings.selected_model,
    image_model: db.settings.image_model,
    ai_messages_count: db.settings.ai_messages_count,
    backups: db.settings.backups,
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
      openrouter_api_key?: string;
      selected_model?: string;
      image_model?: string;
      client_cloud_provider?: 'Google Drive' | 'Dropbox' | 'Desativado';
      client_cloud_remote?: string;
    };

    const updated = updateSettings(body);
    const plain = getOpenRouterPlainKey();

    return NextResponse.json({
      ok: true,
      has_openrouter_key: Boolean(plain),
      openrouter_key_masked: maskApiKey(plain),
      openrouter_credits_exhausted: updated.openrouter_credits_exhausted,
      selected_model: updated.selected_model,
      image_model: updated.image_model,
      backups: updated.backups,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao atualizar configurações.',
      },
      { status: 500 }
    );
  }
}
