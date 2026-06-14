#!/usr/bin/env bash
set -euo pipefail

# SporNerede.net — deploy (Astro SSR @astrojs/node standalone)
#
# Bu script:
# - Lokal `npm ci` (varsa) + `npm run build`
# - `dist/` ciktisini sunucuda timestamp'li release klasorune rsync eder
# - `${REMOTE_BASE}/current` symlink'ini yeni release'e cevirir
# - Onceki release yolunu `${REMOTE_BASE}/releases/.previous` icine yazar
# - `${SYSTEMD_UNIT}` varsa `systemctl restart` yapar
#
# Kurulum (bir kere):
# 1) Sunucuda dizin olustur:
#    sudo mkdir -p /opt/spornerede/releases
# 2) systemd unit ekle (ornek dosya): `deploy/spornerede.service.example`
# 3) Sunucuda `/opt/spornerede/.env` dosyasini olustur (GIT'e koyma)
#
# Kullanim:
#   bash deploy.sh --ssh root@sunucu-ip
#
# Alternatif:
#   export DEPLOY_SSH="root@sunucu-ip"   # Git Bash
#   $env:DEPLOY_SSH="root@sunucu-ip"     # PowerShell (sonra: bash deploy.sh)
#
# Opsiyonel kalici ayar (GIT'e ekleme):
#   ./.env.deploy icine DEPLOY_SSH=... yazin (bu dosya .gitignore'da)
#
# Sifreli SSH (gecici):
# - Tercih: ssh anahtari (`ssh-copy-id`)
# - Alternatif: bu script TTY'de calisirken root sifresini gizli olarak sorar
# - Alternatif: `SSH_PASSWORD` ortam degiskeni (sohbete yapistirmayin)
# - `sshpass` varsa sifre otomatik enjekte edilir; yoksa interaktif ssh/rsync kullanilir
# - Tek sifre: SSH ControlMaster (deploy/lib-ssh.sh). Kapatmak: DISABLE_SSH_MUX=1
#
# Rollback:
#   bash rollback.sh
#
# Notlar:
# - Kalici cozum: `ssh-copy-id` ile anahtar kurmak
# - Eski `dist/` upload (nginx root) yaklasimi SSR icin yeterli degildir; bu script standalone `dist/` dagitir.
# - Prod hala "coming soon" gorunuyorsa: nginx hala statik `root`/`try_files` sunuyor olabilir.
#   Cozum: reverse proxy (Node). Ilk kurulum icin:
#     bash deploy.sh --ssh root@IP --update-nginx

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
  bash deploy.sh --ssh root@SUNUCU_IP

Opsiyonlar:
  --ssh USER@HOST     DEPLOY_SSH yerine (PowerShell'de en pratik yol)
  --skip-build        Lokal npm ci/build atla (dist/ hazir olmali; all-in-one icin)
  --update-nginx      Sunucuda Nginx vhost'unu Node reverse-proxy olacak sekilde yazar/yeniler
  --nginx-site-path PATH
                      Yazilacak site dosyasi (varsayilan: /etc/nginx/sites-available/spornerede-app)
  --nginx-template PATH
                      Lokal nginx sablonu (varsayilan: deploy/nginx-spornerede.conf.tpl)
  -h, --help          Bu yardim

Ortam degiskenleri:
  DEPLOY_SSH          zorunlu (ornek: root@1.2.3.4)
  REMOTE_BASE         opsiyonel (varsayilan: /opt/spornerede)
  SYSTEMD_UNIT        opsiyonel (varsayilan: spornerede)
  SSH_PASSWORD        opsiyonel (sohbete yapistirmayin)
  DISABLE_SSH_MUX     1 ise ControlMaster kapali (cok nadir gerekir)
  UPDATE_NGINX        opsiyonel (1 ise --update-nginx ile ayni)
  NGINX_SITE_PATH     opsiyonel (varsayilan: /etc/nginx/sites-available/spornerede-app)
  NGINX_SITE_ENABLED   opsiyonel (varsayilan: /etc/nginx/sites-enabled/spornerede-app)
  NGINX_TEMPLATE      opsiyonel (lokal tpl yolu)
  NGINX_SERVER_NAME    opsiyonel (varsayilan: spornerede.net)

PowerShell notu:
  $env:DEPLOY_SSH="root@IP"
  bash deploy.sh
EOF
}

