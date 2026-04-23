#Requires -Version 5.1
<#
.SYNOPSIS
    AI Workspace Configurator — One-Click Installer
.DESCRIPTION
    Downloads and installs the AI Workspace Configurator from GitHub releases.
    Self-elevates to Administrator if needed. Creates Start Menu shortcut.
    https://github.com/FlexNetOS/ai-workspace-configurator
.EXAMPLE
    # One-liner (run in PowerShell):
    irm https://raw.githubusercontent.com/FlexNetOS/ai-workspace-configurator/main/public/scripts/Install-App.ps1 | iex
#>
param(
    [string]$InstallPath = "$env:LOCALAPPDATA\AI-Workspace-Configurator",
    [string]$Version = "latest",
    [switch]$DesktopShortcut,
    [switch]$NoLaunch
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ─── Banner ───
Write-Host @"
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║           🤖 AI Workspace Configurator v3.6              ║
║           One-Click Installer                             ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# ─── Check/Request Admin ───
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).
    IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[Elevate] Requesting Administrator privileges..." -ForegroundColor Yellow
    $scriptUrl = "https://raw.githubusercontent.com/FlexNetOS/ai-workspace-configurator/main/public/scripts/Install-App.ps1"
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"irm '$scriptUrl' | iex`"" -Wait
    exit
}

# ─── Create install directory ───
Write-Host "[1/6] Preparing installation directory..." -ForegroundColor Cyan
if (Test-Path $InstallPath) {
    Write-Host "      Removing previous installation..." -ForegroundColor Gray
    Remove-Item -Path $InstallPath -Recurse -Force
}
New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
Write-Host "      OK: $InstallPath" -ForegroundColor Green

# ─── Determine download URL ───
Write-Host "[2/6] Resolving download URL..." -ForegroundColor Cyan
if ($Version -eq "latest") {
    $releaseUrl = "https://api.github.com/repos/FlexNetOS/ai-workspace-configurator/releases/latest"
    try {
        $release = Invoke-RestMethod -Uri $releaseUrl -UseBasicParsing
        $asset = $release.assets | Where-Object { $_.name -match "win.*\.zip$" } | Select-Object -First 1
        if (-not $asset) {
            throw "No ZIP asset found in latest release"
        }
        $downloadUrl = $asset.browser_download_url
        $actualVersion = $release.tag_name
        Write-Host "      Latest version: $actualVersion" -ForegroundColor Green
    } catch {
        Write-Host "      GitHub API failed, using direct URL..." -ForegroundColor Yellow
        $downloadUrl = "https://github.com/FlexNetOS/ai-workspace-configurator/releases/latest/download/AI-Workspace-Configurator-3.6.0-win.zip"
    }
} else {
    $downloadUrl = "https://github.com/FlexNetOS/ai-workspace-configurator/releases/download/$Version/AI-Workspace-Configurator-$Version-win.zip"
}

# ─── Download ───
Write-Host "[3/6] Downloading application..." -ForegroundColor Cyan
$zipPath = "$env:TEMP\ai-workspace-configurator.zip"
Write-Host "      From: $downloadUrl" -ForegroundColor Gray
Write-Host "      To: $zipPath" -ForegroundColor Gray

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing -MaximumRedirection 10
    $size = (Get-Item $zipPath).Length / 1MB
    Write-Host "      Downloaded: $([math]::Round($size, 1)) MB" -ForegroundColor Green
} catch {
    Write-Error "Download failed: $_"
    exit 1
}

# ─── Extract ───
Write-Host "[4/6] Extracting files..." -ForegroundColor Cyan
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $InstallPath)
Remove-Item $zipPath -Force
Write-Host "      Extracted to: $InstallPath" -ForegroundColor Green

# ─── Create shortcuts ───
Write-Host "[5/6] Creating shortcuts..." -ForegroundColor Cyan
$exePath = Join-Path $InstallPath "AI Workspace Configurator.exe"
if (-not (Test-Path $exePath)) {
    # Try to find the exe
    $exe = Get-ChildItem -Path $InstallPath -Filter "*.exe" -Recurse | Select-Object -First 1
    if ($exe) { $exePath = $exe.FullName }
}

# Start Menu shortcut
$startMenuPath = [Environment]::GetFolderPath("StartMenu")
$programsPath = Join-Path $startMenuPath "Programs"
$shortcutPath = Join-Path $programsPath "AI Workspace Configurator.lnk"
$WshShell = New-Object -ComObject WScript.Shell
$shortcut = $WshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $exePath
$shortcut.WorkingDirectory = $InstallPath
$shortcut.Description = "AI Workspace Configurator"
$shortcut.IconLocation = $exePath
$shortcut.Save()
Write-Host "      Start Menu shortcut: $shortcutPath" -ForegroundColor Green

# Desktop shortcut (optional)
if ($DesktopShortcut) {
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $desktopShortcut = Join-Path $desktopPath "AI Workspace Configurator.lnk"
    $shortcut2 = $WshShell.CreateShortcut($desktopShortcut)
    $shortcut2.TargetPath = $exePath
    $shortcut2.WorkingDirectory = $InstallPath
    $shortcut2.Description = "AI Workspace Configurator"
    $shortcut2.IconLocation = $exePath
    $shortcut2.Save()
    Write-Host "      Desktop shortcut: $desktopShortcut" -ForegroundColor Green
}

# ─── Create workspace directories ───
Write-Host "[6/6] Setting up workspace..." -ForegroundColor Cyan
$workspaceDir = "$env:USERPROFILE\.ai-workspace"
@("$workspaceDir\logs", "$workspaceDir\artifacts", "$workspaceDir\scripts") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}
Write-Host "      Workspace: $workspaceDir" -ForegroundColor Green

# ─── Summary ───
Write-Host @"

╔══════════════════════════════════════════════════════════╗
║                    ✅ INSTALL COMPLETE                     ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  📁 Install Path: $InstallPath
║  🏠 Workspace:    $workspaceDir
║                                                          ║
║  🚀 Launch:       Search "AI Workspace" in Start Menu    ║
║  🗑️  Uninstall:   Delete $InstallPath                    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green

if (-not $NoLaunch) {
    Write-Host "Starting AI Workspace Configurator..." -ForegroundColor Cyan
    Start-Process $exePath
}
