set -euo pipefail
REMOTE_BASE='/opt/spornerede'
SYSTEMD_UNIT='spornerede'

echo "Installing unzip if needed..."
if ! command -v unzip >/dev/null 2>&1; then
  apt-get update && apt-get install -y unzip
fi

TS=$(date -u +"%Y%m%dT%H%M%SZ")
REMOTE_RELEASE="${REMOTE_BASE}/releases/${TS}"

echo "Creating release directory ${REMOTE_RELEASE}..."
mkdir -p "${REMOTE_RELEASE}"

cd "${REMOTE_BASE}"
echo "Extracting zip..."
unzip -q dist.zip -d "${REMOTE_RELEASE}-temp"

mv "${REMOTE_RELEASE}-temp/dist/"* "${REMOTE_RELEASE}/"
rm -rf "${REMOTE_RELEASE}-temp"
rm dist.zip

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
