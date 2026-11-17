#!/bin/sh
set -eu

# ==============================================================================
# Brand AI Hub — Backup Automático em 3 Camadas (Sem iCloud)
# Camada 1: Snapshot local diário (retenção de 7 dias)
# Camada 2: Nuvem da Agência (Cloudflare R2 / Backblaze B2 via rclone)
# Camada 3: Drive do Cliente (Google Drive ou Dropbox via rclone)
# ==============================================================================

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
DOMAIN_SLUG="${DOMAIN:-brand-node}"
BACKUP_ROOT="/backups"

run_backup_cycle() {
  STAMP="$(date -u +%Y-%m-%d_%H-%M)"
  DAY_DIR="${BACKUP_ROOT}/${STAMP}"
  echo "[Backup ${STAMP}] Iniciando ciclo para ${DOMAIN_SLUG}..."

  # Camada 1 — Snapshot local no servidor (sem compressão pesada para poupar CPU)
  mkdir -p "${DAY_DIR}/app_data" "${DAY_DIR}/pb_data"
  cp -a /source/app_data/. "${DAY_DIR}/app_data/" 2>/dev/null || true
  cp -a /source/pb_data/. "${DAY_DIR}/pb_data/" 2>/dev/null || true

  # Limpar snapshots locais mais antigos que RETENTION_DAYS
  find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d -mtime +"${RETENTION_DAYS}" -exec rm -rf {} + 2>/dev/null || true
  echo "[Backup ${STAMP}] Camada 1 (Local ${RETENTION_DAYS}d) concluída."

  # Camada 2 — Nuvem da Agência (R2 ou B2)
  if [ -n "${AGENCY_R2_REMOTE:-}" ] && [ -f "/config/rclone/rclone.conf" ]; then
    rclone sync "${DAY_DIR}" "${AGENCY_R2_REMOTE}/${DOMAIN_SLUG}/latest" --transfers=4 --quiet || \
      echo "[Backup ${STAMP}] Aviso: falha ao sincronizar Camada 2 (Agência R2/B2)."
    echo "[Backup ${STAMP}] Camada 2 (Nuvem Agência) concluída."
  fi

  # Camada 3 — Google Drive / Dropbox do Cliente (sem iCloud)
  if [ -n "${CLIENT_CLOUD_REMOTE:-}" ] && [ -f "/config/rclone/rclone.conf" ]; then
    rclone sync /source/app_data/assets "${CLIENT_CLOUD_REMOTE}/Ativos" --transfers=2 --quiet || \
      echo "[Backup ${STAMP}] Aviso: falha ao sincronizar Ativos na Camada 3 (Drive/Dropbox)."
    rclone copy /source/app_data/node-db.json "${CLIENT_CLOUD_REMOTE}/Config" --quiet || true
    echo "[Backup ${STAMP}] Camada 3 (Drive/Dropbox do Cliente) concluída."
  fi

  # Ping opcional para Uptime Kuma (monitor push)
  if [ -n "${UPTIME_KUMA_PUSH_URL:-}" ]; then
    wget -q -O /dev/null "${UPTIME_KUMA_PUSH_URL}?status=up&msg=BackupOK" || true
  fi
}

# Executa ciclo inicial após subir o container e depois a cada 24h
sleep 30
while true; do
  run_backup_cycle || true
  sleep 86400
done
