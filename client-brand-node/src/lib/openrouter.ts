import { getOpenRouterPlainKey, readNodeDb, updateSettings, writeNodeDb } from './store';
import type {
  BrandApprovalItem,
  ComplianceCheckItem,
  CreationPrecheckResult,
  PublicSiteContent,
} from './types';

export interface OpenRouterGuardError {
  aiPaused: true;
  reason: 'missing_key' | 'credits_exhausted' | 'invalid_key';
  message: string;
}

function getKeyOrThrowGuard(allowDemoFallback: boolean): string | null {
  const key = getOpenRouterPlainKey();
  if (!key) {
    if (allowDemoFallback) return null;
    const err: OpenRouterGuardError = {
      aiPaused: true,
      reason: 'missing_key',
      message:
        'Chave OpenRouter do cliente não configurada. Configure na aba "Backups & Chave IA" (site e downloads continuam funcionando normalmente).',
    };
    throw err;
  }
  return key;
}

async function openRouterChat(
  apiKey: string,
  model: string,
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  }>,
  responseJson = false
): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': `https://marca.${process.env.DOMAIN || 'brandhub.local'}`,
      'X-Title': 'Brand AI Hub',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      ...(responseJson ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(45000),
  });

  if (res.status === 402) {
    updateSettings({
      openrouter_credits_exhausted: true,
      openrouter_last_error: 'Créditos OpenRouter esgotados (HTTP 402).',
    });
    const err: OpenRouterGuardError = {
      aiPaused: true,
      reason: 'credits_exhausted',
      message:
        'Seus créditos no OpenRouter acabaram (HTTP 402). A IA foi pausada até a recarga, mas seu site institucional e os downloads de ativos continuam no ar.',
    };
    throw err;
  }

  if (res.status === 401 || res.status === 403) {
    updateSettings({
      openrouter_last_error: `Chave OpenRouter inválida ou revogada (HTTP ${res.status}).`,
    });
    const err: OpenRouterGuardError = {
      aiPaused: true,
      reason: 'invalid_key',
      message:
        'Chave OpenRouter inválida ou sem permissão. Verifique sua chave na aba "Backups & Chave IA".',
    };
    throw err;
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenRouter HTTP ${res.status}: ${txt.slice(0, 200)}`);
  }

  updateSettings({
    openrouter_credits_exhausted: false,
    openrouter_last_error: null,
  });

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content || '';
}

function extractCitations(text: string): string[] {
  const matches = text.match(/\[[0-9]+\.[0-9]+[^\]]*\]/g) || [];
  return Array.from(new Set(matches));
}

function buildDossierSystemPrompt(dossier: string): string {
  return `Você é o **Guardião Oficial da Marca**, conectado ao Dossiê Oficial numerado abaixo.

REGRAS INVIOLÁVEIS:
1. Responda ESTRITAMENTE com base no dossiê abaixo. Nunca invente regras, preços, cores ou afirmações que não estejam escritas.
2. Em TODA resposta, cite explicitamente as seções consultadas entre colchetes, exatamente como aparecem no dossiê (ex: [4.1 Personalidade Verbal], [5.2 Área de Proteção], [6.1 Cores Primárias]).
3. Se uma informação não estiver no dossiê, diga claramente: "Essa definição não consta nas diretrizes atuais do Dossiê da Marca; recomendo consultar o designer responsável [12.2 Escalonamento para o Designer]."
4. Se o usuário pedir para alterar textos ou cores do site público, NÃO aplique automaticamente: proponha o novo valor no formato JSON dentro de um bloco \`\`\`site_patch ... \`\`\` e peça confirmação explícita antes de salvar.

=== DOSSIÊ OFICIAL DA MARCA ===
${dossier}
=== FIM DO DOSSIÊ ===`;
}

