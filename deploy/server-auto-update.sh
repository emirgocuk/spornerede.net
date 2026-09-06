#!/usr/bin/env bash
set -euo pipefail
# v2.1.0 - content-engine bundle & verified models

# git pull bu dosyayi guncelleyebilir; bash repo dosyasindan satir satir okudugu icin
# inode/offset kaymasi olusur (exec satirina hic gelinmeden eski kod calisabilir).
# Betigi /tmp altina kopyalayıp oradan exec et: pull sonrasi satirlar her zaman tutarli kalir.
if [[ -z "${SN_AUTOUPDATE_TMP_RUN:-}" ]]; then
  _src="${BASH_SOURCE[0]:-$0}"
  _tmp="$(mktemp /tmp/spornerede-autoupdate.XXXXXX.sh)"
  cp -f "${_src}" "${_tmp}"
  chmod +x "${_tmp}" 2>/dev/null || true
  export SN_AUTOUPDATE_TMP_RUN=1
  exec bash "${_tmp}" "$@"
fi

# Sunucu tarafinda periyodik calisir:
# - GitHub'dan yeni commit var mi kontrol eder
# - Varsa pull + build + PocketBase schema sync + release + systemd restart yapar

APP_REPO_DIR="${APP_REPO_DIR:-/opt/spornerede/repo}"
APP_BASE="${APP_BASE:-/opt/spornerede}"
APP_BRANCH="${APP_BRANCH:-main}"
APP_REMOTE="${APP_REMOTE:-origin}"
SYSTEMD_UNIT="${SYSTEMD_UNIT:-spornerede}"
ENV_FILE="${ENV_FILE:-${APP_BASE}/.env}"
RUN_RELEASE_GATE="${RUN_RELEASE_GATE:-1}"
RUN_PB_SETUP="${RUN_PB_SETUP:-1}"
RUN_SMOKE_CHECK="${RUN_SMOKE_CHECK:-1}"

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

load_env_file() {
  local line key value
  if [[ ! -f "${ENV_FILE}" ]]; then
    log "UYARI: env dosyasi bulunamadi: ${ENV_FILE}"
    return 0
  fi

  while IFS= read -r line || [[ -n "${line}" ]]; do
    line="${line%$'\n'}"
    [[ -z "${line}" || "${line}" =~ ^[[:space:]]*# ]] && continue
    [[ "${line}" != *=* ]] && continue
    key="${line%%=*}"
    value="${line#*=}"
    key="$(printf "%s" "${key}" | xargs)"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    if [[ "${key}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      export "${key}=${value}"
    fi
  done < "${ENV_FILE}"
}

require_cmd git
require_cmd npm
require_cmd rsync
require_cmd date
require_cmd xargs

load_env_file

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

if [[ "${RUN_RELEASE_GATE}" == "1" ]]; then
  npm run release:gate
fi

npm run build

if [[ "${RUN_PB_SETUP}" == "1" ]]; then
  npm run pb:setup
  if [[ -d "${APP_REPO_DIR}/content-engine" ]]; then
    log "Content Engine koleksiyon + keyword seed..."
    (cd "${APP_REPO_DIR}" && npm run content-engine:ensure) || \
      log "UYARI: content-engine:ensure basarisiz; admin SEO haber sekmesi etkilenebilir."
  fi
fi

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
cp "${APP_REPO_DIR}/package.json" "${NEW_RELEASE}/package.json"
if [[ -f "${APP_REPO_DIR}/package-lock.json" ]]; then
  cp "${APP_REPO_DIR}/package-lock.json" "${NEW_RELEASE}/package-lock.json"
fi
(cd "${NEW_RELEASE}" && npm ci --omit=dev)

# Content Engine (izole CLI) — admin "Content Engine" sekmesi calisma aninda
# release icindeki content-engine/ klasorunu `npx tsx` ile spawn eder
# (cwd = current/content-engine). Bu yuzden kaynagi + bagimliliklarini release'e
# tasiriz. node_modules ve .env haric tutulur; env degerleri systemd
# EnvironmentFile (/opt/spornerede/.env) uzerinden process.env ile gecer.
# Hata main site deploy'unu durdurmasin diye non-fatal birakilir.
if [[ -d "${APP_REPO_DIR}/content-engine" ]]; then
  log "Content Engine release'e kopyalaniyor..."
  rsync -a --delete \
    --exclude 'node_modules/' \
    --exclude '.env' \
    --exclude 'secrets/' \
    "${APP_REPO_DIR}/content-engine/" "${NEW_RELEASE}/content-engine/"
  if (cd "${NEW_RELEASE}/content-engine" && npm ci --include=dev); then
    log "Content Engine bagimliliklari kuruldu."
  else
    log "UYARI: content-engine npm ci basarisiz; admin Content Engine sekmesi calismayabilir."
  fi
  CE_ENV_SRC="${APP_BASE}/content-engine.env"
  if [[ -f "${CE_ENV_SRC}" ]]; then
    cp "${CE_ENV_SRC}" "${NEW_RELEASE}/content-engine/.env"
    chmod 600 "${NEW_RELEASE}/content-engine/.env"
    log "Content Engine .env kopyalandi (${CE_ENV_SRC})."
  else
    log "UYARI: ${CE_ENV_SRC} yok — admin Content Engine icin: bash deploy/sync-content-engine-env.sh"
  fi
  # shellcheck disable=SC1091
  source "${APP_REPO_DIR}/deploy/lib-content-engine-secrets.sh"
  install_content_engine_secrets "${NEW_RELEASE}/content-engine"
fi

ln -sfn "${NEW_RELEASE}" "${CURRENT_LINK}"
log "Release aktif: ${NEW_RELEASE}"

if [[ -f "${APP_REPO_DIR}/deploy/prune-releases.sh" ]]; then
  bash "${APP_REPO_DIR}/deploy/prune-releases.sh" || log "UYARI: prune-releases basarisiz"
fi

# .env icinden yanlis SYSTEMD_UNIT gelmesin diye normalize et
SYSTEMD_UNIT="${SYSTEMD_UNIT:-spornerede}"
SYSTEMD_UNIT="${SYSTEMD_UNIT%.service}"
UNIT_FILE="${SYSTEMD_UNIT}.service"

# Dogrudan restart: LoadState / list-unit-files kontrolleri bazi ortamlarda
# bos cikti veya broken pipe ile yanlis negatif verebiliyordu.
if systemctl restart "${UNIT_FILE}"; then
  log "Servis restart: ${UNIT_FILE}"
else
  log "UYARI: systemctl restart basarisiz: ${UNIT_FILE} (exit $?)"
fi

if [[ "${RUN_SMOKE_CHECK}" == "1" ]]; then
  npm run smoke:check
fi

log "Tamamlandi."
