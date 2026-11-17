import {
  appendLog,
  getClientPlainSecret,
  getRawClientById,
  listRawClients,
  updateClient,
} from './store';
import type { ClientNodeRecord, ClientStatus, PublicClientView } from './types';

function resolveHeartbeatUrl(client: ClientNodeRecord): string {
  if (client.node_url_override) {
    return `${client.node_url_override.replace(/\/+$/, '')}/api/agency-heartbeat`;
  }
  return `https://marca.${client.root_domain}/api/agency-heartbeat`;
}

export interface HeartbeatPayload {
  ok: boolean;
  status: ClientStatus;
  openrouterConfigured: boolean;
  disk: { usedGb: number; totalGb: number };
  ram: { usedPercent: number; totalMb?: number; usedMb?: number };
  counts: {
    assets: number;
    aiMessages: number;
    creations: number;
    approvals: number;
  };
  backupLastOkAt?: string | null;
}

export async function pingClientHeartbeat(clientId: string): Promise<{
  ok: boolean;
  client: PublicClientView | null;
  message: string;
}> {
  const raw = getRawClientById(clientId);
  if (!raw) {
    return { ok: false, client: null, message: 'Cliente não encontrado.' };
  }

  const secret = getClientPlainSecret(raw);
  const url = resolveHeartbeatUrl(raw);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Agency-Heartbeat-Secret': secret,
      },
      signal: AbortSignal.timeout(6000),
    });

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      const updated = updateClient(clientId, {
        telemetry: {
          ...raw.telemetry,
          online: false,
          latencyMs,
          lastHeartbeatAt: new Date().toISOString(),
        },
      });
      appendLog({
        client_id: clientId,
        brand_name: raw.brand_name,
        action: 'HEARTBEAT_FAIL',
        result: 'error',
        detail: `HTTP ${res.status} ao consultar ${url}.`,
      });
      return {
        ok: false,
        client: updated,
        message: `Nó respondeu HTTP ${res.status} (${url}).`,
      };
    }

    const data = (await res.json()) as HeartbeatPayload;
    const now = new Date().toISOString();

    const updated = updateClient(clientId, {
      status: data.status || raw.status,
      telemetry: {
        online: true,
        diskUsedGb: Number(data.disk?.usedGb ?? raw.telemetry.diskUsedGb),
        diskTotalGb: Number(data.disk?.totalGb ?? 50),
        ramPercent: Number(data.ram?.usedPercent ?? raw.telemetry.ramPercent),
        assetsCount: Number(data.counts?.assets ?? 0),
        aiMessagesCount: Number(data.counts?.aiMessages ?? 0),
        creationsCount: Number(data.counts?.creations ?? 0),
        approvalsCount: Number(data.counts?.approvals ?? 0),
        openrouterOk: Boolean(data.openrouterConfigured),
        backupLastOkAt: data.backupLastOkAt ?? raw.telemetry.backupLastOkAt,
        lastHeartbeatAt: now,
        latencyMs,
      },
    });

    appendLog({
      client_id: clientId,
      brand_name: raw.brand_name,
      action: 'HEARTBEAT_OK',
      result: 'success',
      detail: `Online (${latencyMs}ms) — Disco ${data.disk?.usedGb ?? 0}/${data.disk?.totalGb ?? 50} GB, RAM ${data.ram?.usedPercent ?? 0}%.`,
    });

    return {
      ok: true,
      client: updated,
      message: `Telemetria atualizada em ${latencyMs}ms.`,
    };
  } catch (error) {
    const updated = updateClient(clientId, {
      telemetry: {
        ...raw.telemetry,
        online: false,
        latencyMs: null,
      },
    });
    const errMsg =
      error instanceof Error ? error.message : 'Timeout ou nó inacessível';
    appendLog({
      client_id: clientId,
      brand_name: raw.brand_name,
      action: 'HEARTBEAT_UNREACHABLE',
      result: 'error',
      detail: `Falha ao acessar ${url}: ${errMsg}`,
    });
    return {
      ok: false,
      client: updated,
      message: `Nó inacessível (${errMsg}).`,
    };
  }
}

export async function pushRemoteStatus(
  clientId: string,
  targetStatus: ClientStatus
): Promise<{
  ok: boolean;
  remoteSynced: boolean;
  client: PublicClientView | null;
  message: string;
}> {
  const raw = getRawClientById(clientId);
  if (!raw) {
    return {
      ok: false,
      remoteSynced: false,
      client: null,
      message: 'Cliente não encontrado.',
    };
  }

  const secret = getClientPlainSecret(raw);
  const url = resolveHeartbeatUrl(raw);
  let remoteSynced = false;
  let remoteNote = '';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agency-Heartbeat-Secret': secret,
      },
      body: JSON.stringify({ status: targetStatus }),
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      remoteSynced = true;
    } else {
      remoteNote = ` (nó retornou HTTP ${res.status})`;
    }
  } catch {
    remoteNote = ' (nó remoto offline no momento; estado salvo no painel)';
  }

  const updated = updateClient(clientId, {
    status: targetStatus,
  });

  const actionLabel =
    targetStatus === 'suspended' ? 'SYSTEM_SUSPENDED' : 'SYSTEM_REACTIVATED';

  appendLog({
    client_id: clientId,
    brand_name: raw.brand_name,
    action: actionLabel,
    result: remoteSynced ? 'success' : 'info',
    detail:
      targetStatus === 'suspended'
        ? `Sistema completo suspenso${remoteNote}.`
        : `Sistema reativado${remoteNote}.`,
  });

  return {
    ok: true,
    remoteSynced,
    client: updated,
    message:
      targetStatus === 'suspended'
        ? `Sistema de ${raw.brand_name} suspenso${remoteNote}.`
        : `Sistema de ${raw.brand_name} reativado${remoteNote}.`,
  };
}

export async function pollAllClients(): Promise<{
  total: number;
  online: number;
}> {
  const clients = listRawClients();
  let online = 0;
  await Promise.all(
    clients.map(async (c) => {
      const r = await pingClientHeartbeat(c.id);
      if (r.ok) online += 1;
    })
  );
  return { total: clients.length, online };
}
