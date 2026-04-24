import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal, Shield, Cpu, HardDrive, Package,
  Download, Check, AlertTriangle, Play, Code2, Zap
} from 'lucide-react';

interface ScriptDef {
  id: string;
  name: string;
  description: string;
  filename: string;
  size: string;
  icon: React.ReactNode;
  category: string;
  requiresAdmin: boolean;
  purpose: string;
}

const scripts: ScriptDef[] = [
  {
    id: 'bootstrap-cmd',
    name: 'Bootstrap Launcher (Recommended)',
    description: 'Runs bootstrap.ps1 with ExecutionPolicy Bypass and auto-elevation.',
    filename: 'bootstrap.cmd',
    size: '1.0 KB',
    icon: <Zap className="w-5 h-5" />,
    category: 'Core',
    requiresAdmin: false,
    purpose: 'Preferred entry point on Windows to avoid Mark-of-the-Web execution blocks',
  },
  {
    id: 'bootstrap',
    name: 'Master Bootstrap',
    description: 'One-click full setup. Runs all phases automatically.',
    filename: 'bootstrap.ps1',
    size: '6.3 KB',
    icon: <Zap className="w-5 h-5" />,
    category: 'Core',
    requiresAdmin: true,
    purpose: 'Entry point - downloads, checks, installs everything',
  },
  {
    id: 'security',
    name: 'Security Check',
    description: 'Admin rights, UAC, virtualization, Secure Boot, Windows Update.',
    filename: 'SecurityCheck.ps1',
    size: '7.6 KB',
    icon: <Shield className="w-5 h-5" />,
    category: 'Check',
    requiresAdmin: true,
    purpose: 'Prerequisites validation with auto-fix option',
  },
  {
    id: 'hardware',
    name: 'Hardware Scanner',
    description: 'Full WMI-based hardware inventory. CPU, RAM, GPU, storage, network.',
    filename: 'HardwareScan.ps1',
    size: '8.1 KB',
    icon: <Cpu className="w-5 h-5" />,
    category: 'Scan',
    requiresAdmin: true,
    purpose: 'Real hardware detection via Windows Management Instrumentation',
  },
  {
    id: 'vhdx',
    name: 'VHDX Manager',
    description: 'Create, mount, resize VHDX disks for WSL2 workspace storage.',
    filename: 'VhdxManager.ps1',
    size: '9.1 KB',
    icon: <HardDrive className="w-5 h-5" />,
    category: 'Storage',
    requiresAdmin: true,
    purpose: 'WSL2 virtual disk management without third-party tools',
  },
  {
    id: 'install',
    name: 'Install Stack',
    description: 'Installs Docker, WSL2, Ubuntu, Zsh, ZED, Kimi CLI, llama.cpp.',
    filename: 'InstallStack.ps1',
    size: '12.8 KB',
    icon: <Package className="w-5 h-5" />,
    category: 'Install',
    requiresAdmin: true,
    purpose: 'Idempotent, resume-safe installation of all components',
  },
];

const configs = [
  {
    id: 'zed-kimi',
    name: 'ZED + Kimi ACP',
    description: 'ZED editor settings for Kimi Code CLI via Agent Client Protocol',
    filename: 'zed-kimi.json',
    icon: <Code2 className="w-5 h-5" />,
    installPath: '~/.config/zed/settings.json',
  },
  {
    id: 'kimi-toml',
    name: 'Kimi CLI Config',
    description: 'Default model, API settings, display preferences',
    filename: 'kimi-config.toml',
    icon: <Terminal className="w-5 h-5" />,
    installPath: '~/.kimi/config.toml',
  },
  {
    id: 'vscode-wsl',
    name: 'VS Code WSL Settings',
    description: 'VS Code settings for WSL2 remote development',
    filename: 'vscode-wsl.json',
    icon: <Code2 className="w-5 h-5" />,
    installPath: '%APPDATA%\\Code\\User\\settings.json',
  },
  {
    id: 'vscode-exts',
    name: 'VS Code Extensions',
    description: 'Recommended extensions list for AI workspace',
    filename: 'vscode-extensions.txt',
    icon: <Package className="w-5 h-5" />,
    installPath: 'Import via VS Code extension panel',
  },
];

