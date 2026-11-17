import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { decryptApiKey, encryptApiKey } from './crypto';
import { loadDefaultDossier } from './default-dossier';
import type {
  AssetCategory,
  BrandApprovalItem,
  BrandAsset,
  BrandCreationItem,
  ChatHistoryMessage,
  NodeSettings,
  NodeStatus,
  PublicSiteContent,
  SiteRevision,
} from './types';

export interface NodeDatabase {
  settings: NodeSettings;
  public_site_content: PublicSiteContent;
  site_revisions: SiteRevision[];
  brand_dossier: string;
  brand_assets: BrandAsset[];
  brand_creations: BrandCreationItem[];
  brand_approvals: BrandApprovalItem[];
  chat_history: ChatHistoryMessage[];
}

const DATA_DIR =
  process.env.VERCEL === '1'
    ? path.join(os.tmpdir(), 'brandcentr-client-data')
    : path.join(process.cwd(), 'data');
export const ASSETS_DIR = path.join(DATA_DIR, 'assets');
const DB_FILE = path.join(DATA_DIR, 'node-db.json');

function ensureAssetsSeeded(): BrandAsset[] {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const now = new Date().toISOString();
  const seedFiles: Array<{
    id: string;
    title: string;
    category: AssetCategory;
    description: string;
    file_name: string;
    mime_type: string;
    content: string;
  }> = [
    {
      id: 'ast_logo_horiz',
      title: 'Logotipo Principal Horizontal (Vetorial SVG)',
      category: 'Logos',
      description:
        'Versão horizontal oficial em #1C1917 conforme seção [5.1] do Dossiê.',
      file_name: 'aurora-logo-horizontal.svg',
      mime_type: 'image/svg+xml',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="180" viewBox="0 0 640 180">
  <rect width="640" height="180" fill="#FBF8F3"/>
  <circle cx="95" cy="90" r="42" fill="#9A4D26"/>
  <path d="M53 96 Q95 52 137 96" fill="none" stroke="#FBF8F3" stroke-width="5"/>
  <text x="165" y="103" font-family="Georgia, serif" font-size="44" font-weight="600" fill="#1C1917" letter-spacing="4">AURORA CAFÉ</text>
</svg>`,
    },
    {
      id: 'ast_logo_mono',
      title: 'Monograma Sol Nascente (Redução < 80px)',
      category: 'Design Kit',
      description: 'Uso exclusivo em favicons, avatares e selos [5.1].',
      file_name: 'aurora-monograma.svg',
      mime_type: 'image/svg+xml',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
  <rect width="240" height="240" rx="24" fill="#1C1917"/>
  <circle cx="120" cy="120" r="68" fill="#9A4D26"/>
  <path d="M58 130 Q120 68 182 130" fill="none" stroke="#FBF8F3" stroke-width="8"/>
</svg>`,
    },
    {
      id: 'ast_palette_tokens',
      title: 'Tokens de Cores & Tipografia (JSON)',
      category: 'Design Kit',
      description: 'Paleta oficial HEX/RGB/CMYK [6.1] pronta para Figma/Web.',
      file_name: 'aurora-design-tokens.json',
      mime_type: 'application/json',
      content: JSON.stringify(
        {
          brand: 'Aurora Café & Torrefação Artesanal',
          colors: {
            terracotaCobre: '#9A4D26',
            carvaoTorra: '#1C1917',
            cremePapel: '#FBF8F3',
            verdeFolha: '#2D3A2E',
            douradoMel: '#D49B4B',
            areiaSuave: '#EAE2D6',
          },
          typography: {
            display: 'Cormorant Garamond',
            body: 'Plus Jakarta Sans',
          },
        },
        null,
        2
      ),
    },
    {
      id: 'ast_kv_ritual',
      title: 'KV-01 Campanha Ritual da Manhã (Guia de Grid)',
      category: 'Key Visuals',
      description: 'Ficha técnica e grid 4:5 da campanha principal [9.1].',
      file_name: 'kv01-ritual-da-manha-spec.svg',
      mime_type: 'image/svg+xml',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="#FBF8F3"/>
  <rect x="64" y="64" width="952" height="1222" fill="none" stroke="#1C1917" stroke-width="2"/>
  <text x="104" y="210" font-family="Georgia, serif" font-size="72" fill="#1C1917">A primeira clareza</text>
  <text x="104" y="295" font-family="Georgia, serif" font-size="72" font-style="italic" fill="#9A4D26">da manhã.</text>
  <rect x="104" y="340" width="180" height="3" fill="#D49B4B"/>
  <circle cx="760" cy="960" r="190" fill="#EAE2D6"/>
  <text x="104" y="1210" font-family="Arial, sans-serif" font-size="28" fill="#1C1917" letter-spacing="4">AURORA CAFÉ • KV-01</text>
</svg>`,
    },
    {
      id: 'ast_media_release',
      title: 'Press Kit & Ficha Institucional para Mídia',
      category: 'Media Kit',
      description: 'Texto oficial, fotos descritas e guia para imprensa.',
      file_name: 'aurora-media-kit-press.txt',
      mime_type: 'text/plain',
      content: `AURORA CAFÉ & TORREFAÇÃO ARTESANAL — MEDIA KIT OFICIAL
Site: https://auroracafe.com.br
Contato imprensa: branding@auroracafe.com.br
Tagline: A primeira clareza do dia.
`,
    },
    {
      id: 'ast_social_template',
      title: 'Template Grid Instagram 1080x1350 (Referência)',
      category: 'Templates',
      description: 'Margem mínima de 80px e posicionamento do logotipo [10.1].',
      file_name: 'aurora-template-feed-4x5.svg',
      mime_type: 'image/svg+xml',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="#2D3A2E"/>
  <rect x="80" y="80" width="920" height="1190" fill="none" stroke="#D49B4B" stroke-width="2" stroke-dasharray="10 8"/>
  <text x="140" y="240" font-family="Georgia, serif" font-size="60" fill="#FBF8F3">Área Segura (80px)</text>
  <text x="140" y="320" font-family="Arial, sans-serif" font-size="28" fill="#EAE2D6">Seção [10.1] — Template Oficial Feed 4:5</text>
</svg>`,
    },
    {
      id: 'ast_manual_md',
      title: 'Dossiê Oficial da Marca (Documento Mestre)',
      category: 'Manual',
      description: 'Base oficial usada pelo Brand AI e pelo Manual Web.',
      file_name: 'Dossie_Oficial_Aurora_Cafe.md',
      mime_type: 'text/markdown',
      content: loadDefaultDossier(),
    },
  ];

  return seedFiles.map((item) => {
    const filePath = path.join(ASSETS_DIR, item.file_name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, item.content, 'utf8');
    }
    const stat = fs.statSync(filePath);
    return {
      id: item.id,
      title: item.title,
      category: item.category,
      description: item.description,
      file_name: item.file_name,
      stored_path: filePath,
      mime_type: item.mime_type,
      file_size_bytes: stat.size,
      created_at: now,
    };
  });
}

