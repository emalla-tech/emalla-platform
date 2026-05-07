$ErrorActionPreference = 'Stop'

$workspace = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $workspace '.runtime'
$apiPidPath = Join-Path $runtimeDir 'api.pid'
$webPidPath = Join-Path $runtimeDir 'web.pid'
$watcherPidPath = Join-Path $runtimeDir 'watcher.pid'
$apiLogPath = Join-Path $runtimeDir 'api.log'
$apiErrLogPath = Join-Path $runtimeDir 'api-error.log'
$webLogPath = Join-Path $runtimeDir 'web.log'
$webErrLogPath = Join-Path $runtimeDir 'web-error.log'
$watcherLogPath = Join-Path $runtimeDir 'watcher.log'
$watcherErrLogPath = Join-Path $runtimeDir 'watcher-error.log'

New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null

function Stop-TrackedProcess {
  param([string]$PidFile)

  if (-not (Test-Path $PidFile)) {
    return
  }

  $existingPidRaw = Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  $existingPid = if ($null -ne $existingPidRaw) { $existingPidRaw.ToString().Trim() } else { '' }
  if ($existingPid) {
    $process = Get-Process -Id ([int]$existingPid) -ErrorAction SilentlyContinue
    if ($process) {
      Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
      Start-Sleep -Milliseconds 500
    }
  }

  Remove-Item $PidFile -ErrorAction SilentlyContinue
}

function Stop-PortProcess {
  param([int]$Port)

  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  foreach ($connection in $connections) {
    if (-not $connection.OwningProcess) {
      continue
    }

    $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
      Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
      Start-Sleep -Milliseconds 500
    }
  }
}

function Wait-ForHttp {
  param(
    [string]$Url,
    [int]$MaxAttempts = 25
  )

  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    Start-Sleep -Seconds 1
    try {
      $response = Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
    }
  }

  return $false
}

Stop-TrackedProcess -PidFile $watcherPidPath
Stop-TrackedProcess -PidFile $apiPidPath
Stop-TrackedProcess -PidFile $webPidPath
Stop-PortProcess -Port 4000
Stop-PortProcess -Port 3000

if (Test-Path $watcherLogPath) {
  Remove-Item $watcherLogPath -Force
}
if (Test-Path $watcherErrLogPath) {
  Remove-Item $watcherErrLogPath -Force
}

$watcher = Start-Process -FilePath 'node' `
  -ArgumentList @('.\scripts\monitor-dev.mjs') `
  -WorkingDirectory $workspace `
  -RedirectStandardOutput $watcherLogPath `
  -RedirectStandardError $watcherErrLogPath `
  -WindowStyle Hidden `
  -PassThru

Set-Content -Path $watcherPidPath -Value $watcher.Id
Write-Host "Supervisor started with PID $($watcher.Id)"

$apiOk = Wait-ForHttp -Url 'http://127.0.0.1:4000/api/health'
$webOk = Wait-ForHttp -Url 'http://127.0.0.1:3000'

if (-not $apiOk -or -not $webOk) {
  Write-Host ''
  Write-Host 'One or more services failed to start.'
  Write-Host "API log:     $apiLogPath"
  Write-Host "API error:   $apiErrLogPath"
  Write-Host "Web log:     $webLogPath"
  Write-Host "Web error:   $webErrLogPath"
  Write-Host "Watcher log: $watcherLogPath"
  Write-Host "Watcher err: $watcherErrLogPath"
  exit 1
}

Write-Host ''
Write-Host 'E-Malla Rwanda local environment is ready.'
Write-Host 'Frontend: http://127.0.0.1:3000'
Write-Host 'Backend:  http://127.0.0.1:4000/api/health'
Write-Host "Logs:     $runtimeDir"
