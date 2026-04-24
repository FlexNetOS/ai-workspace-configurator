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
    # Recommended on Windows (avoids ExecutionPolicy + Mark-of-the-Web issues):
    .\bootstrap.cmd

    # Or save and run:
    pwsh -NoProfile -ExecutionPolicy Bypass -File .\bootstrap.ps1 -NonInteractive
#>
param(
    [ValidateSet("Full","CheckOnly","InstallOnly")]
    [string]$Mode = "Full",
    [switch]$NonInteractive,
    [string]$WorkspaceDir = "$env:USERPROFILE\.ai-workspace",
    [string]$VhdxPath = "$env:USERPROFILE\WSL\workspace.vhdx",
    [int]$VhdxSizeGB = 100,
    [switch]$FixPrereqs
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "Continue"

# Canonical hosted scripts base (used if companion scripts are missing locally)
# Prefer raw GitHub URLs so script updates take effect immediately (no GitHub Pages rebuild lag).
$ScriptsBaseUrl = "https://raw.githubusercontent.com/FlexNetOS/ai-workspace-configurator/master/public/scripts"

# If the user didn’t provide a VHDX path, default it under the workspace dir to keep state together.
if (-not $PSBoundParameters.ContainsKey("VhdxPath")) {
    $VhdxPath = Join-Path $WorkspaceDir "wsl\\workspace.vhdx"
}
$wslDir = Split-Path -Parent $VhdxPath

# ─── Banner ───
Write-Host @"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║           🤖 AI Workspace Configurator v3.0                      ║
║           From clean Windows 11 to vibe-coding                   ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

if ($Mode -eq "CheckOnly") {
    Write-Host "      PRE-FLIGHT MODE (CheckOnly): no installs will run" -ForegroundColor Yellow
}

# ─── Step 0: Environment Setup ───
Write-Host "`n[0/5] Setting up workspace directories..." -ForegroundColor Cyan
$dirs = @("$WorkspaceDir\logs", "$WorkspaceDir\artifacts", "$WorkspaceDir\scripts", $wslDir)
foreach ($d in $dirs) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null } }
Write-Host "      Directories ready" -ForegroundColor Green

# Ensure companion scripts exist in $WorkspaceDir\scripts (copy from local bundle or download)
Write-Host "      Syncing companion scripts..." -ForegroundColor Gray
$companionScripts = @("SecurityCheck.ps1", "HardwareScan.ps1", "VhdxManager.ps1", "InstallStack.ps1")
foreach ($name in $companionScripts) {
    $dest = Join-Path "$WorkspaceDir\scripts" $name
    $tmp = "$dest.tmp"

    $local = if ($PSScriptRoot) { Join-Path $PSScriptRoot $name } else { $null }
    if ($local -and (Test-Path $local)) {
        Copy-Item -Path $local -Destination $tmp -Force
        if ((Test-Path $tmp) -and ((Get-Item $tmp).Length -gt 0)) {
            Move-Item -Path $tmp -Destination $dest -Force
            Unblock-File -Path $dest -ErrorAction SilentlyContinue
        } else {
            Remove-Item -Path $tmp -Force -ErrorAction SilentlyContinue
        }
        continue
    }

    $url = "$ScriptsBaseUrl/$name"
    try {
        Invoke-WebRequest -Uri $url -OutFile $tmp -MaximumRedirection 10
        if ((Test-Path $tmp) -and ((Get-Item $tmp).Length -gt 0)) {
            Move-Item -Path $tmp -Destination $dest -Force
            Unblock-File -Path $dest -ErrorAction SilentlyContinue
        } else {
            Remove-Item -Path $tmp -Force -ErrorAction SilentlyContinue
            if (-not (Test-Path $dest)) {
                Write-Host "      Warning: Failed to fetch $name from $url" -ForegroundColor Yellow
            }
        }
    } catch {
        Remove-Item -Path $tmp -Force -ErrorAction SilentlyContinue
        if (-not (Test-Path $dest)) {
            Write-Host "      Warning: Failed to fetch $name from $url" -ForegroundColor Yellow
        }
    }
}

