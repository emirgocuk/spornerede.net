#!/usr/bin/env bash
set -euo pipefail

# Sunucu tarafinda periyodik calisir:
# - GitHub'dan yeni commit var mi kontrol eder
# - Varsa pull + build + release + systemd restart yapar
#
# Varsayilanlar:
#   APP_REPO_DIR=/opt/spornerede/repo
#   APP_BASE=/opt/spornerede
#   APP_BRANCH=main
#   APP_REMOTE=origin
#   SYSTEMD_UNIT=spornerede

APP_REPO_DIR="${APP_REPO_DIR:-/opt/spornerede/repo}"
APP_BASE="${APP_BASE:-/opt/spornerede}"
APP_BRANCH="${APP_BRANCH:-main}"
APP_REMOTE="${APP_REMOTE:-origin}"
SYSTEMD_UNIT="${SYSTEMD_UNIT:-spornerede}"

RELEASES_DIR="${APP_BASE}/releases"
CURRENT_LINK="${APP_BASE}/current"
PREV_FILE="${RELEASES_DIR}/.previous"
LOG_PREFIX="[server-auto-update]"

log() {
  printf "%s %s\n" "${LOG_PREFIX}" "$*"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    log "HATA: '$1' bulunamadi."
    exit 1
  }
}

require_cmd git
require_cmd npm
require_cmd rsync
require_cmd date

if [[ ! -d "${APP_REPO_DIR}/.git" ]]; then
  log "HATA: repo bulunamadi: ${APP_REPO_DIR}"
  log "Cozum: sunucuda repo klonlayin, ornek:"
  log "  git clone git@github.com:emirgocuk/spornerede.net.git ${APP_REPO_DIR}"
  exit 1
fi

mkdir -p "${RELEASES_DIR}"

cd "${APP_REPO_DIR}"

if [[ -n "$(git status --porcelain)" ]]; then
  log "UYARI: repo temiz degil, otomatik guncelleme atlandi."
  exit 0
fi

log "Fetch: ${APP_REMOTE}/${APP_BRANCH}"
git fetch --quiet "${APP_REMOTE}" "${APP_BRANCH}"

LOCAL_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse "${APP_REMOTE}/${APP_BRANCH}")"

if [[ "${LOCAL_SHA}" == "${REMOTE_SHA}" ]]; then
  log "Yeni commit yok, cikiliyor."
  exit 0
fi

log "Yeni commit bulundu: ${LOCAL_SHA} -> ${REMOTE_SHA}"

git checkout "${APP_BRANCH}" >/dev/null 2>&1
git pull --ff-only "${APP_REMOTE}" "${APP_BRANCH}"

if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

npm run build

if [[ ! -d dist ]]; then
  log "HATA: dist/ bulunamadi, build basarisiz olabilir."
  exit 1
fi

TS="$(date -u +"%Y%m%dT%H%M%SZ")"
NEW_RELEASE="${RELEASES_DIR}/${TS}"
mkdir -p "${NEW_RELEASE}"

if [[ -L "${CURRENT_LINK}" || -e "${CURRENT_LINK}" ]]; then
  CUR="$(readlink -f "${CURRENT_LINK}" 2>/dev/null || true)"
  if [[ -n "${CUR}" && -d "${CUR}" ]]; then
    printf "%s\n" "${CUR}" > "${PREV_FILE}"
  fi
fi

rsync -a --delete "${APP_REPO_DIR}/dist/" "${NEW_RELEASE}/"
ln -sfn "${NEW_RELEASE}" "${CURRENT_LINK}"
log "Release aktif: ${NEW_RELEASE}"

if systemctl list-unit-files | grep -q "^${SYSTEMD_UNIT}\.service"; then
  systemctl restart "${SYSTEMD_UNIT}"
  log "Servis restart: ${SYSTEMD_UNIT}"
else
  log "UYARI: ${SYSTEMD_UNIT}.service bulunamadi, restart atlandi."
fi

log "Tamamlandi."
