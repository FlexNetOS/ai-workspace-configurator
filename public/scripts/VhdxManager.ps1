#Requires -RunAsAdministrator
<#
.SYNOPSIS
    AI Workspace Configurator - VHDX Manager for WSL2
.DESCRIPTION
    Creates, resizes, mounts, and manages VHDX virtual disks for WSL2 workspace storage.
    Uses native Windows tools only - no third-party software required.
    Supports both Windows 11 Pro (Hyper-V) and Home editions.
.EXAMPLE
    .\VhdxManager.ps1 -Action Create -Path "$env:USERPROFILE\WSL\workspace.vhdx" -SizeGB 100
    .\VhdxManager.ps1 -Action Mount -Path "$env:USERPROFILE\WSL\workspace.vhdx" -Distro Ubuntu
    .\VhdxManager.ps1 -Action Resize -Path "$env:USERPROFILE\WSL\workspace.vhdx" -NewSizeGB 200
    .\VhdxManager.ps1 -Action ResizeDistro -Distro Ubuntu -NewSizeGB 256
#>
param(
    [Parameter(Mandatory)]
    [ValidateSet("Create","Mount","Dismount","Resize","ResizeDistro","Info","AutoMount")]
    [string]$Action,

    [string]$Path = "$env:USERPROFILE\WSL\workspace.vhdx",
    [int]$SizeGB = 100,
    [int]$NewSizeGB = 0,
    [string]$Distro = "Ubuntu",
    [switch]$Silent
)

$ErrorActionPreference = "Stop"

function Test-Admin {
    return ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).
        IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-WslVersion {
    try {
        $ver = (wsl --version) | Select-String "WSL version"
        if ($ver) { return $ver.ToString().Split(':')[-1].Trim() }
    } catch {}
    # Fallback: check if store version
    $store = Get-AppxPackage MicrosoftCorporationII.WindowsSubsystemForLinux -ErrorAction SilentlyContinue
    if ($store) { return "Store 2.x+" }
    return "Inbox"
}

function Test-HyperVAvailable {
    $hyperv = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All -ErrorAction SilentlyContinue
    return ($hyperv -and $hyperv.State -eq "Enabled")
}

function New-WorkspaceVhdx {
    param([string]$VhdxPath, [int]$Size)

    Write-Host "[VHDX] Creating workspace virtual disk..." -ForegroundColor Cyan
    $dir = Split-Path $VhdxPath -Parent
    if (-not (Test-Path $dir)) { 
        New-Item -ItemType Directory -Path $dir -Force | Out-Null 
    }

    if (Test-Path $VhdxPath) {
        Write-Warning "VHDX already exists at $VhdxPath. Use -Action Resize to expand."
        return
    }

    $hasHyperV = Test-HyperVAvailable
    $sizeBytes = [int64]$Size * 1GB

    if ($hasHyperV) {
        # Use Hyper-V module (Pro/Enterprise)
        New-VHD -Path $VhdxPath -SizeBytes $sizeBytes -Dynamic -BlockSizeBytes 1MB
        Write-Host "[OK] Created dynamic VHDX via Hyper-V: $VhdxPath (${Size}GB)" -ForegroundColor Green
    } else {
        # Use diskpart for Home edition
        $diskpartScript = @"
create vdisk file="$VhdxPath" maximum=$($Size * 1024) type=expandable
select vdisk file="$VhdxPath"
attach vdisk
create partition primary
format fs=ntfs quick label="Workspace"
detach vdisk
exit
"@
        $tempFile = [System.IO.Path]::GetTempFileName()
        $diskpartScript | Out-File $tempFile -Encoding ASCII
        diskpart /s $tempFile | Out-Null
        Remove-Item $tempFile -Force
        Write-Host "[OK] Created VHDX via diskpart: $VhdxPath (${Size}GB)" -ForegroundColor Green
    }

    # Save metadata
    $metaPath = "$VhdxPath.json"
    @{
        created = (Get-Date -Format "o")
        sizeGB = $Size
        path = $VhdxPath
        hyperV = $hasHyperV
    } | ConvertTo-Json | Out-File $metaPath -Encoding UTF8
}

function Mount-WorkspaceVhdx {
    param([string]$VhdxPath, [string]$TargetDistro)

    Write-Host "[VHDX] Mounting to WSL2 distro '$TargetDistro'..." -ForegroundColor Cyan

    $wslVer = Get-WslVersion
    Write-Host "       WSL Version: $wslVer" -ForegroundColor Gray

    # Check if WSL Preview (supports --mount --vhd)
    $preview = $false
    try { 
        $help = wsl --help 2>&1
        if ($help -match "--vhd") { $preview = $true }
    } catch {}

    if ($preview) {
        # WSL Preview: direct VHD mount
        wsl --distribution $TargetDistro --mount --vhd "$VhdxPath" --bare | Out-Null
        Write-Host "[OK] Mounted via WSL --mount --vhd" -ForegroundColor Green
    } else {
        # Legacy: Mount via diskpart + wsl --mount PhysicalDrive
        Mount-VHD -Path $VhdxPath -NoDriveLetter -ErrorAction SilentlyContinue | Out-Null
        $diskNum = (Get-VHD -Path $VhdxPath).DiskNumber
        if ($diskNum -ne $null) {
            wsl --mount "\\.\PhysicalDrive$diskNum" --bare | Out-Null
            Write-Host "[OK] Mounted PhysicalDrive$diskNum to WSL" -ForegroundColor Green
        }
    }

    # Inside WSL: format if needed and mount
    $mountScript = @'
#!/bin/bash
DEVICE=$(lsblk -dpno NAME,SIZE,TYPE | grep disk | tail -1 | awk '{print $1}')
if [ -b "${DEVICE}1" ]; then
    echo "Partition exists, mounting..."
else
    echo "Creating partition..."
    echo -e "g\nn\n1\n\n\nw" | fdisk $DEVICE
    mkfs.ext4 -G 4096 "${DEVICE}1"
fi
mkdir -p ~/workspace
mount "${DEVICE}1" ~/workspace
echo "Workspace mounted at ~/workspace"
'@

    $wslScriptPath = "/tmp/.ai-workspace-mount.sh"
    $mountScript | wsl -d $TargetDistro -e bash -c "cat > $wslScriptPath && chmod +x $wslScriptPath && bash $wslScriptPath"

    Write-Host "[OK] Workspace VHDX mounted at ~/workspace in $TargetDistro" -ForegroundColor Green
}

