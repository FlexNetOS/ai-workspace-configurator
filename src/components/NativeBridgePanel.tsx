import { motion } from 'framer-motion';
import {
  Monitor, Server, Cpu, HardDrive, Globe, ArrowRight,
  FileCode, Shield, Container, Boxes, Sparkles, Terminal
} from 'lucide-react';

const architectureLayers = [
  {
    icon: <Monitor className="w-5 h-5" />,
    title: 'Electron / Tauri Desktop Shell',
    color: '#2563EB',
    desc: 'The app ships as a Windows .exe installer. The UI is the same React web app, wrapped in a native shell that provides system-level APIs.',
    capabilities: ['File system access', 'Process spawning', 'Admin privilege escalation', 'System tray integration'],
  },
  {
    icon: <Server className="w-5 h-5" />,
    title: 'Native Host Bridge (Node.js)',
    color: '#7C3AED',
    desc: 'A Node.js layer inside the desktop app that bridges the React UI to the Windows system. Runs PowerShell scripts via child_process.',
    capabilities: ['Spawn powershell.exe with args', 'Read WMI output as JSON', 'Monitor running processes', 'Stream stdout to UI in real-time'],
  },
  {
    icon: <FileCode className="w-5 h-5" />,
    title: 'PowerShell Script Engine',
    color: '#0891B2',
    desc: 'All system operations are implemented as PowerShell scripts that ship inside the app bundle. No external dependencies.',
    capabilities: ['HardwareScan.ps1 (WMI queries)', 'VhdxManager.ps1 (disk operations)', 'SecurityCheck.ps1 (prereq validation)', 'InstallStack.ps1 (idempotent installs)'],
  },
  {
    icon: <Cpu className="w-5 h-5" />,
    title: 'WMI / Windows APIs',
    color: '#059669',
    desc: 'Direct access to Windows Management Instrumentation for hardware detection, and native APIs for disk and process management.',
    capabilities: ['Win32_Processor, Win32_VideoController', 'Get-WmiObject for full inventory', 'diskpart for VHDX without Hyper-V', 'wsl.exe command interface'],
  },
  {
    icon: <HardDrive className="w-5 h-5" />,
    title: 'WSL2 + VHDX Layer',
    color: '#D97706',
    desc: 'WSL2 runs a lightweight Linux VM. The app manages VHDX virtual disks, distro installs, and kernel updates through native commands.',
    capabilities: ['wsl --install, wsl --import', 'VHDX create/mount/resize', 'ext4 filesystem management', 'GPU passthrough (CUDA/DirectML)'],
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'IDE + LLM Integration',
    color: '#DC2626',
    desc: 'The app generates configuration files for ZED and VS Code to connect to Kimi Code CLI via the Agent Client Protocol (ACP).',
    capabilities: ['Kimi CLI install inside WSL', 'ZED settings.json with ACP config', 'VS Code Remote-WSL extension', 'Model download (GGUF via huggingface-cli)'],
  },
];

