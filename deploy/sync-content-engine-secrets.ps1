# Lokal content-engine\secrets\*.json -> sunucu
# Kullanim: npm run content-engine:sync-secrets:win

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$SecretsSrc = Join-Path $Root 'content-engine\secrets'
$DeployFile = Join-Path $Root '.env.deploy'
$RemoteBase = '/opt/spornerede'
$RemoteSecrets = "$RemoteBase/content-engine-secrets"
$InstallCurrent = $args -contains '--install-current'

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

$files = Get-ChildItem -Path $SecretsSrc -Filter '*.json' -File -ErrorAction SilentlyContinue
if (-not $files -or $files.Count -eq 0) {
  Write-Error "content-engine\secrets icinde *.json yok. Once: cd content-engine; npm run gsc:oauth"
}

Write-Host "Upload: ${DeploySsh}:${RemoteSecrets}/"
ssh $DeploySsh "mkdir -p '$RemoteSecrets' && chmod 700 '$RemoteSecrets'"
foreach ($f in $files) {
  Write-Host "  $($f.Name)"
  scp -q $f.FullName "${DeploySsh}:${RemoteSecrets}/$($f.Name)"
}
ssh $DeploySsh "chmod 600 '${RemoteSecrets}/'*.json 2>/dev/null || true"

if ($InstallCurrent) {
  $CeDir = "$RemoteBase/current/content-engine"
  $exists = (ssh $DeploySsh "test -d '$CeDir' && echo yes || echo no").Trim()
  if ($exists -eq 'yes') {
    Write-Host 'Copy to active release content-engine\secrets'
    ssh $DeploySsh @"
mkdir -p '$CeDir/secrets'
rsync -a '$RemoteSecrets/' '$CeDir/secrets/'
chmod 700 '$CeDir/secrets'
chmod 600 '$CeDir/secrets/'*.json 2>/dev/null || true
"@
  } else {
    Write-Host 'WARN: current/content-engine missing'
  }
}

Write-Host 'Done.'
