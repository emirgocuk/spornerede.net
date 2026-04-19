#!/usr/bin/env bash
# Sunucuda calistirin (root). FileZilla ile yuklenen dist/ icerigini release yapar.
#
# Onceden bir kez:
#   - Bu dosyayi /opt/spornerede/apply-ftp-upload.sh olarak koyun
#   - chmod +x /opt/spornerede/apply-ftp-upload.sh
#   - FileZilla ile build ciktisini /opt/spornerede/incoming/dist/ altina yukleyin
#
set -euo pipefail

REMOTE_BASE="${REMOTE_BASE:-/opt/spornerede}"
INCOMING="${REMOTE_BASE}/incoming/dist"
SYSTEMD_UNIT="${SYSTEMD_UNIT:-spornerede}"

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "HATA: root ile calistirin: sudo $0" >&2
  exit 1
fi

if [[ ! -f "${INCOMING}/server/entry.mjs" ]]; then
  echo "HATA: ${INCOMING}/server/entry.mjs yok." >&2
  echo "       FileZilla ile dist/ ICERIGINI ${INCOMING}/ altina yukleyin." >&2
  exit 1
fi

TS="$(date -u +"%Y%m%dT%H%M%SZ")"
RELEASE="${REMOTE_BASE}/releases/${TS}"
PREV_FILE="${REMOTE_BASE}/releases/.previous"

mkdir -p "${REMOTE_BASE}/releases"

CUR_LINK="${REMOTE_BASE}/current"
if [[ -L "${CUR_LINK}" || -e "${CUR_LINK}" ]]; then
  CUR="$(readlink -f "${CUR_LINK}" || true)"
  if [[ -n "${CUR}" && -d "${CUR}" ]]; then
    echo "${CUR}" >"${PREV_FILE}"
  fi
fi

mkdir -p "${RELEASE}"
rsync -a --delete "${INCOMING}/" "${RELEASE}/"

ln -sfn "${RELEASE}" "${CUR_LINK}"
echo "==> current -> ${RELEASE}"

if systemctl list-unit-files | grep -q "^${SYSTEMD_UNIT}.service"; then
  systemctl restart "${SYSTEMD_UNIT}"
  systemctl --no-pager --full status "${SYSTEMD_UNIT}" | sed -n '1,14p' || true
else
  echo "UYARI: systemd unit yok: ${SYSTEMD_UNIT}.service" >&2
fi

echo "==> Tamam. Site Node release ile guncellendi."
echo "    Not: Nginx hala statik sunuyorsa ayrica reverse-proxy gerekir (deploy.sh --update-nginx)."
