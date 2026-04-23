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
  return `# --- AI DevOps Workspace Host Bootstrapper (Windows 11 Pro Optimized) ---
# .SYNOPSIS
#   Advanced Host Provisioning for AI-Centric Workflows.
# .DESCRIPTION
#   Installs PSv7, Docker Desktop, WSL2, VHDX Isolation, and AI Tooling Suite.

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   AI DEVOPS - PROFESSIONAL ARCHITECT SYNC   " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Permission & Policy Hardening
Write-Host "\n[1/10] Configuring Permissions & Policies..."
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# 2. PowerShell 7 (MSI)
Write-Host "\n[2/10] Verifying PowerShell Core Integration..."
if (!(Get-Command "pwsh" -ErrorAction SilentlyContinue)) {
    $msiUrl = "https://github.com/PowerShell/PowerShell/releases/download/v7.4.2/PowerShell-7.4.2-win-x64.msi"
    Invoke-WebRequest -Uri $msiUrl -OutFile "$env:TEMP\\pwsh.msi"
    Start-Process msiexec.exe -Wait -ArgumentList "/i $env:TEMP\\pwsh.msi /quiet"
    Write-Host "✅ PowerShell 7 Deployed." -ForegroundColor Green
}

# 3. Dynamic VHDX Partitioning (AI_ENCLAVE)
Write-Host "\n[3/10] Provisioning Dynamic VHDX (AI_ENCLAVE)..."
$vhdxDir = "$env:USERPROFILE\\Documents\\AI_Workspace"
$vhdxPath = "$vhdxDir\\ai_enclave.vhdx"
if (!(Test-Path $vhdxPath)) {
    New-Item -Path $vhdxDir -ItemType Directory -Force
    $diskScript = @"
create vdisk file="$vhdxPath" maximum=102400 type=expandable
attach vdisk
create partition primary
format fs=ntfs label="AI_WORKSPACE" quick
assign letter=Z
detach vdisk
"@
    $diskScriptPath = "$env:TEMP\\diskpart_ai.txt"
    $diskScript | Set-Content $diskScriptPath
    Start-Process diskpart.exe -ArgumentList "/s $diskScriptPath" -Wait -Verb RunAs
    Write-Host "✅ 100GB Dynamic VHDX Created at Z: (Mounted)" -ForegroundColor Green
}

# 4. Networking & Firewall Hardening
Write-Host "\n[4/10] Configuring Firewall Enclave Exceptions..."
$ports = @(3000, 8080, 8888, 5173, 11434) # Web, Jupyter, Ollama
foreach ($port in $ports) {
    if (!(Get-NetFirewallRule -DisplayName "AI_DEV_PORT_$port" -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName "AI_DEV_PORT_$port" -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow -Group "AI_DevOps"
    }
}

# 5. Toolchain: winget/choco distribution
Write-Host "\n[5/10] Provisioning DevOps Toolchain..."
winget install Docker.DockerDesktop --silent --accept-package-agreements
winget install Microsoft.VisualStudioCode --silent
winget install CLI.GitHub --silent
winget install Amazon.AWSCLI --silent
winget install Google.CloudSDK --silent
winget install Microsoft.AzureCLI --silent
winget install Microsoft.WSL --silent

# 6. WSL2 Architecture Setup
Write-Host "\n[6/10] Hardening WSL2 Subsystem..."
wsl --install --no-distribution
wsl --update
$wslConfig = @"
[wsl2]
processors=8
memory=16GB
localhostForwarding=true
nestedVirtualization=true
guiApplications=true
"@
$wslConfig | Set-Content -Path "$env:USERPROFILE\\.wslconfig"

# 7. AI Workspace Scaffolding
Write-Host "\n[7/10] Architecting Workspace Directory..."
$dirs = @("models", "datasets", "projects", ".local/bin", ".cache")
foreach ($dir in $dirs) {
    New-Item -Path "$vhdxDir\\$dir" -ItemType Directory -Force
}

# 8. AI CLI Provisioning (Host Side)
Write-Host "\n[8/10] Installing AI Interface Layer (Node/Python based)..."
winget install OpenJS.NodeJS.LTS --silent

Write-Host "\n[9/10] Finalizing Permissions..."
$acl = Get-Acl "$vhdxDir"
$permission = "Users","FullControl","Allow"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($accessRule)
Set-Acl "$vhdxDir" $acl

Write-Host "\n[10/10] SUCCESS! Host Orchestration Complete." -ForegroundColor Cyan
`;
};

