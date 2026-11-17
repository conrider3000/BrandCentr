# Brand AI Hub & Agency Command Center

Ecossistema proprietário completo para estúdios e designers de marca entregarem uma infraestrutura digital viva no domínio do cliente, controlada a partir de uma Torre de Controle centralizada da agência.

---

## 1. Arquitetura do Monorepo

```text
Brand AI/
├── agency-master-admin/          # Painel Mestre da Agência (VPS da Agência)
│   ├── docker-compose.yml        # Next.js + PocketBase (labels Coolify/Traefik)
│   ├── Caddyfile                 # Proxy opcional (profile: standalone-caddy)
│   ├── pb_migrations/            # Esquema PocketBase da frota de clientes
│   ├── pb_hooks/                 # Cron job de telemetria a cada 5 minutos
│   └── src/                      # Dashboard Dark-Mode + APIs Coolify & Heartbeat
├── client-brand-node/            # Nó Dedicado do Cliente (1 VPS KVM 1 por cliente)
│   ├── docker-compose.yml        # Next.js + PocketBase + rclone backup (sem AnythingLLM!)
│   ├── Caddyfile                 # Proxy opcional (profile: standalone-caddy)
│   ├── backup/                   # Script de backup em 3 camadas (Local + R2 + Drive/Dropbox)
│   ├── pb_migrations/            # Esquema PocketBase do cliente
│   └── src/                      # Site Novo + Portal da Marca + Brand AI Longo-Contexto
├── docs/
│   └── TEMPLATE_DOSSIE_MARCA.md  # Modelo padrão numerado (12 seções) para todas as marcas
└── setup-vps.sh                  # Provisionamento Ubuntu 24.04 (Swap 4GB, Docker, rclone, UFW)
```

### Principais Decisões de Engenharia
1. **Zero conflito Coolify x Caddy:** Os arquivos `docker-compose.yml` usam labels do **Traefik/Coolify** por padrão para emitir HTTPS nas portas `80/443`. O `Caddyfile` fica sob `--profile standalone-caddy` caso algum servidor não use Coolify.
2. **Sem AnythingLLM (Contexto Longo Direto):** O Dossiê Oficial numerado ([TEMPLATE_DOSSIE_MARCA.md](docs/TEMPLATE_DOSSIE_MARCA.md)) é injetado diretamente no modelo `google/gemini-2.5-flash` (1M tokens) via OpenRouter. Isso economiza **1–2 GB de RAM** na VPS de 4 GB e garante que toda resposta cite a seção exata (`[4.1]`, `[5.2]`, `[6.1]`).
3. **Downloads `zip -0` em Streaming:** `Design_Kit.zip`, `Media_Kit.zip` e `Full_Brand_Kit.zip` são montados na hora em modo `STORE` (sem compressão de CPU e sem duplicar arquivos no disco NVMe de 50 GB).
4. **Criações (Pré-Verificador Econômico) + Aprovações:**
   - **Aba Criações:** Antes de gastar tokens gerando imagem, a IA valida texto, intenção e cores contra o Dossiê e otimiza o briefing.
   - **Aba Aprovações:** Recebe uploads externos ou peças geradas na aba Criações, pontuando de 0 a 10 com checklist de logo, área de proteção, paleta HEX e tom de voz.
5. **Suspensão em Dois Níveis:**
   - **OpenRouter BYOK (Chave do Cliente):** Se os créditos acabarem (`HTTP 402`), apenas os recursos de IA pausam; site e downloads continuam funcionando.
   - **Inadimplência com a Agência:** Como a VPS fica na conta da agência vinculada ao parcelamento anual do cliente, o botão **Suspender** no `/agency-master-admin` bloqueia todo o sistema (site público + portal).
6. **Backups em 3 Camadas (Sem iCloud):** Snapshot local de 7 dias + Nuvem da Agência (Cloudflare R2 / Backblaze B2) + Google Drive ou Dropbox do cliente via `rclone`.

---

## 2. Preparando a VPS (Ubuntu 24.04 — Hostinger SP)

Execute como `root` em cada nova VPS (Mestre KVM 2 e Clientes KVM 1):

```bash
curl -fsSL https://raw.githubusercontent.com/SEU-ORG/brand-ai-hub/main/setup-vps.sh -o setup-vps.sh
sudo bash setup-vps.sh
```

