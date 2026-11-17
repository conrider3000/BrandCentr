'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Lock,
  MoreHorizontal,
  Plus,
  RefreshCw,
  X,
} from 'lucide-react';
import { BrandCentrLogo } from '@/components/BrandCentrLogo';
import type { PublicClientView } from '@/lib/types';

interface FleetSummary {
  totalNodes: number;
  activeNodes: number;
  suspendedNodes: number;
  provisioningNodes: number;
  onlineNodes: number;
  totalMonthlyRevenueBrl: number;
  totalVpsCostBrl: number;
  totalAssets: number;
  totalAiMessages: number;
}

export default function BrandCentrCommandPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState('admin@suaagencia.com.br');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setAuthenticated(true);
      })
      .catch(() => {});
  }, []);

  const [clients, setClients] = useState<PublicClientView[]>([]);
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<{
    brand: string;
    domain: string;
    ip: string;
    secret: string;
  } | null>(null);

  const [form, setForm] = useState({
    brand_name: '',
    root_domain: '',
    vps_ip: '',
    coolify_app_uuid: '',
    monthly_fee_brl: '290',
    hostinger_cost_brl: '32',
    annual_installment_plan: '12x R$ 290/mês (Anual)',
    renewal_date: new Date(Date.now() + 365 * 86400 * 1000)
      .toISOString()
      .slice(0, 10),
  });

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 5000);
  };

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/clients', { cache: 'no-store' });
      const data = await res.json();
      setClients(data.clients || []);
      setSummary(data.summary || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadData();
      const timer = setInterval(loadData, 30000);
      return () => clearInterval(timer);
    }
  }, [authenticated, loadData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAuthenticated(true);
      } else {
        setAuthError(data.error || 'Credenciais inválidas.');
      }
    } catch {
      setAuthError('Falha ao conectar.');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleNodeAction(
    id: string,
    action: 'ping_heartbeat' | 'toggle_suspension' | 'deploy'
  ) {
    setBusyId(id);
    setOpenMenuId(null);
    try {
      const res = await fetch(`/api/clients/${id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      flash(data.message || data.error || 'Concluído.');
      await loadData();
    } finally {
      setBusyId(null);
    }
  }

  async function handleFleetAction(
    action: 'poll_all_heartbeats' | 'update_all_nodes'
  ) {
    setBusyId('fleet');
    try {
      const res = await fetch('/api/fleet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      flash(data.message || 'Frota sincronizada.');
      await loadData();
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        monthly_fee_brl: Number(form.monthly_fee_brl),
        hostinger_cost_brl: Number(form.hostinger_cost_brl),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      flash(data.error || 'Erro ao criar cliente.');
      return;
    }

    setCreatedSecret({
      brand: data.client.brand_name,
      domain: data.client.root_domain,
      ip: data.client.vps_ip,
      secret: data.generatedHeartbeatSecret,
    });
    setShowCreateModal(false);
    setForm({
      brand_name: '',
      root_domain: '',
      vps_ip: '',
      coolify_app_uuid: '',
      monthly_fee_brl: '290',
      hostinger_cost_brl: '32',
      annual_installment_plan: '12x R$ 290/mês (Anual)',
      renewal_date: new Date(Date.now() + 365 * 86400 * 1000)
        .toISOString()
        .slice(0, 10),
    });
    await loadData();
  }

  async function handleDelete(id: string, name: string) {
    setOpenMenuId(null);
    if (!confirm(`Remover "${name}" da lista?`)) return;
    await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    flash(`"${name}" removido.`);
    loadData();
  }

  // TELA DE LOGIN DO BRANDCENTR COMMAND (ACESSO DE QUALQUER LUGAR)
  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-[#0A0A0B] px-6 py-10 text-zinc-100">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao site BrandCentr
          </Link>
          <BrandCentrLogo size={22} tone="light" />
        </div>

        <div className="mx-auto w-full max-w-sm space-y-7">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-zinc-300">
              <Lock className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-medium tracking-tight text-white">
              BrandCentr Command
            </h1>
            <p className="text-xs text-zinc-500">
              Torre de controle exclusiva da agência
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 text-xs">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail de administrador"
              className="w-full rounded-2xl border border-zinc-800 bg-[#111114] px-4 py-3 text-white outline-none focus:border-zinc-600"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha mestre"
              className="w-full rounded-2xl border border-zinc-800 bg-[#111114] px-4 py-3 text-white outline-none focus:border-zinc-600"
            />

            {authError && (
              <p className="text-center text-xs text-rose-400">{authError}</p>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full rounded-2xl bg-white py-3.5 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {loggingIn ? 'Autenticando...' : 'Entrar no Command'}
            </button>
          </form>
        </div>

        <div className="text-center text-[11px] text-zinc-600">
          BrandCentr — O Futuro das Marcas
        </div>
      </div>
    );
  }

  const netMonthly = summary
    ? summary.totalMonthlyRevenueBrl - summary.totalVpsCostBrl
    : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100">
      {/* Minimal Header */}
      <header className="border-b border-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <Link href="/" className="transition hover:opacity-80">
              <BrandCentrLogo size={24} tone="light" />
            </Link>
            <span className="rounded-full border border-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-400">
              Command
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-xs text-zinc-500 hover:text-white sm:inline"
            >
              Landing Page
            </Link>

            <button
              onClick={() => handleFleetAction('poll_all_heartbeats')}
              disabled={busyId === 'fleet'}
              title="Atualizar status da frota"
              className="rounded-full border border-zinc-800 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  busyId === 'fleet' ? 'animate-spin' : ''
                }`}
              />
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-medium text-black transition hover:bg-zinc-200"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova Marca
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-6 py-10">
        {notice && (
          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-2.5 text-xs text-zinc-300">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)}>
              <X className="h-3.5 w-3.5 text-zinc-500 hover:text-white" />
            </button>
          </div>
        )}

        {createdSecret && (
          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white">
                Configuração de {createdSecret.brand} ({createdSecret.domain})
              </span>
              <button
                onClick={() => setCreatedSecret(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <pre className="overflow-x-auto rounded-xl bg-black p-3 font-mono text-[11px] text-zinc-300">
{`DOMAIN=${createdSecret.domain}
AGENCY_HEARTBEAT_SECRET=${createdSecret.secret}`}
              </pre>
              <pre className="overflow-x-auto rounded-xl bg-black p-3 font-mono text-[11px] text-zinc-400">
{`Registro.br (Tipo A -> ${createdSecret.ip})
@     ${createdSecret.ip}
www   ${createdSecret.ip}
marca ${createdSecret.ip}`}
              </pre>
            </div>
          </div>
        )}

        {/* Clean Summary Strip */}
        <section className="grid grid-cols-3 gap-6 border-b border-zinc-900 pb-8">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">
              Marcas Online
            </span>
            <p className="mt-1 text-2xl font-light text-white">
              {summary?.onlineNodes ?? 0}
              <span className="text-zinc-600">
                /{summary?.totalNodes ?? 0}
              </span>
            </p>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">
              Margem Mensal Líquida
            </span>
            <p className="mt-1 text-2xl font-light text-white">
              R$ {netMonthly.toLocaleString('pt-BR')}
            </p>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                Suspensas
              </span>
              <p className="mt-1 text-2xl font-light text-white">
                {summary?.suspendedNodes ?? 0}
              </p>
            </div>
            <button
              onClick={() => handleFleetAction('update_all_nodes')}
              className="text-xs text-zinc-500 underline-offset-4 hover:text-zinc-200 hover:underline"
            >
              Atualizar toda a frota
            </button>
          </div>
        </section>

        {/* Minimal Client List */}
        <section className="space-y-2">
          {loading ? (
            <p className="py-12 text-center text-xs text-zinc-500">
              Carregando marcas...
            </p>
          ) : (
            clients.map((c) => {
              const isSuspended = c.status === 'suspended';
              const diskPct = Math.min(
                100,
                Math.round(
                  ((c.telemetry.diskUsedGb || 0) /
                    (c.telemetry.diskTotalGb || 50)) *
                    100
                )
              );

              return (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-900 bg-[#0F0F12] px-5 py-4 transition hover:border-zinc-800"
                >
                  {/* Brand & Domain */}
                  <div className="flex min-w-[240px] items-center gap-3.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isSuspended
                          ? 'bg-rose-500'
                          : c.telemetry.online
                          ? 'bg-emerald-400'
                          : 'bg-zinc-600'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {c.brand_name}
                        </span>
                        {c.node_url_override && (
                          <a
                            href={`${c.node_url_override}/portal`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-zinc-500 hover:text-white"
                            title="Abrir Portal BrandCentr desta marca"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">
                        {c.root_domain} · {c.vps_ip}
                      </p>
                    </div>
                  </div>

                  {/* Subtle Telemetry */}
                  <div className="flex items-center gap-6 text-xs text-zinc-400">
                    <div>
                      <span className="text-zinc-600">Disco </span>
                      <span>
                        {c.telemetry.diskUsedGb}/{c.telemetry.diskTotalGb} GB (
                        {diskPct}%)
                      </span>
                    </div>
                    <div className="hidden sm:block">
                      <span className="text-zinc-600">RAM </span>
                      <span>{c.telemetry.ramPercent}%</span>
                    </div>
                    <div className="hidden md:block">
                      <span className="text-zinc-600">IA </span>
                      <span
                        className={
                          c.telemetry.openrouterOk
                            ? 'text-zinc-300'
                            : 'text-amber-400/90'
                        }
                      >
                        {c.telemetry.openrouterOk ? 'Ativa' : 'Sem chave'}
                      </span>
                    </div>
                    <div className="hidden text-zinc-300 lg:block">
                      R$ {c.monthly_fee_brl}/mês
                    </div>
                  </div>

                  {/* Single Main Toggle + Quiet More Menu */}
                  <div className="relative flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleNodeAction(c.id, 'toggle_suspension')
                      }
                      disabled={busyId === c.id}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                        isSuspended
                          ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                          : 'border border-zinc-800 text-zinc-300 hover:border-rose-500/40 hover:text-rose-300'
                      }`}
                    >
                      {isSuspended ? 'Reativar' : 'Ativo'}
                    </button>

                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === c.id ? null : c.id)
                      }
                      className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-white"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {openMenuId === c.id && (
                      <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-zinc-800 bg-[#141418] p-1.5 text-xs shadow-xl">
                        <button
                          onClick={() =>
                            handleNodeAction(c.id, 'ping_heartbeat')
                          }
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800"
                        >
                          Sincronizar agora
                        </button>
                        <button
                          onClick={() => handleNodeAction(c.id, 'deploy')}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800"
                        >
                          Deploy via Coolify
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.brand_name)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-rose-400 hover:bg-zinc-800"
                        >
                          Remover da lista
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      <footer className="mx-auto flex max-w-5xl items-center justify-between px-6 py-10 text-[11px] text-zinc-600">
        <span>BrandCentr — O Futuro das Marcas</span>
        <button
          onClick={async () => {
            await fetch('/api/auth', { method: 'DELETE' });
            setAuthenticated(false);
          }}
          className="hover:text-zinc-300"
        >
          Bloquear sessão
        </button>
      </footer>

      {/* Clean Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#121215] p-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                Adicionar Marca ao BrandCentr
              </span>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <input
                required
                value={form.brand_name}
                onChange={(e) =>
                  setForm({ ...form, brand_name: e.target.value })
                }
                placeholder="Nome da marca (ex: Aurora Café)"
                className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-white outline-none focus:border-zinc-600"
              />
              <input
                required
                value={form.root_domain}
                onChange={(e) =>
                  setForm({ ...form, root_domain: e.target.value })
                }
                placeholder="Domínio (ex: auroracafe.com.br)"
                className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-white outline-none focus:border-zinc-600"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  required
                  value={form.vps_ip}
                  onChange={(e) => setForm({ ...form, vps_ip: e.target.value })}
                  placeholder="IP da VPS"
                  className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 font-mono text-white outline-none focus:border-zinc-600"
                />
                <input
                  type="number"
                  value={form.monthly_fee_brl}
                  onChange={(e) =>
                    setForm({ ...form, monthly_fee_brl: e.target.value })
                  }
                  placeholder="Mensalidade (R$)"
                  className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-white outline-none focus:border-zinc-600"
                />
              </div>
              <input
                value={form.coolify_app_uuid}
                onChange={(e) =>
                  setForm({ ...form, coolify_app_uuid: e.target.value })
                }
                placeholder="UUID da aplicação no Coolify (opcional)"
                className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 font-mono text-white outline-none focus:border-zinc-600"
              />

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 font-medium text-black hover:bg-zinc-200"
                >
                  <Check className="h-3.5 w-3.5" />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
