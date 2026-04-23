Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$requiredArtifacts = @(
  ".changelog/CHANGELOG.MD",
  ".changelog/file-changelog-table.csv",
  ".changelog/reports-notes"
)

$missing = @()
foreach ($path in $requiredArtifacts) {
  if (-not (Test-Path -LiteralPath $path)) {
    $missing += $path
  }
}

if ($missing.Count -gt 0) {
  Write-Error ("Post-update verification failed. Missing artifacts: " + ($missing -join ", "))
  exit 1
}

$latestReport = Get-ChildItem -LiteralPath ".changelog/reports-notes" -File -Filter "*.md" |
  Sort-Object LastWriteTimeUtc -Descending |
  Select-Object -First 1

if (-not $latestReport) {
  Write-Error "Post-update verification failed. No markdown report found in .changelog/reports-notes."
  exit 1
}

Write-Output ("Post-update verification passed. Latest report: " + $latestReport.Name)