UPDATE_NGINX="${UPDATE_NGINX:-0}"
NGINX_SITE_PATH="${NGINX_SITE_PATH:-/etc/nginx/sites-available/spornerede-app}"
NGINX_SITE_ENABLED="${NGINX_SITE_ENABLED:-/etc/nginx/sites-enabled/spornerede-app}"
NGINX_TEMPLATE="${NGINX_TEMPLATE:-${ROOT_DIR}/deploy/nginx-spornerede.conf.tpl}"
NGINX_SERVER_NAME="${NGINX_SERVER_NAME:-spornerede.net}"
SKIP_BUILD="${SKIP_BUILD:-0}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ssh)
      DEPLOY_SSH="${2:-}"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD="1"
      shift 1
      ;;
    --update-nginx)
      UPDATE_NGINX="1"
      shift 1
      ;;
    --nginx-site-path)
      NGINX_SITE_PATH="${2:-}"
      shift 2
      ;;
    --nginx-template)
      NGINX_TEMPLATE="${2:-}"
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
  echo "       Ya da:      bash deploy.sh --ssh root@IP" >&2
  echo "       Ya da:      ./.env.deploy dosyasina DEPLOY_SSH yazin (GIT'e ekleme)" >&2
  exit 1
fi

# shellcheck disable=SC1091
source "${ROOT_DIR}/deploy/lib-ssh.sh"
assert_deploy_ssh_not_placeholder
init_deploy_ssh_mux

maybe_prompt_password

# Uzun npm build oncesi mux master acilsin; yoksa ilk SSH rsync'e kadar gecikir, sifre tekrarlanir.
if ! has_ssh_key_auth; then
  echo "==> SSH oturumu (tek sifre icin); bir kez dogrulama"
  ssh_r "true"
fi

warn_if_windows_dev_server() {
  # Windows'ta 'npm run dev' acikken 'npm ci' / 'npm install' siklikla EPERM ile patlar
  # (native .node dosyalari kilitlenir). Kullaniciya erken uyar.
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
      2>/dev/null | tr -d '\n'
  )"

  if [[ -z "${busy}" ]]; then
    return 0
  fi

  local pid name
  pid="${busy%%|*}"
  name="${busy#*|}"

  echo "UYARI: 4321 portunda bir proses dinliyor gibi gorunuyor (PID=${pid}, name=${name})." >&2
  echo "        Bu genelde 'npm run dev' demektir. Acikken 'npm ci' cogu zaman Windows'ta EPERM verir." >&2
  echo "        Cozum: dev server'i durdurun (Ctrl+C) veya PID'yi kapat:" >&2
  echo "          taskkill /PID ${pid} /F" >&2
  echo "        Bu uyariyi gormek istemiyorsan: SKIP_DEV_SERVER_CHECK=1 bash deploy.sh ..." >&2
}

warn_if_windows_dev_server

if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  echo "==> Lokal build basliyor"
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
  npm run build
else
  echo "==> Lokal build atlandi (--skip-build)"
fi

if [[ ! -d dist ]]; then
  echo "HATA: dist/ bulunamadi. Build basarisiz olabilir." >&2
  exit 1
fi

TS="$(date -u +"%Y%m%dT%H%M%SZ")"
REMOTE_RELEASE="${REMOTE_BASE}/releases/${TS}"

echo "==> Deploy hedefi"
echo "    SSH=${DEPLOY_SSH}"
echo "    REMOTE_RELEASE=${REMOTE_RELEASE}"

ssh_r bash -s <<EOF
set -euo pipefail
REMOTE_BASE="${REMOTE_BASE}"
REMOTE_RELEASE="${REMOTE_RELEASE}"
SYSTEMD_UNIT="${SYSTEMD_UNIT}"

mkdir -p "\${REMOTE_BASE}/releases"

CUR_LINK="\${REMOTE_BASE}/current"
PREV_FILE="\${REMOTE_BASE}/releases/.previous"

if [[ -L "\${CUR_LINK}" || -e "\${CUR_LINK}" ]]; then
  CUR="\$(readlink -f "\${CUR_LINK}")"
  if [[ -n "\${CUR}" && -d "\${CUR}" ]]; then
    echo "\${CUR}" > "\${PREV_FILE}"
  fi
fi

mkdir -p "\${REMOTE_RELEASE}"
EOF

echo "==> rsync: ./dist/ -> ${REMOTE_RELEASE}/"
rsync_r "${ROOT_DIR}/dist/" "${DEPLOY_SSH}:${REMOTE_RELEASE}/"
scp_r "${ROOT_DIR}/package.json" "${DEPLOY_SSH}:${REMOTE_RELEASE}/package.json"
if [[ -f "${ROOT_DIR}/package-lock.json" ]]; then
  scp_r "${ROOT_DIR}/package-lock.json" "${DEPLOY_SSH}:${REMOTE_RELEASE}/package-lock.json"