export async function runBrandGuardianChat(params: {
  userMessage: string;
  simulationMode?: boolean;
}): Promise<{
  reply: string;
  citations: string[];
  proposedSitePatch: Partial<PublicSiteContent> | null;
  simulated: boolean;
}> {
  const db = readNodeDb();
  const apiKey = getKeyOrThrowGuard(Boolean(params.simulationMode));

  // Detecta pedido de edição do site público
  const lower = params.userMessage.toLowerCase();
  const wantsSiteEdit =
    lower.includes('site') &&
    (lower.includes('mude') ||
      lower.includes('altere') ||
      lower.includes('atualize') ||
      lower.includes('troque') ||
      lower.includes('título') ||
      lower.includes('hero'));

  if (!apiKey) {
    // Modo demonstração / simulação determinística ancorada no dossiê real
    let reply = '';
    let proposedPatch: Partial<PublicSiteContent> | null = null;

    if (wantsSiteEdit) {
      proposedPatch = {
        hero_title:
          'Café especial recém-torrado em pequenos lotes, direto para o seu ritual da manhã.',
      };
      reply =
        'Preparei uma sugestão de atualização para o **site público** seguindo o tom de voz caloroso e claro de `[4.1 Personalidade Verbal]` e a proposta de valor `[2.3 Proposta de Valor Única]`.\n\n**Prévia da alteração proposta:**\n- `hero_title`: *"Café especial recém-torrado em pequenos lotes, direto para o seu ritual da manhã."*\n\nNenhuma alteração foi aplicada ainda. Clique em **Confirmar Alteração no Site** abaixo para publicar.';
    } else if (lower.includes('cor') || lower.includes('paleta') || lower.includes('hex')) {
      reply =
        'A paleta oficial da marca é composta por:\n- **Terracota Cobre:** `#9A4D26` (destaques e CTAs) `[6.1 Cores Primárias]`\n- **Carvão Torra:** `#1C1917` (textos e fundos escuros) `[6.1 Cores Primárias]`\n- **Creme Papel:** `#FBF8F3` (fundo principal, 60% da composição) `[6.1 Cores Primárias]` `[6.3 Proporção de Uso]`\n- **Apoio:** Verde Folha `#2D3A2E`, Dourado Mel `#D49B4B` e Areia Suave `#EAE2D6` `[6.2 Cores Secundárias e de Apoio]`.\n\nAtenção: nunca utilize vermelho vivo (`#FF0000`) ou neon `[6.4 Combinações Proibidas]`.';
    } else if (lower.includes('logo') || lower.includes('tamanho') || lower.includes('margem')) {
      reply =
        'Para uso do logotipo:\n- **Versões:** Horizontal (padrão), Vertical/Empilhada e Monograma (espaços < 80px) `[5.1 Versões Oficiais do Logo]`.\n- **Área de Proteção:** Preserve margem livre mínima de `1x` (altura da letra "A") em todos os lados `[5.2 Área de Proteção]`.\n- **Tamanho Mínimo:** `120 px` no digital (`32 px` para monograma) e `30 mm` no impresso `[5.3 Tamanho Mínimo]`.';
    } else if (lower.includes('tom') || lower.includes('texto') || lower.includes('promo')) {
      reply =
        'O tom de voz deve ser **caloroso, claro e conciso** `[4.1 Personalidade Verbal]`. Evite termos como "liquidação", caixa alta agressiva (`COMPRE AGORA!!!`) ou múltiplas exclamações `[4.3 Lista Negra / O Que NUNCA Dizer]` `[3.3 Regra Comercial de Descontos]`. Prefira expressões como *"Convite de Safra"* ou *"Benefício de Assinante"*.';
    } else {
      reply =
        'Consultei o **Dossiê Oficial da Marca** `[0.1 Nome da Marca]`: nossa essência busca transformar a pausa do café em presença e clareza `[1.1 Propósito]`, com cafés rastreados entregues em até 48h após a torra `[1.2 Missão]`. Pergunte sobre **paleta de cores**, **regras de logo**, **tom de voz**, **Key Visuals** ou peça para editar o **site público**.';
    }

    db.settings.ai_messages_count += 1;
    writeNodeDb(db);
    return {
      reply,
      citations: extractCitations(reply),
      proposedSitePatch: proposedPatch,
      simulated: true,
    };
  }

  const systemPrompt = buildDossierSystemPrompt(db.brand_dossier);
  const recentHistory = db.chat_history.slice(-8).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const rawReply = await openRouterChat(apiKey, db.settings.selected_model, [
    { role: 'system', content: systemPrompt },
    ...recentHistory,
    { role: 'user', content: params.userMessage },
  ]);

  let proposedSitePatch: Partial<PublicSiteContent> | null = null;
  const patchMatch = rawReply.match(/```site_patch\s*([\s\S]*?)```/);
  if (patchMatch?.[1]) {
    try {
      proposedSitePatch = JSON.parse(patchMatch[1]) as Partial<PublicSiteContent>;
    } catch {
      proposedSitePatch = null;
    }
  }

  db.settings.ai_messages_count += 1;
  writeNodeDb(db);

  return {
    reply: rawReply.replace(/```site_patch[\s\S]*?```/g, '').trim(),
    citations: extractCitations(rawReply),
    proposedSitePatch,
    simulated: false,
  };
}

