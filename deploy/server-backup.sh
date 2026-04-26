#!/usr/bin/env bash
set -euo pipefail

# SporNerede.net production backup
#
# Backs up:
# - production env file
# - PocketBase data
# - PocketBase public/uploads
# - optional release metadata
#
# Optional offsite copy:
#   OFFSITE_BACKUP_TARGET=user@backup-host:/path/to/backups
#

APP_BASE="${APP_BASE:-/opt/spornerede}"
APP_REPO_DIR="${APP_REPO_DIR:-${APP_BASE}/repo}"
BACKUP_DIR="${BACKUP_DIR:-${APP_BASE}/backups}"
ENV_FILE="${ENV_FILE:-${APP_BASE}/.env}"
PB_DATA_DIR="${PB_DATA_DIR:-${APP_REPO_DIR}/pocketbase/pb_data}"
PB_PUBLIC_DIR="${PB_PUBLIC_DIR:-${APP_REPO_DIR}/pocketbase/pb_public}"
LOCAL_RETENTION_DAYS="${LOCAL_RETENTION_DAYS:-7}"
OFFSITE_RETENTION_DAYS="${OFFSITE_RETENTION_DAYS:-30}"
OFFSITE_BACKUP_TARGET="${OFFSITE_BACKUP_TARGET:-}"

TS="$(date -u +"%Y%m%dT%H%M%SZ")"
WORK_DIR="${BACKUP_DIR}/${TS}"
ARCHIVE="${BACKUP_DIR}/spornerede-backup-${TS}.tar.gz"
LOG_PREFIX="[server-backup]"

log() {
  printf "%s %s\n" "${LOG_PREFIX}" "$*"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    log "HATA: '$1' bulunamadi."
    exit 1
  }
}

require_cmd tar
require_cmd find
require_cmd date

mkdir -p "${WORK_DIR}"

if [[ -f "${ENV_FILE}" ]]; then
  mkdir -p "${WORK_DIR}/opt/spornerede"
  cp -a "${ENV_FILE}" "${WORK_DIR}/opt/spornerede/.env"
else
  log "UYARI: env dosyasi bulunamadi: ${ENV_FILE}"
fi

if [[ -d "${PB_DATA_DIR}" ]]; then
  mkdir -p "${WORK_DIR}/pocketbase"
  cp -a "${PB_DATA_DIR}" "${WORK_DIR}/pocketbase/pb_data"
else
  log "UYARI: PocketBase data bulunamadi: ${PB_DATA_DIR}"
fi

if [[ -d "${PB_PUBLIC_DIR}" ]]; then
  mkdir -p "${WORK_DIR}/pocketbase"
  cp -a "${PB_PUBLIC_DIR}" "${WORK_DIR}/pocketbase/pb_public"
else
  log "UYARI: PocketBase public bulunamadi: ${PB_PUBLIC_DIR}"
fi

if [[ -f "${APP_BASE}/releases/.previous" ]]; then
  mkdir -p "${WORK_DIR}/releases"
  cp -a "${APP_BASE}/releases/.previous" "${WORK_DIR}/releases/.previous"
fi

tar -C "${WORK_DIR}" -czf "${ARCHIVE}" .
rm -rf "${WORK_DIR}"
chmod 0600 "${ARCHIVE}"
log "Lokal yedek olustu: ${ARCHIVE}"

if [[ -n "${OFFSITE_BACKUP_TARGET}" ]]; then
  require_cmd rsync
  rsync -a "${ARCHIVE}" "${OFFSITE_BACKUP_TARGET}/"
  log "Offsite yedek kopyalandi: ${OFFSITE_BACKUP_TARGET}"

  if command -v ssh >/dev/null 2>&1 && [[ "${OFFSITE_BACKUP_TARGET}" == *:* ]]; then
    OFFSITE_HOST="${OFFSITE_BACKUP_TARGET%%:*}"
    OFFSITE_PATH="${OFFSITE_BACKUP_TARGET#*:}"
    ssh "${OFFSITE_HOST}" "find '${OFFSITE_PATH}' -name 'spornerede-backup-*.tar.gz' -type f -mtime +${OFFSITE_RETENTION_DAYS} -delete" || true
  fi
else
  log "OFFSITE_BACKUP_TARGET bos; uzak yedek atlandi."
fi

find "${BACKUP_DIR}" -name 'spornerede-backup-*.tar.gz' -type f -mtime +"${LOCAL_RETENTION_DAYS}" -delete
log "Lokal retention tamam: ${LOCAL_RETENTION_DAYS} gun."

log "Tamamlandi."
