# SporNerede.net — Windows: SSH anahtari + sunucuya ekleme + SSH config
# Bir kez calistirin; sifre en fazla 2 kez (scp + ssh; ControlMaster yok).
#
#   npm run ssh:setup
#
# .env.deploy icinde DEPLOY_SSH=root@GERCEK_IP olmali.

param(
  [string] $DeploySsh = "",
  [switch] $UpdateEnvDeploy
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
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

function Parse-DeploySsh([string] $raw) {
  if ($raw -notmatch "@") { throw "DEPLOY_SSH 'user@host' olmali: $raw" }
  $p = $raw.Split("@", 2)
  return @{ User = $p[0]; Host = $p[1] }
}

function Ensure-SshConfigBlock([string] $hostAlias, [string] $hostName, [string] $user, [string] $identityFile) {
  $cfgDir = Join-Path $env:USERPROFILE ".ssh"
  if (-not (Test-Path $cfgDir)) { New-Item -ItemType Directory -Path $cfgDir | Out-Null }
  $cfgPath = Join-Path $cfgDir "config"
  $block = @"

Host $hostAlias
  HostName $hostName
  User $user
  IdentityFile $identityFile
  IdentitiesOnly yes
"@
  if (Test-Path $cfgPath) {
    $existing = Get-Content -LiteralPath $cfgPath -Raw -ErrorAction SilentlyContinue
    if ($existing -and $existing.Contains("Host $hostAlias")) {
      Write-Host "==> SSH config: '$hostAlias' zaten var: $cfgPath" -ForegroundColor Yellow
      return
    }
    Add-Content -LiteralPath $cfgPath -Value $block -Encoding UTF8
  } else {
    Set-Content -LiteralPath $cfgPath -Value $block.TrimStart() -Encoding UTF8
  }
  Write-Host "==> SSH config guncellendi: $cfgPath" -ForegroundColor Green
}

$envMap = Read-DotEnvDeploy
if (-not $DeploySsh) { $DeploySsh = $envMap["DEPLOY_SSH"] }
if (-not $DeploySsh) {
  throw ".env.deploy icinde DEPLOY_SSH yok. Ornek: DEPLOY_SSH=root@45.155.19.82 veya -DeploySsh root@IP"
}

$parsed = Parse-DeploySsh $DeploySsh
$sshUser = $parsed.User
$sshHost = $parsed.Host

if ($sshHost -eq "spornerede-net") {
  throw "Ilk kurulum: .env.deploy icinde gercek IP kullanin (DEPLOY_SSH=root@45.155.19.82). Sonra bu script DEPLOY_SSH'i root@spornerede-net yapabilir (-UpdateEnvDeploy)."
}

$sshDir = Join-Path $env:USERPROFILE ".ssh"
$keyName = "id_ed25519_spornerede"
$keyPath = Join-Path $sshDir $keyName
$pubPath = "$keyPath.pub"

if (-not (Test-Path $sshDir)) { New-Item -ItemType Directory -Path $sshDir | Out-Null }

if (-not (Test-Path $keyPath)) {
  Write-Host "==> Yeni anahtar: $keyPath" -ForegroundColor Cyan
  & ssh-keygen -t ed25519 -f $keyPath -C "spornerede-net-deploy" -N ""
} else {
  Write-Host "==> Mevcut anahtar kullaniliyor: $keyPath" -ForegroundColor Yellow
}

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
  throw "ssh bulunamadi. Ayarlar -> Uygulamalar -> Isteg bagli ozellikler -> OpenSSH Client."
}
if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
  throw "scp bulunamadi (OpenSSH Client)."
}

$remoteTmp = "/tmp/spornerede-setupkey.pub"
Write-Host "==> Sunucuya public key (scp + ssh; sifre sorabilir): ${sshUser}@${sshHost}" -ForegroundColor Cyan
& scp $pubPath "${sshUser}@${sshHost}:${remoteTmp}"
$remoteCmd = "mkdir -p ~/.ssh && chmod 700 ~/.ssh && touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && if ! grep -qFf ${remoteTmp} ~/.ssh/authorized_keys 2>/dev/null; then cat ${remoteTmp} >> ~/.ssh/authorized_keys && echo 'Anahtar eklendi.'; else echo 'Anahtar zaten vardi.'; fi && rm -f ${remoteTmp}"
& ssh "${sshUser}@${sshHost}" $remoteCmd

$identityUnix = "~/.ssh/$keyName"
Ensure-SshConfigBlock -hostAlias "spornerede-net" -hostName $sshHost -user $sshUser -identityFile $identityUnix

Write-Host ""
Write-Host "Baglanti testi (sifre sormamali):" -ForegroundColor Cyan
ssh spornerede-net "echo OK; hostname"

if ($UpdateEnvDeploy) {
  $envPath = Join-Path $Root ".env.deploy"
  if (-not (Test-Path $envPath)) { throw ".env.deploy yok" }
  $lines = Get-Content -LiteralPath $envPath
  $newLines = foreach ($line in $lines) {
    if ($line -match '^\s*DEPLOY_SSH\s*=') {
      "DEPLOY_SSH=${sshUser}@spornerede-net"
    } else {
      $line
    }
  }
  Set-Content -LiteralPath $envPath -Value $newLines -Encoding UTF8
  Write-Host "==> .env.deploy guncellendi: DEPLOY_SSH=${sshUser}@spornerede-net" -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "Istege bagli: .env.deploy icinde su satira gecin (tek satir):" -ForegroundColor Yellow
  Write-Host "  DEPLOY_SSH=${sshUser}@spornerede-net"
  Write-Host "Ya da tekrar calistirin: npm run ssh:setup -- -UpdateEnvDeploy"
}

Write-Host ""
Write-Host "Tamam. Artik npm run deploy:win / deploy:prod sifresiz calisabilir." -ForegroundColor Green
