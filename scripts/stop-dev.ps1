$ErrorActionPreference = 'Stop'

$workspace = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $workspace '.runtime'
$pidFiles = @(
  (Join-Path $runtimeDir 'watcher.pid'),
  (Join-Path $runtimeDir 'api.pid'),
  (Join-Path $runtimeDir 'web.pid')
)

foreach ($pidFile in $pidFiles) {
  if (-not (Test-Path $pidFile)) {
    continue
  }

  $pidValue = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
  if ($pidValue) {
    $process = Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
    if ($process) {
      Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
      Write-Host "Stopped PID $($process.Id)"
    }
  }

  Remove-Item $pidFile -ErrorAction SilentlyContinue
}

Write-Host 'Local E-Malla services stopped.'
