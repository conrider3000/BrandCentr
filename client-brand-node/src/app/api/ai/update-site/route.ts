import { NextRequest, NextResponse } from 'next/server';
import { isPortalAuthenticated } from '@/lib/session';
import { applySiteContentPatch, readNodeDb } from '@/lib/store';
import type { PublicSiteContent } from '@/lib/types';

export const dynamic = 'force-dynamic';

const ALLOWED_FIELDS: Array<keyof PublicSiteContent> = [
  'brand_name',
  'tagline',
  'hero_title',
  'hero_subtitle',
  'hero_cta_label',
  'hero_banner_url',
  'about_title',
  'about_text',
  'contact_email',
  'whatsapp_number',
  'city_label',
  'primary_color',
  'secondary_color',
  'background_color',
  'dark_color',
];

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
      confirmed?: boolean;
      patch?: Partial<PublicSiteContent>;
      summary?: string;
    };

    if (body.confirmed !== true) {
      return NextResponse.json(
        {
          error:
            'Confirmação explícita obrigatória: o endpoint /api/ai/update-site exige confirmed=true.',
        },
        { status: 400 }
      );
    }

    if (!body.patch || typeof body.patch !== 'object') {
      return NextResponse.json(
        { error: 'Patch de atualização inválido.' },
        { status: 400 }
      );
    }

    const sanitized: Partial<PublicSiteContent> = {};
    for (const key of ALLOWED_FIELDS) {
      if (body.patch[key] !== undefined) {
        (sanitized as Record<string, unknown>)[key] = body.patch[key];
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo permitido encontrado no patch.' },
        { status: 400 }
      );
    }

    const updated = applySiteContentPatch(
      sanitized,
      'Brand AI (Confirmado no Chat)',
      body.summary ||
        `Atualização via IA (${Object.keys(sanitized).join(', ')})`
    );

    return NextResponse.json({
      ok: true,
      content: updated,
      appliedFields: Object.keys(sanitized),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Falha ao atualizar site via IA.',
      },
      { status: 500 }
    );
  }
}