fi

ssh_r bash -s <<EOF
set -euo pipefail
REMOTE_BASE="${REMOTE_BASE}"
REMOTE_RELEASE="${REMOTE_RELEASE}"
SYSTEMD_UNIT="${SYSTEMD_UNIT}"

CUR_LINK="\${REMOTE_BASE}/current"
(cd "\${REMOTE_RELEASE}" && npm ci --omit=dev)
ln -sfn "\${REMOTE_RELEASE}" "\${CUR_LINK}"
echo "==> current -> \${REMOTE_RELEASE}"

if systemctl list-unit-files | grep -q "^\${SYSTEMD_UNIT}.service"; then
  systemctl restart "\${SYSTEMD_UNIT}"
  systemctl --no-pager --full status "\${SYSTEMD_UNIT}" | sed -n '1,12p' || true
else
  echo "UYARI: systemd unit bulunamadi: \${SYSTEMD_UNIT}.service" >&2
  echo "UYARI: Node prosesini manuel restart etmeniz gerekebilir." >&2
fi
EOF

echo "==> Deploy tamamlandi."
echo "    Hizli kontrol: curl -I https://spornerede.net/ | head"

if [[ "${UPDATE_NGINX}" == "1" ]]; then
  if [[ ! -f "${NGINX_TEMPLATE}" ]]; then
    echo "HATA: nginx sablonu bulunamadi: ${NGINX_TEMPLATE}" >&2
    exit 1
  fi

  echo "==> Nginx reverse-proxy guncelleniyor"
  echo "    SITE=${NGINX_SERVER_NAME}"
  echo "    OUT=${NGINX_SITE_PATH}"
  echo "    ENABLE=${NGINX_SITE_ENABLED}"

  if ! command -v python3 >/dev/null 2>&1; then
    echo "HATA: python3 bulunamadi (nginx config render icin gerekli)." >&2
    exit 1
  fi

  if ! command -v scp >/dev/null 2>&1; then
    echo "HATA: scp bulunamadi (OpenSSH gerekli)." >&2
    exit 1
  fi

  META="$(mktemp -t spornerede-nginx-meta.XXXXXX.env)"
  RENDERED="$(mktemp -t spornerede-nginx-rendered.XXXXXX.conf)"
  cleanup_nginx_tmp() {
    rm -f "${META}" "${RENDERED}" || true
  }
  trap cleanup_nginx_tmp EXIT

  ENABLED_BASENAME="$(basename "${NGINX_SITE_ENABLED}")"

  echo "==> Sunucudan nginx meta okunuyor"
  ssh_r "bash -s" -- "${REMOTE_BASE}" "${NGINX_SERVER_NAME}" "${ENABLED_BASENAME}" >"${META}" <<'EOS'
set -euo pipefail
REMOTE_BASE="${1:?}"
SERVER_NAME="${2:?}"
SKIP_BASENAME="${3:-}"
ENV_FILE="${REMOTE_BASE}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "HATA: ${ENV_FILE} bulunamadi (PORT/HOST okunamadi)." >&2
  exit 1
fi

get_env() {
  local key="$1"
  awk -F= -v k="${key}" '
    $1 == k {
      v=$2
      gsub(/\n$/, "", v)
      gsub(/^[" ]+|[" ]+$/, "", v)
      print v
    }
  ' "${ENV_FILE}" | tail -n 1
}

PORT="$(get_env PORT)"
HOST="$(get_env HOST)"

if [[ -z "${PORT}" ]]; then
  PORT="3000"
fi

if [[ -z "${HOST}" || "${HOST}" == "0.0.0.0" ]]; then
  UPSTREAM_HOST="127.0.0.1"
else
  UPSTREAM_HOST="${HOST}"
fi

