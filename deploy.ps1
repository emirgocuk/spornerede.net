# SporNerede.net — Windows PowerShell deploy (SSH + tar)
# Gereksinim: OpenSSH (ssh, scp), tar; sunucuda bash.
# Sifresiz icin: ssh-copy-id veya Windows'ta SSH anahtari.
#
#   npm run deploy:win
#
# .env.deploy: DEPLOY_SSH=root@IP   opsiyonel: REMOTE_BASE, SYSTEMD_UNIT
# Nginx: bash (Git Bash) varsa deploy.sh --update-nginx; yoksa -NoUpdateNginx veya sonra deploy:quick

param(
  [string] $DeploySsh = "",
  [string] $RemoteBase = "",
  [string] $SystemdUnit = "",
  [switch] $Full,
  [switch] $NoUpdateNginx
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
Set-Location $Root

function Read-DotEnvDeploy {
  $path = Join-Path $Root ".env.deploy"
  if (-not (Test-Path $path)) { return @{} }
  $h = @{}
  Get-Content -LiteralPath $path -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if ($line.Length -eq 0 -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $k = $line.Substring(0, $idx).Trim()
    $v = $line.Substring($idx + 1).Trim()
    if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Substring(1, $v.Length - 2) }
    if ($v.StartsWith("'") -and $v.EndsWith("'")) { $v = $v.Substring(1, $v.Length - 2) }
    $h[$k] = $v
  }
  $h
}

function Assert-DeploySsh([string] $raw) {
  if ($raw -notmatch "@") {
    throw "DEPLOY_SSH 'kullanici@sunucu' olmali. .env.deploy: DEPLOY_SSH=root@45.155.19.82"
  }
  $hostPart = ($raw -split "@", 2)[1]
  $hl = $hostPart.ToLowerInvariant()
  if ($raw -match "SUNUCU_IP" -or $hl -eq "sunucu_ip" -or $hl -eq "sunucu-ip" -or $raw -match "GERCEK_IP") {
    throw "DEPLOY_SSH hala ornek metin. .env.deploy icinde gercek IP yazin."
  }
}

function Require-Cmd([string] $name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Komut bulunamadi: $name. OpenSSH (ssh, scp) ve tar gerekli."
  }
}

# Git Bash / MSYS: `bash D:\foo\deploy.sh` Windows yolunu kirpar; Unix yolu + cd kullan.
function ConvertToGitBashPath([string] $WindowsPath) {
  $full = (Resolve-Path -LiteralPath $WindowsPath).Path
  $cygpath = Get-Command cygpath -ErrorAction SilentlyContinue
  if ($cygpath) {
    return (& cygpath -u $full).Trim()
  }
  if ($full -match '^([A-Za-z]):\\(.*)$') {
    $drive = $Matches[1].ToLowerInvariant()
    $rest = $Matches[2] -replace '\\', '/'
    return "/$drive/$rest"
  }
  return ($full -replace '\\', '/')
}

Require-Cmd "ssh"
Require-Cmd "scp"
Require-Cmd "tar"

$envMap = Read-DotEnvDeploy
if (-not $DeploySsh) { $DeploySsh = $envMap["DEPLOY_SSH"] }
if (-not $RemoteBase) { $RemoteBase = $(if ($envMap["REMOTE_BASE"]) { $envMap["REMOTE_BASE"] } else { "/opt/spornerede" }) }
if (-not $SystemdUnit) { $SystemdUnit = $(if ($envMap["SYSTEMD_UNIT"]) { $envMap["SYSTEMD_UNIT"] } else { "spornerede" }) }

if (-not $DeploySsh) {
  throw "DEPLOY_SSH bos. .env.deploy veya: -DeploySsh root@IP"
}
Assert-DeploySsh $DeploySsh

Write-Host "==> SporNerede deploy (PowerShell)" -ForegroundColor Cyan
Write-Host "    $DeploySsh  REMOTE_BASE=$RemoteBase"

if ($Full) {
  Write-Host "==> Lokal: npm ci" -ForegroundColor Yellow
  if (Test-Path (Join-Path $Root "package-lock.json")) { npm ci } else { npm install }
} else {
  Write-Host "==> Lokal: npm run build (bagimlilik icin once: -Full veya npm ci)" -ForegroundColor Yellow
}

Write-Host "==> Lokal: npm run build" -ForegroundColor Yellow
npm run build

$distPath = Join-Path $Root "dist"
if (-not (Test-Path $distPath)) { throw "dist/ yok." }

$stamp = Get-Date -Format "yyyyMMddTHHmmss"
$localTgz = Join-Path $env:TEMP "spornerede-dist-$stamp.tgz"
$remoteTgz = "/tmp/spornerede-upload-$stamp.tgz"
$remoteSh = "/tmp/spornerede-deploy-$stamp.sh"

