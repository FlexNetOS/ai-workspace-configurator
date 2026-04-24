#Requires -RunAsAdministrator
<#
.SYNOPSIS
    AI Workspace Configurator - Security & Readiness Checker
.DESCRIPTION
    Verifies system prerequisites for workspace installation.
    Checks admin rights, UAC, virtualization, Secure Boot, Windows Update status.
    Generates a JSON report with remediation steps for any failures.
.EXAMPLE
    .\SecurityCheck.ps1 -OutputPath "$env:USERPROFILE\.ai-workspace\artifacts\security-report.json"
#>
param(
    [string]$OutputPath = "$env:USERPROFILE\.ai-workspace\artifacts\security-report.json",
    [switch]$Fix
)

$ErrorActionPreference = "Continue"
$allPassed = $true

function Test-AdminRights {
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).
        IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    return @{ passed = $isAdmin; value = if ($isAdmin) { "Administrator" } else { "Standard User" }; 
              severity = "critical"; remediation = "Right-click PowerShell -> Run as Administrator" }
}

function Test-UACStatus {
    try {
        $uac = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" -Name "EnableLUA" -ErrorAction Stop
        $consent = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" -Name "ConsentPromptBehaviorAdmin" -ErrorAction Stop
        $uacOn = ($uac.EnableLUA -eq 1)
        $level = switch ($consent.ConsentPromptBehaviorAdmin) {
            2 { "Always notify" }
            5 { "Notify me only when apps try to make changes" }
            0 { "Never notify (Not recommended)" }
            default { "Custom" }
        }
        return @{ passed = $uacOn; value = $level; severity = "warning";
                  remediation = "Settings > Accounts > Other users > Change User Account Control settings" }
    } catch {
        return @{ passed = $false; value = "Unknown"; severity = "warning"; 
                  remediation = "Check UAC settings manually in Control Panel" }
    }
}

function Test-Virtualization {
    $cpu = Get-WmiObject Win32_Processor
    $hyperv = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All -ErrorAction SilentlyContinue
    $vmPlatform = Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -ErrorAction SilentlyContinue

    $cpuVirt = $cpu.VirtualizationFirmwareEnabled
    $hypervOn = ($hyperv -and $hyperv.State -eq "Enabled")
    $vmOn = ($vmPlatform -and $vmPlatform.State -eq "Enabled")

    $passed = $cpuVirt -and $vmOn
    $details = "CPU Virtualization: $cpuVirt | Hyper-V: $(if($hypervOn){'Enabled'}else{'Disabled'}) | VM Platform: $(if($vmOn){'Enabled'}else{'Disabled'})"

    $remediation = if (-not $cpuVirt) { 
        "Enable virtualization in BIOS/UEFI (Intel VT-x or AMD-V)" 
    } elseif (-not $vmOn) {
        "Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -NoRestart"
    } else { "" }

    return @{ passed = $passed; value = $details; severity = "critical"; remediation = $remediation }
}

function Test-WindowsUpdate {
    try {
        $session = New-Object -ComObject Microsoft.Update.Session
        $searcher = $session.CreateUpdateSearcher()
        $pending = $searcher.Search("IsInstalled=0")
        $count = $pending.Updates.Count
        return @{ passed = ($count -eq 0); value = "$count updates pending"; severity = "warning";
                  remediation = if ($count -gt 0) { "Run: Start-Process ms-settings:windowsupdate-action" } else { "" } }
    } catch {
        return @{ passed = $false; value = "Unable to check"; severity = "warning"; remediation = "Check Windows Update manually" }
    }
}