O script configura:
- **4 GB de Swap em NVMe** (`vm.swappiness=10`) para evitar quedas por OOM em servidores de 4 GB RAM.
- **Docker + Docker Compose + rclone + Fail2ban + atualizações automáticas**.
- **UFW Firewall** liberando apenas portas `22`, `80` e `443`.

---

## 3. Deploy do `/agency-master-admin` (Servidor Mestre)

1. Na VPS Mestre (recomendado **Hostinger KVM 2**, mínimo 2 vCPUs), instale o **Coolify**:
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```
2. No Coolify, crie um projeto apontando para a pasta `/agency-master-admin`.
3. Configure as variáveis de ambiente baseadas em `agency-master-admin/.env.example`:
   - `ADMIN_DOMAIN=admin.suaagencia.com.br`
   - `COOLIFY_API_URL=http://host.docker.internal:8000/api/v1`
   - `COOLIFY_API_TOKEN=<seu-token-api-do-coolify>`
   - `MASTER_ENCRYPTION_KEY=<chave-32-caracteres>`
4. Faça o deploy e aponte o registro Tipo `A` de `admin.suaagencia.com.br` para o IP da VPS Mestre.

---

## 4. Deploy de Novo Cliente (`/client-brand-node`)

1. No Painel Mestre (`/agency-master-admin`), clique em **"Novo Cliente / VPS"**, cadastre o cliente e copie o `AGENCY_HEARTBEAT_SECRET` gerado.
2. Adicione a VPS KVM 1 do cliente como servidor remoto no Coolify (via SSH).
3. Crie um novo serviço Docker Compose no Coolify apontando para `/client-brand-node` e preencha o `.env`:
   - `DOMAIN=clientedominio.com.br`
   - `AGENCY_HEARTBEAT_SECRET=<secret-copiado-do-painel-mestre>`
   - `NODE_ENCRYPTION_KEY=<chave-32-caracteres-unica>`
   - `PORTAL_CLIENT_EMAIL` e `PORTAL_CLIENT_PASSWORD`
4. **(Opcional para Backups Remotos):** Copie `client-brand-node/backup/rclone.conf.example` para `client-brand-node/backup/rclone.conf` e autorize `agency-r2` e `client-drive` (Google Drive) ou `client-dropbox`.

---

## 5. Configuração de DNS no Registro.br (Site Novo Substituindo o Antigo)

No painel do **Registro.br** (ou provedor DNS onde a zona estiver ativa), crie/atualize os 3 registros Tipo **A** apontando para o **IP da VPS do cliente**:

| Tipo | Nome / Host | Valor / Destino | O que entrega |
|---|---|---|---|
| `A` | `@` *(vazio)* | `IP_DA_VPS_CLIENTE` | **Novo Site Institucional** (substitui o antigo) |
| `A` | `www` | `IP_DA_VPS_CLIENTE` | Redirecionamento / espelho do novo site |
| `A` | `marca` | `IP_DA_VPS_CLIENTE` | **Portal Privado, Manual, Criações, Aprovações & Brand AI** |

> O proxy Traefik do Coolify emitirá automaticamente os certificados SSL Let's Encrypt para os três endereços.

---

## 6. Checklist da Reunião de Entrega com o Cliente

1. Subir o Dossiê da Marca preenchido (seguindo `docs/TEMPLATE_DOSSIE_MARCA.md`) na aba **Manual da Marca** e os ativos finais (logos, KVs, fontes, vídeos) na aba **Ativos & Kits**.
2. Abrir `https://marca.clientedominio.com.br` na aba **Backups & Chave IA**, ajudar o cliente a criar sua conta no OpenRouter e colar a chave `sk-or-v1-...` (armazenada criptografada).
3. Testar junto com o cliente o botão **"Baixar Full_Brand_Kit.zip"** (streaming instantâneo sem estourar CPU/disco).
4. Apresentar o fluxo de trabalho diário: **Criações (Pré-Verificador)** antes de gerar imagens e **Aprovações** para validar peças antes de publicar.

---

## 7. Desenvolvimento Local & Testes Rápidos

Em dois terminais separados:

```bash
# Terminal 1 — Painel Mestre (http://localhost:3001)
cd agency-master-admin
npm install
npm run dev

# Terminal 2 — Nó de Cliente Demo (http://localhost:3002 e http://localhost:3002/portal)
cd client-brand-node
npm install
npm run dev
```