function DownloadButton({ filename, label }: { filename: string; label: string }) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    const isScript = filename.endsWith('.ps1') || filename.endsWith('.cmd');
    const prefix = isScript ? '/scripts/' : '/configs/';
    try {
      const resp = await fetch(prefix + filename);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch {
      alert('Download failed. Please try again.');
    }
  };

  return (
    <motion.button
      onClick={handleDownload}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
      style={{
        background: downloaded ? 'rgba(16,185,129,0.15)' : 'rgba(37,99,235,0.1)',
        color: downloaded ? '#10B981' : '#3B82F6',
        border: `1px solid ${downloaded ? 'rgba(16,185,129,0.3)' : 'rgba(37,99,235,0.25)'}`,
      }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
    >
      {downloaded ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
      {downloaded ? 'Downloaded' : label}
    </motion.button>
  );
}

export default function ScriptPanel() {
  const [activeTab, setActiveTab] = useState<'scripts' | 'configs' | 'howto'>('scripts');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {(['scripts', 'configs', 'howto'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              activeTab === tab
                ? 'bg-[rgba(37,99,235,0.15)] text-[#3B82F6] border border-[rgba(37,99,235,0.3)]'
                : 'text-[#64748B] hover:text-[#94A3B8] border border-transparent'
            }`}
          >
            {tab === 'scripts' ? 'PowerShell Scripts' : tab === 'configs' ? 'IDE Configs' : 'How to Run'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'scripts' && (
          <motion.div
            key="scripts"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <div className="grid gap-3">
              {scripts.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-4 p-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(37,99,235,0.2)] transition-all group"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[rgba(37,99,235,0.08)] flex items-center justify-center text-[#3B82F6]">
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[14px] font-semibold text-[#F0F4F8]">{s.name}</h4>
                      {s.requiresAdmin && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.2)]">
                          ADMIN
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[rgba(255,255,255,0.04)] text-[#475569]">
                        {s.category}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#64748B] mb-1">{s.description}</p>
                    <p className="text-[11px] text-[#475569] mb-2">Purpose: {s.purpose}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#475569] font-mono">{s.filename} · {s.size}</span>
                      <DownloadButton filename={s.filename} label="Download" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'configs' && (
          <motion.div
            key="configs"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid gap-3"
          >
            {configs.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-4 p-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(37,99,235,0.2)] transition-all"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[rgba(6,182,212,0.08)] flex items-center justify-center text-[#06B6D4]">
                  {c.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-semibold text-[#F0F4F8] mb-1">{c.name}</h4>
                  <p className="text-[12px] text-[#64748B] mb-1">{c.description}</p>
                  <p className="text-[11px] text-[#475569] font-mono mb-2">Install to: {c.installPath}</p>
                  <DownloadButton filename={c.filename} label="Download Config" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'howto' && (
          <motion.div
            key="howto"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="p-4 rounded-xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.04)]">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                <h4 className="text-[14px] font-semibold text-[#F59E0B]">Administrator Required</h4>
              </div>
              <p className="text-[12px] text-[#94A3B8]">
                All PowerShell scripts require Administrator rights. Right-click PowerShell → &quot;Run as Administrator&quot;.
                The app itself runs in your browser - only the scripts need elevation.
              </p>
            </div>

            {[
              {
                step: 1,
                title: 'Download Scripts',
                desc: 'Click Download on each script above, or download the full ZIP from the Artifacts panel.',
                cmd: null,
              },
              {
                step: 2,
                title: 'Run the Bootstrap Launcher',
                desc: 'No execution policy changes needed. This launcher auto-elevates and bypasses Mark-of-the-Web blocks:',
                cmd: '.\\bootstrap.cmd',
              },
              {
                step: 3,
                title: 'Run Security Check First',
                desc: 'Validate your system before installing anything:',
                cmd: '.\\SecurityCheck.ps1 -Fix',
              },
              {
                step: 4,
                title: 'Run Full Setup',
                desc: 'Let the bootstrap handle everything (30-60 minutes):',
                cmd: '.\\bootstrap.cmd -Mode Full',
              },
              {
                step: 5,
                title: 'Configure Your IDE',
                desc: 'Copy the ZED/VS Code config files to the paths shown above.',
                cmd: null,
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgba(37,99,235,0.15)] flex items-center justify-center text-[#3B82F6] text-[12px] font-bold">
                  {item.step}
                </div>
                <div>
                  <h5 className="text-[13px] font-semibold text-[#F0F4F8] mb-1">{item.title}</h5>
                  <p className="text-[12px] text-[#64748B] mb-2">{item.desc}</p>
                  {item.cmd && (
                    <code className="block p-3 rounded-lg bg-[#050A18] border border-[rgba(255,255,255,0.06)] text-[#67E8F9] text-[12px] font-mono">
                      {item.cmd}
                    </code>
                  )}
                </div>
              </div>
            ))}

            <div className="p-4 rounded-xl border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.04)]">
              <div className="flex items-center gap-2 mb-2">
                <Play className="w-4 h-4 text-[#10B981]" />
                <h4 className="text-[14px] font-semibold text-[#10B981]">One-Liner (Advanced)</h4>
              </div>
              <code className="block p-3 rounded-lg bg-[#050A18] border border-[rgba(255,255,255,0.06)] text-[#67E8F9] text-[11px] font-mono break-all">
                iwr https://flexnetos.github.io/ai-workspace-configurator/scripts/bootstrap.cmd -OutFile $env:TEMP\ai-workspace-bootstrap.cmd; & $env:TEMP\ai-workspace-bootstrap.cmd
              </code>
              <p className="text-[11px] text-[#475569] mt-2">
                Downloads and runs the bootstrap launcher. Only use from trusted sources.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