function Test-RebootPending {
    $reboot = $false
    if (Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending") { $reboot = $true }
    if (Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired") { $reboot = $true }
    $active = Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager" -Name "PendingFileRenameOperations" -ErrorAction SilentlyContinue
    if ($active -and $active.PendingFileRenameOperations) { $reboot = $true }

    return @{ passed = (-not $reboot); value = if ($reboot) { "Reboot required" } else { "No reboot pending" }; severity = "warning";
              remediation = if ($reboot) { "Restart your computer before continuing" } else { "" } }
}

function Test-SecureBoot {
    try {
        $sb = Confirm-SecureBootUEFI -ErrorAction Stop
        return @{ passed = $true; value = if ($sb) { "Enabled" } else { "Disabled" }; severity = "info";
                  remediation = "Secure Boot can be left off for WSL2, but some features may require it" }
    } catch {
        return @{ passed = $true; value = "Not UEFI or not available"; severity = "info"; remediation = "" }
    }
}

function Test-WSLInstalled {
    try {
        & wsl.exe --status *> $null
        $ok = ($LASTEXITCODE -eq 0)
        return @{
            passed = $ok
            value = if ($ok) { "Installed" } else { "Not installed" }
            severity = "critical"
            remediation = "wsl --install (will require restart)"
        }
    } catch {
        return @{
            passed = $false
            value = "Not installed"
            severity = "critical"
            remediation = "wsl --install (will require restart)"
        }
    }
}

function Test-WSLReady {
    try {
        & wsl.exe --status *> $null
        $ok = ($LASTEXITCODE -eq 0)
        return @{
            passed = $ok
            value = if ($ok) { "Ready" } else { "Not ready" }
            severity = "critical"
            remediation = "Run: wsl --install --no-distribution (may require restart)"
        }
    } catch {
        return @{
            passed = $false
            value = "wsl.exe not usable"
            severity = "critical"
            remediation = "Run: wsl --install --no-distribution (may require restart)"
        }
    }
}

# ─── Run Checks ───
Write-Host "Running Security & Readiness Checks..." -ForegroundColor Cyan

$checks = @{
    adminRights = Test-AdminRights
    uacStatus = Test-UACStatus
    virtualization = Test-Virtualization
    windowsUpdate = Test-WindowsUpdate
    rebootPending = Test-RebootPending
    secureBoot = Test-SecureBoot
    wslInstalled = Test-WSLInstalled
    wslReady = Test-WSLReady
}

foreach ($name in $checks.Keys) {
    $c = $checks[$name]
    $color = if ($c.passed) { "Green" } elseif ($c.severity -eq "critical") { "Red" } else { "Yellow" }
    $icon = if ($c.passed) { "✓" } else { "!" }
    Write-Host "  [$icon] $name`: $($c.value)" -ForegroundColor $color
    if (-not $c.passed -and $c.remediation) {
        Write-Host "      → $($c.remediation)" -ForegroundColor DarkGray
    }
    if (-not $c.passed -and $c.severity -eq "critical") { $allPassed = $false }
}

# Auto-fix if requested
if ($Fix) {
    Write-Host "`nApplying automatic fixes..." -ForegroundColor Cyan

    # Ensure required Windows features are enabled (no reboot triggered automatically).
    $vmFeature = Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -ErrorAction SilentlyContinue
    if ($vmFeature -and $vmFeature.State -ne "Enabled") {
        Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -NoRestart -All | Out-Null
        Write-Host "  [FIXED] Enabled VirtualMachinePlatform" -ForegroundColor Green
    }

    $wslFeature = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -ErrorAction SilentlyContinue
    if ($wslFeature -and $wslFeature.State -ne "Enabled") {
        Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -NoRestart -All | Out-Null
        Write-Host "  [FIXED] Enabled Microsoft-Windows-Subsystem-Linux" -ForegroundColor Green
    }

    # Use the supported WSL installer to fetch the kernel/store components (no distro here).
    if (-not $checks.wslReady.passed) {
        try {
            & wsl.exe --install --no-distribution | Out-Null
            Write-Host "  [FIX] Ran: wsl --install --no-distribution" -ForegroundColor Green
        } catch {
            Write-Host "  [WARN] Could not run: wsl --install --no-distribution" -ForegroundColor Yellow
        }
    }

    if (-not $checks.windowsUpdate.passed) {
        try {
            Start-Process ms-settings:windowsupdate-action | Out-Null
            Write-Host "  [FIX] Opened Windows Update settings" -ForegroundColor Green
        } catch {
            Write-Host "  [WARN] Could not open Windows Update settings" -ForegroundColor Yellow
        }
    }
}

# Ready-to-install means: no critical failures, no pending reboot, and no pending updates.
$readyToInstall = $true
foreach ($name in $checks.Keys) {
    $c = $checks[$name]
    if (-not $c.passed -and $c.severity -eq "critical") { $readyToInstall = $false }
}
if (-not $checks.windowsUpdate.passed) { $readyToInstall = $false }
if (-not $checks.rebootPending.passed) { $readyToInstall = $false }
if (-not $checks.wslReady.passed) { $readyToInstall = $false }

# Save report
$failed = @()
foreach ($name in $checks.Keys) {
    $c = $checks[$name]
    if (-not $c.passed) {
        $failed += @{
            name = $name
            severity = $c.severity
            value = $c.value
            remediation = $c.remediation
        }
    }
}

$report = @{
    timestamp = (Get-Date -Format "o")
    allPassed = $allPassed
    readyToInstall = $readyToInstall
    failed = $failed
    checks = $checks
}
$dir = Split-Path $OutputPath -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$report | ConvertTo-Json -Depth 5 | Out-File $OutputPath -Encoding UTF8

Write-Host "`nReport saved to: $OutputPath" -ForegroundColor Cyan
if ($readyToInstall) {
    Write-Host "Preflight is clean. Ready to proceed." -ForegroundColor Green
} else {
    Write-Host "Preflight found blockers. Review the report above." -ForegroundColor Yellow
}
