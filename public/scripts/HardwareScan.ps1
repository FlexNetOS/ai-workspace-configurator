#Requires -RunAsAdministrator
<#
.SYNOPSIS
    AI Workspace Configurator - Hardware Inventory Scanner
.DESCRIPTION
    Performs comprehensive hardware discovery using WMI and native Windows APIs.
    Generates a JSON inventory artifact for the workspace setup wizard.
    No external dependencies required - uses built-in Windows PowerShell.
.EXAMPLE
    .\HardwareScan.ps1 -OutputPath "$env:USERPROFILE\.ai-workspace\artifacts\hardware-inventory.json"
#>
param(
    [string]$OutputPath = "$env:USERPROFILE\.ai-workspace\artifacts\hardware-inventory.json",
    [switch]$Silent
)

$ErrorActionPreference = "Stop"
$script:Progress = 0

function Write-ScanProgress {
    param([string]$Stage, [int]$Percent)
    $script:Progress = $Percent
    if (-not $Silent) {
        Write-Host "[SCAN] $Stage ... ${Percent}%" -ForegroundColor Cyan
    }
}

function Get-ProcessorInfo {
    Write-ScanProgress "Scanning CPU" 5
    $cpu = Get-WmiObject Win32_Processor | Select-Object -First 1
    $cores = (Get-WmiObject Win32_Processor | Measure-Object NumberOfCores -Sum).Sum
    $threads = (Get-WmiObject Win32_Processor | Measure-Object NumberOfLogicalProcessors -Sum).Sum
    return @{
        name = $cpu.Name.Trim()
        manufacturer = $cpu.Manufacturer
        cores = $cores
        threads = $threads
        baseClock = [math]::Round($cpu.MaxClockSpeed / 1000, 2)
        socket = $cpu.SocketDesignation
        virtualization = ($cpu.VirtualizationFirmwareEnabled -eq $true)
    }
}

function Get-MemoryInfo {
    Write-ScanProgress "Scanning RAM" 15
    $ram = Get-WmiObject Win32_PhysicalMemory
    $total = ($ram | Measure-Object Capacity -Sum).Sum
    $slots = Get-WmiObject Win32_PhysicalMemoryArray
    return @{
        totalGB = [math]::Round($total / 1GB, 1)
        modules = @($ram | ForEach-Object {
            @{
                capacityGB = [math]::Round($_.Capacity / 1GB, 1)
                speed = $_.Speed
                manufacturer = $_.Manufacturer
                partNumber = ($_.PartNumber -replace '\s+','').Trim()
            }
        })
        slotsTotal = $slots.MemoryDevices
        slotsUsed = $ram.Count
        formFactor = if ($ram[0].FormFactor -eq 12) { "SODIMM" } elseif ($ram[0].FormFactor -eq 8) { "DIMM" } else { "Unknown" }
    }
}

function Get-GpuInfo {
    Write-ScanProgress "Scanning GPU" 30
    $gpus = @()
    $controllers = Get-WmiObject Win32_VideoController | Where-Object { $_.AdapterRAM -gt 0 }
    foreach ($gpu in $controllers) {
        $vram = if ($gpu.AdapterRAM -gt 0) { [math]::Round($gpu.AdapterRAM / 1GB, 1) } else { 0 }
        $gpus += @{
            name = $gpu.Name.Trim()
            vendor = if ($gpu.Name -match "NVIDIA") { "NVIDIA" } elseif ($gpu.Name -match "AMD|Radeon") { "AMD" } elseif ($gpu.Name -match "Intel") { "Intel" } else { "Unknown" }
            vramGB = $vram
            driverVersion = $gpu.DriverVersion
            driverDate = $gpu.DriverDate
            resolution = "$($gpu.CurrentHorizontalResolution)x$($gpu.CurrentVerticalResolution)"
            refreshRate = $gpu.CurrentRefreshRate
            wslCompatible = ($gpu.Name -match "NVIDIA.*RTX|NVIDIA.*GTX.*16|NVIDIA.*GTX.*10")
        }
    }
    return $gpus
}

