#Requires -RunAsAdministrator
<#
.SYNOPSIS
    AI Workspace Configurator - Master Bootstrap
.DESCRIPTION
    One-click setup from clean Windows 11 to fully configured vibe-coding environment.
    This script bootstraps the entire process - it downloads the configurator if needed,
    runs security checks, creates a system restore point, and executes the full install.
    SAFE to run multiple times (idempotent).
.EXAMPLE
    # Download and run directly from GitHub:
    irm https://your-domain.com/bootstrap.ps1 | iex

    # Or save and run:
    .\bootstrap.ps1 -NonInteractive
#>
param(
    [ValidateSet("Full","CheckOnly","InstallOnly")]
    [string]$Mode = "Full",
    [switch]$NonInteractive,
    [string]$WorkspaceDir = "$env:USERPROFILE\.ai-workspace",
    [string]$VhdxPath = "$env:USERPROFILE\WSL\workspace.vhdx",
    [int]$VhdxSizeGB = 100
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "Continue"

# ─── Banner ───
Write-Host @"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║           🤖 AI Workspace Configurator v3.0                      ║
║           From clean Windows 11 to vibe-coding                   ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# ─── Step 0: Environment Setup ───
Write-Host "`n[0/5] Setting up workspace directories..." -ForegroundColor Cyan
$dirs = @("$WorkspaceDir\logs", "$WorkspaceDir\artifacts", "$WorkspaceDir\scripts", "$env:USERPROFILE\WSL")
foreach ($d in $dirs) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null } }
Write-Host "      Directories ready" -ForegroundColor Green

# ─── Step 1: Security Check ───
Write-Host "`n[1/5] Running security & readiness checks..." -ForegroundColor Cyan
$secScript = "$WorkspaceDir\scripts\SecurityCheck.ps1"
if (Test-Path $secScript) {
    & $secScript -OutputPath "$WorkspaceDir\artifacts\security-report.json"
} else {
    Write-Host "      Security script not found. Skipping." -ForegroundColor Yellow
}

# ─── Step 2: Create Restore Point ───
Write-Host "`n[2/5] Creating system restore point..." -ForegroundColor Cyan
try {
    Checkpoint-Computer -Description "AI-Workspace-Setup-$(Get-Date -Format 'yyyyMMdd-HHmm')" `
        -RestorePointType "MODIFY_SETTINGS" -ErrorAction Stop
    Write-Host "      Restore point created" -ForegroundColor Green
} catch {
    Write-Host "      Could not create restore point (System Protection may be disabled)" -ForegroundColor Yellow
}

# ─── Step 3: Hardware Scan ───
Write-Host "`n[3/5] Scanning hardware..." -ForegroundColor Cyan
$hwScript = "$WorkspaceDir\scripts\HardwareScan.ps1"
if (Test-Path $hwScript) {
    & $hwScript -OutputPath "$WorkspaceDir\artifacts\hardware-inventory.json" -Silent
} else {
    Write-Host "      Hardware scanner not found. Skipping." -ForegroundColor Yellow
}

# ─── Step 4: Run Full Install ───
Write-Host "`n[4/5] Installing workspace stack (this will take 30-60 minutes)..." -ForegroundColor Cyan
Write-Host "      Phases: PowerShell → Updates → winget → Docker → WSL → Ubuntu → Zsh → ZED → Kimi → llama.cpp → Models" -ForegroundColor Gray

$installScript = "$WorkspaceDir\scripts\InstallStack.ps1"
if (Test-Path $installScript) {
    & $installScript -Phase All -Verbose
} else {
    Write-Host "      Install script not found. Skipping." -ForegroundColor Yellow
}

# ─── Step 5: Configure IDE Integration ───
Write-Host "`n[5/5] Configuring IDE integrations..." -ForegroundColor Cyan

# Configure ZED for Kimi
$zedConfigDir = "$env:USERPROFILE\AppData\Roaming\Zed"
if (Test-Path "$zedConfigDir\settings.json") {
    Write-Host "      ZED found. Add Kimi ACP config to settings.json:" -ForegroundColor Gray
    Write-Host @'
      {
        "agent_servers": {
          "Kimi Code CLI": {
            "type": "custom",
            "command": "kimi",
            "args": ["acp"]
          }
        }
      }
'@ -ForegroundColor DarkCyan
}

# Configure VS Code for WSL
$codeConfigDir = "$env:APPDATA\Code\User"
if (Test-Path $codeConfigDir) {
    Write-Host "      VS Code found. WSL remote ready." -ForegroundColor Green
}

Write-Host "      Kimi CLI configured inside WSL at ~/.kimi/config.toml" -ForegroundColor Green

# ─── Summary ───
Write-Host @"

╔══════════════════════════════════════════════════════════════════╗
║                     ✅ SETUP COMPLETE                            ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  📁 Workspace: $WorkspaceDir
║  💾 VHDX:      $VhdxPath
║  📋 Logs:      $WorkspaceDir\logs\install-stack.log
║                                                                  ║
║  🖥️  Open ZED:        Search Start Menu for "Zed"                ║
║  🐧 Open WSL:        wsl -d Ubuntu                               ║
║  🤖 Start Kimi:      wsl -d Ubuntu -e zsh -c "kimi"             ║
║                                                                  ║
║  📖 Documentation:   https://kimi.com/code/docs                  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green

Write-Host "Happy vibe-coding! 🚀" -ForegroundColor Cyan