export default function NativeBridgePanel() {
  return (
    <div className="space-y-5">
      {/* Architecture Overview */}
      <div className="p-4 rounded-xl border border-[rgba(37,99,235,0.15)] bg-[rgba(37,99,235,0.03)]">
        <h3 className="text-[15px] font-semibold text-[#F0F4F8] mb-3 flex items-center gap-2">
          <Boxes className="w-5 h-5 text-[#2563EB]" />
          Architecture: Browser UI + Native Execution
        </h3>
        <p className="text-[12px] text-[#94A3B8] leading-relaxed mb-4">
          The app you are using now is the <strong>web version</strong> — it guides you through setup and generates
          scripts. The <strong>desktop version</strong> (Electron) wraps this same UI with a native host that can
          execute PowerShell scripts directly. No third-party tools like DiskGenius or GParted are needed —
          we use built-in Windows commands (diskpart, Mount-VHD, wsl --manage) for all disk operations.
        </p>

        <div className="space-y-3">
          {architectureLayers.map((layer, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="relative"
            >
              {i < architectureLayers.length - 1 && (
                <div className="absolute left-5 top-10 w-px h-5 bg-[rgba(255,255,255,0.06)]" />
              )}
              <div className="flex gap-3">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${layer.color}15`, color: layer.color }}
                >
                  {layer.icon}
                </div>
                <div className="flex-1 pb-2">
                  <h4 className="text-[13px] font-semibold" style={{ color: layer.color }}>
                    {layer.title}
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5 mb-1.5 leading-relaxed">{layer.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {layer.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[rgba(255,255,255,0.04)] text-[#475569] border border-[rgba(255,255,255,0.06)]"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Data Flow */}
      <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
        <h4 className="text-[14px] font-semibold text-[#F0F4F8] mb-3">Command Flow (One Step)</h4>
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-[#64748B]">
          <span className="px-2 py-1 rounded bg-[rgba(37,99,235,0.1)] text-[#3B82F6]">React UI</span>
          <ArrowRight className="w-3 h-3" />
          <span className="px-2 py-1 rounded bg-[rgba(124,58,237,0.1)] text-[#A78BFA]">Electron IPC</span>
          <ArrowRight className="w-3 h-3" />
          <span className="px-2 py-1 rounded bg-[rgba(8,145,178,0.1)] text-[#06B6D4]">Node child_process</span>
          <ArrowRight className="w-3 h-3" />
          <span className="px-2 py-1 rounded bg-[rgba(5,150,105,0.1)] text-[#10B981]">powershell.exe</span>
          <ArrowRight className="w-3 h-3" />
          <span className="px-2 py-1 rounded bg-[rgba(217,119,6,0.1)] text-[#F59E0B]">WMI / diskpart / wsl</span>
        </div>
      </div>

      {/* Key Answers */}
      <div className="grid gap-3">
        {[
          {
            q: 'How do scripts run without a CLI installed?',
            a: 'The InstallStack script bootstraps in order: first installs winget via PowerShell, then uses winget to install Docker Desktop, Git, GitHub CLI, etc. Inside WSL, apt installs huggingface-cli and kimi-cli. Each CLI is installed before it is needed.',
            icon: <Terminal className="w-4 h-4" />,
          },
          {
            q: 'How is VHDX managed without DiskGenius/GParted?',
            a: 'Windows 11 Pro uses Mount-VHD (Hyper-V). Windows 11 Home uses diskpart (built-in). WSL2 2.5+ has wsl --manage --resize. For filesystem operations inside WSL, fdisk/mkfs.ext4 come pre-installed with Ubuntu. No third-party disk tools needed.',
            icon: <HardDrive className="w-4 h-4" />,
          },
          {
            q: 'How does Kimi connect to ZED or VS Code?',
            a: 'Kimi Code CLI implements the Agent Client Protocol (ACP). ZED reads ~/.config/zed/settings.json to find the Kimi ACP server. VS Code uses the Remote-WSL extension to connect to WSL, then the Kimi extension talks to the CLI. The app generates these config files automatically.',
            icon: <Globe className="w-4 h-4" />,
          },
          {
            q: 'How is hardware scanned without drivers?',
            a: 'Hardware scanning uses Windows Management Instrumentation (WMI), a built-in Windows subsystem. Get-WmiObject Win32_Processor, Win32_VideoController, Win32_PhysicalMemory work out-of-the-box on any Windows 11 install — no drivers or third-party tools required.',
            icon: <Cpu className="w-4 h-4" />,
          },
          {
            q: 'What is the packaging format?',
            a: 'The app ships as an .exe installer (NSIS or WiX). It bundles: the React UI, a Node.js runtime, PowerShell scripts, and config templates. The installer is ~80MB. Users download it, run it, and the guided wizard handles everything — no command-line knowledge needed.',
            icon: <Container className="w-4 h-4" />,
          },
          {
            q: 'Is this safe to run multiple times?',
            a: 'Yes — every script is idempotent. The InstallStack checks if each component exists before installing. HardwareScan overwrites the previous inventory. VhdxManager skips creation if the VHDX exists. You can re-run the full bootstrap safely after a reboot or failure.',
            icon: <Shield className="w-4 h-4" />,
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[rgba(37,99,235,0.08)] flex items-center justify-center text-[#3B82F6]">
                {item.icon}
              </div>
              <div>
                <h5 className="text-[13px] font-semibold text-[#F0F4F8] mb-1">{item.q}</h5>
                <p className="text-[12px] text-[#64748B] leading-relaxed">{item.a}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


