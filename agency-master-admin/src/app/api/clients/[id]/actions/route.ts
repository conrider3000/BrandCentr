import { NextRequest, NextResponse } from 'next/server';
import { triggerCoolifyDeploy } from '@/lib/coolify';
import { isAdminAuthenticated } from '@/lib/session';
import { appendLog, getRawClientById } from '@/lib/store';
import { pingClientHeartbeat, pushRemoteStatus } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await context.params;
  const client = getRawClientById(id);
  if (!client) {
    return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
  }

  try {
    const body = (await req.json()) as { action?: string };
    const action = body.action;

    if (action === 'ping_heartbeat') {
      const result = await pingClientHeartbeat(id);
      return NextResponse.json(result);
    }

    if (action === 'toggle_suspension') {
      const nextStatus = client.status === 'suspended' ? 'active' : 'suspended';
      const result = await pushRemoteStatus(id, nextStatus);
      return NextResponse.json(result);
    }

    if (action === 'deploy') {
      const deployResult = await triggerCoolifyDeploy(
        client.coolify_app_uuid,
        client.brand_name
      );
      appendLog({
        client_id: client.id,
        brand_name: client.brand_name,
        action: 'COOLIFY_DEPLOY',
        result: deployResult.ok ? 'success' : 'error',
        detail: deployResult.message,
      });
      return NextResponse.json(deployResult);
    }

    return NextResponse.json(
      { error: `Ação desconhecida: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao executar ação remota.',
      },
      { status: 500 }
    );
  }
}
