'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  Plus,
  Send,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import {
  BrandCentrCollabHeader,
  BrandCentrLogo,
  PoweredByBrandCentr,
} from '@/components/BrandCentrLogo';
import type {
  AssetCategory,
  BackupSettings,
  BrandApprovalItem,
  BrandAsset,
  BrandCreationItem,
  ChatHistoryMessage,
  PublicSiteContent,
  SiteRevision,
} from '@/lib/types';

type TabKey = 'arquivos' | 'manual' | 'criar' | 'aprovar' | 'ia';

interface InitialPortalSettings {
  hasOpenRouterKey: boolean;
  openRouterKeyMasked: string;
  creditsExhausted: boolean;
  lastError: string | null;
  selectedModel: string;
  imageModel: string;
  backups: BackupSettings;
}

interface BrandPortalClientProps {
  initialSiteContent: PublicSiteContent;
  initialRevisions: SiteRevision[];
  initialDossier: string;
  initialAssets: BrandAsset[];
  initialCreations: BrandCreationItem[];
  initialApprovals: BrandApprovalItem[];
  initialChat: ChatHistoryMessage[];
  initialSettings: InitialPortalSettings;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function BrandPortalClient({
  initialSiteContent,
  initialRevisions,
  initialDossier,
  initialAssets,
  initialCreations,
  initialApprovals,
  initialChat,
  initialSettings,
}: BrandPortalClientProps) {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/api/portal-auth', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setAuthenticated(true);
      })
      .catch(() => {});
  }, []);
  const [loginEmail, setLoginEmail] = useState('equipe@auroracafe.com.br');
  const [loginPassword, setLoginPassword] = useState('MarcaAurora2026!');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>('arquivos');
  const [siteContent, setSiteContent] = useState(initialSiteContent);
  const [revisions, setRevisions] = useState(initialRevisions);
  const [dossier, setDossier] = useState(initialDossier);
  const [editingDossier, setEditingDossier] = useState(false);
  const [assets, setAssets] = useState(initialAssets);
  const [creations, setCreations] = useState(initialCreations);
  const [approvals, setApprovals] = useState(initialApprovals);
  const [chat, setChat] = useState(initialChat);
  const [settings, setSettings] = useState(initialSettings);

  // Funciona imediatamente em simulação local enquanto o cliente não colar a chave OpenRouter
  const [simulationMode, setSimulationMode] = useState(
    !initialSettings.hasOpenRouterKey
  );
  const [notice, setNotice] = useState<string | null>(null);

  // Modais discretos (escondem formulários secundários para manter a tela limpa)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Upload de Ativo
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCat, setUploadCat] = useState<AssetCategory>('Design Kit');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadingAsset, setUploadingAsset] = useState(false);

  // Copiar cor HEX no Manual
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Aba Criar (Passo 1 -> Passo 2)
  const [pieceType, setPieceType] = useState('Post Instagram');
  const [intention, setIntention] = useState('');
  const [draftCopy, setDraftCopy] = useState('');
  const [prechecking, setPrechecking] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Aba Aprovar (envio de peça avulsa)
  const [auditTitle, setAuditTitle] = useState('');
  const [auditText, setAuditText] = useState('');
  const [auditImageDataUrl, setAuditImageDataUrl] = useState('');
  const [auditFileName, setAuditFileName] = useState('');
  const [auditing, setAuditing] = useState(false);

  // Aba IA
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);

  // Modal Configurações
  const [newApiKey, setNewApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(
    initialSettings.selectedModel
  );
  const [clientCloudProvider, setClientCloudProvider] = useState<
    'Google Drive' | 'Dropbox' | 'Desativado'
  >(initialSettings.backups.client_cloud_provider);
  const [savingSettings, setSavingSettings] = useState(false);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4500);
  };

  const dossierSections = useMemo(() => {
    const chunks = dossier.split(/^##\s+/m).filter(Boolean);
    return chunks
      .filter((c) => /^\d+\./.test(c.trim()))
      .map((block) => {
        const lines = block.trim().split('\n');
        const title = (lines[0] || '').replace(/^\d+\.\s*/, '').trim();
        const body = lines
          .slice(1)
          .join('\n')
          .replace(/^-\s*\*\*\[[^\]]+\]\s*/gm, '• ')
          .replace(/\*\*/g, '')
          .trim();
        return { title, body };
      });
  }, [dossier]);

  const paletteSwatches = useMemo(() => {
    const found = dossier.match(/#[0-9A-Fa-f]{6}\b/g) || [];
    const unique = Array.from(new Set(found.map((h) => h.toUpperCase())));
    const labels: Record<string, string> = {
      '#9A4D26': 'Terracota',
      '#1C1917': 'Carvão',
      '#FBF8F3': 'Creme',
      '#2D3A2E': 'Verde Folha',
      '#D49B4B': 'Dourado',
      '#EAE2D6': 'Areia',
    };
    return unique.slice(0, 6).map((hex) => ({
      hex,
      name: labels[hex] || 'Cor',
    }));
  }, [dossier]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/portal-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAuthenticated(true);
      } else {
        setLoginError(data.error || 'Acesso negado.');
      }
    } catch {
      setLoginError('Falha de conexão.');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleAssetUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;
    setUploadingAsset(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadFile);
      fd.append('title', uploadTitle || uploadFile.name);
      fd.append('category', uploadCat);

      const res = await fetch('/api/assets', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.asset) {
        setAssets((prev) => [data.asset, ...prev]);
        setUploadTitle('');
        setUploadFile(null);
        setShowUploadModal(false);
        flash('Arquivo adicionado.');
      }
    } finally {
      setUploadingAsset(false);
    }
  }

  async function handleDeleteAsset(id: string) {
    const res = await fetch(`/api/assets?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
    }
  }

  async function handleSaveDossier() {
    const res = await fetch('/api/dossier', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dossier }),
    });
    if (res.ok) {
      setEditingDossier(false);
      flash('Manual atualizado.');
    }
  }

  async function handlePrecheckCreation(e: React.FormEvent) {
    e.preventDefault();
    setPrechecking(true);
    try {
      const res = await fetch('/api/ai/precheck-creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          piece_type: pieceType,
          intention,
          draft_copy: draftCopy,
          visual_idea: '',
          simulationMode,
        }),
      });
      const data = await res.json();
      if (res.status === 402 && data.aiPaused) {
        setSettings((s) => ({ ...s, creditsExhausted: true }));
        flash(data.message);
        return;
      }
      if (res.ok && data.creation) {
        setCreations((prev) => [data.creation, ...prev]);
        setIntention('');
        setDraftCopy('');
      }
    } finally {
      setPrechecking(false);
    }
  }

  async function handleGenerateCreation(
    creationId: string,
    chosenCopy: string
  ) {
    setGeneratingId(creationId);
    try {
      const res = await fetch('/api/ai/generate-creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creationId,
          chosenCopy,
          sendToApproval: true,
          simulationMode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreations((prev) =>
          prev.map((c) => (c.id === creationId ? data.creation : c))
        );
        if (data.approval) {
          setApprovals((prev) => [data.approval, ...prev]);
          flash('Peça criada e enviada para Aprovar.');
          setActiveTab('aprovar');
        }
      }
    } finally {
      setGeneratingId(null);
    }
  }

  function handleAuditFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAuditFileName(file.name);
    if (!auditTitle) setAuditTitle(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAuditImageDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleVerifyPiece(e: React.FormEvent) {
    e.preventDefault();
    setAuditing(true);
    try {
      const res = await fetch('/api/ai/verify-piece', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: auditTitle || 'Peça enviada',
          piece_type: 'Peça Gráfica',
          piece_text: auditText,
          image_data_url: auditImageDataUrl || undefined,
          file_name: auditFileName || undefined,
          simulationMode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.approval) {
        setApprovals((prev) => [data.approval, ...prev]);
        setAuditTitle('');
        setAuditText('');
        setAuditImageDataUrl('');
        setAuditFileName('');
        setShowAuditModal(false);
        flash('Peça analisada.');
      }
    } finally {
      setAuditing(false);
    }
  }

  async function handleApprovalDecision(
    id: string,
    decision: BrandApprovalItem['decision']
  ) {
    const res = await fetch('/api/ai/verify-piece', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, decision }),
    });
    const data = await res.json();
    if (res.ok && data.approval) {
      setApprovals((prev) =>
        prev.map((a) => (a.id === id ? data.approval : a))
      );
    }
  }

  async function handleSendChat(text?: string) {
    const message = (text ?? chatInput).trim();
    if (!message) return;
    setChatSending(true);
    if (!text) setChatInput('');
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, simulationMode }),
      });
      const data = await res.json();
      if (res.status === 402 && data.aiPaused) {
        setSettings((s) => ({ ...s, creditsExhausted: true }));
        flash(data.message);
        return;
      }
      if (res.ok) {
        setChat(data.messages || []);
      }
    } finally {
      setChatSending(false);
    }
  }

  async function handleConfirmSitePatch(patch: Partial<PublicSiteContent>) {
    const res = await fetch('/api/ai/update-site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        confirmed: true,
        patch,
        summary: 'Atualizado via BrandCentr IA',
      }),
    });
    const data = await res.json();
    if (res.ok && data.content) {
      setSiteContent(data.content);
      const revRes = await fetch('/api/site-content');
      const revData = await revRes.json();
      setRevisions(revData.revisions || []);
      flash('Site público atualizado.');
    }
  }

  async function handleRollbackRevision(revisionId: string) {
    const res = await fetch('/api/site-content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollbackRevisionId: revisionId }),
    });
    const data = await res.json();
    if (res.ok && data.content) {
      setSiteContent(data.content);
      flash('Versão restaurada.');
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload: Record<string, unknown> = {
        selected_model: selectedModel,
        client_cloud_provider: clientCloudProvider,
      };
      if (newApiKey.trim()) {
        payload.openrouter_api_key = newApiKey.trim();
      }
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setSettings((prev) => ({
          ...prev,
          hasOpenRouterKey: data.has_openrouter_key,
          openRouterKeyMasked: data.openrouter_key_masked,
          creditsExhausted: data.openrouter_credits_exhausted,
          selectedModel: data.selected_model,
          backups: data.backups,
        }));
        if (newApiKey.trim()) {
          setSimulationMode(false);
          setNewApiKey('');
        }
        setShowSettingsModal(false);
        flash('Configurações salvas.');
      }
    } finally {
      setSavingSettings(false);
    }
  }

  // TELA DE LOGIN MINIMALISTA COM BRANDCENTR × MARCA DO CLIENTE (COLLAB)
  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-[#FAF9F6] px-6 py-10 text-stone-900">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <BrandCentrCollabHeader
            brandName={siteContent.brand_name}
            brandColor={siteContent.primary_color}
            size={24}
          />
          <Link
            href="/"
            className="text-xs text-stone-400 transition hover:text-stone-900"
          >
            Ver site público →
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="space-y-3 text-center">
            <div className="flex justify-center">
              <BrandCentrCollabHeader
                brandName={siteContent.brand_name}
                brandColor={siteContent.primary_color}
                size={26}
              />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
              Acesso Oficial da Marca
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 text-sm">
            <input
              type="email"
              required
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-900"
            />
            <input
              type="password"
              required
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Senha"
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-900"
            />

            {loginError && (
              <p className="text-center text-xs text-rose-600">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full rounded-2xl bg-stone-900 py-3.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-50"
            >
              {loggingIn ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <div className="text-center text-[11px] text-stone-400">
          BrandCentr — O Futuro das Marcas
        </div>
      </div>
    );
  }

  const pendingApprovalsCount = approvals.filter(
    (a) => a.decision === 'pending'
  ).length;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF9F6] text-stone-900">
      <div>
        {/* BARRA SUPERIOR LIMPA — ASSINATURA COLLAB: BRANDCENTR × MARCA DO CLIENTE */}
        <header className="no-print border-b border-stone-200/80 bg-[#FAF9F6]/90 backdrop-blur-md sticky top-0 z-20">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <BrandCentrCollabHeader
              brandName={siteContent.brand_name}
              brandColor={siteContent.primary_color}
              size={24}
            />

            {/* Navegação Central Minimalista */}
            <nav className="flex items-center gap-1 rounded-full border border-stone-200 bg-white p-1">
              {(
                [
                  { id: 'arquivos', label: 'Arquivos' },
                  { id: 'manual', label: 'Manual' },
                  { id: 'criar', label: 'Criar' },
                  {
                    id: 'aprovar',
                    label:
                      pendingApprovalsCount > 0
                        ? `Aprovar (${pendingApprovalsCount})`
                        : 'Aprovar',
                  },
                  { id: 'ia', label: 'IA' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                target="_blank"
                className="hidden items-center gap-1 text-xs text-stone-500 hover:text-stone-900 sm:inline-flex"
              >
                Site <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={() => setShowSettingsModal(true)}
                title="Chave IA e Backups"
                className="rounded-full p-2 text-stone-500 transition hover:bg-stone-200/60 hover:text-stone-900"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* CONTEÚDO CENTRAL (COLUNA ÚNICA CALMA) */}
        <main className="mx-auto max-w-4xl px-6 py-12">
          {notice && (
            <div className="no-print mb-8 flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs text-stone-700 shadow-sm">
              <span>{notice}</span>
              <button onClick={() => setNotice(null)}>
                <X className="h-3.5 w-3.5 text-stone-400" />
              </button>
            </div>
          )}

          {/* 1. ABA ARQUIVOS */}
          {activeTab === 'arquivos' && (
            <div className="space-y-10">
              {/* Bloco Principal: 1 Botão Claro de Download */}
              <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-stone-200 bg-white p-8">
                <div className="space-y-1">
                  <h2 className="font-serif text-2xl font-normal">
                    Arquivos Oficiais da Marca
                  </h2>
                  <p className="text-xs text-stone-500">
                    Logotipos, fontes, manuais e materiais prontos para uso.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href="/api/downloads/Full_Brand_Kit.zip"
                    className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-xs font-medium text-white transition hover:bg-stone-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Baixar Tudo (.zip)
                  </a>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-4 py-3 text-xs font-medium text-stone-700 transition hover:border-stone-400"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Atalhos sutis por kit */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
                <span>Pacotes rápidos:</span>
                <a
                  href="/api/downloads/Design_Kit.zip"
                  className="underline decoration-stone-300 underline-offset-4 hover:text-stone-900"
                >
                  Design Kit (.zip)
                </a>
                <span>·</span>
                <a
                  href="/api/downloads/Media_Kit.zip"
                  className="underline decoration-stone-300 underline-offset-4 hover:text-stone-900"
                >
                  Media Kit (.zip)
                </a>
              </div>

              {/* Lista limpa de arquivos */}
              <div className="divide-y divide-stone-200/80 rounded-2xl border border-stone-200 bg-white">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium">{asset.title}</p>
                      <p className="mt-0.5 text-xs text-stone-400">
                        {asset.category} · {formatBytes(asset.file_size_bytes)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="rounded-full p-2 text-stone-300 transition hover:text-rose-600"
                      title="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. ABA MANUAL */}
          {activeTab === 'manual' && (
            <div className="space-y-10">
              <div className="no-print flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-normal">
                    Manual da Marca
                  </h2>
                  <p className="text-xs text-stone-500">
                    Clique em uma cor para copiar o código.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:border-stone-400"
                  >
                    Salvar em PDF
                  </button>
                  <button
                    onClick={() => setEditingDossier(!editingDossier)}
                    className="rounded-full px-4 py-2 text-xs text-stone-500 hover:text-stone-900"
                  >
                    {editingDossier ? 'Fechar edição' : 'Editar texto'}
                  </button>
                </div>
              </div>

              {editingDossier ? (
                <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
                  <textarea
                    rows={20}
                    value={dossier}
                    onChange={(e) => setDossier(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 p-4 font-mono text-xs outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveDossier}
                      className="rounded-full bg-stone-900 px-6 py-2.5 text-xs font-medium text-white"
                    >
                      Salvar alterações
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Cores */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                    {paletteSwatches.map((sw) => (
                      <button
                        key={sw.hex}
                        onClick={() => {
                          navigator.clipboard?.writeText(sw.hex);
                          setCopiedHex(sw.hex);
                          setTimeout(() => setCopiedHex(null), 1500);
                        }}
                        className="group overflow-hidden rounded-2xl border border-stone-200 bg-white text-left transition hover:border-stone-400"
                      >
                        <div
                          className="h-16 w-full"
                          style={{ backgroundColor: sw.hex }}
                        />
                        <div className="p-3">
                          <div className="text-xs font-medium">{sw.name}</div>
                          <div className="mt-0.5 flex items-center justify-between font-mono text-[11px] text-stone-400">
                            <span>{sw.hex}</span>
                            {copiedHex === sw.hex ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Diretrizes em leitura limpa */}
                  <div className="space-y-6">
                    {dossierSections.map((sec, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-stone-200/90 bg-white p-6"
                      >
                        <h3 className="font-serif text-lg font-normal text-stone-900">
                          {sec.title}
                        </h3>
                        <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-stone-600">
                          {sec.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 3. ABA CRIAR (PRÉ-VERIFICADOR SIMPLES EM 2 PASSOS) */}
          {activeTab === 'criar' && (
            <div className="space-y-10">
              <form
                onSubmit={handlePrecheckCreation}
                className="space-y-4 rounded-3xl border border-stone-200 bg-white p-7"
              >
                <div>
                  <h2 className="font-serif text-2xl font-normal">
                    Criar nova peça
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-500">
                    Validamos o texto e as cores antes de gerar a arte, sem desperdiçar créditos.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <select
                    value={pieceType}
                    onChange={(e) => setPieceType(e.target.value)}
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs outline-none focus:border-stone-900"
                  >
                    <option>Post Instagram</option>
                    <option>Story Instagram</option>
                    <option>Banner para Site</option>
                    <option>Comunicado / WhatsApp</option>
                  </select>

                  <input
                    required
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                    placeholder="Qual o objetivo? (ex: Anunciar nova safra)"
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs outline-none focus:border-stone-900 sm:col-span-2"
                  />
                </div>

                <textarea
                  rows={2}
                  required
                  value={draftCopy}
                  onChange={(e) => setDraftCopy(e.target.value)}
                  placeholder="O que você quer escrito na peça?"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs outline-none focus:border-stone-900"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={prechecking}
                    className="rounded-full bg-stone-900 px-6 py-3 text-xs font-medium text-white transition hover:bg-stone-800 disabled:opacity-50"
                  >
                    {prechecking ? 'Verificando...' : 'Validar texto e ideia'}
                  </button>
                </div>
              </form>

              {/* Lista de criações validadas */}
              <div className="space-y-4">
                {creations.map((c) => (
                  <div
                    key={c.id}
                    className="space-y-5 rounded-3xl border border-stone-200 bg-white p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-stone-400">
                          {c.piece_type}
                        </span>
                        <h3 className="text-sm font-medium">{c.intention}</h3>
                      </div>
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium">
                        Nota {c.precheck.tone_score}/10
                      </span>
                    </div>

                    {c.precheck.warnings.length > 0 && (
                      <div className="rounded-2xl bg-amber-50/80 px-4 py-3 text-xs text-amber-900">
                        {c.precheck.warnings[0]}
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-xs text-stone-400">
                        Sugestões no tom da sua marca:
                      </p>
                      {c.precheck.refined_copy_options.map((opt, idx) => (
                        <label
                          key={idx}
                          className="flex cursor-pointer items-center gap-3 rounded-2xl border border-stone-200 px-4 py-3 text-xs transition hover:border-stone-400"
                        >
                          <input
                            type="radio"
                            name={`copy_${c.id}`}
                            checked={c.chosen_copy === opt}
                            onChange={() =>
                              setCreations((prev) =>
                                prev.map((item) =>
                                  item.id === c.id
                                    ? { ...item, chosen_copy: opt }
                                    : item
                                )
                              )
                            }
                            className="accent-stone-900"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() =>
                          handleGenerateCreation(c.id, c.chosen_copy)
                        }
                        disabled={generatingId === c.id}
                        className="rounded-full bg-stone-900 px-6 py-2.5 text-xs font-medium text-white transition hover:bg-stone-800 disabled:opacity-50"
                      >
                        {generatingId === c.id
                          ? 'Criando peça...'
                          : 'Gerar peça e enviar para Aprovar →'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. ABA APROVAR */}
          {activeTab === 'aprovar' && (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-normal">
                    Aprovações da Marca
                  </h2>
                  <p className="text-xs text-stone-500">
                    Peças verificadas automaticamente contra o Manual da Marca.
                  </p>
                </div>

                <button
                  onClick={() => setShowAuditModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-5 py-2.5 text-xs font-medium text-white hover:bg-stone-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Verificar uma peça
                </button>
              </div>

              {approvals.length === 0 ? (
                <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center text-xs text-stone-400">
                  Nenhuma peça pendente. Crie uma peça na aba &ldquo;Criar&rdquo; ou clique em &ldquo;Verificar uma peça&rdquo;.
                </div>
              ) : (
                <div className="space-y-4">
                  {approvals.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-6 rounded-3xl border border-stone-200 bg-white p-6 md:grid-cols-12"
                    >
                      {item.preview_data_url && (
                        <div className="md:col-span-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.preview_data_url}
                            alt={item.title}
                            className="max-h-60 w-full rounded-2xl border border-stone-100 object-contain"
                          />
                        </div>
                      )}

                      <div
                        className={`flex flex-col justify-between space-y-4 ${
                          item.preview_data_url
                            ? 'md:col-span-8'
                            : 'md:col-span-12'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-medium">
                              {item.title}
                            </h3>
                            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium">
                              {item.overall_score}/10
                            </span>
                          </div>

                          <p className="text-xs text-stone-500">
                            {item.summary}
                          </p>

                          <div className="space-y-1.5 pt-1">
                            {item.checklist.map((chk, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-stone-700">
                                  {chk.status === 'pass'
                                    ? '✓'
                                    : chk.status === 'warning'
                                    ? '•'
                                    : '✕'}{' '}
                                  {chk.criterion}
                                </span>
                                <span className="text-stone-400">
                                  {chk.finding}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-stone-100 pt-4">
                          <span className="text-xs text-stone-400">
                            Status:{' '}
                            <strong className="font-medium text-stone-800">
                              {item.decision === 'approved'
                                ? 'Aprovada'
                                : item.decision === 'revision_requested'
                                ? 'Pedir ajuste'
                                : item.decision === 'rejected'
                                ? 'Reprovada'
                                : 'Pendente'}
                            </strong>
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleApprovalDecision(
                                  item.id,
                                  'revision_requested'
                                )
                              }
                              className="rounded-full border border-stone-200 px-4 py-1.5 text-xs text-stone-600 hover:border-stone-400"
                            >
                              Pedir ajuste
                            </button>
                            <button
                              onClick={() =>
                                handleApprovalDecision(item.id, 'approved')
                              }
                              className="rounded-full bg-stone-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-stone-800"
                            >
                              Aprovar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. ABA IA (GUARDIÃO DA MARCA + EDIÇÃO DO SITE EM UMA COLUNA LIMPA) */}
          {activeTab === 'ia' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-stone-200 bg-white p-6">
                <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
                  {chat.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        {msg.proposed_site_patch && (
                          <div className="mt-3 rounded-xl bg-white p-3 text-stone-900">
                            <p className="text-[11px] font-medium">
                              Aplicar esta alteração no site público?
                            </p>
                            <button
                              onClick={() =>
                                handleConfirmSitePatch(msg.proposed_site_patch!)
                              }
                              className="mt-2 rounded-full bg-stone-900 px-4 py-1.5 text-[11px] font-medium text-white"
                            >
                              Confirmar e Publicar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-stone-100 pt-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {[
                      'Quais são nossas cores?',
                      'Como usar o logotipo?',
                      'Mude o título do site para destacar a nova safra',
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSendChat(q)}
                        className="rounded-full border border-stone-200 px-3 py-1 text-[11px] text-stone-500 transition hover:border-stone-400 hover:text-stone-900"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChat();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Pergunte qualquer regra da marca ou peça uma mudança no site..."
                      className="flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs outline-none focus:border-stone-900"
                    />
                    <button
                      type="submit"
                      disabled={chatSending}
                      className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-2.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </div>

              {revisions.length > 1 && (
                <div className="flex items-center justify-between px-2 text-xs text-stone-400">
                  <span>Última alteração no site: {revisions[0]?.summary}</span>
                  <button
                    onClick={() => handleRollbackRevision(revisions[1].id)}
                    className="underline hover:text-stone-900"
                  >
                    Desfazer última edição do site
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* RODAPÉ PRESENTE EM TODO O SISTEMA */}
      <footer className="no-print mx-auto flex w-full max-w-4xl items-center justify-between border-t border-stone-200/70 px-6 py-6 text-xs text-stone-400">
        <PoweredByBrandCentr tone="dark" />
        <button
          onClick={async () => {
            await fetch('/api/portal-auth', { method: 'DELETE' });
            setAuthenticated(false);
          }}
          className="hover:text-stone-900"
        >
          Sair
        </button>
      </footer>

      {/* MODAL DISCRETO: UPLOAD DE ARQUIVO */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium">Adicionar arquivo</span>
              <button onClick={() => setShowUploadModal(false)}>
                <X className="h-4 w-4 text-stone-400" />
              </button>
            </div>
            <form onSubmit={handleAssetUpload} className="space-y-3 text-xs">
              <input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Nome do arquivo"
                className="w-full rounded-2xl border border-stone-200 px-3.5 py-2.5 outline-none"
              />
              <select
                value={uploadCat}
                onChange={(e) => setUploadCat(e.target.value as AssetCategory)}
                className="w-full rounded-2xl border border-stone-200 px-3.5 py-2.5 outline-none"
              >
                <option>Design Kit</option>
                <option>Media Kit</option>
                <option>Logos</option>
                <option>Templates</option>
                <option>Manual</option>
                <option>Key Visuals</option>
              </select>
              <input
                type="file"
                required
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-xs"
              />
              <button
                type="submit"
                disabled={uploadingAsset}
                className="w-full rounded-full bg-stone-900 py-3 font-medium text-white"
              >
                {uploadingAsset ? 'Enviando...' : 'Salvar arquivo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DISCRETO: VERIFICAR PEÇA AVULSA */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium">Verificar uma peça</span>
              <button onClick={() => setShowAuditModal(false)}>
                <X className="h-4 w-4 text-stone-400" />
              </button>
            </div>
            <form onSubmit={handleVerifyPiece} className="space-y-3 text-xs">
              <input
                required
                value={auditTitle}
                onChange={(e) => setAuditTitle(e.target.value)}
                placeholder="Nome da peça (ex: Post Dia do Café)"
                className="w-full rounded-2xl border border-stone-200 px-3.5 py-2.5 outline-none"
              />
              <textarea
                rows={2}
                value={auditText}
                onChange={(e) => setAuditText(e.target.value)}
                placeholder="Texto ou observações da peça"
                className="w-full rounded-2xl border border-stone-200 px-3.5 py-2.5 outline-none"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleAuditFilePick}
                className="w-full text-xs"
              />
              <button
                type="submit"
                disabled={auditing}
                className="w-full rounded-full bg-stone-900 py-3 font-medium text-white"
              >
                {auditing ? 'Analisando...' : 'Analisar peça'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DISCRETO: CONFIGURAÇÕES (CHAVE IA & BACKUPS) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <BrandCentrLogo size={18} tone="dark" />
              <button onClick={() => setShowSettingsModal(false)}>
                <X className="h-4 w-4 text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block text-stone-500">
                  Chave OpenRouter ({settings.hasOpenRouterKey ? settings.openRouterKeyMasked : 'Modo demonstração ativo'})
                </label>
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full rounded-2xl border border-stone-200 px-3.5 py-2.5 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-stone-500">
                  Modelo de IA
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-2xl border border-stone-200 px-3.5 py-2.5 outline-none"
                >
                  <option value="google/gemini-2.5-flash">
                    Gemini 2.5 Flash (Recomendado)
                  </option>
                  <option value="google/gemini-2.5-pro">Gemini 2.5 Pro</option>
                  <option value="anthropic/claude-sonnet-4">
                    Claude Sonnet 4
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-stone-500">
                  Backup automático na nuvem
                </label>
                <select
                  value={clientCloudProvider}
                  onChange={(e) =>
                    setClientCloudProvider(
                      e.target.value as
                        | 'Google Drive'
                        | 'Dropbox'
                        | 'Desativado'
                    )
                  }
                  className="w-full rounded-2xl border border-stone-200 px-3.5 py-2.5 outline-none"
                >
                  <option value="Google Drive">
                    Google Drive + Cofre BrandCentr
                  </option>
                  <option value="Dropbox">Dropbox + Cofre BrandCentr</option>
                  <option value="Desativado">Apenas Cofre BrandCentr</option>
                </select>
              </div>

              <label className="flex items-center gap-2 pt-1 text-stone-600">
                <input
                  type="checkbox"
                  checked={simulationMode}
                  onChange={(e) => setSimulationMode(e.target.checked)}
                  className="accent-stone-900"
                />
                <span>Usar modo demonstração local (sem gastar créditos)</span>
              </label>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full rounded-full bg-stone-900 py-3 font-medium text-white"
              >
                {savingSettings ? 'Salvando...' : 'Salvar configurações'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
