# Yerel site yedegi — PocketBase + .env (Git disi: backups/)
# Kullanim: npm run backup:local
# Opsiyonel etiket: npm run backup:local -- -Label "test-oncesi"

param(
  [string]$Label = ''
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$BackupRoot = Join-Path $RepoRoot 'backups'
$Ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$SafeLabel = if ($Label) {
  ($Label -replace '[^a-zA-Z0-9_-]', '-').Trim('-')
} else { '' }
$FolderName = if ($SafeLabel) { "spornerede-backup-$Ts-$SafeLabel" } else { "spornerede-backup-$Ts" }
$WorkDir = Join-Path $BackupRoot $FolderName
$Archive = "$WorkDir.zip"

function Write-Step([string]$msg) { Write-Host "[backup] $msg" }

New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null

# PocketBase tutarli kopya icin durdur
Write-Step 'PocketBase durduruluyor (8090)...'
Push-Location $RepoRoot
try {
  npm run pb:stop 2>&1 | Out-Null
} catch {
  Write-Step 'pb:stop atlandi (zaten kapali olabilir)'
}
Pop-Location
Start-Sleep -Seconds 2

$PbData = Join-Path $RepoRoot 'pocketbase\pb_data'
if (Test-Path $PbData) {
  $dest = Join-Path $WorkDir 'pocketbase\pb_data'
  New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
  Copy-Item -Path $PbData -Destination $dest -Recurse -Force
  Write-Step "pb_data kopyalandi"
} else {
  Write-Warning "pb_data bulunamadi: $PbData"
}

$PbPublic = Join-Path $RepoRoot 'pocketbase\pb_public'
if (Test-Path $PbPublic) {
  $dest = Join-Path $WorkDir 'pocketbase\pb_public'
  New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
  Copy-Item -Path $PbPublic -Destination $dest -Recurse -Force
  Write-Step 'pb_public kopyalandi'
}

foreach ($rel in @('.env', 'content-engine\.env')) {
  $src = Join-Path $RepoRoot $rel
  if (Test-Path $src) {
    $destDir = Join-Path $WorkDir (Split-Path $rel -Parent)
    if ($destDir -and $destDir -ne $WorkDir) {
      New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    }
    Copy-Item -Path $src -Destination (Join-Path $WorkDir $rel) -Force
    Write-Step "kopyalandi: $rel"
  }
}

$Secrets = Join-Path $RepoRoot 'content-engine\secrets'
if (Test-Path $Secrets) {
  $dest = Join-Path $WorkDir 'content-engine\secrets'
  New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
  Copy-Item -Path $Secrets -Destination $dest -Recurse -Force
  Write-Step 'content-engine/secrets kopyalandi'
}

$gitSha = ''
Push-Location $RepoRoot
try { $gitSha = (git rev-parse --short HEAD 2>$null).Trim() } catch { }
Pop-Location

$manifest = @{
  createdAt = (Get-Date).ToUniversalTime().ToString('o')
  label     = $Label
  gitCommit = $gitSha
  hostname  = $env:COMPUTERNAME
  paths     = @('pocketbase/pb_data', 'pocketbase/pb_public', '.env', 'content-engine/.env', 'content-engine/secrets')
} | ConvertTo-Json -Depth 4
Set-Content -Path (Join-Path $WorkDir 'manifest.json') -Value $manifest -Encoding UTF8

if (Test-Path $Archive) { Remove-Item $Archive -Force }
Compress-Archive -Path (Join-Path $WorkDir '*') -DestinationPath $Archive -CompressionLevel Optimal
Remove-Item $WorkDir -Recurse -Force

Write-Step "Arsiv: $Archive"
$sizeMb = [math]::Round((Get-Item $Archive).Length / 1MB, 2)
Write-Step "Boyut: ${sizeMb} MB"
Write-Host ''
Write-Host 'Geri yukleme (ornek):'
Write-Host "  Expand-Archive -Path '$Archive' -DestinationPath '.\restore-tmp'"
Write-Host '  PocketBase kapali iken pb_data klasorunu pocketbase\pb_data uzerine kopyalayin.'
Write-Host ''
Write-Host 'Bu klasor .gitignore ile Git disidir; GitHub''a push etmeyin.'