Write-Host "==> Arsiv: tar.gz" -ForegroundColor Yellow
if (Test-Path $localTgz) { Remove-Item $localTgz -Force }
& tar -czf $localTgz -C $distPath .

$remoteBody = @'
#!/usr/bin/env bash
set -euo pipefail
REMOTE_BASE="__RB__"
SYSTEMD_UNIT="__SU__"
TGZ="__TG__"
TS=$(date -u +"%Y%m%dT%H%M%SZ")
RELEASE="${REMOTE_BASE}/releases/${TS}"
PREV_FILE="${REMOTE_BASE}/releases/.previous"
CUR_LINK="${REMOTE_BASE}/current"

mkdir -p "${REMOTE_BASE}/releases"
if [[ -L "${CUR_LINK}" || -e "${CUR_LINK}" ]]; then
  cur=$(readlink -f "${CUR_LINK}" || true)
  if [[ -n "${cur}" && -d "${cur}" ]]; then
    echo "${cur}" > "${PREV_FILE}"
  fi
fi
mkdir -p "${RELEASE}"
tar xzf "${TGZ}" -C "${RELEASE}"
rm -f "${TGZ}"
if [[ -f "${REMOTE_BASE}/package.json" ]]; then
  cp "${REMOTE_BASE}/package.json" "${RELEASE}/package.json"
fi
if [[ -f "${REMOTE_BASE}/package-lock.json" ]]; then
  cp "${REMOTE_BASE}/package-lock.json" "${RELEASE}/package-lock.json"
fi
if [[ -f "${RELEASE}/package-lock.json" ]]; then
  (cd "${RELEASE}" && npm ci --omit=dev)
else
  echo "UYARI: package-lock.json yok, npm ci atlandi" >&2
fi
ln -sfn "${RELEASE}" "${CUR_LINK}"
echo "==> current -> ${RELEASE}"
# list-unit-files bazen özel unit'i göstermeyebilir; dosya / show ile kontrol
if [[ -f "/etc/systemd/system/${SYSTEMD_UNIT}.service" ]] || \
   [[ -f "/lib/systemd/system/${SYSTEMD_UNIT}.service" ]] || \
   systemctl show "${SYSTEMD_UNIT}.service" &>/dev/null; then
  systemctl restart "${SYSTEMD_UNIT}.service" || systemctl restart "${SYSTEMD_UNIT}"
  systemctl --no-pager --full status "${SYSTEMD_UNIT}.service" 2>/dev/null | sed -n '1,12p' || \
  systemctl --no-pager --full status "${SYSTEMD_UNIT}" | sed -n '1,12p' || true
else
  echo "UYARI: systemd unit bulunamadi: ${SYSTEMD_UNIT}.service — elle: systemctl restart ${SYSTEMD_UNIT}" >&2
fi
'@
$remoteBody = $remoteBody.Replace("__RB__", $RemoteBase).Replace("__SU__", $SystemdUnit).Replace("__TG__", $remoteTgz)

$localSh = Join-Path $env:TEMP "spornerede-remote-$stamp.sh"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($localSh, $remoteBody, $utf8NoBom)

Write-Host "==> Yukleme: scp" -ForegroundColor Yellow
scp $localTgz "${DeploySsh}:$remoteTgz"
scp $localSh "${DeploySsh}:$remoteSh"
scp (Join-Path $Root "package.json") "${DeploySsh}:${RemoteBase}/package.json"
if (Test-Path (Join-Path $Root "package-lock.json")) {
  scp (Join-Path $Root "package-lock.json") "${DeploySsh}:${RemoteBase}/package-lock.json"
}

Write-Host "==> Sunucu: release + systemd" -ForegroundColor Yellow
ssh $DeploySsh "chmod +x $remoteSh && bash $remoteSh && rm -f $remoteSh"

Remove-Item $localTgz -Force -ErrorAction SilentlyContinue
Remove-Item $localSh -Force -ErrorAction SilentlyContinue

if (-not $NoUpdateNginx) {
  $bash = Get-Command "bash" -ErrorAction SilentlyContinue
  if ($bash) {
    Write-Host "==> Nginx: deploy.sh --update-nginx" -ForegroundColor Yellow
    $env:DEPLOY_SSH = $DeploySsh
    if ($envMap["REMOTE_BASE"]) { $env:REMOTE_BASE = $envMap["REMOTE_BASE"] }
    if ($envMap["SYSTEMD_UNIT"]) { $env:SYSTEMD_UNIT = $envMap["SYSTEMD_UNIT"] }
    $repoUnix = ConvertToGitBashPath $Root
    & bash -lc "cd '$repoUnix' && ./deploy.sh --skip-build --update-nginx"
  } else {
    Write-Warning "bash yok (Git Bash kurun); nginx adimi atlandi. Sonra: npm run deploy:quick"
  }
}

Write-Host "==> Tamam." -ForegroundColor Green
