#!/usr/bin/env bash
# Eski release klasorlerini budar. current symlink hedefi asla silinmez.
set -euo pipefail

APP_BASE="${APP_BASE:-/opt/spornerede}"
RELEASES_DIR="${RELEASES_DIR:-${APP_BASE}/releases}"
PREV_FILE="${PREV_FILE:-${RELEASES_DIR}/.previous}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
CURRENT_LINK="${CURRENT_LINK:-${APP_BASE}/current}"

if [[ ! -d "${RELEASES_DIR}" ]]; then
  echo "[prune-releases] releases dizini yok: ${RELEASES_DIR}"
  exit 0
fi

CURRENT=""
if [[ -L "${CURRENT_LINK}" || -e "${CURRENT_LINK}" ]]; then
  CURRENT="$(readlink -f "${CURRENT_LINK}" 2>/dev/null || true)"
fi

mapfile -t ALL < <(find "${RELEASES_DIR}" -maxdepth 1 -mindepth 1 -type d -regextype posix-extended \
  -regex '.*/[0-9]{8}T[0-9]{6}Z' -printf '%f\n' 2>/dev/null | sort)

if [[ ${#ALL[@]} -eq 0 ]]; then
  echo "[prune-releases] release yok."
  exit 0
fi

KEEP_N="${KEEP_RELEASES}"
if [[ ${#ALL[@]} -le ${KEEP_N} ]]; then
  echo "[prune-releases] ${#ALL[@]} release (limit ${KEEP_N}); budama gerek yok."
else
  mapfile -t TO_KEEP < <(printf '%s\n' "${ALL[@]}" | tail -n "${KEEP_N}")
  declare -A KEEP_SET=()
  for name in "${TO_KEEP[@]}"; do
    KEEP_SET["${name}"]=1
  done
  if [[ -n "${CURRENT}" ]]; then
    KEEP_SET["$(basename "${CURRENT}")"]=1
  fi

  REMOVED=0
  FREED=0
  for name in "${ALL[@]}"; do
    if [[ -n "${KEEP_SET[${name}]+x}" ]]; then
      continue
    fi
    TARGET="${RELEASES_DIR}/${name}"
    if [[ -n "${CURRENT}" && "${TARGET}" == "${CURRENT}" ]]; then
      continue
    fi
    SIZE="$(du -sk "${TARGET}" 2>/dev/null | awk '{print $1}')"
    rm -rf "${TARGET}"
    REMOVED=$((REMOVED + 1))
    FREED=$((FREED + SIZE))
    echo "[prune-releases] silindi: ${name}"
  done
  echo "[prune-releases] ${REMOVED} release silindi (~$((FREED / 1024)) MB)."
fi

# Gecici / bozuk klasorler
find "${RELEASES_DIR}" -maxdepth 1 -type d -name '*-temp' -exec rm -rf {} + 2>/dev/null || true

# .previous: tutulan en yeni iki release'ten onceki
mapfile -t REMAINING < <(find "${RELEASES_DIR}" -maxdepth 1 -mindepth 1 -type d -regextype posix-extended \
  -regex '.*/[0-9]{8}T[0-9]{6}Z' -printf '%f\n' 2>/dev/null | sort)
if [[ ${#REMAINING[@]} -ge 2 ]]; then
  PREV_NAME="${REMAINING[-2]}"
  printf '%s\n' "${RELEASES_DIR}/${PREV_NAME}" > "${PREV_FILE}"
  echo "[prune-releases] .previous -> ${PREV_NAME}"
fi

df -h "${APP_BASE}" | tail -1
