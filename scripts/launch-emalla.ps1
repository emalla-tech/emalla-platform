$ErrorActionPreference = 'Stop'

$workspace = Split-Path -Parent $PSScriptRoot

Set-Location $workspace

Write-Host 'Starting E-Malla Rwanda...'
powershell -ExecutionPolicy Bypass -File '.\scripts\start-dev.ps1'

Start-Sleep -Seconds 2

try {
  Start-Process 'http://127.0.0.1:3000'
} catch {
  Write-Host 'App started, but browser did not open automatically.'
}
