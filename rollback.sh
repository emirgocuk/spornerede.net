#!/usr/bin/env bash
set -euo pipefail

# SporNerede.net — hizli rollback (onceki release'e don)
#
# Gereksinimler:
# - ssh anahtari (tercih) veya interaktif sifre (TTY) / `SSH_PASSWORD` / `sshpass`
# - sunucuda `deploy.sh` ile olusturulmus release + metadata
#
# Kullanim:
#   bash rollback.sh --ssh root@sunucu-ip
#
# Alternatif:
#   export DEPLOY_SSH="root@sunucu-ip"   # Git Bash
#   $env:DEPLOY_SSH="root@sunucu-ip"     # PowerShell (sonra: bash rollback.sh)
#
# Opsiyonel kalici ayar (GIT'e ekleme):
#   ./.env.deploy icine DEPLOY_SSH=... yazin (bu dosya .gitignore'da)
#
# Notlar:
# - Bu script, sunucudaki `${REMOTE_BASE}/releases/.previous` dosyasini okur.
# - Deploy sirasinda `.previous` guncellenmezse rollback calismaz.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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
  bash rollback.sh --ssh root@SUNUCU_IP

Opsiyonlar:
  --ssh USER@HOST     DEPLOY_SSH yerine
  -h, --help          Bu yardim

Ortam degiskenleri:
  DEPLOY_SSH          zorunlu
  REMOTE_BASE         opsiyonel (varsayilan: /opt/spornerede)
  SYSTEMD_UNIT        opsiyonel (varsayilan: spornerede)
  SSH_PASSWORD        opsiyonel (sohbete yapistirmayin)

PowerShell notu:
  $env:DEPLOY_SSH="root@IP"
  bash rollback.sh
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ssh)
      DEPLOY_SSH="${2:-}"
      shift 2
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
  echo "HATA: DEPLOY_SSH bos." >&2
  echo "       PowerShell: \$env:DEPLOY_SSH='root@IP'" >&2
  echo "       Git Bash:   export DEPLOY_SSH='root@IP'" >&2
  echo "       Ya da:      bash rollback.sh --ssh root@IP" >&2
  echo "       Ya da:      ./.env.deploy dosyasina DEPLOY_SSH yazin (GIT'e ekleme)" >&2
  exit 1
fi

# shellcheck disable=SC1091
source "${ROOT_DIR}/deploy/lib-ssh.sh"
assert_deploy_ssh_not_placeholder
init_deploy_ssh_mux

maybe_prompt_password

echo "==> Rollback basliyor: ${DEPLOY_SSH}"
echo "    REMOTE_BASE=${REMOTE_BASE}"

ssh_r bash -s <<EOF
set -euo pipefail
REMOTE_BASE="${REMOTE_BASE}"
SYSTEMD_UNIT="${SYSTEMD_UNIT}"

PREV_FILE="\${REMOTE_BASE}/releases/.previous"
CUR_LINK="\${REMOTE_BASE}/current"

if [[ ! -f "\${PREV_FILE}" ]]; then
  echo "HATA: \${PREV_FILE} bulunamadi. Once deploy.sh ile deploy alin." >&2
  exit 1
fi

PREV="\$(cat "\${PREV_FILE}")"
if [[ ! -d "\${PREV}" ]]; then
  echo "HATA: Onceki release dizini yok: \${PREV}" >&2
  exit 1
fi

CUR="\$(readlink -f "\${CUR_LINK}" 2>/dev/null || true)"
if [[ -n "\${CUR}" && -d "\${CUR}" ]]; then
  echo "\${CUR}" > "\${REMOTE_BASE}/releases/.failed"
fi

ln -sfn "\${PREV}" "\${CUR_LINK}"
echo "==> current -> \${PREV}"

if systemctl list-unit-files | grep -q "^\${SYSTEMD_UNIT}.service"; then
  systemctl restart "\${SYSTEMD_UNIT}"
  systemctl --no-pager --full status "\${SYSTEMD_UNIT}" | sed -n '1,12p' || true
else
  echo "UYARI: systemd unit bulunamadi: \${SYSTEMD_UNIT}.service" >&2
  echo "UYARI: Node prosesini manuel restart etmeniz gerekebilir." >&2
fi
EOF

echo "==> Rollback tamamlandi."