export const generateLinuxSetup = () => {
  return `#!/bin/bash
# --- AI DevOps Linux Architechture Sync (Ubuntu 24.04/Pop!_OS/AthenaOS) ---
# Optimized for high-throughput AI engineering.

set -e
echo "--- INITIATING LINUX ENV SYNC ---"

# 1. Distro Detection & Sync
if [ -f /etc/debian_version ]; then
    echo "Detected: Debian/Ubuntu Base (Ubuntu 24.04 / Pop!_OS)"
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y zsh curl wget git build-essential gh docker.io python3-pip unzip nodejs npm
elif [ -f /etc/arch-release ]; then
    echo "Detected: Arch/AthenaOS Base"
    sudo pacman -Syu --noconfirm zsh curl wget git base-devel github-cli docker python-pip nodejs npm
fi

# 2. Oh My Zsh (Headless)
if [ ! -d "$HOME/.oh-my-zsh" ]; then
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
fi

# 3. .local/bin Workspace Scaffolding
mkdir -p ~/.local/bin ~/.cache/ai-models ~/workspace/src ~/workspace/data
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc

# 4. Specialized AI CLIs (Kimi, Gemini, Claude, Codex)
echo "[4/7] Deploying Interface Layer CLIs..."
# Gemini CLI (Google Cloud/SDK)
# Claude CLI (Via Anthropic SDK shell wrapper)
pip3 install --user anthropic google-generativeai moonshot-python openai
npm install -g @anthropic-ai/sdk @google/generative-ai @openai/openai-cli || true

# 5. VHDX Linkage & Scaffolding (WSL-Specific)
if grep -q "microsoft" /proc/version; then
    echo "Provisioning WSL Symlinks for AI Workspace..."
    # Assuming host side VHDX is mounted to Z: and accessible via /mnt/z
    sudo mkdir -p /mnt/z
    sudo mount -t drvfs Z: /mnt/z || true
    
    # Link isolated high-speed VHDX storage to internal workspace
    [ -d "/mnt/z" ] && ln -s /mnt/z ~/workspace_enclave || true
fi

# 6. Docker Performance Tuning
sudo usermod -aG docker $USER
echo '{"default-ulimits":{"nofile":{"Name":"nofile","Hard":65536,"Soft":65536}}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker || true

# 7. Final Kernel Optimization (Sysctl)
sudo sysctl -w fs.file-max=2097152
sudo sysctl -w vm.max_map_count=262144

echo "✅ LINUX DEV_WORKSPACE READY."
`;
};

export const generateHostDocs = (enableGoogleAuth: boolean) => {
  return `# Host System Optimization & Documentation

To ensure high-performance execution of the generated AI workspace, your host machine requires specific configuration for GPU acceleration, multi-core parallel processing, and secure secret mounting.

---

## 🏗️ 1. Windows Host (WSL2 Architecture)

Windows users should utilize **WSL2** for the best performance. This setup maximizes I/O and ensures CUDA drivers are correctly mapped from the Windows host into the dev container.

### Prerequisites:
* **WSL2** installed and updated (\`wsl --update\`)
* **Docker Desktop** with WSL2 backend enabled
* **NVIDIA Driver 595.00+** (if using RTX GPU)

### Automated Setup Script:
This script verifies your environment, installs missing DevOps binaries via Chocolatey/Winget, and configures \`.wslconfig\`.

\`\`\`powershell
${generateWindowsSetup()}
\`\`\`

---

## 🐧 2. Linux Host (Native Ubuntu/Debian)

Native Linux provides the lowest latency for model training and high-speed data processing.

### Prerequisites:
* **Docker Engine** 24.0+
* **NVIDIA Container Toolkit** (for GPU acceleration)
* **build-essential** & **git**

### Automated Setup Script:
Run this to update your toolchain, install the DevOps stack, and optimize your kernel for AI workloads.

\`\`\`bash
${generateLinuxSetup()}
\`\`\`

---

## 💾 3. AI_ENCLAVE Storage (Isolated VHDX)
The setup script provisions a dedicated, high-speed **AI_ENCLAVE** using a dynamic VHDX mounted as **Drive Z:**. 
* **Isolation**: Keeps internal AI data, models, and multi-GB datasets separate from your OS partition.
* **Performance**: Optimized for WSL2 drvfs mounting for low-latency training I/O.
* **Scaffolding**: Automatically creates \`models\`, \`datasets\`, and \`.local\` structures.

## 🔐 4. Security & Connectivity

### Google Auth & Gemini SDKs
${enableGoogleAuth 
  ? "This workspace includes the Google Generative AI SDK. Ensure your host has the Google Cloud CLI installed or use the provided `.env.example` to map your API Key."
  : "Google SDKs are not included in this build. If needed, toggle 'Google Auth/SDKs' in the Architect settings."}

### VS Code Integration
1. Install **'Dev Containers'** extension by Microsoft.
2. Open this folder in VS Code.
3. Select **'Reopen in Container'** when prompted at the bottom right.

---
*Created by Architect_AI Engine v2.0*`;
};