# ─── Step 1: Security Check ───
Write-Host "`n[1/5] Running security & readiness checks..." -ForegroundColor Cyan
$secScript = "$WorkspaceDir\scripts\SecurityCheck.ps1"
if ($Mode -notin @("Full", "CheckOnly", "InstallOnly")) {
    Write-Host "      Skipping (Mode=$Mode)" -ForegroundColor Gray
} elseif (Test-Path $secScript) {
    $secOut = "$WorkspaceDir\artifacts\security-report.json"
    $shouldFix = $FixPrereqs -or ($Mode -in @("Full", "InstallOnly"))
    if ($Mode -eq "CheckOnly") { $shouldFix = $false }

    if ($shouldFix) {
        & $secScript -OutputPath $secOut -Fix
    } else {
        & $secScript -OutputPath $secOut
    }

    if (Test-Path $secOut) {
        try {
            $secReport = Get-Content $secOut -Raw | ConvertFrom-Json
            if ($Mode -in @("Full", "InstallOnly") -and (-not $secReport.readyToInstall)) {
                Write-Host "`nBlocking issues detected. Resolve items in the security report, reboot if required, then re-run bootstrap." -ForegroundColor Yellow
                throw "Preflight blockers detected. See: $secOut"
            }
        } catch {
            Write-Host "      Warning: Could not parse $secOut" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "      Security script not found. Skipping." -ForegroundColor Yellow
}

# ─── Step 2: Create Restore Point ───
if ($Mode -in @("Full", "InstallOnly")) {
    Write-Host "`n[2/5] Creating system restore point..." -ForegroundColor Cyan
    try {
        Checkpoint-Computer -Description "AI-Workspace-Setup-$(Get-Date -Format 'yyyyMMdd-HHmm')" `
            -RestorePointType "MODIFY_SETTINGS" -ErrorAction Stop
        Write-Host "      Restore point created" -ForegroundColor Green
    } catch {
        Write-Host "      Could not create restore point (System Protection may be disabled or frequency limited)" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n[2/5] Creating system restore point..." -ForegroundColor Cyan
    Write-Host "      Skipping (Mode=$Mode)" -ForegroundColor Gray
}

# ─── Step 3: Hardware Scan ───
Write-Host "`n[3/5] Scanning hardware..." -ForegroundColor Cyan
$hwScript = "$WorkspaceDir\scripts\HardwareScan.ps1"
if ($Mode -notin @("Full", "CheckOnly")) {
    Write-Host "      Skipping (Mode=$Mode)" -ForegroundColor Gray
} elseif (Test-Path $hwScript) {
    & $hwScript -OutputPath "$WorkspaceDir\artifacts\hardware-inventory.json" -Silent
} else {
    Write-Host "      Hardware scanner not found. Skipping." -ForegroundColor Yellow
}

# ─── Step 4: Run Full Install ───
if ($Mode -in @("Full", "InstallOnly")) {
    Write-Host "`n[4/5] Installing workspace stack (this will take 30-60 minutes)..." -ForegroundColor Cyan
    Write-Host "      Phases: PowerShell → Updates → winget → Docker → WSL → Ubuntu → Zsh → ZED → Kimi → llama.cpp → Models" -ForegroundColor Gray
} else {
    Write-Host "`n[4/5] Installing workspace stack..." -ForegroundColor Cyan
    Write-Host "      Skipping (Mode=$Mode)" -ForegroundColor Gray
}

$installScript = "$WorkspaceDir\scripts\InstallStack.ps1"
if ($Mode -notin @("Full", "InstallOnly")) {
    # Already reported as skipped above.
} elseif (Test-Path $installScript) {
    & $installScript -Phase All -WorkspaceDir $WorkspaceDir -Verbose
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
