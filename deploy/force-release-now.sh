#!/usr/bin/env bash
set -euo pipefail
APP_REPO_DIR="${APP_REPO_DIR:-/opt/spornerede/repo}"
APP_BASE="${APP_BASE:-/opt/spornerede}"
ENV_FILE="${ENV_FILE:-/opt/spornerede/.env}"

cd "${APP_REPO_DIR}"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

echo "==> commit: $(git log -1 --oneline)"
echo "==> npm ci (repo)"
npm ci
echo "==> content-engine npm ci (repo)"
(cd content-engine && npm ci)
echo "==> pb:setup + content-engine ensure"
npm run pb:setup
npm run content-engine:ensure
echo "==> build"
npm run build

TS="$(date -u +"%Y%m%dT%H%M%SZ")"
NEW_RELEASE="${APP_BASE}/releases/${TS}"
mkdir -p "${NEW_RELEASE}"
rsync -a --delete "${APP_REPO_DIR}/dist/" "${NEW_RELEASE}/"
cp "${APP_REPO_DIR}/package.json" "${NEW_RELEASE}/package.json"
cp "${APP_REPO_DIR}/package-lock.json" "${NEW_RELEASE}/package-lock.json"
(cd "${NEW_RELEASE}" && npm ci --omit=dev)

if [[ -d "${APP_REPO_DIR}/content-engine" ]]; then
  rsync -a --delete \
    --exclude 'node_modules/' \
    --exclude '.env' \
    --exclude 'secrets/' \
    "${APP_REPO_DIR}/content-engine/" "${NEW_RELEASE}/content-engine/"
  (cd "${NEW_RELEASE}/content-engine" && npm ci --include=dev)
  if [[ -f "${APP_BASE}/content-engine.env" ]]; then
    cp "${APP_BASE}/content-engine.env" "${NEW_RELEASE}/content-engine/.env"
    chmod 600 "${NEW_RELEASE}/content-engine/.env"
  fi
  # shellcheck disable=SC1091
  source "$(dirname "$0")/lib-content-engine-secrets.sh"
  install_content_engine_secrets "${NEW_RELEASE}/content-engine"
fi

ln -sfn "${NEW_RELEASE}" "${APP_BASE}/current"
echo "==> release: ${NEW_RELEASE}"
systemctl restart spornerede.service
sleep 3
systemctl is-active spornerede.service
curl -sS https://spornerede.net/api/health | head -c 300
echo