/**
 * Aba CRIAÇÕES — Passo 1: Pré-Verificador de Intenção, Texto e Briefing
 * Economiza tokens de imagem validando e corrigindo tudo ANTES de gerar a peça.
 */
export async function precheckCreationBrief(params: {
  piece_type: string;
  intention: string;
  draft_copy: string;
  visual_idea: string;
  simulationMode?: boolean;
}): Promise<{ result: CreationPrecheckResult; simulated: boolean }> {
  const db = readNodeDb();
  const apiKey = getKeyOrThrowGuard(Boolean(params.simulationMode));

  if (!apiKey) {
    const warnings: string[] = [];
    const citations: string[] = [
      '[4.1 Personalidade Verbal]',
      '[6.1 Cores Primárias]',
      '[9.1 KV-01 — Campanha "Ritual da Manhã"]',
    ];
    let score = 9;

    if (/[A-ZÁÉÍÓÚÇ]{5,}/.test(params.draft_copy) || /!{2,}/.test(params.draft_copy)) {
      warnings.push(
        'Detectada caixa alta agressiva ou múltiplas exclamações — proibido em [4.3 Lista Negra].'
      );
      citations.push('[4.3 Lista Negra / O Que NUNCA Dizer]');
      score -= 3;
    }
    if (/liquida|queima|barato|imperd[ií]vel|compre j[aá]/i.test(params.draft_copy)) {
      warnings.push(
        'Termos promocionais agressivos ("liquidação/imperdível/compre já") contrariam [3.3 Regra Comercial de Descontos].'
      );
      citations.push('[3.3 Regra Comercial de Descontos]');
      score -= 2;
    }
    if (/vermelho|neon|azul el[eé]trico/i.test(params.visual_idea)) {
      warnings.push(
        'A ideia visual cita cor proibida em [6.4 Combinações Proibidas]. Substituído por Terracota Cobre #9A4D26 e Creme Papel #FBF8F3.'
      );
      citations.push('[6.4 Combinações Proibidas]');
      score -= 2;
    }

    const cleanTopic = params.draft_copy.trim() || params.intention.trim();
    const result: CreationPrecheckResult = {
      approved_to_generate: true,
      tone_score: Math.max(2, score),
      warnings,
      citations: Array.from(new Set(citations)),
      refined_copy_options: [
        `A primeira clareza do dia: ${cleanTopic.replace(/!+/g, '.').slice(0, 90)}`,
        `Nova safra recém-torrada para o seu ritual da manhã. Condição especial para assinantes até sexta-feira.`,
        `Menos pressa, mais aroma. Conheça os detalhes da nossa curadoria artesanal.`,
      ],
      recommended_palette: [
        { name: 'Creme Papel (Fundo 60%)', hex: '#FBF8F3', role: 'Fundo principal' },
        { name: 'Carvão Torra (25%)', hex: '#1C1917', role: 'Tipografia e molduras' },
        { name: 'Terracota Cobre (15%)', hex: '#9A4D26', role: 'Destaque e CTA' },
        { name: 'Dourado Mel', hex: '#D49B4B', role: 'Linhas finas de acento' },
      ],
      layout_rules: [
        'Preservar margem interna mínima de 80 px nas laterais [10.1 Redes Sociais].',
        'Manter área superior limpa (40%) para título em Cormorant Garamond [9.1 KV-01].',
        'Respeitar área de proteção 1x ao redor do logotipo [5.2 Área de Proteção].',
      ],
      optimized_visual_prompt: `Editorial minimalist brand visual for Aurora Café (${params.piece_type}). Morning natural sunlight, warm cream background #FBF8F3, charcoal serif typography #1C1917, copper terracotta accent #9A4D26, artisan ceramic pour-over coffee on light oak table. Objective: ${params.intention}. No aggressive badges or neon colors.`,
      tokens_saved_note:
        'Pré-verificação concluída antes da geração visual: texto, paleta e composição alinhados ao dossiê para evitar retrabalho de tokens de imagem.',
    };

    db.settings.ai_messages_count += 1;
    writeNodeDb(db);
    return { result, simulated: true };
  }

  const prompt = `Analise o briefing abaixo ANTES de gerar qualquer imagem, para economizar tokens e garantir 100% de aderência ao dossiê.
Formato da peça: ${params.piece_type}
Intenção/Objetivo: ${params.intention}
Rascunho do que o cliente quer escrito: ${params.draft_copy}
Ideia visual informada: ${params.visual_idea}

Retorne APENAS um JSON válido com estas chaves exatas:
{
  "approved_to_generate": boolean,
  "tone_score": number (0 a 10),
  "warnings": string[],
  "citations": string[] (ex: ["[4.3 Lista Negra]", "[6.1 Cores Primárias]"]),
  "refined_copy_options": string[] (3 opções no tom exato da marca),
  "recommended_palette": [{ "name": string, "hex": string, "role": string }],
  "layout_rules": string[],
  "optimized_visual_prompt": string,
  "tokens_saved_note": string
}`;

  const raw = await openRouterChat(
    apiKey,
    db.settings.selected_model,
    [
      { role: 'system', content: buildDossierSystemPrompt(db.brand_dossier) },
      { role: 'user', content: prompt },
    ],
    true
  );

  const parsed = JSON.parse(raw) as CreationPrecheckResult;
  db.settings.ai_messages_count += 1;
  writeNodeDb(db);
  return { result: parsed, simulated: false };
}

