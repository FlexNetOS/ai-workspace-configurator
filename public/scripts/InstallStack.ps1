#Requires -RunAsAdministrator
<#
.SYNOPSIS
    AI Workspace Configurator - Full Stack Installer
.DESCRIPTION
    Idempotent installation of the complete workspace stack:
    PowerShell 7 → Windows Updates → winget packages → Docker Desktop → WSL2 → Ubuntu → 
    Zsh/OhMyZsh → ZED IDE → Kimi CLI → llama.cpp → AI Models
    Each step is resume-safe - running multiple times is safe.
.EXAMPLE
    .\InstallStack.ps1 -Phase All -Verbose
    .\InstallStack.ps1 -Phase Docker -Verbose
    .\InstallStack.ps1 -Phase Distro -DistroName Ubuntu
#>
param(
    [ValidateSet("All","PowerShell","Updates","Winget","Docker","WSL","Distro","Shell","IDE","Kimi","Llama","Models")]
    [string]$Phase = "All",
    [string]$DistroName = "Ubuntu",
    [string]$WslUsername = $env:USERNAME,
    [switch]$SkipRebootCheck,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "Continue"
$script:LogFile = "$env:USERPROFILE\.ai-workspace\logs\install-stack.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $ts = Get-Date -Format "HH:mm:ss"
    $line = "[$ts] [$Level] $Message"
    Add-Content $script:LogFile $line -ErrorAction SilentlyContinue
    if ($Verbose -or $Level -eq "ERROR" -or $Level -eq "WARN") {
        $color = switch ($Level) { "ERROR" { "Red" } "WARN" { "Yellow" } "OK" { "Green" } default { "White" } }
        Write-Host $line -ForegroundColor $color
    }
}

function Install-LatestPowerShell {
    Write-Log "=== Installing PowerShell 7 ==="
    $pwsh = Get-Command pwsh -ErrorAction SilentlyContinue
    if ($pwsh) {
        $ver = (pwsh -Command '$PSVersionTable.PSVersion.ToString()')
        Write-Log "PowerShell $ver already installed" "OK"
        return
    }

    Write-Log "Downloading PowerShell 7..."
    $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    $url = "https://github.com/PowerShell/PowerShell/releases/download/v7.4.6/PowerShell-7.4.6-win-$arch.msi"
    $msi = "$env:TEMP\PowerShell-7.4.6.msi"

    Invoke-WebRequest -Uri $url -OutFile $msi -UseBasicParsing
    Write-Log "Installing PowerShell 7..."
    Start-Process msiexec.exe -ArgumentList "/i `"$msi`" /qn /norestart ADD_EXPLORER_CONTEXT_MENU=1 ENABLE_PSREMOTING=1" -Wait
    Remove-Item $msi -Force -ErrorAction SilentlyContinue

    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + 
                [System.Environment]::GetEnvironmentVariable("Path", "User")
    Write-Log "PowerShell 7 installed" "OK"
}

function Install-WindowsUpdates {
    Write-Log "=== Running Windows Updates ==="
    try {
        Install-Module PSWindowsUpdate -Force -ErrorAction SilentlyContinue
        $pending = Get-WUList -AcceptAll -AutoSelect
        if ($pending) {
            Write-Log "Installing $($pending.Count) updates..."
            Install-WUUpdates -Updates $pending
            Write-Log "Windows Updates installed" "OK"
        } else {
            Write-Log "No updates pending" "OK"
        }
    } catch {
        Write-Log "Windows Update module not available. Please update manually." "WARN"
    }
}

function Install-WingetPackages {
    Write-Log "=== Installing Packages via winget ==="
    $packages = @(
        @{ id = "Microsoft.PowerShell"; name = "PowerShell 7" },
        @{ id = "Microsoft.WindowsTerminal"; name = "Windows Terminal" },
        @{ id = "Git.Git"; name = "Git" },
        @{ id = "GitHub.cli"; name = "GitHub CLI" },
        @{ id = "Docker.DockerDesktop"; name = "Docker Desktop" },
        @{ id = "VideoLAN.VLC"; name = "VLC (media)" },
        @{ id = "7zip.7zip"; name = "7-Zip" }
    )

    foreach ($pkg in $packages) {
        Write-Log "Installing $($pkg.name)..."
        try {
            $result = winget install --id $pkg.id --silent --accept-package-agreements --accept-source-agreements 2>&1
            if ($result -match "already installed|Already installed") {
                Write-Log "$($pkg.name) already installed" "OK"
            } else {
                Write-Log "$($pkg.name) installed" "OK"
            }
        } catch {
            Write-Log "Failed to install $($pkg.name): $_" "WARN"
        }
    }
}

function Install-DockerDesktop {
    Write-Log "=== Installing Docker Desktop ==="
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($docker) {
        Write-Log "Docker already available" "OK"
        return
    }

    $dockerPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Write-Log "Docker Desktop found, starting..."
        Start-Process $dockerPath
        Write-Log "Docker Desktop started" "OK"
        return
    }

    Write-Log "Installing Docker Desktop via winget..."
    winget install Docker.DockerDesktop --silent --accept-package-agreements
    Write-Log "Docker Desktop installed. Starting..."
    Start-Process "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue
    Write-Log "Docker Desktop installed" "OK"
}

function Install-WSL {
    Write-Log "=== Installing WSL2 ==="
    $wslCheck = wsl --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "WSL2 already installed: $wslCheck" "OK"
        return
    }

    Write-Log "Enabling WSL features..."
    Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -NoRestart -All
    Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -NoRestart -All

    Write-Log "Setting WSL default version to 2..."
    wsl --set-default-version 2 2>&1 | Out-Null
    Write-Log "WSL2 installed. A restart may be required." "OK"
}

function Install-Distro {
    param([string]$Name)
    Write-Log "=== Installing $Name ==="

    $installed = wsl -l -v 2>&1 | ForEach-Object { $_.Replace("`0","") }
    if ($installed -match $Name) {
        Write-Log "$Name already installed" "OK"
        return
    }

    Write-Log "Installing $Name from Microsoft Store..."
    wsl --install -d $Name --no-launch
    Write-Log "$Name installed. Launching to complete setup..." "OK"
}

