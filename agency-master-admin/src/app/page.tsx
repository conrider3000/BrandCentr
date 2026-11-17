'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  Globe,
  Layers,
  Lock,
  Wand2,
  X,
  XCircle,
} from 'lucide-react';
import { BrandCentrLogo, BrandCentrMark } from '@/components/BrandCentrLogo';

const DEMO_NODE_URL = (
  process.env.NEXT_PUBLIC_DEMO_NODE_URL || 'http://localhost:3002'
).replace(/\/+$/, '');

interface DirectoryBrand {
  id: string;
  brand_name: string;
  root_domain: string;
  portal_url: string;
  site_url: string;
}

const NAV_ITEMS = [
  { id: 'ecossistema', label: 'Ecossistema' },
  { id: 'simulador', label: 'Simulador' },
  { id: 'arquitetura', label: 'Arquitetura' },
  { id: 'comparativo', label: 'Comparativo' },
  { id: 'faq', label: 'Dúvidas' },
  { id: 'acesso', label: 'Acesso' },
] as const;

const ORBIT_PILLARS = [
  {
    id: 'site',
    code: '01',
    title: 'Site Oficial Novo',
    domain: 'suaempresa.com.br',
    headline: 'O domínio principal passa a refletir a nova marca no primeiro dia.',
    detail:
      'Substitui sites antigos e desconectados em @ e www com carregamento instantâneo, paleta oficial aplicada na raiz e textos editáveis com histórico de rollback via IA.',
    specs: ['HTTPS automático Let’s Encrypt', 'Edição segura por confirmação', 'Rollback em 1 clique'],
  },
  {
    id: 'portal',
    code: '02',
    title: 'Cofre & Kits .zip',
    domain: 'marca.suaempresa.com.br',
    headline: 'Arquivos pesados organizados, prontos para baixar sem travar.',
    detail:
      'Logos vetoriais, Key Visuals, templates e vídeos em 4K disponíveis por categoria. Os pacotes Design_Kit.zip, Media_Kit.zip e Full_Brand_Kit.zip são empacotados em streaming sem desperdiçar disco.',
    specs: ['Streaming zip -0 sem CPU', 'Suporta vídeos de 5GB+', 'Sem links expirados do Drive'],
  },
  {
    id: 'manual',
    code: '03',
    title: 'Manual Vivo & PDF',
    domain: 'marca.suaempresa.com.br/manual',
    headline: 'A diretriz deixa de ser um arquivo morto e vira página interativa.',
    detail:
      'Paleta HEX/RGB/CMYK copiável com um toque, regras objetivas de logotipo, área de proteção, tipografia e tom de voz estruturados em seções numeradas.',
    specs: ['Códigos HEX copiáveis', 'Exportação em PDF limpa', 'Fonte única de verdade'],
  },
  {
    id: 'ia',
    code: '04',
    title: 'IA Guardiã + Criar/Aprovar',
    domain: 'Contexto Longo 1M Tokens',
    headline: 'Valida antes de gerar e audita cada peça antes de publicar.',
    detail:
      'O Dossiê completo da marca entra integralmente na memória do modelo (sem RAG fragmentado). Toda resposta cita a seção exata do manual, evitando alucinações e desperdício de tokens.',
    specs: ['Pré-verificador de intenção', 'Auditoria visual 0 a 10', 'Citação exata de seções'],
  },
  {
    id: 'backup',
    code: '05',
    title: 'Servidor Dedicado & Backup 3x',
    domain: 'VPS Isolada + Nuvem',
    headline: 'Infraestrutura individual com tripla camada de proteção.',
    detail:
      'Cada marca roda em servidor Linux dedicado na nuvem brasileira com snapshots diários locais, cópia de segurança em nuvem e espelhamento automático no Google Drive ou Dropbox do cliente.',
    specs: ['VPS exclusiva por marca', 'Cofre Nuvem + Drive Cliente', 'Monitoramento 24/7'],
  },
] as const;