find_existing_vhost() {
  local d f base
  for d in /etc/nginx/sites-enabled /etc/nginx/conf.d; do
    if [[ ! -d "${d}" ]]; then
      continue
    fi
    shopt -s nullglob
    for f in "${d}"/*; do
      base="$(basename "${f}")"
      if [[ -n "${SKIP_BASENAME}" && "${base}" == "${SKIP_BASENAME}" ]]; then
        continue
      fi
      if [[ -f "${f}" ]] && grep -Eq "server_name[[:space:]].*${SERVER_NAME}" "${f}" 2>/dev/null; then
        echo "${f}"
        return 0
      fi
    done
  done
  return 1
}

EXISTING="$(find_existing_vhost || true)"

python3 - <<'PY' "${UPSTREAM_HOST}" "${PORT}" "${EXISTING:-}" "${SERVER_NAME}"
import base64, os, re, sys
from pathlib import Path

upstream_host = sys.argv[1]
upstream_port = sys.argv[2]
existing = sys.argv[3] or ""
server_name = sys.argv[4]

def b64s(s: str) -> str:
    return base64.b64encode(s.encode("utf-8")).decode("ascii")

def pick(text: str, pattern: str) -> str:
    m = re.search(pattern, text, flags=re.IGNORECASE | re.MULTILINE)
    return m.group(0).strip() if m else ""

has_ssl = 0
listen443 = ""
ssl_cert = ""
ssl_key = ""
ssl_trusted = ""
acme = ""
includes: list[str] = []

if existing:
    p = Path(existing)
    text = p.read_text(encoding="utf-8", errors="ignore") if p.exists() else ""

    m = re.search(r"location\s+\^~\s+/\.well-known/acme-challenge/\s*\{[\s\S]*?\n\}", text, flags=re.IGNORECASE)
    if m:
        acme = m.group(0).rstrip() + "\n"

    ssl_cert = pick(text, r"^\s*ssl_certificate\s+[^;]+;\s*$")
    ssl_key = pick(text, r"^\s*ssl_certificate_key\s+[^;]+;\s*$")
    ssl_trusted = pick(text, r"^\s*ssl_trusted_certificate\s+[^;]+;\s*$")

    m = re.search(r"^\s*listen\s+(\[::\]:)?443[^;]*;\s*$", text, flags=re.IGNORECASE | re.MULTILINE)
    if m:
        listen443 = m.group(0).strip()

    for line in text.splitlines():
        s = line.strip()
        if "letsencrypt/options-ssl-nginx.conf" in s and s.startswith("include "):
            includes.append(s)
        if s.startswith("ssl_dhparam "):
            includes.append(s)

    if ssl_cert and ssl_key and listen443:
        has_ssl = 1

print(f"UPSTREAM_HOST={upstream_host}")
print(f"UPSTREAM_PORT={upstream_port}")
print(f"EXISTING_FILE={existing}")
print(f"HAS_SSL={has_ssl}")
print(f"LISTEN443_B64={b64s(listen443)}")
print(f"SSL_CERT_B64={b64s(ssl_cert)}")
print(f"SSL_KEY_B64={b64s(ssl_key)}")
print(f"SSL_TRUSTED_B64={b64s(ssl_trusted)}")
print(f"ACME_BLOCK_B64={b64s(acme)}")
print(f"SSL_INCLUDES_B64={b64s(chr(10).join(includes))}")
print(f"SERVER_NAME={server_name}")
PY

EOS

  # shellcheck disable=SC1090
  source "${META}"

  b64_decode() {
    local b64="$1"
    if [[ -z "${b64}" ]]; then
      printf "%s" ""
      return 0
    fi
    python3 - <<'PY' "${b64}"
import base64, sys
print(base64.b64decode(sys.argv[1].encode("ascii")).decode("utf-8", errors="strict"), end="")
PY
  }

  LISTEN443="$(b64_decode "${LISTEN443_B64:-}")"
  SSL_CERT="$(b64_decode "${SSL_CERT_B64:-}")"
  SSL_KEY="$(b64_decode "${SSL_KEY_B64:-}")"
  SSL_TRUSTED="$(b64_decode "${SSL_TRUSTED_B64:-}")"
  ACME_BLOCK="$(b64_decode "${ACME_BLOCK_B64:-}")"
  SSL_INCLUDES="$(b64_decode "${SSL_INCLUDES_B64:-}")"

  LOCATION_PROXY="$(cat <<EOF
  location /api/admin/content-engine/ {
    proxy_pass http://${UPSTREAM_HOST}:${UPSTREAM_PORT};
    proxy_http_version 1.1;

    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$http_x_forwarded_proto;

    proxy_read_timeout 360s;
    proxy_send_timeout 360s;
  }

  location / {
    proxy_pass http://${UPSTREAM_HOST}:${UPSTREAM_PORT};
    proxy_http_version 1.1;

    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$http_x_forwarded_proto;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection \$connection_upgrade;

    proxy_read_timeout 60s;
    proxy_send_timeout 60s;
  }
EOF
)"

  if [[ "${HAS_SSL:-0}" == "1" ]]; then
    HTTP_SERVER_BLOCK="$(cat <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name ${NGINX_SERVER_NAME};

EOF
)"
    if [[ -n "${ACME_BLOCK}" ]]; then
      HTTP_SERVER_BLOCK+="${ACME_BLOCK}"$'\n'
    fi
    HTTP_SERVER_BLOCK+="$(cat <<'EOF'
  location / {
    return 301 https://$host$request_uri;
  }
}
EOF
)"
    SSL_SERVER_BLOCK="$(cat <<EOF
server {
${LISTEN443}
  server_name ${NGINX_SERVER_NAME};

${SSL_CERT}
${SSL_KEY}
${SSL_TRUSTED}
EOF
)"
    if [[ -n "${SSL_INCLUDES}" ]]; then
      SSL_SERVER_BLOCK+="${SSL_INCLUDES}"$'\n'
    fi
    SSL_SERVER_BLOCK+="${LOCATION_PROXY}"$'\n}'$'\n'
  else
    HTTP_SERVER_BLOCK="$(cat <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name ${NGINX_SERVER_NAME};

EOF
)"
    if [[ -n "${ACME_BLOCK}" ]]; then
      HTTP_SERVER_BLOCK+="${ACME_BLOCK}"$'\n'
    fi
    HTTP_SERVER_BLOCK+="${LOCATION_PROXY}"$'\n}'$'\n'
    SSL_SERVER_BLOCK=""
  fi

  if [[ "${HAS_SSL:-0}" == "1" ]]; then
    if [[ -z "${LISTEN443}" || -z "${SSL_CERT}" || -z "${SSL_KEY}" ]]; then
      echo "HATA: Mevcut vhost'tan SSL satirlari okunamadi." >&2
      echo "       Cozum: --nginx-site-path ile dogru dosyayi isaretleyin veya sunucuda ssl_certificate/ssl_certificate_key bulunan spornerede vhost'unu duzeltin." >&2
      exit 1
    fi
  fi

  python3 - <<'PY' "${NGINX_TEMPLATE}" "${RENDERED}" "${HTTP_SERVER_BLOCK}" "${SSL_SERVER_BLOCK}"
import sys
from pathlib import Path

tpl_path, out_path, http_block, ssl_block = sys.argv[1:5]
tpl = Path(tpl_path).read_text(encoding="utf-8")
out = (
    tpl.replace("__HTTP_SERVER_BLOCK__", http_block.rstrip() + "\n")
    .replace("__SSL_SERVER_BLOCK__", (ssl_block.rstrip() + "\n") if ssl_block.strip() else "")
)
Path(out_path).write_text(out, encoding="utf-8")
PY

  REMOTE_TMP="/tmp/spornerede.nginx.${TS}.conf"
  echo "==> Nginx config yukleniyor: ${REMOTE_TMP}"
  scp_r "${RENDERED}" "${DEPLOY_SSH}:${REMOTE_TMP}"

  echo "==> Nginx config uygulaniyor"
  ssh_r "bash -s" -- "${REMOTE_TMP}" "${NGINX_SITE_PATH}" "${NGINX_SITE_ENABLED}" "${EXISTING_FILE:-}" <<'EOS'
set -euo pipefail
SRC="${1:?}"
DST="${2:?}"
ENABLED="${3:?}"
EXISTING="${4:-}"

install -d "$(dirname "${DST}")" "$(dirname "${ENABLED}")"

if [[ -n "${EXISTING}" && -f "${EXISTING}" ]]; then
  ts="$(date -u +"%Y%m%dT%H%M%SZ")"
  dis="/etc/nginx/sites-enabled.disabled"
  install -d "${dis}"
  mv "${EXISTING}" "${dis}/$(basename "${EXISTING}").bak.${ts}"
  echo "==> Eski vhost devre disi: ${EXISTING} -> ${dis}/$(basename "${EXISTING}").bak.${ts}"
fi

mv "${SRC}" "${DST}"
chmod 0644 "${DST}"
ln -sfn "${DST}" "${ENABLED}"

command -v nginx >/dev/null 2>&1
nginx -t
systemctl reload nginx || nginx -s reload

echo "==> Nginx OK"
EOS

  echo "==> Nginx guncellemesi tamamlandi."
  echo "    Not: Cloudflare cache agresifse purge gerekebilir."
fi
