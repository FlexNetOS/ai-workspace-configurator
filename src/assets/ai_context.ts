export const ORCHESTRATOR_SKILLS = `
# Architect AI DevOps Orchestrator - Primary Skills

## 1. Host Os Orchestration
- **Windows (PSv7 via MSI)**: Full automation of PowerShell 7 installation.
- **VHDX Virtualization**: Automated creation and mounting of 100GB dynamic VHDX (AI_ENCLAVE) as Drive Z:.
- **Firewall Hardening**: Dynamic rule generation for secure AI dev ports (11434, 8888, 3000, 5173).
- **WSL2 Integration**: Automated linkage of host VHDX to Linux subsystems via drvfs + symlinks.

## 2. Linux Optimization (Ubuntu 24.04/Pop!_OS/AthenaOS)
- **Kernel Tuning**: Sysctl optimizations for fs.file-max and vm.max_map_count.
- **Docker Hardening**: ulimit configurations and non-root user isolation.
- **ZSH Environment**: Default shell orchestration with Oh My Zsh and .local/bin pathing.

## 3. Distributed AI CLI Ecosystem
- **Gemini CLI**: Managed via Google Generative AI SDK + GCloud.
- **Claude CLI**: Manual and automated Anthropic SDK sync.
- **Moonshot (Kimi)**: Specialized moonshot-python provisioning.
- **Code Generation**: Native integration with Codex/OpenAI CLIs.

## 4. Workload Lifecycle
- **Synthesis Engine**: AI-driven generation of multi-file system blueprints.
- **Hardware Abstraction**: Zero-dependency discovery via PowerShell (Host) and Python (Cross-platform).
- **Vibe Coding Flow**: Optimized Zed/VSCode configurations with Dev Container support.
`;

export const ARCHITECT_MEMORY_TEMPLATE = `
# Current Session Context (Memory Buffer)

## Active Session Identity
- **Version**: Architect_v2.1
- **Status**: Synchronized with Host

## Activity History
- Last Synthesis: {{LAST_SYNTHESIS_PROMPT}}
- Metric Accuracy: {{METRIC_ACCURACY}}
- Linked Accounts: {{LINKED_ACCOUNTS}}

## Security Posture
- Enclave Status: {{ENCLAVE_STATUS}}
- Firewall Mode: Protected_Enclave
`;
