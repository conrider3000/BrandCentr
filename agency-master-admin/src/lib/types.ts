export type ClientStatus = 'active' | 'provisioning' | 'suspended';

export interface ClientTelemetry {
  online: boolean;
  diskUsedGb: number;
  diskTotalGb: number;
  ramPercent: number;
  assetsCount: number;
  aiMessagesCount: number;
  creationsCount: number;
  approvalsCount: number;
  openrouterOk: boolean;
  backupLastOkAt: string | null;
  lastHeartbeatAt: string | null;
  latencyMs: number | null;
}

export interface ClientNodeRecord {
  id: string;
  brand_name: string;
  root_domain: string;
  vps_ip: string;
  coolify_app_uuid: string;
  heartbeat_secret_encrypted: string;
  node_url_override?: string;
  status: ClientStatus;
  renewal_date: string;
  annual_installment_plan: string;
  monthly_fee_brl: number;
  hostinger_cost_brl: number;
  notes: string;
  telemetry: ClientTelemetry;
  created_at: string;
  updated_at: string;
}

export interface PublicClientView
  extends Omit<ClientNodeRecord, 'heartbeat_secret_encrypted'> {
  heartbeat_secret_masked: string;
}

export interface AgencyActivityLog {
  id: string;
  timestamp: string;
  client_id: string;
  brand_name: string;
  action: string;
  result: 'success' | 'error' | 'info';
  detail: string;
}
