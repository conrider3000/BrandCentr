export type NodeStatus = 'active' | 'suspended';

export type AssetCategory =
  | 'Design Kit'
  | 'Media Kit'
  | 'Logos'
  | 'Templates'
  | 'Manual'
  | 'Key Visuals';

export interface PublicSiteContent {
  brand_name: string;
  tagline: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta_label: string;
  hero_banner_url: string;
  about_title: string;
  about_text: string;
  offerings: Array<{ title: string; description: string }>;
  contact_email: string;
  whatsapp_number: string;
  city_label: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  dark_color: string;
  updated_at: string;
}

export interface SiteRevision {
  id: string;
  saved_at: string;
  changed_by: string;
  summary: string;
  snapshot: PublicSiteContent;
}

export interface BrandAsset {
  id: string;
  title: string;
  category: AssetCategory;
  description: string;
  file_name: string;
  stored_path: string;
  mime_type: string;
  file_size_bytes: number;
  created_at: string;
}

export interface CreationPrecheckResult {
  approved_to_generate: boolean;
  tone_score: number;
  warnings: string[];
  citations: string[];
  refined_copy_options: string[];
  recommended_palette: Array<{ name: string; hex: string; role: string }>;
  layout_rules: string[];
  optimized_visual_prompt: string;
  tokens_saved_note: string;
}

export interface BrandCreationItem {
  id: string;
  piece_type: string;
  intention: string;
  draft_copy: string;
  visual_idea: string;
  precheck: CreationPrecheckResult;
  chosen_copy: string;
  generated_preview_data_url?: string;
  generated_by: 'openrouter-image' | 'brand-composer' | null;
  status: 'prechecked' | 'generated' | 'sent_to_approval';
  approval_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceCheckItem {
  criterion: string;
  status: 'pass' | 'warning' | 'fail';
  citation: string;
  finding: string;
  recommendation?: string;
}

export interface BrandApprovalItem {
  id: string;
  title: string;
  source_type: 'upload' | 'creation_tab';
  creation_id?: string;
  piece_type: string;
  preview_data_url?: string;
  file_name?: string;
  overall_score: number;
  decision: 'pending' | 'approved' | 'revision_requested' | 'rejected';
  summary: string;
  checklist: ComplianceCheckItem[];
  designer_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BackupSettings {
  local_retention_days: number;
  local_last_ok_at: string;
  agency_cloud_provider: 'Cloudflare R2' | 'Backblaze B2';
  agency_cloud_remote: string;
  agency_cloud_last_ok_at: string;
  client_cloud_provider: 'Google Drive' | 'Dropbox' | 'Desativado';
  client_cloud_remote: string;
  client_cloud_last_ok_at: string | null;
}

export interface NodeSettings {
  status: NodeStatus;
  openrouter_api_key_encrypted: string;
  openrouter_credits_exhausted: boolean;
  openrouter_last_error: string | null;
  selected_model: string;
  image_model: string;
  ai_messages_count: number;
  backups: BackupSettings;
}

export interface ChatHistoryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  proposed_site_patch?: Partial<PublicSiteContent> | null;
  created_at: string;
}