function Install-ShellEnvironment {
    param([string]$Distro)
    Write-Log "=== Configuring Shell Environment ==="

    $setupScript = @'
#!/bin/bash
set -e

echo "[WSL] Updating packages..."
sudo apt-get update -qq

echo "[WSL] Installing essentials..."
sudo apt-get install -y -qq \
    zsh git curl wget vim nano build-essential \
    cmake python3 python3-pip python3-venv \
    nodejs npm cargo rustc \
    fd-find ripgrep fzf bat exa \
    unzip zip tar gzip

echo "[WSL] Installing Oh My Zsh..."
if [ ! -d "$HOME/.oh-my-zsh" ]; then
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
fi

echo "[WSL] Configuring Zsh..."
cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc
sed -i 's/ZSH_THEME="robbyrussell"/ZSH_THEME="agnoster"/' ~/.zshrc
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc

# Install Zsh plugins
echo "[WSL] Installing Zsh plugins..."
git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions \
    ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions 2>/dev/null || true
git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting \
    ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting 2>/dev/null || true

sed -i 's/plugins=(git)/plugins=(git zsh-autosuggestions zsh-syntax-highlighting)/' ~/.zshrc

echo "[WSL] Changing default shell to zsh..."
sudo chsh -s $(which zsh) $USER

echo "[OK] Shell environment configured"
'@

    $wslScript = "/tmp/setup-shell.sh"
    $setupScript | wsl -d $Distro -e bash -c "cat > $wslScript && chmod +x $wslScript && bash $wslScript"
    Write-Log "Shell environment configured in $Distro" "OK"
}

function Install-KimiCLI {
    param([string]$Distro)
    Write-Log "=== Installing Kimi Code CLI ==="

    $kimiScript = @'
#!/bin/bash
set -e

echo "[WSL] Installing Kimi Code CLI..."
if ! command -v kimi &> /dev/null; then
    pip3 install --user kimi-code-cli
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
    echo "[OK] Kimi CLI installed"
else
    echo "[OK] Kimi CLI already installed"
fi

echo "[WSL] Configuring Kimi defaults..."
mkdir -p ~/.kimi
cat > ~/.kimi/config.toml << 'KIMIEOF'
default_model = "kimi-k2-5"
default_thinking = true
auto_update = true
KIMIEOF

echo "[OK] Kimi CLI configured"
'@
    $kimiScript | wsl -d $Distro -e bash -c "cat > /tmp/setup-kimi.sh && chmod +x /tmp/setup-kimi.sh && bash /tmp/setup-kimi.sh"
    Write-Log "Kimi CLI installed in $Distro" "OK"
}

function Install-IDE {
    Write-Log "=== Installing ZED IDE ==="
    $zedPath = "$env:LOCALAPPDATA\Zed\bin\zed.exe"
    if (Test-Path $zedPath) {
        Write-Log "ZED already installed" "OK"
        return
    }

    Write-Log "Downloading ZED..."
    Invoke-WebRequest -Uri "https://zed.dev/api/releases/stable/latest/zed-windows-x86_64.msi" `
        -OutFile "$env:TEMP\zed-installer.msi" -UseBasicParsing
    Start-Process msiexec -ArgumentList "/i `"$env:TEMP\zed-installer.msi`" /qn" -Wait
    Remove-Item "$env:TEMP\zed-installer.msi" -Force
    Write-Log "ZED installed" "OK"
}

