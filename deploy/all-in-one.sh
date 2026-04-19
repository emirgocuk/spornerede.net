#!/usr/bin/env bash
# SporNerede.net — tek komut: sunucu kontrolu + lokal build + deploy.sh (yukleme + nginx)
#
# Kullanim:
#   bash deploy/all-in-one.sh --ssh root@SUNUCU_IP
#
# Kalici:
#   .env.deploy icinde DEPLOY_SSH=...
#   npm run deploy:prod
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

if [[ -f "${ROOT_DIR}/.env.deploy" ]]; then
  # shellcheck disable=SC1091
  set -a
  source "${ROOT_DIR}/.env.deploy"
  set +a
fi

usage() {
  cat <<'EOF'
Kullanim:
  bash deploy/all-in-one.sh --ssh root@SUNUCU_IP

Opsiyonlar:
  --ssh USER@HOST   DEPLOY_SSH yerine
  --skip-ci         Lokalde sadece `npm run build` (npm ci atlanir; daha hizli)
  --no-nginx        deploy.sh icinde --update-nginx kullanma
  -h, --help

Ortam:
  DEPLOY_SSH, REMOTE_BASE, SYSTEMD_UNIT, SSH_PASSWORD (deploy.sh ile ayni)
EOF
}

SKIP_CI="${SKIP_CI:-0}"
NO_NGINX="${NO_NGINX:-0}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ssh)
      DEPLOY_SSH="${2:-}"
      shift 2
      ;;
    --skip-ci)
      SKIP_CI="1"
      shift 1
      ;;
    --no-nginx)
      NO_NGINX="1"
      shift 1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Bilinmeyen arguman: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

DEPLOY_SSH="${DEPLOY_SSH:-}"
REMOTE_BASE="${REMOTE_BASE:-/opt/spornerede}"
SYSTEMD_UNIT="${SYSTEMD_UNIT:-spornerede}"
SSH_PASSWORD="${SSH_PASSWORD:-}"

if [[ -z "${DEPLOY_SSH}" ]]; then
  echo "HATA: DEPLOY_SSH bos. Ornek: bash deploy/all-in-one.sh --ssh root@IP" >&2
  echo "       Ya da .env.deploy icine DEPLOY_SSH yazin." >&2
  exit 1
fi

# shellcheck disable=SC1091
source "${ROOT_DIR}/deploy/lib-ssh.sh"
assert_deploy_ssh_not_placeholder
init_deploy_ssh_mux

maybe_prompt_password

warn_if_windows_dev_server() {
  if [[ "${SKIP_DEV_SERVER_CHECK:-0}" == "1" ]]; then
    return 0
  fi

  if [[ "$(uname -s 2>/dev/null || echo unknown)" != *MINGW* && "$(uname -s 2>/dev/null || echo unknown)" != *MSYS* && "$(uname -s 2>/dev/null || echo unknown)" != *CYGWIN* ]]; then
    return 0
  fi

  if ! command -v powershell.exe >/dev/null 2>&1; then
    return 0
  fi

  local busy
  busy="$(
    powershell.exe -NoProfile -Command \
      "try { \$c = Get-NetTCPConnection -LocalPort 4321 -State Listen -ErrorAction Stop | Select-Object -First 1; if (\$null -ne \$c) { \$p = Get-Process -Id \$c.OwningProcess -ErrorAction SilentlyContinue; \"\$c.OwningProcess|\$(\$p.ProcessName)\" } } catch { }" \
      2>/dev/null | tr -d '\r'
  )"

  if [[ -z "${busy}" ]]; then
    return 0
  fi

  local pid name
  pid="${busy%%|*}"
  name="${busy#*|}"

  echo "UYARI: 4321 portunda dinleyen proses var (PID=${pid}, ${name}). npm ci/build EPERM verebilir." >&2
  echo "        Dev server'i durdurun veya SKIP_DEV_SERVER_CHECK=1 kullanin." >&2
}

warn_if_windows_dev_server

echo "==> 1/4 Sunucu kontrol / eksikleri tamamla (remote-doctor)"
ssh_r "env REMOTE_BASE=${REMOTE_BASE} SYSTEMD_UNIT=${SYSTEMD_UNIT} bash -s" <"${ROOT_DIR}/deploy/remote-doctor.sh"

echo "==> 2/4 FileZilla sonrasi script (sunucuda guncel)"
scp_r "${ROOT_DIR}/deploy/apply-ftp-upload.sh" "${DEPLOY_SSH}:${REMOTE_BASE}/apply-ftp-upload.sh"
ssh_r "chmod +x ${REMOTE_BASE}/apply-ftp-upload.sh"

echo "==> 3/4 Lokal build"
if [[ "${SKIP_CI}" == "1" ]]; then
  npm run build
else
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
  npm run build
fi

if [[ ! -d dist ]]; then
  echo "HATA: dist/ yok." >&2
  exit 1
fi

echo "==> 4/4 Yukleme (deploy.sh --skip-build)"
DEPLOY_ARGS=(--ssh "${DEPLOY_SSH}" --skip-build)
if [[ "${NO_NGINX}" != "1" ]]; then
  DEPLOY_ARGS+=(--update-nginx)
fi

bash "${ROOT_DIR}/deploy.sh" "${DEPLOY_ARGS[@]}"

echo ""
echo "==> all-in-one tamam."
