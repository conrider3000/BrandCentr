import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { readNodeDb } from '@/lib/store';
import { createStoreModeZipStream, ZipEntryInput } from '@/lib/zip-stream';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ kit: string }> }
) {
  const { kit } = await context.params;
  const db = readNodeDb();

  if (db.settings.status === 'suspended') {
    return NextResponse.json(
      { error: 'Portal temporariamente indisponível.' },
      { status: 503 }
    );
  }

  const normalized = kit.toLowerCase().replace(/\.zip$/, '');
  let filtered = db.brand_assets;
  let filename = 'Full_Brand_Kit.zip';

  if (normalized === 'design_kit' || normalized === 'design-kit') {
    filtered = db.brand_assets.filter((a) =>
      ['Design Kit', 'Logos', 'Templates', 'Manual', 'Key Visuals'].includes(
        a.category
      )
    );
    filename = 'Design_Kit.zip';
  } else if (normalized === 'media_kit' || normalized === 'media-kit') {
    filtered = db.brand_assets.filter((a) =>
      ['Media Kit', 'Logos', 'Key Visuals'].includes(a.category)
    );
    filename = 'Media_Kit.zip';
  } else if (normalized !== 'full_brand_kit' && normalized !== 'full-brand-kit') {
    return NextResponse.json(
      {
        error:
          'Kit desconhecido. Use Design_Kit.zip, Media_Kit.zip ou Full_Brand_Kit.zip.',
      },
      { status: 400 }
    );
  }

  const entries: ZipEntryInput[] = filtered
    .filter((a) => a.stored_path && fs.existsSync(a.stored_path))
    .map((a) => ({
      archivePath: `${a.category}/${path.basename(a.file_name)}`,
      diskPath: a.stored_path,
    }));

  // Garante inclusão do Dossiê atualizado dentro do zip em streaming
  entries.push({
    archivePath: 'Manual/Dossie_Oficial_Marca.md',
    buffer: Buffer.from(db.brand_dossier, 'utf8'),
  });

  const stream = createStoreModeZipStream(entries);

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Zip-Mode': 'STORE-0-STREAMING',
      'Cache-Control': 'no-store',
    },
  });
}