function Resize-DistroVhdx {
    param([string]$TargetDistro, [int]$NewSize)

    Write-Host "[VHDX] Resizing $TargetDistro to ${NewSize}GB..." -ForegroundColor Cyan

    # Shutdown WSL first
    wsl --shutdown
    Start-Sleep -Seconds 3

    # Check if wsl --manage available (WSL 2.5+)
    $hasManage = $false
    try {
        $help = wsl --help 2>&1
        if ($help -match "manage") { $hasManage = $true }
    } catch {}

    if ($hasManage) {
        wsl --manage $TargetDistro --resize "${NewSize}GB"
        Write-Host "[OK] Resized via wsl --manage" -ForegroundColor Green
    } else {
        # Manual resize with diskpart
        $packages = Get-ChildItem "HKCU:\Software\Microsoft\Windows\CurrentVersion\Lxss" -ErrorAction SilentlyContinue
        $ext4Path = $null
        foreach ($pkg in $packages) {
            $props = Get-ItemProperty $pkg.PSPath
            if ($props.DistributionName -eq $TargetDistro) {
                $ext4Path = Join-Path $pkg.PSPath.Replace("HKCU:\Software\Microsoft\Windows\CurrentVersion\Lxss\", 
                    "$env:LOCALAPPDATA\Packages") "LocalState\ext4.vhdx"
                break
            }
        }

        if ($ext4Path -and (Test-Path $ext4Path)) {
            $sizeMB = $NewSize * 1024
            $diskpartCmd = @"
select vdisk file="$ext4Path"
detail vdisk
expand vdisk maximum=$sizeMB
detach vdisk
exit
"@
            $tempFile = [System.IO.Path]::GetTempFileName()
            $diskpartCmd | Out-File $tempFile -Encoding ASCII
            diskpart /s $tempFile
            Remove-Item $tempFile -Force

            # Resize filesystem inside WSL
            wsl -d $TargetDistro -e bash -c "sudo mount -t devtmpfs none /dev && mount | grep ext4 && sudo resize2fs /dev/sd`lsblk -dpno NAME | tail -1 | sed 's/.*sd//'` $sizeMB"M 2>/dev/null || true

            Write-Host "[OK] Resized ext4.vhdx to ${NewSize}GB" -ForegroundColor Green
        }
    }
}

function Get-VhdxInfo {
    param([string]$VhdxPath)

    if (-not (Test-Path $VhdxPath)) {
        Write-Warning "VHDX not found: $VhdxPath"
        return
    }

    $item = Get-Item $VhdxPath
    $vhd = Get-VHD -Path $VhdxPath -ErrorAction SilentlyContinue

    Write-Host "`nVHDX Information:" -ForegroundColor Cyan
    Write-Host "  Path: $VhdxPath"
    Write-Host "  File Size: $([math]::Round($item.Length / 1MB, 1)) MB"
    if ($vhd) {
        Write-Host "  Virtual Size: $([math]::Round($vhd.Size / 1GB, 1)) GB"
        Write-Host "  Minimum Size: $([math]::Round($vhd.MinimumSize / 1GB, 1)) GB"
        Write-Host "  Type: $($vhd.VhdType)"
        Write-Host "  Format: $($vhd.VhdFormat)"
        Write-Host "  Attached: $($vhd.Attached)"
    }
    Write-Host ""
}

# ─── Main ───
if (-not (Test-Admin)) {
    Write-Error "This script must run as Administrator. Right-click PowerShell -> Run as Administrator."
    exit 1
}

switch ($Action) {
    "Create" { New-WorkspaceVhdx -VhdxPath $Path -Size $SizeGB }
    "Mount" { Mount-WorkspaceVhdx -VhdxPath $Path -TargetDistro $Distro }
    "Dismount" { 
        Dismount-VHD -Path $Path -ErrorAction SilentlyContinue
        Write-Host "[OK] Dismounted $Path" -ForegroundColor Green
    }
    "Resize" { 
        # Resize existing VHDX
        if (Test-HyperVAvailable) {
            Resize-VHD -Path $Path -SizeBytes ([int64]$NewSizeGB * 1GB)
        } else {
            Resize-DistroVhdx -TargetDistro $Distro -NewSize $NewSizeGB
        }
    }
    "ResizeDistro" { Resize-DistroVhdx -TargetDistro $Distro -NewSize $NewSizeGB }
    "Info" { Get-VhdxInfo -VhdxPath $Path }
    "AutoMount" {
        # Create if not exists, then mount
        if (-not (Test-Path $Path)) {
            New-WorkspaceVhdx -VhdxPath $Path -Size $SizeGB
        }
        Mount-WorkspaceVhdx -VhdxPath $Path -TargetDistro $Distro
    }
}
