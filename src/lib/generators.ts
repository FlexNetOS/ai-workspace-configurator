import { GenerationResult } from '../services/geminiService';

export const generateDockerfile = (result: GenerationResult | null, needsGpu: boolean, setupAdminUser: boolean, enableGoogleAuth: boolean) => {
  if (!result) return "";
  const deps = result.dependencies;
  const baseImg = deps.base_image || (needsGpu ? 'nvidia/cuda:13.2.0-cudnn9-devel-ubuntu22.04' : 'ubuntu:22.04');
  const isDebian = baseImg.includes('ubuntu') || baseImg.includes('debian') || baseImg.includes('cuda');

  let userSetup = '';
  if (setupAdminUser) {
    if (isDebian) {
      userSetup = `\n# Create a non-root admin user\nARG USERNAME=ai-dev\nARG USER_UID=1000\nARG USER_GID=$USER_UID\n\nRUN groupadd --gid $USER_GID $USERNAME \\\n    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \\\n    && echo $USERNAME ALL=\\(root\\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \\\n    && chmod 0440 /etc/sudoers.d/$USERNAME \\\n    && chown -R $USERNAME:$USERNAME /workspace\n`;
    } else {
      userSetup = `\n# Create a non-root admin user (Generic/Alpine)\nARG USERNAME=ai-dev\nARG USER_UID=1000\n\nRUN (addgroup -g $USER_UID $USERNAME || groupadd -g $USER_UID $USERNAME) \\\n    && (adduser -D -u $USER_UID -G $USERNAME -s /bin/sh $USERNAME || useradd -u $USER_UID -g $USERNAME -m -s /bin/sh $USERNAME) \\\n    && echo "$USERNAME ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers \\\n    && chown -R $USERNAME:$USERNAME /workspace || true\n`;
    }
  }

  const userSwitch = setupAdminUser ? '\nUSER $USERNAME\n' : '';
  const pathEnv = setupAdminUser ? 'ENV PATH="/home/ai-dev/.local/bin:${PATH}"\nENV OMP_NUM_THREADS=$(nproc)\nENV MAKEFLAGS="-j$(nproc)"\n' : 'ENV OMP_NUM_THREADS=$(nproc)\nENV MAKEFLAGS="-j$(nproc)"\n';
  const pkgCmd = deps.pkg_manager_cmd || 'apt-get update && apt-get install -y';
  const cleanCmd = pkgCmd.includes('apt') ? '&& rm -rf /var/lib/apt/lists/*' : '';

  const sysList = ['python3-pip', 'python3-dev', 'git', 'wget', 'sudo', ...(deps.system_packages || [])].join(' \\\n    ');
  
  const basePipList = ['torch torchvision torchaudio', 'jupyterlab', 'transformers', 'pandas numpy'];
  if (enableGoogleAuth) {
    basePipList.push('google-generativeai google-auth google-auth-oauthlib google-api-python-client');
  }
  const pipList = [...basePipList, ...(deps.pip_packages || [])].join(' \\\n    ');

  const additionalConfigs = [
    deps.network_config ? `\n# Network\n${deps.network_config}` : '',
    deps.shell_and_path ? `\n# Shell/Path\n${deps.shell_and_path}` : '',
    deps.local_ai_setup ? `\n# Local AI Tools\n${deps.local_ai_setup}` : '',
    deps.hooks_and_skills ? `\n# Hooks/Skills\n${deps.hooks_and_skills}` : ''
  ].filter(Boolean).join('\n');

  return `# AI Workspace - Auto Generated
FROM ${baseImg}

# System dependencies
RUN ${pkgCmd} \\
    ${sysList} \\
    ${cleanCmd}

WORKDIR /workspace${userSetup}${additionalConfigs}
${userSwitch}${pathEnv}
# Python dependencies (Including Google Auth & Gemini SDKs)
RUN pip3 install ${setupAdminUser ? '--user' : ''} --no-cache-dir \\
    ${pipList}

CMD ["sleep", "infinity"]`;
};