/**
 * Gera preview SVG fiel à paleta/tipografia da marca (ou chama OpenRouter image model se suportado)
 */
export function buildBrandStyledSvgPreview(params: {
  brandName: string;
  headline: string;
  subline: string;
  pieceType: string;
  primaryHex: string;
  bgHex: string;
  darkHex: string;
  accentHex: string;
}): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const isStory = params.pieceType.toLowerCase().includes('storie');
  const width = 900;
  const height = isStory ? 1350 : 1080;
  const words = params.headline.trim().split(/\s+/);
  const line1 = words.slice(0, 5).join(' ');
  const line2 = words.slice(5, 11).join(' ');
  const line3 = words.slice(11, 18).join(' ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${params.bgHex}"/>
  <rect x="64" y="64" width="${width - 128}" height="${height - 128}" fill="none" stroke="${params.darkHex}" stroke-width="2"/>
  <circle cx="${width - 210}" cy="${height - 260}" r="145" fill="${params.primaryHex}" opacity="0.16"/>
  <circle cx="${width - 210}" cy="${height - 260}" r="90" fill="${params.primaryHex}"/>
  <path d="M${width - 285} ${height - 250} Q${width - 210} ${height - 335} ${width - 135} ${height - 250}" fill="none" stroke="${params.bgHex}" stroke-width="6"/>
  <text x="110" y="150" font-family="Arial, sans-serif" font-size="22" letter-spacing="4" fill="${params.primaryHex}">${esc(params.pieceType.toUpperCase())}</text>
  <line x1="110" y1="180" x2="260" y2="180" stroke="${params.accentHex}" stroke-width="3"/>
  <text x="110" y="290" font-family="Georgia, serif" font-size="58" font-weight="600" fill="${params.darkHex}">${esc(line1)}</text>
  ${line2 ? `<text x="110" y="365" font-family="Georgia, serif" font-size="58" font-style="italic" fill="${params.primaryHex}">${esc(line2)}</text>` : ''}
  ${line3 ? `<text x="110" y="440" font-family="Georgia, serif" font-size="48" fill="${params.darkHex}">${esc(line3)}</text>` : ''}
  <text x="110" y="${height - 210}" font-family="Arial, sans-serif" font-size="26" fill="${params.darkHex}" opacity="0.85">${esc(params.subline.slice(0, 62))}</text>
  <rect x="110" y="${height - 155}" width="290" height="44" rx="22" fill="${params.primaryHex}"/>
  <text x="255" y="${height - 126}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="${params.bgHex}">${esc(params.brandName.toUpperCase())}</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}

/**
 * Aba APROVAÇÕES — Verificador de Conformidade Visual + Texto contra o Dossiê
 */
export async function verifyBrandPiece(params: {
  title: string;
  piece_type: string;
  image_data_url?: string;
  piece_text?: string;
  simulationMode?: boolean;
}): Promise<{
  overall_score: number;
  decision: BrandApprovalItem['decision'];
  summary: string;
  checklist: ComplianceCheckItem[];
  simulated: boolean;
}> {
  const db = readNodeDb();
  const apiKey = getKeyOrThrowGuard(Boolean(params.simulationMode));

  if (!apiKey) {
    const txt = `${params.title} ${params.piece_text || ''}`.toLowerCase();
    const hasForbiddenText =
      /compre|rel[aâ]mpago|imperd[ií]vel|liquida|!!!/.test(txt);
    const hasBadColorHint = /vermelho|neon|roxo|azul/.test(txt);

    const checklist: ComplianceCheckItem[] = [
      {
        criterion: 'Logotipo & Versão Aplicada',
        status: 'pass',
        citation: '[5.1 Versões Oficiais do Logo]',
        finding: 'Versão e proporção do símbolo compatíveis com a aplicação.',
      },
      {
        criterion: 'Área de Proteção & Margens',
        status: hasForbiddenText ? 'warning' : 'pass',
        citation: '[5.2 Área de Proteção] & [10.1 Redes Sociais]',
        finding: hasForbiddenText
          ? 'Texto próximo da borda pode invadir a margem livre de 1x / 80px.'
          : 'Respiro lateral e área de proteção respeitados.',
        recommendation: hasForbiddenText
          ? 'Afastar o texto principal das extremidades garantindo respiro mínimo.'
          : undefined,
      },
      {
        criterion: 'Paleta de Cores (HEX)',
        status: hasBadColorHint ? 'fail' : 'pass',
        citation: '[6.1 Cores Primárias] & [6.4 Combinações Proibidas]',
        finding: hasBadColorHint
          ? 'Detectada referência a cor fora da paleta oficial (ex: vermelho vivo ou neon).'
          : 'Uso aderente à tríade Creme Papel #FBF8F3, Carvão #1C1917 e Terracota #9A4D26.',
        recommendation: hasBadColorHint
          ? 'Substituir imediatamente pelo Terracota Cobre #9A4D26 ou Verde Folha #2D3A2E.'
          : undefined,
      },
      {
        criterion: 'Tipografia & Hierarquia',
        status: 'pass',
        citation: '[7.1 Fonte Display] & [7.4 Regras de Hierarquia]',
        finding: 'Hierarquia editorial serifada + sans-serif legível e equilibrada.',
      },
      {
        criterion: 'Tom de Voz & Mensagem',
        status: hasForbiddenText ? 'fail' : 'pass',
        citation: '[4.1 Personalidade Verbal] & [4.3 Lista Negra]',
        finding: hasForbiddenText
          ? 'Texto contém apelo agressivo/exclamações múltiplas vetadas no dossiê.'
          : 'Linguagem serena, calorosa e alinhada ao território da marca.',
        recommendation: hasForbiddenText
          ? 'Reescrever utilizando a aba Criações para adequação automática ao tom de voz.'
          : undefined,
      },
    ];

    const fails = checklist.filter((c) => c.status === 'fail').length;
    const warns = checklist.filter((c) => c.status === 'warning').length;
    const score = Math.max(2, 10 - fails * 3 - warns * 1);

    db.settings.ai_messages_count += 1;
    writeNodeDb(db);

    return {
      overall_score: score,
      decision: fails > 0 ? 'revision_requested' : 'approved',
      summary:
        fails > 0
          ? 'Peça necessita ajustes antes de ir ao ar. Verifique os itens sinalizados abaixo ou acione o designer [12.2].'
          : 'Peça em conformidade com o Manual da Marca e pronta para aprovação final.',
      checklist,
      simulated: true,
    };
  }

  const contentParts: Array<{
    type: string;
    text?: string;
    image_url?: { url: string };
  }> = [
    {
      type: 'text',
      text: `Audite esta peça de marketing contra o Dossiê Oficial da Marca.
Título da peça: ${params.title}
Formato: ${params.piece_type}
Texto presente na peça / contexto: ${params.piece_text || 'Analisar pela imagem'}

Retorne APENAS JSON válido neste formato:
{
  "overall_score": number (0 a 10),
  "decision": "approved" | "revision_requested" | "rejected",
  "summary": string,
  "checklist": [
    {
      "criterion": string,
      "status": "pass" | "warning" | "fail",
      "citation": string (seção do dossiê ex: "[5.2 Área de Proteção]"),
      "finding": string,
      "recommendation": string
    }
  ]
}`,
    },
  ];

  if (
    params.image_data_url &&
    (params.image_data_url.startsWith('data:image/png') ||
      params.image_data_url.startsWith('data:image/jpeg') ||
      params.image_data_url.startsWith('data:image/webp') ||
      params.image_data_url.startsWith('http'))
  ) {
    contentParts.push({
      type: 'image_url',
      image_url: { url: params.image_data_url },
    });
  }

  const raw = await openRouterChat(
    apiKey,
    db.settings.selected_model,
    [
      { role: 'system', content: buildDossierSystemPrompt(db.brand_dossier) },
      { role: 'user', content: contentParts },
    ],
    true
  );

  const parsed = JSON.parse(raw) as {
    overall_score: number;
    decision: BrandApprovalItem['decision'];
    summary: string;
    checklist: ComplianceCheckItem[];
  };

  db.settings.ai_messages_count += 1;
  writeNodeDb(db);

  return { ...parsed, simulated: false };
}
