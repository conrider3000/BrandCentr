import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/session';
import { createClient, listClients, listLogs } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const clients = listClients();
  const logs = listLogs(25);

  const summary = {
    totalNodes: clients.length,
    activeNodes: clients.filter((c) => c.status === 'active').length,
    suspendedNodes: clients.filter((c) => c.status === 'suspended').length,
    provisioningNodes: clients.filter((c) => c.status === 'provisioning').length,
    onlineNodes: clients.filter((c) => c.telemetry.online).length,
    totalMonthlyRevenueBrl: clients
      .filter((c) => c.status !== 'suspended')
      .reduce((acc, c) => acc + (c.monthly_fee_brl || 0), 0),
    totalVpsCostBrl: clients.reduce(
      (acc, c) => acc + (c.hostinger_cost_brl || 0),
      0
    ),
    totalAssets: clients.reduce(
      (acc, c) => acc + (c.telemetry.assetsCount || 0),
      0
    ),
    totalAiMessages: clients.reduce(
      (acc, c) => acc + (c.telemetry.aiMessagesCount || 0),
      0
    ),
  };

  return NextResponse.json({ clients, summary, logs });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const brandName = String(body.brand_name || '').trim();
    const rootDomain = String(body.root_domain || '').trim();
    const vpsIp = String(body.vps_ip || '').trim();

    if (!brandName || !rootDomain || !vpsIp) {
      return NextResponse.json(
        {
          error:
            'Campos obrigatórios ausentes: brand_name, root_domain e vps_ip.',
        },
        { status: 400 }
      );
    }

    const result = createClient({
      brand_name: brandName,
      root_domain: rootDomain,
      vps_ip: vpsIp,
      coolify_app_uuid: body.coolify_app_uuid
        ? String(body.coolify_app_uuid)
        : '',
      heartbeat_secret: body.heartbeat_secret
        ? String(body.heartbeat_secret)
        : undefined,
      node_url_override: body.node_url_override
        ? String(body.node_url_override)
        : undefined,
      status:
        body.status === 'active' ||
        body.status === 'suspended' ||
        body.status === 'provisioning'
          ? body.status
          : 'provisioning',
      renewal_date: body.renewal_date ? String(body.renewal_date) : undefined,
      annual_installment_plan: body.annual_installment_plan
        ? String(body.annual_installment_plan)
        : undefined,
      monthly_fee_brl:
        body.monthly_fee_brl !== undefined
          ? Number(body.monthly_fee_brl)
          : undefined,
      hostinger_cost_brl:
        body.hostinger_cost_brl !== undefined
          ? Number(body.hostinger_cost_brl)
          : undefined,
      notes: body.notes ? String(body.notes) : '',
    });

    return NextResponse.json(
      {
        client: result.client,
        generatedHeartbeatSecret: result.plainSecret,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao criar cliente.',
      },
      { status: 500 }
    );
  }
}
