import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import {
  decryptSecret,
  encryptSecret,
  generateHeartbeatSecret,
  maskSecret,
} from './crypto';
import type {
  AgencyActivityLog,
  ClientNodeRecord,
  ClientStatus,
  PublicClientView,
} from './types';

interface AgencyDatabase {
  clients: ClientNodeRecord[];
  logs: AgencyActivityLog[];
}

const DATA_DIR =
  process.env.VERCEL === '1'
    ? path.join(os.tmpdir(), 'brandcentr-master-data')
    : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'agency-db.json');

function seedDatabase(): AgencyDatabase {
  const now = new Date().toISOString();
  const defaultDemoSecret =
    process.env.DEMO_NODE_HEARTBEAT_SECRET || 'dev-agency-heartbeat-secret-2026';

  return {
    clients: [
      {
        id: 'cli_aurora_01',
        brand_name: 'Aurora Café & Torrefação',
        root_domain: 'auroracafe.com.br',
        vps_ip: '191.252.104.42',
        coolify_app_uuid: 'cly-node-aurora-88f1',
        heartbeat_secret_encrypted: encryptSecret(defaultDemoSecret),
        node_url_override:
          process.env.NEXT_PUBLIC_DEMO_NODE_URL ||
          process.env.LOCAL_NODE_FALLBACK_URL ||
          'http://localhost:3002',
        status: 'active',
        renewal_date: '2027-10-15',
        annual_installment_plan: '12x R$ 290/mês (Anual Contratado)',
        monthly_fee_brl: 290,
        hostinger_cost_brl: 32,
        notes:
          'Cliente âncora. Dossiê v2 carregado. Backup Google Drive + R2 ativo.',
        telemetry: {
          online: true,
          diskUsedGb: 8.4,
          diskTotalGb: 50,
          ramPercent: 18,
          assetsCount: 14,
          aiMessagesCount: 42,
          creationsCount: 6,
          approvalsCount: 4,
          openrouterOk: true,
          backupLastOkAt: now,
          lastHeartbeatAt: now,
          latencyMs: 38,
        },
        created_at: '2026-10-15T10:00:00.000Z',
        updated_at: now,
      },
      {
        id: 'cli_verve_02',
        brand_name: 'Verve Arquitetura & Interiores',
        root_domain: 'verveinteriores.com.br',
        vps_ip: '191.252.108.91',
        coolify_app_uuid: 'cly-node-verve-41b9',
        heartbeat_secret_encrypted: encryptSecret('bh_verve_demo_secret_9912'),
        status: 'active',
        renewal_date: '2027-08-22',
        annual_installment_plan: '12x R$ 350/mês (Anual Contratado)',
        monthly_fee_brl: 350,
        hostinger_cost_brl: 32,
        notes: 'Site antigo substituído no Registro.br em 22/08. 4K renders no Media Kit.',
        telemetry: {
          online: true,
          diskUsedGb: 21.7,
          diskTotalGb: 50,
          ramPercent: 24,
          assetsCount: 38,
          aiMessagesCount: 119,
          creationsCount: 19,
          approvalsCount: 15,
          openrouterOk: true,
          backupLastOkAt: now,
          lastHeartbeatAt: now,
          latencyMs: 52,
        },
        created_at: '2026-08-22T14:30:00.000Z',
        updated_at: now,
      },
      {
        id: 'cli_solaris_03',
        brand_name: 'Solaris Odontologia Boutique',
        root_domain: 'clinicasolaris.com.br',
        vps_ip: '191.252.111.17',
        coolify_app_uuid: 'cly-node-solaris-09e4',
        heartbeat_secret_encrypted: encryptSecret('bh_solaris_demo_secret_7731'),
        status: 'suspended',
        renewal_date: '2026-11-01',
        annual_installment_plan: 'Parcela 04/12 em atraso (14 dias)',
        monthly_fee_brl: 290,
        hostinger_cost_brl: 32,
        notes:
          'Sistema suspenso remotamente por inadimplência na parcela anual. Site e portal exibindo aviso de indisponibilidade.',
        telemetry: {
          online: true,
          diskUsedGb: 6.2,
          diskTotalGb: 50,
          ramPercent: 14,
          assetsCount: 11,
          aiMessagesCount: 27,
          creationsCount: 3,
          approvalsCount: 2,
          openrouterOk: false,
          backupLastOkAt: now,
          lastHeartbeatAt: now,
          latencyMs: 61,
        },
        created_at: '2026-07-01T09:15:00.000Z',
        updated_at: now,
      },
    ],
    logs: [
      {
        id: 'log_init_1',
        timestamp: now,
        client_id: 'cli_aurora_01',
        brand_name: 'Aurora Café & Torrefação',
        action: 'HEARTBEAT_OK',
        result: 'success',
        detail: 'Telemetria recebida: 8.4 GB / 50 GB usados, RAM 18%, OpenRouter ativo.',
      },
      {
        id: 'log_init_2',
        timestamp: now,
        client_id: 'cli_solaris_03',
        brand_name: 'Solaris Odontologia Boutique',
        action: 'SYSTEM_SUSPENDED',
        result: 'info',
        detail: 'Nó colocado em modo suspenso remoto devido a atraso de pagamento.',
      },
    ],
  };
}