function seedNodeDatabase(): NodeDatabase {
  const now = new Date().toISOString();
  const dossier = loadDefaultDossier();
  const assets = ensureAssetsSeeded();

  const siteContent: PublicSiteContent = {
    brand_name: 'Aurora Café & Torrefação',
    tagline: 'A primeira clareza do dia.',
    hero_title: 'Café especial recém-torrado, entregue no seu ritual da manhã.',
    hero_subtitle:
      'Pequenos lotes da Serra da Mantiqueira com rastreabilidade de origem, torra fresca em até 48h e design pensados para quem valoriza presença.',
    hero_cta_label: 'Conhecer o Clube Aurora',
    hero_banner_url: '',
    about_title: 'Sofisticação acolhedora, sem complicação.',
    about_text:
      'Fundada em Minas Gerais, a Aurora conecta produtores de micro-lotes a profissionais criativos, estúdios e empresas que transformam a pausa do café em um momento de clareza.',
    offerings: [
      {
        title: 'Clube Aurora (Assinatura)',
        description:
          'Receba em casa ou no estúdio safras selecionadas todo mês, com guia visual de preparo em 3 passos.',
      },
      {
        title: 'Edições Micro-Lote',
        description:
          'Colheitas raras de talhão único com ficha técnica numerada, altitude e notas sensoriais.',
      },
      {
        title: 'Aurora Office (B2B)',
        description:
          'Fornecimento recorrente para escritórios, hotéis boutique e clínicas com curadoria exclusiva.',
      },
    ],
    contact_email: 'contato@auroracafe.com.br',
    whatsapp_number: '5511999990000',
    city_label: 'Serra da Mantiqueira • São Paulo, SP',
    primary_color: '#9A4D26',
    secondary_color: '#2D3A2E',
    background_color: '#FBF8F3',
    dark_color: '#1C1917',
    updated_at: now,
  };

  return {
    settings: {
      status: 'active',
      openrouter_api_key_encrypted: process.env.CLIENT_OPENROUTER_API_KEY
        ? encryptApiKey(process.env.CLIENT_OPENROUTER_API_KEY)
        : '',
      openrouter_credits_exhausted: false,
      openrouter_last_error: null,
      selected_model:
        process.env.DEFAULT_AI_MODEL || 'google/gemini-2.5-flash',
      image_model:
        process.env.DEFAULT_IMAGE_MODEL ||
        'google/gemini-2.5-flash-image-preview',
      ai_messages_count: 2,
      backups: {
        local_retention_days: Number(process.env.BACKUP_RETENTION_DAYS || 7),
        local_last_ok_at: now,
        agency_cloud_provider: 'Cloudflare R2',
        agency_cloud_remote:
          process.env.AGENCY_R2_REMOTE || 'agency-r2:brand-backups',
        agency_cloud_last_ok_at: now,
        client_cloud_provider: 'Google Drive',
        client_cloud_remote:
          process.env.CLIENT_CLOUD_REMOTE || 'client-drive:Brand-AI-Backup',
        client_cloud_last_ok_at: now,
      },
    },
    public_site_content: siteContent,
    site_revisions: [
      {
        id: 'rev_initial',
        saved_at: now,
        changed_by: 'Agência (Entrega Inicial)',
        summary: 'Publicação inicial do novo site substituindo o domínio antigo.',
        snapshot: siteContent,
      },
    ],
    brand_dossier: dossier,
    brand_assets: assets,
    brand_creations: [],
    brand_approvals: [],
    chat_history: [
      {
        id: 'msg_welcome',
        role: 'assistant',
        content:
          'Olá! Sou o **Guardião da Marca Aurora Café**. Respondo estritamente com base no Dossiê Oficial numerado da sua marca e cito cada seção consultada (ex: `[4.1 Personalidade Verbal]`, `[6.1 Cores Primárias]`). Também posso atualizar textos do seu site público mediante sua confirmação explícita.',
        citations: ['[0.1 Nome da Marca]', '[4.1 Personalidade Verbal]'],
        created_at: now,
      },
    ],
  };
}

