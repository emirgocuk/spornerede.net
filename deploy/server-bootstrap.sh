#!/usr/bin/env bash
# SporNerede.net — sunucuda BIR KEZ calistirin (root).
#
# Kurulum (sunucuda):
#   chmod +x server-bootstrap.sh && sudo ./server-bootstrap.sh
#
# Ya da lokal makineden (sifre/anahtar sizde).
# Git Bash:
#   ssh root@GERCEK_IP 'bash -s' < deploy/server-bootstrap.sh
# Windows PowerShell (stdin < calismaz; pipe kullan):
#   Get-Content -Raw deploy\server-bootstrap.sh | ssh root@GERCEK_IP "bash -s"
#
set -euo pipefail

REMOTE_BASE="${REMOTE_BASE:-/opt/spornerede}"
SYSTEMD_UNIT="${SYSTEMD_UNIT:-spornerede}"

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "HATA: root ile calistirin: sudo $0" >&2
  exit 1
fi

echo "==> Dizinler: ${REMOTE_BASE}"
mkdir -p "${REMOTE_BASE}/releases"

ENV_FILE="${REMOTE_BASE}/.env"
if [[ ! -f "${ENV_FILE}" ]]; then
  cat >"${ENV_FILE}" <<'EOF'
# Minimum (degerleri kendi ortaminiza gore duzeltin)
PORT=3000
HOST=127.0.0.1
SITE_URL=https://spornerede.net

# Asagidakiler ihtiyaca gore:
# DATABASE_URL=postgresql://...
# SMTP_HOST=...
# SMTP_PORT=587
# SMTP_USER=...
# SMTP_PASS=...
# MAIL_TO=...
EOF
  chmod 0600 "${ENV_FILE}"
  echo "==> Olusturuldu: ${ENV_FILE} (duzenleyin)"
else
  echo "==> Var: ${ENV_FILE}"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "UYARI: 'node' bulunamadi. Astro SSR icin Node 22+ kurulu olmali." >&2
else
  node -v
fi

if ! command -v nginx >/dev/null 2>&1; then
  echo "UYARI: nginx yok. Debian/Ubuntu: apt install -y nginx" >&2
else
  nginx -v
fi

UNIT_PATH="/etc/systemd/system/${SYSTEMD_UNIT}.service"
echo "==> systemd unit: ${UNIT_PATH}"
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

systemctl daemon-reload
systemctl enable "${SYSTEMD_UNIT}" 2>/dev/null || true

if [[ -L "${REMOTE_BASE}/current" || -d "${REMOTE_BASE}/current" ]]; then
  if [[ -f "${REMOTE_BASE}/current/server/entry.mjs" ]]; then
    systemctl restart "${SYSTEMD_UNIT}" || true
    systemctl --no-pager --full status "${SYSTEMD_UNIT}" | sed -n '1,14p' || true
  else
    echo "UYARI: ${REMOTE_BASE}/current/server/entry.mjs henuz yok." >&2
    echo "        Once gelistirici makineden: npm run deploy:prod" >&2
  fi
else
  echo "UYARI: ${REMOTE_BASE}/current henuz yok (ilk deploy bekleniyor)." >&2
fi

echo ""
echo "==> Sunucu bootstrap tamam."
echo "    Sonraki adim (gelistirici PC): npm run deploy:prod"
echo "    (.env.deploy icinde DEPLOY_SSH tanimli olsun)"
