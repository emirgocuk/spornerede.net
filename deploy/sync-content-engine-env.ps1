# Lokal content-engine\.env -> sunucu (secret repoya gitmez)
# Kullanim: npm run content-engine:sync-env:win

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$EnvSrc = Join-Path $Root 'content-engine\.env'
$DeployFile = Join-Path $Root '.env.deploy'
$RemoteBase = '/opt/spornerede'

if (-not (Test-Path $EnvSrc)) {
  Write-Error 'content-engine\.env bulunamadi. Once .env.example kopyalayip doldurun.'
}

$DeploySsh = $env:DEPLOY_SSH
if (-not $DeploySsh -and (Test-Path $DeployFile)) {
  Get-Content $DeployFile | ForEach-Object {
    if ($_ -match '^\s*DEPLOY_SSH\s*=\s*(.+)\s*$') {
      $DeploySsh = $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
}
if (-not $DeploySsh) {
  Write-Error 'DEPLOY_SSH tanimli degil (.env.deploy veya ortam degiskeni).'
}

Write-Host "Upload: ${DeploySsh}:${RemoteBase}/content-engine.env"
scp -q $EnvSrc "${DeploySsh}:${RemoteBase}/content-engine.env"
ssh $DeploySsh "chmod 600 '${RemoteBase}/content-engine.env'"

$CeDir = "${RemoteBase}/current/content-engine"
$exists = (ssh $DeploySsh "test -d '$CeDir' && echo yes || echo no").Trim()
if ($exists -eq 'yes') {
  Write-Host 'Copy to active release content-engine\.env'
  ssh $DeploySsh "cp '${RemoteBase}/content-engine.env' '${CeDir}/.env' && chmod 600 '${CeDir}/.env'"
} else {
  Write-Host 'WARN: current/content-engine missing; next autoupdate will copy env.'
}

Write-Host 'Done.'