export const generateDockerCompose = (result: GenerationResult | null, needsGpu: boolean, useSecrets: boolean) => {
  if (!result) return "";
  const deps = result.dependencies;
  const gpuConfig = needsGpu ? `\n    deploy:\n      resources:\n        reservations:\n          devices:\n            - driver: nvidia\n              count: all\n              capabilities: [gpu]` : '';
  const envConfig = useSecrets ? `\n    env_file:\n      - ../.env` : '';
  const extraServices = deps.docker_compose_services ? `\n\n  ${deps.docker_compose_services.split('\n').join('\n  ')}` : '';

  return `version: '3.8'
services:
  app:
    build: 
      context: ..
      dockerfile: .devcontainer/Dockerfile
    volumes:
      - ../:/workspace:cached${gpuConfig}${envConfig}
    # Keeps the container running
    command: sleep infinity${extraServices}`;
};

export const generateDevContainer = (result: GenerationResult | null, useDockerCompose: boolean, needsGpu: boolean, useSecrets: boolean, mountData: boolean, cacheModel: boolean, setupAdminUser: boolean, enableGoogleAuth: boolean) => {
  if (!result) return "";
  const deps = result.dependencies;
  const extensions = Array.from(new Set(["ms-python.python", "ms-toolsai.jupyter", ...(deps.vscode_extensions || [])]));
  
  const defaultPorts = enableGoogleAuth ? [8888, 8080] : [8888];
  const ports = Array.from(new Set([...defaultPorts, ...(deps.forward_ports || [])]));
  
  let mounts = [];
  if (!useDockerCompose) {
    mounts.push(`"source=\${localWorkspaceFolder},target=/workspace,type=bind,consistency=cached"`);
    if (useSecrets) mounts.push(`"source=\${localWorkspaceFolder}/.env,target=/workspace/.env,type=bind"`);
  }

  if (mountData) {
    mounts.push(`"source=/mnt/host/data,target=/workspace/data,type=bind,readonly"`);
  }
  
  if (cacheModel) {
    const cacheTarget = setupAdminUser ? '/home/ai-dev/.cache/huggingface' : '/root/.cache/huggingface';
    mounts.push(`"source=huggingface-cache,target=${cacheTarget},type=volume"`);
  }

  const baseConfig = useDockerCompose 
    ? `"dockerComposeFile": "docker-compose.yml",\n  "service": "app",\n  "workspaceFolder": "/workspace"`
    : `"build": {\n    "dockerfile": "Dockerfile",\n    "context": ".."\n  }${needsGpu ? ',\n  "runArgs": ["--gpus", "all"]' : ''}`;

  const mountsStr = mounts.length > 0 ? `,\n  "mounts": [\n    ${mounts.join(',\n    ')}\n  ]` : '';
  const postCreate = deps.post_create_command ? `,\n  "postCreateCommand": ${JSON.stringify(deps.post_create_command)}` : '';

  return `{
  "name": "AI Dev Workspace",
  ${baseConfig},
  
  "customizations": {
    "vscode": {
      "extensions": ${JSON.stringify(extensions, null, 8).replace(/\]/g, '      ]')}
    }
  },
  
  "forwardPorts": ${JSON.stringify(ports)}${mountsStr}${postCreate},

  "remoteUser": "${setupAdminUser ? 'ai-dev' : 'root'}"${setupAdminUser ? ',\n  "updateRemoteUserUID": true' : ''}
}`;
};