const FAQ_ITEMS = [
  {
    q: 'Por que ter uma infraestrutura BrandCentr em vez de uma pasta no Google Drive + PDF?',
    a: 'Pastas de nuvem acumulam versões antigas, links quebrados e ninguém consulta um PDF de 60 páginas antes de aprovar um post. O BrandCentr coloca o manual, os arquivos, o site novo e um guardião de IA trabalhando juntos diariamente no domínio da própria empresa.',
  },
  {
    q: 'O que acontece com o site antigo da empresa?',
    a: 'Ao apontar os registros @ e www no Registro.br, o novo site institucional desenhado junto com a identidade visual entra no ar no lugar do site antigo — já conectado ao banco de dados e à paleta oficial da marca.',
  },
  {
    q: 'Como o Pré-Verificador da aba Criar economiza dinheiro e tokens?',
    a: 'Em vez de gerar várias imagens erradas até acertar o texto ou o clima visual, a IA primeiro audita sua intenção, corrige o texto fora do tom da marca, define os códigos HEX permitidos e só gera a arte depois de tudo aprovado.',
  },
  {
    q: 'Os arquivos e a marca ficam presos caso o contrato termine?',
    a: 'Não. A infraestrutura funciona sob plano anual transparente, e o cliente mantém o direito de baixar todo o acervo completo em Full_Brand_Kit.zip a qualquer momento além de possuir espelhamento automático no próprio Google Drive ou Dropbox.',
  },
];

