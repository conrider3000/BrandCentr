import fs from 'fs';
import path from 'path';

export const FALLBACK_BRAND_DOSSIER = `# Dossiê Oficial da Marca — Aurora Café & Torrefação Artesanal

## 0. Metadados do Projeto
- **[0.1] Nome da Marca:** Aurora Café & Torrefação Artesanal
- **[0.2] Domínio Oficial:** auroracafe.com.br
- **[0.3] Versão do Dossiê:** v2.0 (Atualizado em 2026)
- **[0.4] Designer / Agência Responsável:** Estúdio Brand AI
- **[0.5] Contato de Suporte de Marca:** branding@auroracafe.com.br

## 1. Essência da Marca
- **[1.1] Propósito:** Transformar a pausa do café em um ritual diário de presença, clareza e conexão humana.
- **[1.2] Missão:** Torrar cafés especiais brasileiros em pequenos lotes, com rastreabilidade de origem e entrega fresca em até 48h após a torra.
- **[1.3] Visão:** Ser a principal referência nacional em cafés especiais de assinatura para profissionais criativos e empresas que valorizam hospitalidade.
- **[1.4] Valores Inegociáveis:** Transparência de origem (fazenda, altitude, produtor), respeito ao tempo e estética funcional sem excessos.
- **[1.5] História Resumida:** Fundada em 2022 em Minas Gerais para descomplicar o café especial — tirando o elitismo técnico e trazendo clareza sensorial.

## 2. Estratégia & Posicionamento
- **[2.1] Público-Alvo Primário:** Profissionais de 25 a 48 anos, designers, arquitetos, empreendedores e escritórios boutique.
- **[2.2] Público-Alvo Secundário (B2B):** Restaurantes, estúdios, hotéis boutique e clínicas premium.
- **[2.3] Proposta de Valor Única:** Café especial recém-torrado com curadoria clara, embalagem colecionável e entrega recorrente pontual.
- **[2.4] Território de Posicionamento:** "Sofisticação acolhedora da manhã". Nunca frios/corporativos nem caricatos/rústicos.
- **[2.5] Diferenciais Competitivos:** Data da torra estampada na frente da embalagem e guia visual de preparo em 3 passos.

## 3. Modelagem de Negócio
- **[3.1] Linhas de Produto:** Clube Aurora (Assinatura), Edições Micro-Lote e Aurora Office (B2B).
- **[3.2] Canais de Venda:** E-commerce próprio (auroracafe.com.br), empórios selecionados e atendimento consultivo via WhatsApp.
- **[3.3] Regra Comercial de Descontos:** Nunca usar linguagem de "liquidação", "queima de estoque" ou "barato". Usar "Convite de Safra", "Benefício de Assinante" ou "Edição de Aniversário".

## 4. Identidade Verbal & Tom de Voz
- **[4.1] Personalidade Verbal:** Calorosa e Serena; Clara e Didática; Segura e Concisa.
- **[4.2] Vocabulário Recomendado:** Ritual, origem, safra, recém-torrado, notas de, pausa, aroma, encontro, artesanal, curadoria.
- **[4.3] Lista Negra / O Que NUNCA Dizer:** Proibido caixa alta agressiva (ex: "COMPRE AGORA!!!", "IMPERDÍVEL", "ÚLTIMA CHANCE"), múltiplos pontos de exclamação ("!!" ou "!!!"), gírias forçadas ("bora", "topzera", "baratíssimo") ou promessas medicinais.
- **[4.4] Exemplos Certo vs. Errado:** Errado: "PROMOÇÃO RELÂMPAGO!! Café gourmet top!!". Certo: "A nova safra da Serra da Mantiqueira acabou de sair do torrador. Assinantes têm condição especial até sexta-feira."
- **[4.5] Taglines Oficiais:** Principal: "A primeira clareza do dia." | Secundária: "Café especial, sem complicação."

## 5. Diretrizes de Logotipo
- **[5.1] Versões Oficiais do Logo:** Principal (Horizontal: sol nascente à esquerda + AURORA CAFÉ), Secundária (Vertical/Empilhada) e Monograma (apenas o sol nascente para espaços < 80 px).
- **[5.2] Área de Proteção:** Margem livre mínima equivalente à altura da letra "A" (1x) em todos os quatro lados. Nenhum texto ou selo pode invadir essa área.
- **[5.3] Tamanho Mínimo:** Digital: 120 px de largura (horizontal) e 32 px (monograma). Impresso: 30 mm (horizontal).
- **[5.4] Fundos Permitidos:** Fundo #FBF8F3 ou #FFFFFF -> logo em #1C1917 ou #9A4D26. Fundo #1C1917 ou #2D3A2E -> logo exclusivamente em #FBF8F3.
- **[5.5] Usos Proibidos:** Distorcer/esticar, aplicar drop shadow ou contorno, rotacionar o logotipo ou aplicar sem contraste WCAG AA (4.5:1).

## 6. Paleta de Cores Oficial
- **[6.1] Cores Primárias:** Terracota Cobre (#9A4D26 | RGB 154,77,38 | CMYK 20,75,90,15 | Pantone 7580 C); Carvão Torra (#1C1917 | RGB 28,25,23 | CMYK 70,65,65,80); Creme Papel (#FBF8F3 | RGB 251,248,243).
- **[6.2] Cores Secundárias e de Apoio:** Verde Folha (#2D3A2E | RGB 45,58,46); Dourado Mel (#D49B4B | RGB 212,155,75); Areia Suave (#EAE2D6 | RGB 234,226,214).
- **[6.3] Proporção de Uso:** 60% #FBF8F3, 25% #1C1917, 15% #9A4D26 / #D49B4B.
- **[6.4] Combinações Proibidas:** Nunca usar vermelho vivo (#FF0000 / #E53935), neon, azul elétrico ou rosa choque; nunca colocar texto #9A4D26 sobre fundo #2D3A2E.

## 7. Tipografia
- **[7.1] Fonte Display / Títulos:** Cormorant Garamond (ou Playfair Display), pesos 400, 600 e Italic.
- **[7.2] Fonte de Apoio / Corpo:** Plus Jakarta Sans (ou Inter), pesos 400, 500, 700.
- **[7.3] Fonte Substituta de Escritório:** Georgia (títulos) + Calibri/Arial (textos).
- **[7.4] Regras de Hierarquia:** Títulos curtos (máximo 8 palavras) e line-height mínimo de 1.4.

## 8. Elementos Visuais & Fotografia
- **[8.1] Direção Fotográfica:** Luz natural da manhã, sombras suaves e quentes, foco em textura de grãos, cerâmica artesanal ou vidro limpo.
- **[8.2] Proibições Fotográficas:** Proibido banco de imagem corporativo artificial ou xícaras com espuma exagerada.
- **[8.3] Grafismos:** Linhas finas de 1px em #1C1917 ou #D49B4B e cantos sutis (8px).

## 9. Fichas Técnicas de Key Visuals (KVs)
- **[9.1] KV-01 — Campanha "Ritual da Manhã":** 40% área superior limpa para título em Cormorant Garamond, produto no terço inferior direito, paleta #FBF8F3 + #9A4D26 + #D49B4B. Formatos: Feed 4:5 (1080x1350), Stories 9:16 (1080x1920), Banner 16:9.
- **[9.2] KV-02 — Selo de Origem e Micro-Lote:** Rótulo minimalista sobre #2D3A2E ou #FBF8F3 com moldura fina #1C1917, exibindo Região, Altitude, 3 Notas Sensoriais e Variedade.

## 10. Aplicações & Templates
- **[10.1] Redes Sociais:** Margem interna mínima de 80 px nas laterais em peças de 1080 px; logo no rodapé central ou canto superior esquerdo.
- **[10.2] Site Institucional:** Botão CTA principal em #9A4D26 com texto #FBF8F3.
- **[10.3] Impressos:** CMYK, 300 DPI, sangria de 3 mm.

## 11. Perguntas Frequentes & Decisões
- **[11.1] Uso de Emojis:** Moderado (máximo 1–2 por legenda, preferindo ☕, ☀️, ✨). Proibido 🚨, 🔥🔥🔥, 😱.
- **[11.2] Atendimento e Críticas:** Responder com serenidade, empatia e solução direta sem burocracia.

## 12. Glossário & Contatos
- **[12.1] Glossário:** Torra Média-Clara (preserva acidez equilibrada e doçura natural); Micro-Lote (colheita rastreada de talhão único).
- **[12.2] Escalonamento para o Designer:** Peças fora das regras exigem consulta prévia a branding@auroracafe.com.br.
`;

export function loadDefaultDossier(): string {
  const candidates = [
    path.resolve(process.cwd(), '../docs/TEMPLATE_DOSSIE_MARCA.md'),
    path.resolve(process.cwd(), 'docs/TEMPLATE_DOSSIE_MARCA.md'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        return fs.readFileSync(p, 'utf8');
      } catch {
        // Fallback below
      }
    }
  }
  return FALLBACK_BRAND_DOSSIER;
}