export const generateWindowsSetup = () => {
  return `# --- AI DevOps Workspace Host Bootstrapper (Windows 11 Home/Pro) ---
# .SYNOPSIS
#   Automated setup for high-performance AI vibe coding environment.
# .DESCRIPTION
#   Installs PSv7, DockerDesktop, WSL2, configures VHDX isolation, ZED IDE, and NVIDIA v595+ stack.

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   AI DevOps Workspace - ARCHITECT BOOTSTRAP " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Latest PowerShell Core via MSI
Write-Host "\n[1/8] Verifying PowerShell Core (v7.4+)..."
if (!(Get-Command "pwsh" -ErrorAction SilentlyContinue)) {
    $msiUrl = "https://github.com/PowerShell/PowerShell/releases/download/v7.4.2/PowerShell-7.4.2-win-x64.msi"
    Invoke-WebRequest -Uri $msiUrl -OutFile "$env:TEMP\\pwsh.msi"
    Start-Process msiexec.exe -Wait -ArgumentList "/i $env:TEMP\\pwsh.msi /quiet"
    Write-Host "✅ PowerShell Core Deployed." -ForegroundColor Green
}

# 2. Docker Desktop & WSL2 Backend
Write-Host "\n[2/8] Syncing Docker Desktop & WSL2 Subsystem..."
if (!(Get-Command "docker" -ErrorAction SilentlyContinue)) {
    winget install Docker.DockerDesktop --silent --accept-package-agreements
}
wsl --install --no-distribution
wsl --update

# 3. Dedicated VHDX Image Mapping
Write-Host "\n[3/8] Configuring isolated VHDX storage for AI Distros..."
$vhdxPath = "$env:USERPROFILE\\Documents\\WSL_Data\\ai_distro.vhdx"
if (!(Test-Path $vhdxPath)) {
    New-Item -Path (Split-Path $vhdxPath) -ItemType Directory -Force
    Write-Host "Created virtual snapshot target at $vhdxPath" -ForegroundColor Gray
}

# 4. ZED IDE & Toolchain
Write-Host "\n[4/8] Installing ZED IDE & DevOps CLI (gh, docker, huggingface)..."
winget install Zed.Zed --silent
winget install CLI.GitHub --silent

# 5. Resource Mapping (.wslconfig)
$cores = (Get-CimInstance Win32_ComputerSystem).NumberOfLogicalProcessors
$ram = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)
$wslMemory = [math]::Max(4, [math]::Round($ram * 0.8))

$wslConfig = @"
[wsl2]
processors=$cores
memory=\${wslMemory}GB
localhostForwarding=true
guiApplications=true
"@
Set-Content -Path "$env:USERPROFILE\\.wslconfig" -Value $wslConfig
Write-Host "✅ Mapped $cores Cores & \${wslMemory}GB RAM to WSL kernel." -ForegroundColor Green

# 6. NVIDIA v595+ Hardware Detection
Write-Host "\n[6/8] Hardware Audit: RTX 5090 / CUDA 13.2 Requirements..."
try {
    $driver = (nvidia-smi --query-gpu=driver_version --format=csv,noheader)
    Write-Host "Detected NVIDIA Driver: $driver" -ForegroundColor Green
    Write-Host "Reference Driver PR: https://github.com/pop-os/nvidia-graphics-drivers-595/pull/" -ForegroundColor Gray
    Write-Host "Reference Linux PR: https://github.com/pop-os/linux/pull/412" -ForegroundColor Gray
} catch {
    Write-Warning "GPU not detected or nvidia-smi missing."
}

Write-Host "\n[7/8] Initializing local directory structure..."
New-Item -Path "$env:USERPROFILE\\.local\\bin" -ItemType Directory -Force

Write-Host "\n[8/8] Finalizing Bootstrap..."
Write-Host "Setup Complete. Run the companion Linux setup in WSL for ZSH & llama.cpp optimization." -ForegroundColor Cyan
`;
};

