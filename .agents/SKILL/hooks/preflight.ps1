Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$requiredPaths = @(
  ".changelog",
  ".changelog/CHANGELOG.MD",
  ".changelog/file-changelog-table.csv",
  ".changelog/reports-notes"
)

$missing = @()
foreach ($path in $requiredPaths) {
  if (-not (Test-Path -LiteralPath $path)) {
    $missing += $path
  }
}

if ($missing.Count -gt 0) {
  Write-Error ("Preflight failed. Missing required paths: " + ($missing -join ", "))
  exit 1
}

Write-Output "Preflight passed."