export default function BrandCentrLandingPage() {
  const [brands, setBrands] = useState<DirectoryBrand[]>([]);
  const [activeNav, setActiveNav] = useState<string>('ecossistema');

  // Modal único de Login (sem exibir Command publicamente)
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [customDomain, setCustomDomain] = useState('');

  // Estado interativo do Simulador
  const [simTab, setSimTab] = useState<
    'precheck' | 'approve' | 'kits' | 'site'
  >('precheck');
  const [simDraft, setSimDraft] = useState(
    'PROMOÇÃO RELÂMPAGO!! Café gourmet barato hoje com 30% OFF!!'
  );
  const [simApproveVariant, setSimApproveVariant] = useState<'fail' | 'pass'>(
    'fail'
  );
  const [simHeroHeadline, setSimHeroHeadline] = useState(
    'Café especial recém-torrado, entregue no seu ritual da manhã.'
  );

  // Estado interativo da Órbita de Arquitetura
  const [selectedPillarId, setSelectedPillarId] = useState<string>('ia');

  // Estado interativo do Comparativo e FAQ
  const [compareFocus, setCompareFocus] = useState<'brandcentr' | 'comum'>(
    'brandcentr'
  );
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    fetch('/api/public-directory')
      .then((r) => r.json())
      .then((d) => setBrands(d.brands || []))
      .catch(() => {});
  }, []);

  // Scroll spy suave para destacar seção ativa no menu
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveNav(entry.target.id);
          }
        }
      },
      { rootMargin: '-35% 0px -50% 0px' }
    );

    for (const item of NAV_ITEMS) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  function scrollToSection(id: string) {
    setActiveNav(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async function handleUnifiedLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/unified-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setLoginError(data.error || 'E-mail ou senha inválidos.');
    } catch {
      setLoginError('Erro ao conectar.');
    } finally {
      setLoggingIn(false);
    }
  }

  function handleCustomDomainGo(e: React.FormEvent) {
    e.preventDefault();
    const clean = customDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^marca\./, '')
      .replace(/\/.*$/, '');
    if (!clean) return;

    const matched = brands.find(
      (b) =>
        b.root_domain.toLowerCase() === clean ||
        b.brand_name.toLowerCase() === clean
    );
    if (matched) {
      window.location.href = matched.portal_url;
      return;
    }
    window.location.href = `https://marca.${clean}`;
  }

  // Análise em tempo real do Pré-Verificador no Simulador da Landing Page
  const hasCapsViolation =
    /[A-ZÁÉÍÓÚÇ]{5,}/.test(simDraft) || /!{2,}/.test(simDraft);
  const hasDiscountViolation =
    /liquida|queima|barato|rel[aâ]mpago|imperd[ií]vel|off/i.test(simDraft);
  const simScore =
    10 - (hasCapsViolation ? 3 : 0) - (hasDiscountViolation ? 3 : 0);

  const selectedPillar =
    ORBIT_PILLARS.find((p) => p.id === selectedPillarId) || ORBIT_PILLARS[0];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#070709] text-zinc-100 selection:bg-[#7C5CFF] selection:text-white">
      {/* Camadas atmosféricas de fundo */}
      <div className="pointer-events-none fixed inset-0 bg-grid-architectural opacity-60" />
      <div className="pointer-events-none fixed left-1/2 top-[-220px] h-[540px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.18)_0%,rgba(229,169,82,0.06)_45%,transparent_72%)] blur-3xl animate-pulse-slow" />

      {/* Top Sticky Glass Header — ÚNICO BOTÃO: Entrar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#070709]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button
            onClick={() => scrollToSection('ecossistema')}
            className="text-left transition hover:opacity-85"
          >
            <BrandCentrLogo size={26} tone="light" />
          </button>

          {/* Navegação âncora com rolagem suave + indicador ativo */}
          <nav className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs transition-all duration-300 ${
                    active
                      ? 'bg-white font-medium text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Apenas um botão discreto e elegante de Login */}
          <button
            onClick={() => {
              setLoginError('');
              setShowLoginModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
          >
            <Lock className="h-3 w-3" />
            Entrar
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section
        id="ecossistema"
        className="relative mx-auto max-w-6xl scroll-mt-24 px-6 pb-20 pt-20 sm:pt-28"
      >
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto inline-flex items-center gap-2.5 rounded-full border border-[#7C5CFF]/30 bg-[#7C5CFF]/10 px-4 py-1.5 text-[11px] font-medium text-[#D6CCFF]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E5A952]" />
            BrandCentr · O Centro de Gravidade da Marca
          </div>

          <h1 className="mt-8 text-4xl font-light leading-[1.06] tracking-[-0.03em] text-white sm:text-6xl lg:text-[68px]">
            Sua marca não é um PDF.{' '}
            <span className="font-editorial italic font-normal text-[#E5A952]">
              Ela é um sistema vivo.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            O <strong className="font-medium text-white">BrandCentr</strong>{' '}
            substitui links soltos no Drive por uma infraestrutura exclusiva no
            domínio do cliente: novo site oficial, portal de ativos, manual
            navegável e IA guardiã treinada apenas na verdade da marca.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
            <button
              onClick={() => scrollToSection('simulador')}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-xs font-semibold text-black shadow-[0_0_40px_rgba(255,255,255,0.16)] transition hover:scale-[1.02] hover:bg-zinc-100"
            >
              Testar o Sistema ao Vivo
              <ArrowDown className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => scrollToSection('acesso')}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-7 py-3.5 text-xs font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/[0.08]"
            >
              Acessar minha Marca
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Faixa de métricas */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 border-t border-white/[0.08] pt-8 sm:grid-cols-4">
            {[
              { val: '100%', label: 'Baseado no Dossiê' },
              { val: '0 CPU', label: 'Kits .zip em streaming' },
              { val: '3x', label: 'Camadas de Backup' },
              { val: '1 VPS', label: 'Dedicada por Marca' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-xl font-semibold tracking-tight text-white">
                  {stat.val}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO INTERATIVA 1: SIMULADOR AO VIVO DO PRODUTO */}
      <section
        id="simulador"
        className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-20"
      >
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#E5A952]">
              Simulador Interativo
            </span>
            <h2 className="text-3xl font-light tracking-tight text-white sm:text-4xl">
              Veja como o cliente vive a{' '}
              <span className="font-editorial italic">
                experiência BrandCentr
              </span>
              .
            </h2>
          </div>

          <a
            href={`${DEMO_NODE_URL}/portal`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs text-zinc-300 transition hover:border-white/35 hover:text-white"
          >
            Abrir Portal Demo Completo
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Janela do Produto */}
        <div className="overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0D0D11] shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
          {/* Topo Collab dentro do Simulador */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] bg-[#111117] px-6 py-4">
            <div className="flex items-center gap-3">
              <BrandCentrLogo size={20} tone="light" />
              <span className="font-mono text-xs text-zinc-600">×</span>
              <span className="inline-flex items-center gap-2 text-xs font-medium text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-[#9A4D26] text-[10px] font-bold">
                  A
                </span>
                Aurora Café &amp; Torrefação
              </span>
            </div>

            {/* Abas do Simulador */}
            <div className="flex flex-wrap gap-1 rounded-full border border-white/[0.08] bg-black/40 p-1">
              {(
                [
                  { id: 'precheck', label: '1. Criar (Pré-Verificador)' },
                  { id: 'approve', label: '2. Aprovar (Nota 0–10)' },
                  { id: 'kits', label: '3. Arquivos & Kits' },
                  { id: 'site', label: '4. Site Vivo' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSimTab(t.id)}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-medium transition ${
                    simTab === t.id
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conteúdo Dinâmico do Simulador */}
          <div className="p-6 sm:p-10">
            {simTab === 'precheck' && (
              <div className="grid gap-8 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-6">
                  <div className="inline-flex items-center gap-2 text-xs text-[#E5A952]">
                    <Wand2 className="h-3.5 w-3.5" />
                    Teste o Pré-Verificador antes de gastar tokens
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-400">
                    Edite o texto abaixo ou clique em um exemplo. O BrandCentr
                    audita a frase contra o Dossiê Oficial em tempo real antes de
                    gerar a peça visual:
                  </p>

                  <textarea
                    rows={3}
                    value={simDraft}
                    onChange={(e) => setSimDraft(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/60 p-4 text-xs text-white outline-none focus:border-[#7C5CFF]"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setSimDraft(
                          'PROMOÇÃO RELÂMPAGO!! Café gourmet barato hoje com 30% OFF!!'
                        )
                      }
                      className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-zinc-400 hover:border-white/25 hover:text-white"
                    >
                      Exemplo fora do padrão
                    </button>
                    <button
                      onClick={() =>
                        setSimDraft(
                          'A nova safra da Serra da Mantiqueira acabou de sair do torrador. Convite especial para assinantes até sexta-feira.'
                        )
                      }
                      className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-zinc-400 hover:border-white/25 hover:text-white"
                    >
                      Exemplo no tom da marca
                    </button>
                  </div>
                </div>

                <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-black/50 p-6 lg:col-span-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300">
                      Diagnóstico Instantâneo do Dossiê
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        simScore >= 8
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      Nota {simScore}/10
                    </span>
                  </div>

                  {hasCapsViolation || hasDiscountViolation ? (
                    <div className="space-y-2 text-xs">
                      {hasCapsViolation && (
                        <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 p-3 text-rose-200">
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                          <span>
                            Caixa alta agressiva ou exclamações múltiplas
                            violam{' '}
                            <code className="text-rose-300">
                              [4.3 Lista Negra]
                            </code>
                            .
                          </span>
                        </div>
                      )}
                      {hasDiscountViolation && (
                        <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-amber-200">
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                          <span>
                            Termos como &ldquo;barato / relâmpago / OFF&rdquo;
                            ferem{' '}
                            <code className="text-amber-300">
                              [3.3 Regra Comercial]
                            </code>
                            .
                          </span>
                        </div>
                      )}
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-200">
                        <span className="block text-[11px] font-semibold text-emerald-300">
                          Reescrita sugerida no tom oficial [4.1]:
                        </span>
                        &ldquo;Nova safra recém-torrada para o seu ritual da
                        manhã. Benefício exclusivo para assinantes até
                        sexta-feira.&rdquo;
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/10 p-4 text-xs text-emerald-200">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <div>
                        <p className="font-semibold">
                          Texto aprovado pelo Guardião [4.1]!
                        </p>
                        <p className="mt-1 text-emerald-200/80">
                          Liberado para gerar a peça visual na paleta Creme
                          Papel #FBF8F3 + Terracota #9A4D26 [6.1].
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {simTab === 'approve' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#E5A952]">
                      <FileCheck2 className="h-3.5 w-3.5" />
                      Auditoria Visual Automática (Aba Aprovar)
                    </span>
                    <p className="text-xs text-zinc-400">
                      Alterne entre as peças abaixo para ver como a IA protege a
                      marca contra artes feitas fora do padrão:
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSimApproveVariant('fail')}
                      className={`rounded-full px-3.5 py-1.5 text-xs transition ${
                        simApproveVariant === 'fail'
                          ? 'border border-rose-500/40 bg-rose-500/20 text-rose-200'
                          : 'border border-white/10 text-zinc-400'
                      }`}
                    >
                      Peça com Desvios (4/10)
                    </button>
                    <button
                      onClick={() => setSimApproveVariant('pass')}
                      className={`rounded-full px-3.5 py-1.5 text-xs transition ${
                        simApproveVariant === 'pass'
                          ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-200'
                          : 'border border-white/10 text-zinc-400'
                      }`}
                    >
                      Peça Validada (10/10)
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      item: 'Versão do Logo [5.1]',
                      ok: true,
                      msg: 'Horizontal oficial aplicado sem distorção.',
                    },
                    {
                      item: 'Área de Proteção [5.2]',
                      ok: simApproveVariant === 'pass',
                      msg:
                        simApproveVariant === 'pass'
                          ? 'Margem livre 1x preservada nas bordas.'
                          : 'Texto colado no símbolo (invadiu respiro 1x).',
                    },
                    {
                      item: 'Paleta HEX [6.1]',
                      ok: simApproveVariant === 'pass',
                      msg:
                        simApproveVariant === 'pass'
                          ? 'Fundo #FBF8F3 e destaque #9A4D26 exatos.'
                          : 'Vermelho #E53935 proibido em [6.4].',
                    },
                    {
                      item: 'Tom de Voz [4.3]',
                      ok: simApproveVariant === 'pass',
                      msg:
                        simApproveVariant === 'pass'
                          ? 'Serena, clara e concisa.'
                          : 'Uso de "COMPRE JÁ!!!" bloqueado.',
                    },
                  ].map((chk) => (
                    <div
                      key={chk.item}
                      className={`rounded-2xl border p-4 text-xs ${
                        chk.ok
                          ? 'border-emerald-500/20 bg-emerald-500/[0.04]'
                          : 'border-rose-500/30 bg-rose-500/[0.06]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-medium text-white">
                        <span>{chk.item}</span>
                        {chk.ok ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-rose-400" />
                        )}
                      </div>
                      <p className="mt-2 text-zinc-400">{chk.msg}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {simTab === 'kits' && (
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    name: 'Design_Kit.zip',
                    items: 'Logos SVG/EPS, Fontes, Tokens e Manual',
                    mode: 'Streaming zip -0 · 0% CPU',
                  },
                  {
                    name: 'Media_Kit.zip',
                    items: 'Key Visuals em alta, Releases e Fotos',
                    mode: 'Streaming zip -0 · 0% CPU',
                  },
                  {
                    name: 'Full_Brand_Kit.zip',
                    items: 'Backup completo + Dossiê Markdown',
                    mode: 'Espelhado em Nuvem + Google Drive',
                  },
                ].map((k) => (
                  <div
                    key={k.name}
                    className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-black/50 p-6"
                  >
                    <div>
                      <span className="font-mono text-xs text-[#7C5CFF]">
                        {k.mode}
                      </span>
                      <h4 className="mt-2 text-base font-medium text-white">
                        {k.name}
                      </h4>
                      <p className="mt-1 text-xs text-zinc-400">{k.items}</p>
                    </div>
                    <a
                      href={`${DEMO_NODE_URL}/api/downloads/Design_Kit.zip`}
                      className="mt-5 inline-flex items-center justify-center rounded-full border border-white/15 py-2 text-xs text-white transition hover:bg-white hover:text-black"
                    >
                      Testar download real
                    </a>
                  </div>
                ))}
              </div>
            )}

            {simTab === 'site' && (
              <div className="grid gap-8 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-5">
                  <span className="text-xs text-[#E5A952]">
                    Edição Segura via IA + Rollback
                  </span>
                  <p className="text-xs leading-relaxed text-zinc-400">
                    O cliente pede uma mudança no chat, confirma a prévia e o
                    site institucional público é atualizado na hora sem quebrar
                    o layout da marca:
                  </p>
                  <div className="space-y-2">
                    {[
                      'Café especial recém-torrado, entregue no seu ritual da manhã.',
                      'Micro-lotes da Mantiqueira direto para o seu estúdio em 48h.',
                    ].map((title) => (
                      <button
                        key={title}
                        onClick={() => setSimHeroHeadline(title)}
                        className={`block w-full rounded-xl border px-3.5 py-2.5 text-left text-xs transition ${
                          simHeroHeadline === title
                            ? 'border-[#7C5CFF] bg-[#7C5CFF]/15 text-white'
                            : 'border-white/10 text-zinc-400 hover:border-white/25'
                        }`}
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-stone-300/20 bg-[#FBF8F3] p-8 text-[#1C1917] lg:col-span-7">
                  <div className="flex items-center justify-between text-[11px] opacity-60">
                    <span>auroracafe.com.br</span>
                    <span>Paleta Oficial Aplicada</span>
                  </div>
                  <h4 className="mt-6 font-editorial text-3xl leading-tight sm:text-4xl">
                    {simHeroHeadline}
                  </h4>
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#9A4D26] px-5 py-2.5 text-xs font-medium text-white">
                    Conhecer o Clube Aurora
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SEÇÃO INTERATIVA 2: ARQUITETURA ORBITAL BRANDCENTR */}
      <section
        id="arquitetura"
        className="relative scroll-mt-24 border-t border-white/[0.06] py-24"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#7C5CFF]">
              Arquitetura Proprietária
            </span>
            <h2 className="text-3xl font-light tracking-tight text-white sm:text-4xl">
              Tudo orbita ao redor da{' '}
              <span className="font-editorial italic text-[#E5A952]">
                verdade da marca
              </span>
              .
            </h2>
            <p className="text-xs text-zinc-400 sm:text-sm">
              Clique em cada camada ao redor do núcleo BrandCentr para explorar
              como o servidor dedicado opera.
            </p>
          </div>

          <div className="mt-12 grid items-center gap-8 lg:grid-cols-12">
            <div className="space-y-2.5 lg:col-span-5">
              {ORBIT_PILLARS.map((pillar) => {
                const active = pillar.id === selectedPillarId;
                return (
                  <button
                    key={pillar.id}
                    onClick={() => setSelectedPillarId(pillar.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all duration-300 ${
                      active
                        ? 'border-[#7C5CFF]/60 bg-[#7C5CFF]/10 shadow-[0_0_30px_rgba(124,92,255,0.12)]'
                        : 'border-white/[0.07] bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={`font-mono text-xs ${
                          active ? 'text-[#E5A952]' : 'text-zinc-600'
                        }`}
                      >
                        {pillar.code}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {pillar.title}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {pillar.domain}
                        </div>
                      </div>
                    </div>
                    <ArrowRight
                      className={`h-4 w-4 transition-transform ${
                        active ? 'translate-x-0.5 text-white' : 'text-zinc-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/[0.1] bg-gradient-to-br from-[#121218] to-[#0A0A0D] p-8 sm:p-10 lg:col-span-7">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BrandCentrMark size={32} tone="light" />
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-[#E5A952]">
                      Camada {selectedPillar.code}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {selectedPillar.domain}
                    </span>
                  </div>
                </div>
                <Layers className="h-5 w-5 text-zinc-600" />
              </div>

              <h3 className="font-editorial text-3xl leading-snug text-white sm:text-4xl">
                {selectedPillar.headline}
              </h3>

              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                {selectedPillar.detail}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {selectedPillar.specs.map((sp) => (
                  <div
                    key={sp}
                    className="rounded-xl border border-white/[0.08] bg-black/50 px-3.5 py-3 text-xs text-zinc-200"
                  >
                    <Check className="mb-1.5 h-3.5 w-3.5 text-emerald-400" />
                    {sp}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: COMPARATIVO INTERATIVO */}
      <section
        id="comparativo"
        className="scroll-mt-24 border-t border-white/[0.06] py-24"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                Posicionamento
              </span>
              <h2 className="mt-2 text-3xl font-light text-white sm:text-4xl">
                A diferença entre entregar arquivos e{' '}
                <span className="font-editorial italic text-[#E5A952]">
                  entregar uma marca blindada
                </span>
                .
              </h2>
            </div>

            <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs">
              <button
                onClick={() => setCompareFocus('brandcentr')}
                className={`rounded-full px-4 py-1.5 transition ${
                  compareFocus === 'brandcentr'
                    ? 'bg-white font-medium text-black'
                    : 'text-zinc-400'
                }`}
              >
                Com BrandCentr
              </button>
              <button
                onClick={() => setCompareFocus('comum')}
                className={`rounded-full px-4 py-1.5 transition ${
                  compareFocus === 'comum'
                    ? 'bg-white font-medium text-black'
                    : 'text-zinc-400'
                }`}
              >
                Entrega Comum
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div
              className={`rounded-3xl border p-8 transition duration-300 ${
                compareFocus === 'comum'
                  ? 'border-rose-500/40 bg-rose-500/[0.05]'
                  : 'border-white/[0.06] bg-[#0B0B0E] opacity-70'
              }`}
            >
              <span className="text-xs uppercase tracking-wider text-zinc-400">
                Modelo Tradicional (Drive + PDF)
              </span>
              <ul className="mt-6 space-y-4 text-xs text-zinc-300">
                <li>✕ PDF de manual esquecido na caixa de entrada</li>
                <li>
                  ✕ Links do Google Drive expirados ou com versões duplicadas
                </li>
                <li>✕ Peças publicadas com cores erradas e logo distorcido</li>
                <li>
                  ✕ Site antigo no ar sem conversar com a nova identidade
                </li>
                <li>✕ Sem controle contínuo nem backup gerenciado</li>
              </ul>
            </div>

            <div
              className={`rounded-3xl border p-8 transition duration-300 ${
                compareFocus === 'brandcentr'
                  ? 'border-[#7C5CFF]/50 bg-gradient-to-b from-[#14131D] to-[#0B0B0F] shadow-[0_0_50px_rgba(124,92,255,0.12)]'
                  : 'border-white/[0.06] bg-[#0B0B0E] opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <BrandCentrLogo size={20} tone="light" />
                <span className="rounded-full bg-[#7C5CFF]/20 px-3 py-0.5 text-[11px] text-[#C8BAFF]">
                  Padrão BrandCentr
                </span>
              </div>
              <ul className="mt-6 space-y-4 text-xs text-zinc-200">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Site institucional novo no ar substituindo o antigo
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Portal privado{' '}
                  <code className="text-zinc-400">marca.dominio.com.br</code> com
                  collab
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Abas Criar &amp; Aprovar com auditoria por IA e citações exatas
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Downloads instantâneos em .zip e backup em 3 camadas
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Infraestrutura dedicada e sempre atualizada no seu domínio
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 4: FAQ ACORDEÃO INTERATIVO */}
      <section
        id="faq"
        className="scroll-mt-24 border-t border-white/[0.06] py-24"
      >
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Dúvidas Frequentes
            </span>
            <h2 className="mt-2 text-3xl font-light text-white">
              Transparência técnica e comercial.
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D0D11]"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-sm font-medium text-white transition hover:bg-white/[0.02]"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-white/[0.06] px-6 py-4 text-xs leading-relaxed text-zinc-400">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO 5: ACESSO PARA CLIENTES (SEM EXPOR O COMMAND PUBLICAMENTE) */}
      <section
        id="acesso"
        className="scroll-mt-24 border-t border-white/[0.06] py-24"
      >
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-3xl border border-white/[0.1] bg-[#0E0E13] p-8 sm:p-10">
            <div className="flex items-center gap-2 text-xs text-[#E5A952]">
              <Globe className="h-4 w-4" />
              Portal Exclusivo
            </div>
            <h3 className="mt-2 text-2xl font-light text-white sm:text-3xl">
              Acesse o BrandCentr da sua empresa
            </h3>
            <p className="mt-2 text-xs text-zinc-400">
              Digite o domínio da sua marca abaixo ou clique em{' '}
              <strong className="font-medium text-white">Entrar</strong> no topo
              para fazer login com seu e-mail.
            </p>

            <form
              onSubmit={handleCustomDomainGo}
              className="mt-6 flex flex-wrap gap-2.5"
            >
              <input
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="Ex: auroracafe.com.br"
                className="flex-1 rounded-full border border-white/15 bg-black/70 px-5 py-3 text-xs text-white outline-none focus:border-[#7C5CFF]"
              />
              <button
                type="submit"
                className="rounded-full bg-white px-6 py-3 text-xs font-semibold text-black transition hover:bg-zinc-200"
              >
                Acessar Marca →
              </button>
            </form>

            {brands.length > 0 && (
              <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                {brands.map((b) => (
                  <a
                    key={b.id}
                    href={b.portal_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/50 px-4 py-3 text-xs transition hover:border-white/25"
                  >
                    <div>
                      <p className="font-medium text-white">{b.brand_name}</p>
                      <p className="text-[11px] text-zinc-500">
                        marca.{b.root_domain}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-zinc-500" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* RODAPÉ LIMPO (SEM LINK OU MENÇÃO AO COMMAND) */}
      <footer className="border-t border-white/[0.06] bg-[#060608] py-14">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6">
          <div className="space-y-2">
            <BrandCentrLogo size={24} tone="light" />
            <p className="text-xs text-zinc-500">
              O Futuro das Marcas · Infraestrutura viva de Branding &amp; IA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-zinc-400">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="hover:text-white"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* MODAL ÚNICO DE LOGIN (IDENTIFICA AUTOMATICAMENTE SE É CLIENTE OU ADMINISTRADOR) */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#111116] p-7 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <BrandCentrLogo size={20} tone="light" />
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-5 space-y-1">
              <h3 className="text-base font-medium text-white">
                Entrar no BrandCentr
              </h3>
              <p className="text-xs text-zinc-400">
                Informe seu e-mail de acesso (ou o domínio da sua marca) para entrar.
              </p>
            </div>

            <form onSubmit={handleUnifiedLogin} className="space-y-3 text-xs">
              <input
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="E-mail ou domínio (ex: auroracafe.com.br)"
                className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none focus:border-[#7C5CFF]"
              />
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Senha (se aplicável)"
                className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none focus:border-[#7C5CFF]"
              />

              {loginError && (
                <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-rose-300">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full rounded-full bg-white py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {loggingIn ? 'Verificando...' : 'Continuar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
