#Requires -Version 7.0
<#
.SYNOPSIS
    AI Workspace Configurator — Developer Environment Setup
.DESCRIPTION
    One-click setup for developers cloning this repository.
    Verifies prerequisites, fixes PATH, bootstraps .env, installs deps, and smoke-tests the build.
    SAFE to run multiple times (idempotent).
.EXAMPLE
    pwsh scripts/setup-dev.ps1
#>

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ─── Configuration ───
$RequiredNodeVersion = [Version]::new(20, 0, 0)
$ExpectedPaths = @(
    "F:\.local\node",
    "F:\.local\bin",
    "F:\Tools\CLI"
)

# ─── Banner ───
Write-Host @"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║           🤖 AI Workspace Configurator                           ║
║           Developer Environment Setup                            ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# ─── 1. PowerShell 7 Check ───
Write-Host "`n[1/9] Checking PowerShell version..." -ForegroundColor Cyan
if ($PSVersionTable.PSVersion.Major -lt 7) {
    Write-Error "PowerShell 7+ is required. You are running $($PSVersionTable.PSVersion).`nInstall from: https://github.com/PowerShell/PowerShell/releases"
    exit 1
}
Write-Host "      PowerShell $($PSVersionTable.PSVersion) ✅" -ForegroundColor Green

# ─── 2. Node.js Check ───
Write-Host "`n[2/9] Checking Node.js..." -ForegroundColor Cyan
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "      Node.js not found in PATH." -ForegroundColor Red
    Write-Host "      Install via winget:  winget install OpenJS.NodeJS.LTS" -ForegroundColor Yellow
    Write-Host "      Or download from:    https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

$nodeVersion = [Version]::new((node --version).TrimStart('v').Split('.')[0], (node --version).TrimStart('v').Split('.')[1], 0)
if ($nodeVersion -lt $RequiredNodeVersion) {
    Write-Error "Node.js $nodeVersion is too old. Required: >= $RequiredNodeVersion`nUpdate via: winget upgrade OpenJS.NodeJS.LTS"
    exit 1
}
Write-Host "      Node.js $nodeVersion ✅" -ForegroundColor Green

# ─── 3. npm Check ───
Write-Host "`n[3/9] Checking npm..." -ForegroundColor Cyan
$npmPath = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmPath) {
    Write-Error "npm not found. It should be bundled with Node.js."
    exit 1
}
Write-Host "      npm $(npm --version) ✅" -ForegroundColor Green

# ─── 4. Git Check ───
Write-Host "`n[4/9] Checking Git..." -ForegroundColor Cyan
$gitPath = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitPath) {
    Write-Host "      Git not found." -ForegroundColor Red
    Write-Host "      Install via winget:  winget install Git.Git" -ForegroundColor Yellow
    exit 1
}
Write-Host "      Git $(git --version) ✅" -ForegroundColor Green

# ─── 5. PATH Verification & Fix ───
Write-Host "`n[5/9] Verifying PATH entries..." -ForegroundColor Cyan
$currentUserPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$pathEntries = $currentUserPath -split ';'
$updated = $false

foreach ($p in $ExpectedPaths) {
    if ($pathEntries -contains $p) {
        Write-Host "      $p ✅" -ForegroundColor Green
    } else {
        Write-Host "      $p missing — adding to User PATH..." -ForegroundColor Yellow
        $currentUserPath = "$currentUserPath;$p"
        $updated = $true
    }
}

if ($updated) {
    [Environment]::SetEnvironmentVariable('Path', $currentUserPath, 'User')
    Write-Host "      PATH updated in registry." -ForegroundColor Green
    Write-Host "      ⚠️  Start a NEW terminal session for changes to take effect." -ForegroundColor Magenta
} else {
    Write-Host "      All PATH entries verified ✅" -ForegroundColor Green
}

# ─── 6. .env Bootstrap ───
Write-Host "`n[6/9] Checking environment file..." -ForegroundColor Cyan
$envFile = Join-Path $PSScriptRoot '..' '.env'
$envExample = Join-Path $PSScriptRoot '..' '.env.example'

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "      Created .env from .env.example ✅" -ForegroundColor Green
        Write-Host "      ⚠️  Remember to fill in GEMINI_API_KEY and OAuth client IDs!" -ForegroundColor Magenta
    } else {
        Write-Host "      .env.example not found. Skipping bootstrap." -ForegroundColor Yellow
    }
} else {
    Write-Host "      .env already exists ✅" -ForegroundColor Green
}

# ─── 7. Dependency Install ───
Write-Host "`n[7/9] Installing dependencies (npm ci)..." -ForegroundColor Cyan
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Push-Location $repoRoot
try {
    npm ci
    if ($LASTEXITCODE -ne 0) {
        throw "npm ci failed with exit code $LASTEXITCODE"
    }
    Write-Host "      Dependencies installed ✅" -ForegroundColor Green
} finally {
    Pop-Location
}

# ─── 8. VS Code Extensions (optional) ───
Write-Host "`n[8/9] Checking VS Code extensions..." -ForegroundColor Cyan
$vscodeExtFile = Join-Path $repoRoot 'public\configs\vscode-extensions.txt'
$codeCmd = Get-Command code -ErrorAction SilentlyContinue

if ($codeCmd -and (Test-Path $vscodeExtFile)) {
    $extensions = Get-Content $vscodeExtFile | Where-Object { $_ -match '\S' }
    Write-Host "      Found $($extensions.Count) recommended extensions." -ForegroundColor Cyan
    $install = Read-Host "      Install them now? (y/N)"
    if ($install -eq 'y' -or $install -eq 'Y') {
        foreach ($ext in $extensions) {
            code --install-extension $ext.Trim() --force | Out-Null
        }
        Write-Host "      Extensions installed ✅" -ForegroundColor Green
    } else {
        Write-Host "      Skipped. Install later with:  Get-Content public/configs/vscode-extensions.txt | ForEach-Object { code --install-extension \$_.Trim() }" -ForegroundColor Yellow
    }
} else {
    Write-Host "      VS Code not found or no extension list. Skipped." -ForegroundColor Yellow
}

# ─── 9. Smoke Test ───
Write-Host "`n[9/9] Running smoke build..." -ForegroundColor Cyan
Push-Location $repoRoot
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed with exit code $LASTEXITCODE"
    }
    Write-Host "      Smoke build passed ✅" -ForegroundColor Green
} finally {
    Pop-Location
}

# ─── Success ───
Write-Host @"

╔══════════════════════════════════════════════════════════════════╗
║                    ✅ Setup Complete!                            ║
╚══════════════════════════════════════════════════════════════════╝

Next steps:
  npm run dev          # Start Vite dev server
  npm run dev:api      # Start Express API server
  npm run test         # Run tests
  npm run lint         # Run linter

Release:
  git tag v<X.Y.Z>
  git push origin v<X.Y.Z>

"@ -ForegroundColor Cyan
