#!/usr/bin/env bash
# content-engine.env icindeki PocketBase kimligini ana /opt/spornerede/.env ile hizalar
set -euo pipefail
APP_BASE="${APP_BASE:-/opt/spornerede}"
MAIN_ENV="${APP_BASE}/.env"
CE_ENV="${APP_BASE}/content-engine.env"

if [[ ! -f "${MAIN_ENV}" || ! -f "${CE_ENV}" ]]; then
  echo "HATA: ${MAIN_ENV} veya ${CE_ENV} yok"
  exit 1
fi

get_val() {
  local file="$1" key="$2"
  grep -E "^${key}=" "$file" | head -1 | cut -d= -f2- | sed 's/^["'\'' ]//;s/["'\'' ]$//'
}

TMP="$(mktemp)"
while IFS= read -r line || [[ -n "$line" ]]; do
  if [[ "$line" =~ ^POCKETBASE_URL= ]]; then
    echo "POCKETBASE_URL=$(get_val "${MAIN_ENV}" POCKETBASE_URL)"
  elif [[ "$line" =~ ^POCKETBASE_ADMIN_EMAIL= ]]; then
    echo "POCKETBASE_ADMIN_EMAIL=$(get_val "${MAIN_ENV}" POCKETBASE_ADMIN_EMAIL)"
  elif [[ "$line" =~ ^POCKETBASE_ADMIN_PASSWORD= ]]; then
    echo "POCKETBASE_ADMIN_PASSWORD=$(get_val "${MAIN_ENV}" POCKETBASE_ADMIN_PASSWORD)"
  else
    printf '%s\n' "$line"
  fi
done < "${CE_ENV}" > "${TMP}"
mv "${TMP}" "${CE_ENV}"
chmod 600 "${CE_ENV}"

if [[ -d "${APP_BASE}/current/content-engine" ]]; then
  cp "${CE_ENV}" "${APP_BASE}/current/content-engine/.env"
  chmod 600 "${APP_BASE}/current/content-engine/.env"
fi

echo "content-engine.env PocketBase alanlari ana .env ile hizalandi."
