import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { NextRequest, NextResponse } from 'next/server';
import { isPortalAuthenticated } from '@/lib/session';
import { ASSETS_DIR, readNodeDb, writeNodeDb } from '@/lib/store';
import type { AssetCategory, BrandAsset } from '@/lib/types';

export const dynamic = 'force-dynamic';

const ALLOWED_CATEGORIES: AssetCategory[] = [
  'Design Kit',
  'Media Kit',
  'Logos',
  'Templates',
  'Manual',
  'Key Visuals',
];

export async function GET(req: NextRequest) {
  if (!isPortalAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = readNodeDb();
  return NextResponse.json({
    assets: db.brand_assets,
    status: db.settings.status,
  });
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
    const formData = await req.formData();
    const file = formData.get('file');
    const title = String(formData.get('title') || '').trim();
    const categoryRaw = String(formData.get('category') || 'Design Kit');
    const description = String(formData.get('description') || '').trim();

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado.' },
        { status: 400 }
      );
    }

    const category: AssetCategory = ALLOWED_CATEGORIES.includes(
      categoryRaw as AssetCategory
    )
      ? (categoryRaw as AssetCategory)
      : 'Design Kit';

    if (!fs.existsSync(ASSETS_DIR)) {
      fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const destPath = path.join(ASSETS_DIR, safeName);

    // Stream direto para o disco para suportar arquivos grandes sem inflar RAM
    const nodeStream = Readable.fromWeb(
      file.stream() as unknown as import('stream/web').ReadableStream
    );
    await pipeline(nodeStream, fs.createWriteStream(destPath));
    const stat = fs.statSync(destPath);

    const record: BrandAsset = {
      id: `ast_${crypto.randomBytes(5).toString('hex')}`,
      title: title || file.name,
      category,
      description,
      file_name: file.name,
      stored_path: destPath,
      mime_type: file.type || 'application/octet-stream',
      file_size_bytes: stat.size,
      created_at: new Date().toISOString(),
    };

    db.brand_assets.unshift(record);
    writeNodeDb(db);

    return NextResponse.json({ asset: record }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao gravar arquivo no servidor.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!isPortalAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 });
  }
  const db = readNodeDb();
  const target = db.brand_assets.find((a) => a.id === id);
  if (!target) {
    return NextResponse.json({ error: 'Ativo não encontrado.' }, { status: 404 });
  }
  if (target.stored_path && fs.existsSync(target.stored_path)) {
    try {
      fs.unlinkSync(target.stored_path);
    } catch {
      // ignore disk cleanup error
    }
  }
  db.brand_assets = db.brand_assets.filter((a) => a.id !== id);
  writeNodeDb(db);
  return NextResponse.json({ ok: true });
}
