import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  buildBrandStyledSvgPreview,
  verifyBrandPiece,
} from '@/lib/openrouter';
import { isPortalAuthenticated } from '@/lib/session';
import { getOpenRouterPlainKey, readNodeDb, writeNodeDb } from '@/lib/store';
import type { BrandApprovalItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

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
      creationId?: string;
      chosenCopy?: string;
      sendToApproval?: boolean;
      simulationMode?: boolean;
    };

    const idx = db.brand_creations.findIndex((c) => c.id === body.creationId);
    if (idx === -1) {
      return NextResponse.json(
        { error: 'Briefing de criação não encontrado.' },
        { status: 404 }
      );
    }

    const creation = db.brand_creations[idx];
    const headline =
      (body.chosenCopy && body.chosenCopy.trim()) ||
      creation.chosen_copy ||
      creation.precheck.refined_copy_options[0] ||
      creation.intention;

    const apiKey = getOpenRouterPlainKey();
    let previewUrl: string | undefined;
    let generatedBy: 'openrouter-image' | 'brand-composer' = 'brand-composer';

    // Se houver chave OpenRouter configurada e não estiver em simulação, tenta geração via OpenRouter Image Model
    if (apiKey && !body.simulationMode) {
      try {
        const res = await fetch(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: db.settings.image_model,
              messages: [
                {
                  role: 'user',
                  content: `${creation.precheck.optimized_visual_prompt}\nTexto principal da arte: "${headline}"`,
                },
              ],
            }),
            signal: AbortSignal.timeout(30000),
          }
        );

        if (res.ok) {
          const data = (await res.json()) as {
            choices?: Array<{
              message?: {
                images?: Array<{ image_url?: { url?: string } }>;
              };
            }>;
          };
          const img = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (img) {
            previewUrl = img;
            generatedBy = 'openrouter-image';
          }
        }
      } catch {
        // Segue para o compositor vetorial fiel à marca
      }
    }

    if (!previewUrl) {
      previewUrl = buildBrandStyledSvgPreview({
        brandName: db.public_site_content.brand_name,
        headline,
        subline: creation.intention,
        pieceType: creation.piece_type,
        primaryHex: db.public_site_content.primary_color,
        bgHex: db.public_site_content.background_color,
        darkHex: db.public_site_content.dark_color,
        accentHex: '#D49B4B',
      });
      generatedBy = 'brand-composer';
    }

    const now = new Date().toISOString();
    creation.chosen_copy = headline;
    creation.generated_preview_data_url = previewUrl;
    creation.generated_by = generatedBy;
    creation.status = body.sendToApproval ? 'sent_to_approval' : 'generated';
    creation.updated_at = now;

    let createdApproval: BrandApprovalItem | null = null;
    if (body.sendToApproval) {
      const audit = await verifyBrandPiece({
        title: `${creation.piece_type}: ${headline.slice(0, 42)}`,
        piece_type: creation.piece_type,
        piece_text: headline,
        image_data_url: previewUrl,
        simulationMode: Boolean(body.simulationMode) || !apiKey,
      });

      const freshDb = readNodeDb();
      const approvalId = `apr_${crypto.randomBytes(5).toString('hex')}`;
      createdApproval = {
        id: approvalId,
        title: `${creation.piece_type}: ${headline.slice(0, 48)}`,
        source_type: 'creation_tab',
        creation_id: creation.id,
        piece_type: creation.piece_type,
        preview_data_url: previewUrl,
        overall_score: audit.overall_score,
        decision: 'pending',
        summary: audit.summary,
        checklist: audit.checklist,
        created_at: now,
        updated_at: now,
      };
      creation.approval_id = approvalId;
      freshDb.brand_creations[idx] = creation;
      freshDb.brand_approvals.unshift(createdApproval);
      writeNodeDb(freshDb);

      return NextResponse.json({
        creation,
        approval: createdApproval,
      });
    }

    db.brand_creations[idx] = creation;
    writeNodeDb(db);

    return NextResponse.json({ creation });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao gerar peça.',
      },
      { status: 500 }
    );
  }
}
