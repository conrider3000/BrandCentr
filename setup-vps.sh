#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Brand AI Hub — Setup Inicial de VPS (Ubuntu 24.04 LTS)
# Prepara servidor KVM (4GB RAM, 50GB NVMe) para rodar o Client Brand Node
# ou o Agency Master Admin via Coolify / Docker.
# ==============================================================================

if [[ "${EUID}" -ne 0 ]]; then
  echo "❌ Execute este script como root: sudo bash setup-vps.sh"
  exit 1
fi

echo "============================================================"
echo "  Brand AI Hub — Provisionamento Ubuntu 24.04"
echo "============================================================"

# 1. Atualizar sistema e pacotes essenciais
echo "[1/6] Atualizando sistema e instalando utilitários..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  curl \
  wget \
  git \
  ufw \
  fail2ban \
  unattended-upgrades \
  ca-certificates \
  gnupg \
  lsb-release \
  unzip \
  zip \
  jq

# 2. Configurar Swap NVMe de 4GB (previne OOM em VPS de 4GB RAM)
echo "[2/6] Configurando 4GB de Swap em NVMe (swappiness=10)..."
if swapon --show | grep -q "/swapfile"; then
  echo "✅ /swapfile já está ativo."
else
  fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096 status=progress
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q "^/swapfile " /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
fi

cat <<'EOF' >/etc/sysctl.d/99-brand-ai-swap.conf
vm.swappiness=10
vm.vfs_cache_pressure=50
EOF
sysctl --system >/dev/null

# 3. Instalar Docker & Docker Compose Plugin (caso ainda não estejam instalados)
echo "[3/6] Verificando Docker Engine..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "✅ Docker já instalado: $(docker --version)"
fi

# 4. Instalar rclone para backups automáticos (R2/B2 + Google Drive/Dropbox)
echo "[4/6] Instalando rclone..."
if ! command -v rclone >/dev/null 2>&1; then
  curl -fsSL https://rclone.org/install.sh | bash
else
  echo "✅ rclone já instalado: $(rclone version | head -n1)"
fi

# 5. Configurar Firewall UFW (portas 22, 80, 443) + Fail2ban
echo "[5/6] Configurando UFW e Fail2ban..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP / Coolify Traefik'
ufw allow 443/tcp comment 'HTTPS / Coolify Traefik'
# Se quiser restringir a porta 8000 do Coolify apenas no Servidor Mestre, libere manualmente.
ufw --force enable

systemctl enable fail2ban
systemctl restart fail2ban

# Habilitar atualizações automáticas de segurança
dpkg-reconfigure -f noninteractive unattended-upgrades || true

# 6. Criar estrutura de diretórios padrão para o nó
echo "[6/6] Criando diretórios em /opt/brand-node..."
mkdir -p /opt/brand-node/data/assets
mkdir -p /opt/brand-node/data/creations
mkdir -p /opt/brand-node/data/approvals
mkdir -p /opt/brand-node/backups/local
mkdir -p /opt/brand-node/pb_data
chmod -R 755 /opt/brand-node

echo "============================================================"
echo "✅ VPS pronta para receber o Coolify / Client Brand Node!"
echo "   Swap ativo: $(free -h | awk '/Swap:/ {print $2}')"
echo "   Docker: $(docker --version)"
echo "   rclone: $(rclone version | head -n1)"
echo "   UFW status:"
ufw status numbered
echo "============================================================"
