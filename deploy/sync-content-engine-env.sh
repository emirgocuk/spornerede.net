#!/usr/bin/env bash
# Lokal content-engine/.env → sunucuya (GIT disi, secret'lar repoya gitmez)
#
# Kullanim:
#   cp deploy/env.deploy.example .env.deploy   # DEPLOY_SSH doldur
#   bash deploy/sync-content-engine-env.sh
#
# Hedefler:
#   1) /opt/spornerede/content-engine.env  (kalici, autoupdate buradan kopyalar)
#   2) /opt/spornerede/current/content-engine/.env  (aktif release, hemen calisir)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_SRC="${ROOT}/content-engine/.env"
REMOTE_BASE="${REMOTE_BASE:-/opt/spornerede}"

if [[ -f "${ROOT}/.env.deploy" ]]; then
  # shellcheck disable=SC1091
  set -a
  source "${ROOT}/.env.deploy"
  set +a
fi

DEPLOY_SSH="${DEPLOY_SSH:-}"
if [[ -z "${DEPLOY_SSH}" ]]; then
  echo "HATA: DEPLOY_SSH tanimli degil. .env.deploy olusturun (deploy/env.deploy.example)."
  exit 1
fi

if [[ ! -f "${ENV_SRC}" ]]; then
  echo "HATA: ${ENV_SRC} bulunamadi. Once content-engine/.env.example kopyalayip doldurun."
  exit 1
fi

echo "→ ${DEPLOY_SSH}:${REMOTE_BASE}/content-engine.env"
scp -q "${ENV_SRC}" "${DEPLOY_SSH}:${REMOTE_BASE}/content-engine.env"
ssh "${DEPLOY_SSH}" "chmod 600 '${REMOTE_BASE}/content-engine.env'"

if ssh "${DEPLOY_SSH}" "test -d '${REMOTE_BASE}/current/content-engine'"; then
  echo "→ aktif release content-engine/.env"
  ssh "${DEPLOY_SSH}" "cp '${REMOTE_BASE}/content-engine.env' '${REMOTE_BASE}/current/content-engine/.env' && chmod 600 '${REMOTE_BASE}/current/content-engine/.env'"
else
  echo "UYARI: ${REMOTE_BASE}/current/content-engine yok; sonraki autoupdate veya deploy sonrasi kopyalanir."
fi

echo "Tamam. content-engine env sunucuda hazir."