function Install-LlamaCpp {
    param([string]$Distro)
    Write-Log "=== Building llama.cpp ==="

    $llamaScript = @'
#!/bin/bash
set -e

LLAMA_DIR="$HOME/ai-tools/llama.cpp"
if [ -d "$LLAMA_DIR/build" ]; then
    echo "[OK] llama.cpp already built"
    exit 0
fi

echo "[WSL] Cloning llama.cpp..."
mkdir -p ~/ai-tools
git clone --depth=1 https://github.com/ggerganov/llama.git "$LLAMA_DIR" 2>/dev/null || true

echo "[WSL] Building llama.cpp with CUDA..."
cd "$LLAMA_DIR"
mkdir -p build && cd build

# Check for CUDA
if command -v nvcc &> /dev/null; then
    cmake .. -DLLAMA_CUDA=ON -DLLAMA_NATIVE=ON
else
    cmake .. -DLLAMA_NATIVE=ON
fi

cmake --build . --config Release -j$(nproc)

echo 'export PATH="$HOME/ai-tools/llama.cpp/build/bin:$PATH"' >> ~/.zshrc
echo "[OK] llama.cpp built successfully"
'@
    $llamaScript | wsl -d $Distro -e bash -c "cat > /tmp/setup-llama.sh && chmod +x /tmp/setup-llama.sh && bash /tmp/setup-llama.sh"
    Write-Log "llama.cpp built in $Distro" "OK"
}

function Install-Models {
    param([string]$Distro)
    Write-Log "=== Downloading AI Models ==="

    $modelScript = @'
#!/bin/bash
mkdir -p ~/ai-models
cd ~/ai-models

# Qwen 2.5 7B Instruct (excellent for coding)
if [ ! -f "qwen2.5-7b-instruct-q4_K_M.gguf" ]; then
    echo "[WSL] Downloading Qwen 2.5 7B..."
    huggingface-cli download Qwen/Qwen2.5-7B-Instruct-GGUF \
        qwen2.5-7b-instruct-q4_K_M.gguf \
        --local-dir ~/ai-models --local-dir-use-symlinks False
fi

# Llama 3.1 8B
if [ ! -f "Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf" ]; then
    echo "[WSL] Downloading Llama 3.1 8B..."
    huggingface-cli download bartowski/Meta-Llama-3.1-8B-Instruct-GGUF \
        Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf \
        --local-dir ~/ai-models --local-dir-use-symlinks False
fi

echo "[OK] Models downloaded to ~/ai-models"
ls -lh ~/ai-models/*.gguf
'@
    $modelScript | wsl -d $Distro -e bash -c "cat > /tmp/setup-models.sh && chmod +x /tmp/setup-models.sh && bash /tmp/setup-models.sh"
    Write-Log "AI Models downloaded in $Distro" "OK"
}

# ─── Phase Router ───
$logDir = Split-Path $script:LogFile -Parent
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
"=== AI Workspace Configurator - Install Stack ===" | Out-File $script:LogFile
Write-Log "Starting installation. Phase: $Phase"

if (-not $SkipRebootCheck) {
    $reboot = Test-Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending"
    if ($reboot) {
        Write-Log "REBOOT PENDING. Please restart Windows first, then re-run this script." "ERROR"
        exit 1
    }
}

switch ($Phase) {
    "All" { 
        Install-LatestPowerShell
        Install-WindowsUpdates
        Install-WingetPackages
        Install-DockerDesktop
        Install-WSL
        Install-Distro -Name $DistroName
        Install-ShellEnvironment -Distro $DistroName
        Install-KimiCLI -Distro $DistroName
        Install-IDE
        Install-LlamaCpp -Distro $DistroName
        Install-Models -Distro $DistroName
    }
    "PowerShell" { Install-LatestPowerShell }
    "Updates" { Install-WindowsUpdates }
    "Winget" { Install-WingetPackages }
    "Docker" { Install-DockerDesktop }
    "WSL" { Install-WSL }
    "Distro" { Install-Distro -Name $DistroName }
    "Shell" { Install-ShellEnvironment -Distro $DistroName }
    "IDE" { Install-IDE }
    "Kimi" { Install-KimiCLI -Distro $DistroName }
    "Llama" { Install-LlamaCpp -Distro $DistroName }
    "Models" { Install-Models -Distro $DistroName }
}

Write-Log "=== Installation Complete ===" "OK"
Write-Log "Log saved to: $script:LogFile"
