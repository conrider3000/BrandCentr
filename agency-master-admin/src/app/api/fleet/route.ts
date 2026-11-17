import { NextRequest, NextResponse } from 'next/server';
import { triggerCoolifyDeploy } from '@/lib/coolify';
import { isAdminAuthenticated } from '@/lib/session';
import { appendLog, listRawClients } from '@/lib/store';
import { pollAllClients } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { action?: string };
    const action = body.action;

    if (action === 'poll_all_heartbeats') {
      const summary = await pollAllClients();
      return NextResponse.json({
        ok: true,
        message: `Telemetria consultada em ${summary.total} nós (${summary.online} online).`,
        ...summary,
      });
    }

    if (action === 'update_all_nodes') {
      const clients = listRawClients().filter((c) => c.coolify_app_uuid);
      const results = await Promise.all(
        clients.map(async (c) => {
          const r = await triggerCoolifyDeploy(c.coolify_app_uuid, c.brand_name);
          appendLog({
            client_id: c.id,
            brand_name: c.brand_name,
            action: 'FLEET_DEPLOY',
            result: r.ok ? 'success' : 'error',
            detail: r.message,
          });
          return { id: c.id, brand_name: c.brand_name, ...r };
        })
      );

      return NextResponse.json({
        ok: true,
        message: `Atualização em massa disparada para ${results.length} nós.`,
        results,
      });
    }

    return NextResponse.json(
      { error: `Ação de frota desconhecida: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao executar comando na frota.',
      },
      { status: 500 }
    );
  }
}
