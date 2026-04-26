#!/usr/bin/env bash
# Sunucuda calisir (stdin ile SSH uzerinden). Eksik dizin/systemd/.env kontrolu + tamamlama.
# Ortam: REMOTE_BASE, SYSTEMD_UNIT (opsiyonel)

set -euo pipefail

REMOTE_BASE="${REMOTE_BASE:-/opt/spornerede}"
SYSTEMD_UNIT="${SYSTEMD_UNIT:-spornerede}"

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "UYARI: root degilsiniz; systemd ve /opt yazimi basarisiz olabilir." >&2
fi

APP_REPO_DIR="${APP_REPO_DIR:-${REMOTE_BASE}/repo}"

echo "==> remote-doctor: REMOTE_BASE=${REMOTE_BASE}"

mkdir -p "${REMOTE_BASE}/releases" "${REMOTE_BASE}/incoming/dist" "${REMOTE_BASE}/backups" "${REMOTE_BASE}/shared/pocketbase/pb_data" "${REMOTE_BASE}/shared/pocketbase/pb_public"

ENV_FILE="${REMOTE_BASE}/.env"
if [[ ! -f "${ENV_FILE}" ]]; then
  cat >"${ENV_FILE}" <<'EOF'
PORT=3000
HOST=127.0.0.1
SITE_URL=https://spornerede.net
EOF
  chmod 0600 "${ENV_FILE}"
  echo "==> Olusturuldu: ${ENV_FILE} (SMTP/DB icin duzenleyin)"
else
  echo "==> Var: ${ENV_FILE}"
fi

need_pkg() {
  local name="$1"
  command -v "${name}" >/dev/null 2>&1 || {
    echo "UYARI: '${name}' bulunamadi." >&2
    return 1
  }
  return 0
}

need_pkg node || true
need_pkg nginx || true
need_pkg rsync || true
need_pkg git || true
need_pkg curl || true
need_pkg python3 || echo "UYARI: python3 yok; deploy.sh --update-nginx nginx adiminda hata verebilir." >&2

if [[ -d "${APP_REPO_DIR}/.git" ]]; then
  echo "==> Repo var: ${APP_REPO_DIR}"
else
  echo "UYARI: Repo bulunamadi: ${APP_REPO_DIR}" >&2
  echo "       Ornek: git clone <repo-url> ${APP_REPO_DIR}" >&2
fi

UNIT_PATH="/etc/systemd/system/${SYSTEMD_UNIT}.service"
if [[ ! -f "${UNIT_PATH}" ]]; then
  cat >"${UNIT_PATH}" <<'UNIT'
[Unit]
Description=SporNerede.net (Astro SSR standalone)
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/spornerede/current
EnvironmentFile=/opt/spornerede/.env
ExecStart=/usr/bin/node /opt/spornerede/current/server/entry.mjs
Restart=always
RestartSec=3
User=root
Group=root

[Install]
WantedBy=multi-user.target
UNIT
  echo "==> systemd unit yazildi: ${UNIT_PATH}"
else
  echo "==> systemd unit zaten var: ${UNIT_PATH}"
fi

if command -v systemctl >/dev/null 2>&1; then
  systemctl daemon-reload
  systemctl enable "${SYSTEMD_UNIT}" 2>/dev/null || true
fi

PORT="$(awk -F= '$1=="PORT"{v=$2; gsub(/\n$/,"",v); gsub(/^[" ]+|[" ]+$/,"",v); print v}' "${ENV_FILE}" | tail -n 1)"
if [[ -z "${PORT}" ]]; then
  PORT="3000"
fi

if [[ -f "${REMOTE_BASE}/current/server/entry.mjs" ]] && command -v systemctl >/dev/null 2>&1; then
  systemctl restart "${SYSTEMD_UNIT}" 2>/dev/null || true
  echo "==> Servis restart denendi (${SYSTEMD_UNIT})"
elif [[ -L "${REMOTE_BASE}/current" || -d "${REMOTE_BASE}/current" ]]; then
  echo "UYARI: ${REMOTE_BASE}/current var ama server/entry.mjs yok; deploy bekleniyor." >&2
else
  echo "UYARI: Ilk deploy henuz yok (${REMOTE_BASE}/current)." >&2
fi

if command -v curl >/dev/null 2>&1; then
  if curl -sf --max-time 2 "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
    echo "==> Saglik: http://127.0.0.1:${PORT}/ yanit verdi"
  else
    echo "UYARI: http://127.0.0.1:${PORT}/ su an yanit vermedi (servis ayaga inmemis olabilir)." >&2
  fi
else
  echo "UYARI: curl yok; yerel port sagligi atlandi." >&2
fi

echo "==> remote-doctor tamam."