function Get-StorageInfo {
    Write-ScanProgress "Scanning Storage" 50
    $disks = Get-WmiObject Win32_DiskDrive
    $volumes = Get-WmiObject Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 }
    return @{
        physicalDisks = @($disks | ForEach-Object {
            @{
                model = $_.Model.Trim()
                sizeGB = [math]::Round($_.Size / 1GB, 0)
                interface = $_.InterfaceType
                media = if ($_.MediaType) { $_.MediaType } elseif ($_.Model -match "SSD") { "SSD" } else { "HDD" }
                partitions = $_.Partitions
            }
        })
        volumes = @($volumes | ForEach-Object {
            $freePct = if ($_.Size -gt 0) { [math]::Round(($_.FreeSpace / $_.Size) * 100, 1) } else { 0 }
            @{
                drive = $_.DeviceID
                label = $_.VolumeName
                totalGB = [math]::Round($_.Size / 1GB, 0)
                freeGB = [math]::Round($_.FreeSpace / 1GB, 0)
                freePercent = $freePct
                fileSystem = $_.FileSystem
            }
        })
    }
}

function Get-NetworkInfo {
    Write-ScanProgress "Scanning Network" 70
    $adapters = Get-WmiObject Win32_NetworkAdapter | Where-Object { $_.NetEnabled -eq $true -and $_.PhysicalAdapter -eq $true }
    $configs = Get-WmiObject Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true }
    return @{
        adapters = @($adapters | ForEach-Object {
            $cfg = $configs | Where-Object { $_.Index -eq $_.Index }
            @{
                name = $_.Name
                mac = $_.MACAddress
                speedMbps = if ($_.Speed) { [math]::Round($_.Speed / 1000000, 0) } else { 0 }
                ip = if ($cfg) { @($cfg.IPAddress | Where-Object { $_ -match '^\d' }) } else { @() }
                gateway = if ($cfg) { @($cfg.DefaultIPGateway) } else { @() }
                dns = if ($cfg) { @($cfg.DNSServerSearchOrder) } else { @() }
            }
        })
        internet = (Test-Connection 8.8.8.8 -Count 1 -Quiet)
    }
}

function Get-MotherboardInfo {
    Write-ScanProgress "Scanning Motherboard" 85
    $board = Get-WmiObject Win32_BaseBoard
    $system = Get-WmiObject Win32_ComputerSystem
    return @{
        manufacturer = $board.Manufacturer
        model = $board.Product
        serial = $board.SerialNumber.Trim()
        systemFamily = $system.SystemFamily
        sku = $system.SystemSKUNumber
    }
}

function Get-BiosInfo {
    Write-ScanProgress "Scanning BIOS" 90
    $bios = Get-WmiObject Win32_BIOS
    return @{
        vendor = $bios.Manufacturer
        version = $bios.SMBIOSBIOSVersion
        date = $bios.ReleaseDate
        uefi = (Get-WmiObject Win32_ComputerSystem).BIOSVersion -match "UEFI"
    }
}

# ─── Main Execution ───
Write-Host @"
╔══════════════════════════════════════════════════════════╗
║     AI Workspace Configurator - Hardware Scanner         ║
╚══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Blue

$inventory = @{
    timestamp = (Get-Date -Format "o")
    hostname = $env:COMPUTERNAME
    os = @{ 
        name = (Get-WmiObject Win32_OperatingSystem).Caption
        version = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion").DisplayVersion
        build = [System.Environment]::OSVersion.Version.ToString()
    }
    cpu = Get-ProcessorInfo
    memory = Get-MemoryInfo
    gpus = @(Get-GpuInfo)
    storage = Get-StorageInfo
    network = Get-NetworkInfo
    motherboard = Get-MotherboardInfo
    bios = Get-BiosInfo
    wslReady = @{
        virtualizationEnabled = (Get-WmiObject Win32_Processor).VirtualizationFirmwareEnabled
        hyperVAvailable = (Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux).State -eq "Enabled"
        tpmPresent = (Get-Tpm -ErrorAction SilentlyContinue).TpmPresent
    }
}

# Save
$dir = Split-Path $OutputPath -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$inventory | ConvertTo-Json -Depth 10 | Out-File $OutputPath -Encoding UTF8

Write-Host "`n[OK] Hardware inventory saved to: $OutputPath" -ForegroundColor Green
Write-Host "     CPU: $($inventory.cpu.name)" -ForegroundColor Gray
Write-Host "     RAM: $($inventory.memory.totalGB) GB ($($inventory.memory.slotsUsed)/$($inventory.memory.slotsTotal) slots)" -ForegroundColor Gray
Write-Host "     GPU: $($inventory.gpus[0].name) ($($inventory.gpus[0].vramGB) GB)" -ForegroundColor Gray
Write-Host "     Disk: $($inventory.storage.volumes[0].freeGB) GB free / $($inventory.storage.volumes[0].totalGB) GB" -ForegroundColor Gray