function readDb(): AgencyDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = seedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw) as AgencyDatabase;
  } catch {
    const initial = seedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

function writeDb(db: AgencyDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

export function toPublicClientView(record: ClientNodeRecord): PublicClientView {
  const plain = decryptSecret(record.heartbeat_secret_encrypted);
  const { heartbeat_secret_encrypted: _omit, ...rest } = record;
  return {
    ...rest,
    heartbeat_secret_masked: maskSecret(plain),
  };
}

export function listClients(): PublicClientView[] {
  const db = readDb();
  return db.clients.map(toPublicClientView);
}

export function listRawClients(): ClientNodeRecord[] {
  return readDb().clients;
}

export function getRawClientById(id: string): ClientNodeRecord | undefined {
  return readDb().clients.find((c) => c.id === id);
}

export function getClientPlainSecret(record: ClientNodeRecord): string {
  return decryptSecret(record.heartbeat_secret_encrypted);
}

export function listLogs(limit = 30): AgencyActivityLog[] {
  return readDb().logs.slice(0, limit);
}

export function appendLog(entry: Omit<AgencyActivityLog, 'id' | 'timestamp'>): void {
  const db = readDb();
  db.logs.unshift({
    id: `log_${crypto.randomBytes(6).toString('hex')}`,
    timestamp: new Date().toISOString(),
    ...entry,
  });
  db.logs = db.logs.slice(0, 100);
  writeDb(db);
}

export interface CreateClientInput {
  brand_name: string;
  root_domain: string;
  vps_ip: string;
  coolify_app_uuid?: string;
  heartbeat_secret?: string;
  node_url_override?: string;
  status?: ClientStatus;
  renewal_date?: string;
  annual_installment_plan?: string;
  monthly_fee_brl?: number;
  hostinger_cost_brl?: number;
  notes?: string;
}

export function createClient(input: CreateClientInput): {
  client: PublicClientView;
  plainSecret: string;
} {
  const db = readDb();
  const now = new Date().toISOString();
  const plainSecret = input.heartbeat_secret?.trim() || generateHeartbeatSecret();

  const record: ClientNodeRecord = {
    id: `cli_${crypto.randomBytes(5).toString('hex')}`,
    brand_name: input.brand_name.trim(),
    root_domain: input.root_domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, ''),
    vps_ip: input.vps_ip.trim(),
    coolify_app_uuid: input.coolify_app_uuid?.trim() || '',
    heartbeat_secret_encrypted: encryptSecret(plainSecret),
    node_url_override: input.node_url_override?.trim() || undefined,
    status: input.status || 'provisioning',
    renewal_date:
      input.renewal_date ||
      new Date(Date.now() + 365 * 86400 * 1000).toISOString().slice(0, 10),
    annual_installment_plan:
      input.annual_installment_plan || '12x Anual (Parcelado)',
    monthly_fee_brl: Number(input.monthly_fee_brl ?? 290),
    hostinger_cost_brl: Number(input.hostinger_cost_brl ?? 32),
    notes: input.notes?.trim() || '',
    telemetry: {
      online: false,
      diskUsedGb: 0,
      diskTotalGb: 50,
      ramPercent: 0,
      assetsCount: 0,
      aiMessagesCount: 0,
      creationsCount: 0,
      approvalsCount: 0,
      openrouterOk: false,
      backupLastOkAt: null,
      lastHeartbeatAt: null,
      latencyMs: null,
    },
    created_at: now,
    updated_at: now,
  };

  db.clients.unshift(record);
  writeDb(db);

  appendLog({
    client_id: record.id,
    brand_name: record.brand_name,
    action: 'CLIENT_CREATED',
    result: 'success',
    detail: `Nó cadastrado para ${record.root_domain} (${record.vps_ip}).`,
  });

  return { client: toPublicClientView(record), plainSecret };
}

export function updateClient(
  id: string,
  patch: Partial<
    Omit<ClientNodeRecord, 'id' | 'created_at' | 'heartbeat_secret_encrypted'>
  > & { heartbeat_secret?: string }
): PublicClientView | null {
  const db = readDb();
  const idx = db.clients.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  const current = db.clients[idx];
  const { heartbeat_secret, ...rest } = patch;

  const updated: ClientNodeRecord = {
    ...current,
    ...rest,
    heartbeat_secret_encrypted: heartbeat_secret
      ? encryptSecret(heartbeat_secret)
      : current.heartbeat_secret_encrypted,
    updated_at: new Date().toISOString(),
  };

  db.clients[idx] = updated;
  writeDb(db);
  return toPublicClientView(updated);
}

export function deleteClient(id: string): boolean {
  const db = readDb();
  const target = db.clients.find((c) => c.id === id);
  if (!target) return false;
  db.clients = db.clients.filter((c) => c.id !== id);
  writeDb(db);
  appendLog({
    client_id: id,
    brand_name: target.brand_name,
    action: 'CLIENT_REMOVED',
    result: 'info',
    detail: `Registro removido do painel mestre (${target.root_domain}).`,
  });
  return true;
}