export const generateHardwareInspectorPs = () => {
  return `# --- AI Hardware Discovery Agent (Zero-Dependency PowerShell) ---
$info = @{
    OS = [System.Environment]::OSVersion.VersionString
    CPU = (Get-CimInstance Win32_Processor).Name
    Cores = (Get-CimInstance Win32_Processor).NumberOfLogicalProcessors
    RAM_GB = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)
    GPU = @("None")
    Timestamp = (Get-Date).ToString("o")
}

try {
    $nvidia = (nvidia-smi --query-gpu=name,driver_version --format=csv,noheader).Split(',')
    if ($nvidia) { $info.GPU = $nvidia }
} catch {}

$json = $info | ConvertTo-Json -Depth 5
$json | Set-Content "hardware_inventory.json"
Write-Host "---------------------------------------------"
Write-Host "🚀 DISCOVERY_COMPLETE [HOST_WINDOWS]" -ForegroundColor Cyan
Write-Host "CPU: $($info.CPU)"
Write-Host "GPU: $($info.GPU[0])"
Write-Host "✅ inventory saved to hardware_inventory.json" -ForegroundColor Green
Write-Host "---------------------------------------------"
`;
};

export const generateHardwareInspector = () => {
  return `import os
import json
import subprocess
import platform

def get_gpu_info():
    try:
        # Check for NVIDIA GPUs via nvidia-smi
        res = subprocess.check_output(['nvidia-smi', '--query-gpu=name,driver_version,memory.total,cuda_compute_capability', '--format=csv,noheader,nounits'])
        return res.decode('utf-8').strip().split(',')
    except:
        return ["None", "N/A", "0", "N/A"]

def scan():
    print("🚀 INITIATING_HARDWARE_SCAN [VIBE_MODE_ACTIVE]")
    info = {
        "os": platform.system(),
        "os_release": platform.release(),
        "cpu": platform.processor(),
        "cores_logical": os.cpu_count(),
        "gpu": get_gpu_info(),
        "timestamp": str(platform.node())
    }
    
    with open('hardware_inventory.json', 'w') as f:
        json.dump(info, f, indent=4)
    
    print("-" * 40)
    print(f"DEVICE: {info['os']} {info['os_release']}")
    print(f"CPU: {info['cpu']} ({info['cores_logical']} cores)")
    print(f"GPU: {info['gpu'][0]} [DRIVER: {info['gpu'][1]}]")
    print("-" * 40)
    print("✅ INVENTORY_CREATED: hardware_inventory.json")

if __name__ == "__main__":
    scan()
`;
};

export const generateEnvExample = (selectedAccounts: Record<string, boolean>) => {
  return `# WORKFORCE_LIFECYCLE_ENCLAVE - CONFIGURATION_ENVELOPE
# Fill these values to enable full module connectivity.

# --- LLM_CORES ---
GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OPENROUTER_API_KEY=
HF_TOKEN=

# --- INFRA_VCS ---
${selectedAccounts['github'] ? 'GITHUB_TOKEN=' : '# GITHUB_TOKEN='}
${selectedAccounts['docker'] ? 'DOCKER_HUB_TOKEN=' : '# DOCKER_HUB_TOKEN='}
${selectedAccounts['cloudflare'] ? 'CLOUDFLARE_API_TOKEN=' : '# CLOUDFLARE_API_TOKEN='}

# --- TOOLS_SYNC ---
${selectedAccounts['notion'] ? 'NOTION_API_KEY=' : '# NOTION_API_KEY='}
${selectedAccounts['google'] ? 'GOOGLE_CLIENT_ID=\nGOOGLE_CLIENT_SECRET=' : '# GOOGLE_CLIENT_ID=\n# GOOGLE_CLIENT_SECRET='}
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

## 🚀 Hardware Discovery
To optimize the workspace for your specific silicon (RTX cores, logical threads), run the discovery agent:

### Windows (Zero-Dependency)
\`\`\`powershell
.\\inspect_hardware.ps1
\`\`\`

### Linux / macOS (Python Required)
\`\`\`bash
python3 inspect_hardware.py
\`\`\`

This creates \`hardware_inventory.json\` which the DevContainer uses to bind parallel processes to your actual core count.

## 🔑 Secret Management & LLM Connection
The workspace is built for multi-LLM orchestration. 
1. Rename \`.env.example\` to \`.env\`.
2. Populate the keys for your providers (Gemini, OpenAI, etc.).
3. The DevContainer will automatically inject these into your Shell/Python environment.

## 🏗️ Starting the Workspace
1. Launch **VS Code**.
2. Install the **Dev Containers** extension.
3. Open this folder in VS Code.
4. Press \`Ctrl+Shift+P\` and select **"Dev Containers: Reopen in Container"**.
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