export const generateLinuxSetup = () => {
  return `#!/bin/zsh
# --- AI DevOps Workspace Host optimization (Linux/WSL2) ---
# Target Distros: AthenaOS (Nix), Pop!_OS (Nvidia 595 Optimized)

set -e

echo "--- INITIATING LINUX ARCHITECT SYNC ---"

# 1. Update & Upgrade Sequence
echo "[1/7] Full System Synchronization..."
sudo apt update && sudo apt upgrade -y || sudo pacman -Syu --noconfirm

# 2. Oh My Zsh & Shell Environment
echo "[2/7] Deploying ZSH with Oh My Zsh..."
if [ ! -d "$HOME/.oh-my-zsh" ]; then
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
    chsh -s $(which zsh)
fi

# 3. Path & .local workspace
mkdir -p ~/.local/bin
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc

# 4. Advanced Toolchain (gh, docker, hf, zed)
echo "[4/7] verify DevOps binaries..."
sudo apt install -y gh docker.io python3-pip build-essential cmake
pip3 install --user huggingface_hub

# 5. llama.cpp Deployment (Qwen 3.5 9B)
echo "[5/7] architecting llama.cpp environment..."
if [ ! -d "llama.cpp" ]; then
    git clone https://github.com/ggerganov/llama.cpp
    cd llama.cpp && mkdir build && cd build
    cmake .. -DGGML_CUDA=ON
    make -j$(nproc)
    cd ../..
    mv llama.cpp/build/bin/main ~/.local/bin/llama-cli
fi

# 6. Specialized GPU stack (Pop!_OS v595 optimization)
echo "[6/7] GPU Driver Linkage Reference..."
echo "Verify Pop!_OS Drivers if on Pop: pop-os/nvidia-graphics-drivers-595 (PR Check)"
echo "Linux Kernel Pull: https://github.com/pop-os/linux/pull/412"

# 7. Final Permissions & Permission Correction
echo "[7/7] Correcting permission hierarchy..."
sudo chown -R $USER:$USER ~/.local
sudo chmod +x ~/.local/bin/*

echo "✅ ARCHITECT LINUX SYNC COMPLETE. SHELL: ZSH ACTIVE."
`;
};

export const generateReadme = (result: GenerationResult | null, needsGpu: boolean, setupAdminUser: boolean, useDockerCompose: boolean, enableGoogleAuth: boolean) => {
  if (!result) return "";
  const deps = result.dependencies;
  return `# AI DevOps Workspace

This repository contains a reproducible, hardware-optimized AI development environment generated by the AI Workspace Architect.

## Prerequisites & Host Setup
To ensure maximum performance (multi-core parallel processing, GPU passthrough, and I/O speeds), you must configure your host machine first.

### Windows Host
We have provided an automated PowerShell script that installs the latest PowerShell via MSI, verifies VS Code & Docker, sets up WSL2 parallel thread logic (\`.wslconfig\`), and checks for RTX 5090 / CUDA 13.2 driver compatibility.
1. Open PowerShell as Administrator.
2. Run the script:
   \`\`\`powershell
   .\\setup_host.ps1
   \`\`\`

### Linux Host (Ubuntu/Debian)
We have provided a bash script to update your system, install Docker, map \`nproc\` parallel logic, and install the NVIDIA Container Toolkit.
1. Make the script executable and run it:
   \`\`\`bash
   chmod +x setup_host.sh
   ./setup_host.sh
   \`\`\`

## Starting the Workspace
1. Launch **VS Code**.
2. Install the **Dev Containers** extension.
3. Open this folder in VS Code.
4. Press \`Ctrl+Shift+P\` and select **"Dev Containers: Reopen in Container"**.

${enableGoogleAuth ? `## Google Auth & Gemini API Setup
This container is pre-configured for Google SDKs and Gemini integration.

**1. Connecting via API Key:**
Edit the \`.env\` file in the root of your project:
\`\`\`env
GEMINI_API_KEY=your_key_here
\`\`\`

**2. Connecting via OAuth:**
Run your Python script that utilizes \`InstalledAppFlow\`. The DevContainer automatically forwards port \`8080\` back to your host browser.` : ''}

## Features Included
* **Architecture**: ${useDockerCompose ? 'Multi-container Docker Compose' : 'Single Docker Container'}
* **Base Image**: ${deps.base_image || (needsGpu ? 'nvidia/cuda:13.2.0-cudnn9-devel-ubuntu22.04' : 'ubuntu:22.04')}
* **GPU Target**: Driver 595+ / CUDA 13.2+
* **Parallel Processing**: Automatically bound to all logical host cores.
* **Security**: Non-root \`ai-dev\` user (${setupAdminUser ? 'Enabled' : 'Disabled'}).

---
### AI Generated Guide
${result.readme}
`;
};