export function readNodeDb(): NodeDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = seedNodeDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw) as NodeDatabase;
  } catch {
    const initial = seedNodeDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
}

export function writeNodeDb(db: NodeDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

export function getNodeStatus(): NodeStatus {
  return readNodeDb().settings.status;
}

export function setNodeStatus(status: NodeStatus): NodeSettings {
  const db = readNodeDb();
  db.settings.status = status;
  writeNodeDb(db);
  return db.settings;
}

export function getOpenRouterPlainKey(): string {
  const db = readNodeDb();
  return decryptApiKey(db.settings.openrouter_api_key_encrypted);
}

export function updateSettings(patch: {
  openrouter_api_key?: string;
  selected_model?: string;
  image_model?: string;
  openrouter_credits_exhausted?: boolean;
  openrouter_last_error?: string | null;
  client_cloud_provider?: 'Google Drive' | 'Dropbox' | 'Desativado';
  client_cloud_remote?: string;
}): NodeSettings {
  const db = readNodeDb();
  if (patch.openrouter_api_key !== undefined) {
    const clean = patch.openrouter_api_key.trim();
    db.settings.openrouter_api_key_encrypted = clean
      ? encryptApiKey(clean)
      : '';
    db.settings.openrouter_credits_exhausted = false;
    db.settings.openrouter_last_error = null;
  }
  if (patch.selected_model) {
    db.settings.selected_model = patch.selected_model;
  }
  if (patch.image_model) {
    db.settings.image_model = patch.image_model;
  }
  if (patch.openrouter_credits_exhausted !== undefined) {
    db.settings.openrouter_credits_exhausted =
      patch.openrouter_credits_exhausted;
  }
  if (patch.openrouter_last_error !== undefined) {
    db.settings.openrouter_last_error = patch.openrouter_last_error;
  }
  if (patch.client_cloud_provider) {
    db.settings.backups.client_cloud_provider = patch.client_cloud_provider;
  }
  if (patch.client_cloud_remote !== undefined) {
    db.settings.backups.client_cloud_remote = patch.client_cloud_remote;
  }
  writeNodeDb(db);
  return db.settings;
}

export function applySiteContentPatch(
  patch: Partial<PublicSiteContent>,
  changedBy: string,
  summary: string
): PublicSiteContent {
  const db = readNodeDb();
  const updated: PublicSiteContent = {
    ...db.public_site_content,
    ...patch,
    updated_at: new Date().toISOString(),
  };

  db.public_site_content = updated;
  db.site_revisions.unshift({
    id: `rev_${crypto.randomBytes(4).toString('hex')}`,
    saved_at: updated.updated_at,
    changed_by: changedBy,
    summary,
    snapshot: updated,
  });
  db.site_revisions = db.site_revisions.slice(0, 20);
  writeNodeDb(db);
  return updated;
}

export function rollbackSiteRevision(revisionId: string): PublicSiteContent | null {
  const db = readNodeDb();
  const rev = db.site_revisions.find((r) => r.id === revisionId);
  if (!rev) return null;
  return applySiteContentPatch(
    rev.snapshot,
    'Portal (Rollback)',
    `Restaurada versão de ${new Date(rev.saved_at).toLocaleString('pt-BR')}`
  );
}
