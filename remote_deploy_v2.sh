set -euo pipefail
REMOTE_BASE='/opt/spornerede'
SYSTEMD_UNIT='spornerede'

TS=$(date -u +"%Y%m%dT%H%M%SZ")
REMOTE_RELEASE="${REMOTE_BASE}/releases/${TS}"

echo "Creating release directory ${REMOTE_RELEASE}..."
mkdir -p "${REMOTE_RELEASE}"

echo "Moving dist-new to release..."
mv "${REMOTE_BASE}/dist-new/"* "${REMOTE_RELEASE}/"
rm -rf "${REMOTE_BASE}/dist-new"

CUR_LINK="${REMOTE_BASE}/current"
PREV_FILE="${REMOTE_BASE}/releases/.previous"

echo "Backing up previous version link..."
if [[ -L "${CUR_LINK}" || -e "${CUR_LINK}" ]]; then
  CUR=$(readlink -f "${CUR_LINK}")
  if [[ -n "${CUR}" && -d "${CUR}" ]]; then
    echo "${CUR}" > "${PREV_FILE}"
  fi
fi

echo "Switching symlink..."
ln -sfn "${REMOTE_RELEASE}" "${CUR_LINK}"

echo "Restarting service..."
if systemctl list-unit-files | grep -q "^${SYSTEMD_UNIT}.service"; then
  systemctl restart "${SYSTEMD_UNIT}"
  systemctl --no-pager --full status "${SYSTEMD_UNIT}" | sed -n '1,12p' || true
  echo "=> Deploy completed successfully."
else
  echo "Warning: System unit not found: ${SYSTEMD_UNIT}.service"
fi
