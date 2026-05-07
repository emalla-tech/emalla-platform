$ErrorActionPreference = 'Stop'

$workspace = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $workspace '.runtime'
$watcherPidPath = Join-Path $runtimeDir 'watcher.pid'
$apiPidPath = Join-Path $runtimeDir 'api.pid'
$webPidPath = Join-Path $runtimeDir 'web.pid'

function Show-ServiceStatus {
  param(
    [string]$Name,
    [string]$PidFile,
    [string]$Url
  )

  $pidValue = ''
  $processRunning = $false

  if (Test-Path $PidFile) {
    $pidValue = (Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
    if ($pidValue) {
      $process = Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
      $processRunning = $null -ne $process
    }
  }

  $httpStatus = 'offline'
  try {
    $response = Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 3
    $httpStatus = "online ($($response.StatusCode))"
  } catch {
  }

  Write-Host "$Name"
  Write-Host "  PID file:  $PidFile"
  Write-Host "  PID:       $(if ($pidValue) { $pidValue } else { 'n/a' })"
  Write-Host "  Process:   $(if ($processRunning) { 'running' } else { 'stopped' })"
  Write-Host "  HTTP:      $httpStatus"
}

Show-ServiceStatus -Name 'Supervisor' -PidFile $watcherPidPath -Url 'http://127.0.0.1:3000'
Write-Host ''
Show-ServiceStatus -Name 'API' -PidFile $apiPidPath -Url 'http://127.0.0.1:4000/api/health'
Write-Host ''
Show-ServiceStatus -Name 'Web' -PidFile $webPidPath -Url 'http://127.0.0.1:3000'
