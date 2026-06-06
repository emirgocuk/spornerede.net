#!/usr/bin/env bash
# Lokal content-engine/secrets/*.json -> sunucu (GIT disi)
#
# Hedef: /opt/spornerede/content-engine-secrets/
# Sonraki deploy/autoupdate bu dizinden aktif release'e kopyalar.
#
# Kullanim:
#   bash deploy/sync-content-engine-secrets.sh
#   bash deploy/sync-content-engine-secrets.sh --install-current

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS_SRC="${ROOT}/content-engine/secrets"
REMOTE_BASE="${REMOTE_BASE:-/opt/spornerede}"
REMOTE_SECRETS="${REMOTE_BASE}/content-engine-secrets"
INSTALL_CURRENT=0

for arg in "$@"; do
  if [[ "${arg}" == "--install-current" ]]; then
    INSTALL_CURRENT=1
  fi
done

if [[ -f "${ROOT}/.env.deploy" ]]; then
  # shellcheck disable=SC1091
  set -a
  source "${ROOT}/.env.deploy"
  set +a
fi

DEPLOY_SSH="${DEPLOY_SSH:-}"
if [[ -z "${DEPLOY_SSH}" ]]; then
  echo "HATA: DEPLOY_SSH tanimli degil (.env.deploy)."
  exit 1
fi

shopt -s nullglob
files=("${SECRETS_SRC}"/*.json)
shopt -u nullglob
if [[ ${#files[@]} -eq 0 ]]; then
  echo "HATA: ${SECRETS_SRC} icinde *.json yok. Once npm run gsc:oauth (content-engine)."
  exit 1
fi

echo "→ ${DEPLOY_SSH}:${REMOTE_SECRETS}/"
ssh "${DEPLOY_SSH}" "mkdir -p '${REMOTE_SECRETS}' && chmod 700 '${REMOTE_SECRETS}'"
for f in "${files[@]}"; do
  base="$(basename "${f}")"
  echo "  ${base}"
  scp -q "${f}" "${DEPLOY_SSH}:${REMOTE_SECRETS}/${base}"
done
ssh "${DEPLOY_SSH}" "chmod 600 '${REMOTE_SECRETS}/'*.json 2>/dev/null || true"

if [[ "${INSTALL_CURRENT}" == "1" ]]; then
  echo "→ aktif release content-engine/secrets"
  ssh "${DEPLOY_SSH}" "bash -s" <<EOF
set -euo pipefail
CE_DIR="${REMOTE_BASE}/current/content-engine"
if [[ ! -d "\${CE_DIR}" ]]; then
  echo "UYARI: \${CE_DIR} yok"
  exit 0
fi
mkdir -p "\${CE_DIR}/secrets"
rsync -a "${REMOTE_SECRETS}/" "\${CE_DIR}/secrets/"
chmod 700 "\${CE_DIR}/secrets"
chmod 600 "\${CE_DIR}/secrets/"*.json 2>/dev/null || true
echo "Aktif release secrets guncellendi."
EOF
fi

echo "Tamam. GSC secrets sunucuda hazir."
