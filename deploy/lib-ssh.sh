# shellcheck shell=bash
# Ortak SSH/rsync/scp yardimcilari (deploy.sh ve deploy/all-in-one.sh)
# Gereksinim: DEPLOY_SSH ayarli; SSH_PASSWORD opsiyonel.
#
# Tek sifre: ControlMaster ile ilk SSH oturumu acilir, sonrakiler ayni mux soketini kullanir.
# Kapatmak icin: DISABLE_SSH_MUX=1

init_deploy_ssh_mux() {
  if [[ "${DISABLE_SSH_MUX:-0}" == "1" ]]; then
    SSH_COMMON_OPTS=(
      -o ConnectTimeout=12
      -o StrictHostKeyChecking=accept-new
    )
    return 0
  fi

  mkdir -p "${HOME}/.ssh" 2>/dev/null || true
  local mux_slug
  mux_slug="$(printf '%s' "${DEPLOY_SSH}" | tr -c 'A-Za-z0-9._-' '_')"

  SSH_COMMON_OPTS=(
    -o ConnectTimeout=12
    -o StrictHostKeyChecking=accept-new
    -o ControlMaster=auto
    -o "ControlPath=${HOME}/.ssh/cm-spornerede-${mux_slug}"
    -o ControlPersist=3600
  )
}

# init_deploy_ssh_mux cagrilmadan once bos olabilir; cagiran: assert sonrasi.
SSH_COMMON_OPTS=()

ssh_cmd_string() {
  local parts=()
  for opt in "${SSH_COMMON_OPTS[@]}"; do
    parts+=("${opt}")
  done
  printf '%q ' "${parts[@]}"
}

has_ssh_key_auth() {
  ssh "${SSH_COMMON_OPTS[@]}" -o BatchMode=yes -o PasswordAuthentication=no "${DEPLOY_SSH}" "echo ok" >/dev/null 2>&1
}

maybe_prompt_password() {
  if has_ssh_key_auth; then
    return 0
  fi

  if [[ -n "${SSH_PASSWORD:-}" ]]; then
    return 0
  fi

  if [[ -t 0 ]]; then
    read -r -s -p "SSH sifresi (${DEPLOY_SSH}): " SSH_PASSWORD
    echo ""
    export SSH_PASSWORD
    return 0
  fi

  echo "HATA: SSH anahtari ile giris yok ve interaktif sifre giremiyorum (TTY degil)." >&2
  echo "       Cozum: ssh-copy-id kurun veya SSH_PASSWORD env ile calistirin veya sshpass kurun." >&2
  exit 1
}

ssh_r() {
  if command -v sshpass >/dev/null 2>&1 && [[ -n "${SSH_PASSWORD:-}" ]]; then
    SSHPASS="${SSH_PASSWORD}" sshpass -e ssh "${SSH_COMMON_OPTS[@]}" "${DEPLOY_SSH}" "$@"
    return
  fi
  ssh "${SSH_COMMON_OPTS[@]}" "${DEPLOY_SSH}" "$@"
}

rsync_r() {
  local ssh_e
  ssh_e="ssh $(ssh_cmd_string)"
  if command -v sshpass >/dev/null 2>&1 && [[ -n "${SSH_PASSWORD:-}" ]]; then
    SSHPASS="${SSH_PASSWORD}" sshpass -e rsync -az --delete -e "${ssh_e}" "$@"
    return
  fi
  rsync -az --delete -e "${ssh_e}" "$@"
}

scp_r() {
  if command -v sshpass >/dev/null 2>&1 && [[ -n "${SSH_PASSWORD:-}" ]]; then
    SSHPASS="${SSH_PASSWORD}" sshpass -e scp "${SSH_COMMON_OPTS[@]}" "$@"
    return
  fi
  scp "${SSH_COMMON_OPTS[@]}" "$@"
}

# DEPLOY_SSH ornek metni gercek IP/domain ile degistirilmediyse erken uyar.
assert_deploy_ssh_not_placeholder() {
  local raw host hl
  raw="${DEPLOY_SSH:-}"
  if [[ "${raw}" != *@* ]]; then
    echo "HATA: DEPLOY_SSH 'kullanici@sunucu' formatinda olmali (ornek: root@45.155.19.82)." >&2
    exit 1
  fi
  host="${raw#*@}"
  hl="$(printf '%s' "${host}" | tr '[:upper:]' '[:lower:]')"

  if [[ "${raw}" == *SUNUCU_IP* ]] || [[ "${raw}" == *sunucu_ip* ]] || [[ "${hl}" == "sunucu_ip" ]] || [[ "${hl}" == "sunucu-ip" ]]; then
    echo "HATA: DEPLOY_SSH hala ornek metin: '${raw}'" >&2
    echo "       .env.deploy icinde SUNUCU_IP yerine gercek IP veya alan adi yazin (ornek: root@45.155.19.82)." >&2
    exit 1
  fi

  case "${hl}" in
    placeholder|your-server|changeme|example.invalid|localhost|gercek_ip_veya_alan_adi)
      echo "HATA: DEPLOY_SSH sunucu adi gecersiz/ornek gorunuyor: ${host}" >&2
      echo "       deploy/env.deploy.example satirini gercek IP ile degistirin (ornek: 45.155.19.82)." >&2
      exit 1
      ;;
  esac
}
