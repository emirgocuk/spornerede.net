#!/usr/bin/env bash
# content-engine GSC secrets — kalici dizinden release'e kopyala
# Kalici: /opt/spornerede/content-engine-secrets/ (GIT disi, sync script ile yuklenir)

install_content_engine_secrets() {
  local dest_ce="$1"
  local secrets_src="${CONTENT_ENGINE_SECRETS_DIR:-/opt/spornerede/content-engine-secrets}"

  if [[ ! -d "${dest_ce}" ]]; then
    return 0
  fi

  if [[ ! -d "${secrets_src}" ]]; then
    echo "UYARI: ${secrets_src} yok — GSC OAuth icin: bash deploy/sync-content-engine-secrets.sh"
    return 0
  fi

  mkdir -p "${dest_ce}/secrets"
  rsync -a "${secrets_src}/" "${dest_ce}/secrets/"
  chmod 700 "${dest_ce}/secrets" 2>/dev/null || true
  find "${dest_ce}/secrets" -maxdepth 1 -type f -name '*.json' -exec chmod 600 {} + 2>/dev/null || true
  echo "==> content-engine secrets: ${secrets_src} -> ${dest_ce}/secrets"
}
