import fs from 'fs';
import os from 'os';
import { NextRequest, NextResponse } from 'next/server';
import {
  getOpenRouterPlainKey,
  readNodeDb,
  setNodeStatus,
} from '@/lib/store';

export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const expected =
    process.env.AGENCY_HEARTBEAT_SECRET || 'dev-agency-heartbeat-secret-2026';
  const provided =
    req.headers.get('x-agency-heartbeat-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    '';
  return Boolean(expected && provided && provided === expected);
}

function getDiskTelemetry(): { usedGb: number; totalGb: number } {
  try {
    const stat = fs.statfsSync(process.cwd());
    const totalBytes = Number(stat.blocks) * Number(stat.bsize);
    const freeBytes = Number(stat.bavail) * Number(stat.bsize);
    const usedBytes = Math.max(0, totalBytes - freeBytes);
    return {
      usedGb: Number((usedBytes / 1024 ** 3).toFixed(2)),
      totalGb: Number((totalBytes / 1024 ** 3).toFixed(2)),
    };
  } catch {
    return { usedGb: 8.4, totalGb: 50 };
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized: invalid X-Agency-Heartbeat-Secret' },
      { status: 401 }
    );
  }

  const db = readNodeDb();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = Math.max(0, totalMem - freeMem);
  const ramPercent = Math.round((usedMem / totalMem) * 100);
  const disk = getDiskTelemetry();
  const key = getOpenRouterPlainKey();

  return NextResponse.json({
    ok: true,
    domain: process.env.DOMAIN || 'auroracafe.com.br',
    status: db.settings.status,
    openrouterConfigured: Boolean(key && !db.settings.openrouter_credits_exhausted),
    openrouterCreditsExhausted: db.settings.openrouter_credits_exhausted,
    disk,
    ram: {
      usedPercent: ramPercent,
      totalMb: Math.round(totalMem / 1024 ** 2),
      usedMb: Math.round(usedMem / 1024 ** 2),
    },
    counts: {
      assets: db.brand_assets.length,
      aiMessages: db.settings.ai_messages_count,
      creations: db.brand_creations.length,
      approvals: db.brand_approvals.length,
    },
    backupLastOkAt: db.settings.backups.agency_cloud_last_ok_at,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized: invalid X-Agency-Heartbeat-Secret' },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as { status?: string };
    if (body.status !== 'active' && body.status !== 'suspended') {
      return NextResponse.json(
        { error: 'status inválido (use active ou suspended).' },
        { status: 400 }
      );
    }

    const updated = setNodeStatus(body.status);
    return NextResponse.json({
      ok: true,
      status: updated.status,
      message:
        updated.status === 'suspended'
          ? 'Sistema inteiro suspenso (site público e portal).'
          : 'Sistema reativado.',
    });
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }
}
