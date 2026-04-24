import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Check, Monitor, Zap, ExternalLink,
  Github, FileArchive, Terminal, AlertTriangle, Copy,
  Rocket, Code2
} from 'lucide-react';

interface DownloadOption {
  id: string;
  name: string;
  description: string;
  size: string;
  icon: React.ReactNode;
  action: 'download-file' | 'download-zip' | 'copy-command' | 'open-guide';
  url?: string;
  downloadAs?: string;
  recommended?: boolean;
  badge?: string;
}

const downloadOptions: DownloadOption[] = [
  {
    id: 'bootstrap',
    name: 'PowerShell Installer',
    description: 'One-liner command. Auto-downloads, installs, and launches the app.',
    size: '25 KB',
    icon: <Terminal className="w-5 h-5" />,
    action: 'copy-command',
    recommended: true,
    badge: 'Fastest',
  },
  {
    id: 'scripts-zip',
    name: 'Setup Scripts Bundle',
    description: 'All PowerShell scripts + configs in a ZIP. Run bootstrap.cmd to start (recommended).',
    size: '~50 KB',
    icon: <FileArchive className="w-5 h-5" />,
    action: 'download-zip',
    badge: 'Manual',
  },
  {
    id: 'bootstrap-file',
    name: 'Bootstrap Launcher (Recommended)',
    description: 'bootstrap.cmd runner that avoids ExecutionPolicy + Mark-of-the-Web issues.',
    size: '1 KB',
    icon: <Code2 className="w-5 h-5" />,
    action: 'download-file',
    url: '/scripts/bootstrap.cmd',
    downloadAs: 'bootstrap.cmd',
  },
  {
    id: 'desktop-app',
    name: 'Desktop App (.exe)',
    description: 'Full Electron desktop app with native PowerShell bridge. Download from GitHub Releases.',
    size: '~85 MB',
    icon: <Monitor className="w-5 h-5" />,
    action: 'open-guide',
    badge: 'Windows',
  },
];

// The one-liner install command (will work once pushed to GitHub)
const installCommand = "iwr https://flexnetos.github.io/ai-workspace-configurator/scripts/bootstrap.cmd -OutFile $env:TEMP\\ai-workspace-bootstrap.cmd; & $env:TEMP\\ai-workspace-bootstrap.cmd";

export function DownloadAppModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [downloaded, setDownloaded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'download' | 'install'>('download');

  const handleAction = (option: DownloadOption) => {
    switch (option.action) {
      case 'copy-command':
        navigator.clipboard.writeText(installCommand);
        setCopied(true);
        setDownloaded(option.id);
        setTimeout(() => { setCopied(false); setDownloaded(null); }, 3000);
        break;

      case 'download-file':
        if (!option.url) break;
        fetch(option.url)
          .then((r) => r.blob())
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = option.downloadAs ?? 'download';
            a.click();
            URL.revokeObjectURL(url);
          });
        setDownloaded(option.id);
        setTimeout(() => setDownloaded(null), 3000);
        break;

      case 'download-zip': {
        // Create a zip of all scripts using JSZip
        import('jszip').then((JSZipModule) => {
          const JSZip = JSZipModule.default;
          const zip = new JSZip();
          const scripts = [
            'bootstrap.cmd',
            'bootstrap.ps1',
            'SecurityCheck.ps1',
            'HardwareScan.ps1',
            'VhdxManager.ps1',
            'InstallStack.ps1',
            'Install-App.ps1',
          ];
          const configs = [
            'zed-kimi.json',
            'kimi-config.toml',
            'vscode-wsl.json',
            'vscode-extensions.txt',
          ];

          Promise.all([
            ...scripts.map((s) =>
              fetch(`/scripts/${s}`).then((r) => r.text()).then((t) => zip.file(`scripts/${s}`, t))
            ),
            ...configs.map((c) =>
              fetch(`/configs/${c}`).then((r) => r.text()).then((t) => zip.file(`configs/${c}`, t))
            ),
          ]).then(() => {
            zip.generateAsync({ type: 'blob' }).then((blob) => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ai-workspace-scripts-v${__APP_VERSION__}.zip`;
              a.click();
              URL.revokeObjectURL(url);
              setDownloaded(option.id);
              setTimeout(() => setDownloaded(null), 3000);
            });
          });
        });
        break;
      }

      case 'open-guide':
        // Show the desktop app guide
        setActiveTab('install');
        break;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[rgba(2,6,23,0.7)] backdrop-blur-[4px]"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[560px] max-w-[calc(100vw-32px)] max-h-[90vh] overflow-y-auto rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0B1120] shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-[rgba(37,99,235,0.12)] flex items-center justify-center">
                  <Rocket className="w-6 h-6 text-[#3B82F6]" />
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-[#F0F4F8]">Get AI Workspace Configurator</h2>
                  <p className="text-[12px] text-[#64748B]">Version {__APP_VERSION__} • Multiple ways to install</p>
                </div>
              </div>

              {/* One-liner hero */}
              <div className="mt-4 p-4 rounded-xl bg-[#050A18] border border-[rgba(37,99,235,0.15)]">
                <p className="text-[10px] text-[#475569] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#F59E0B]" />
                  Quick Install (copy &amp; paste in PowerShell as Admin)
                </p>
                <div className="flex gap-2">
                  <code className="flex-1 p-2.5 rounded-lg bg-[rgba(37,99,235,0.06)] border border-[rgba(37,99,235,0.1)] text-[#67E8F9] text-[12px] font-mono break-all">
                    {installCommand}
                  </code>
                  <motion.button
                    onClick={() => {
                      navigator.clipboard.writeText(installCommand);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 3000);
                    }}
                    className="px-3 py-2 rounded-lg text-[12px] font-medium text-white flex-shrink-0 flex items-center gap-1.5"
                    style={{ background: copied ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg, #2563EB, #06B6D4)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </motion.button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-4">
                {(['download', 'install'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-[rgba(37,99,235,0.12)] text-[#3B82F6]'
                        : 'text-[#64748B] hover:text-[#94A3B8]'
                    }`}
                  >
                    {tab === 'download' ? 'Download Options' : 'Install Guide'}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {activeTab === 'download' ? (
                <div className="space-y-3">
                  {downloadOptions.map((opt) => (
                    <motion.div
                      key={opt.id}
                      whileHover={{ y: -1 }}
                      className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                        opt.recommended
                          ? 'border-[rgba(37,99,235,0.3)] bg-[rgba(37,99,235,0.04)]'
                          : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.12)]'
                      }`}
                      onClick={() => handleAction(opt)}
                    >
                      {opt.recommended && (
                        <span className="absolute -top-2 left-4 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#2563EB] text-white">
                          RECOMMENDED
                        </span>
                      )}
                      {opt.badge && !opt.recommended && (
                        <span className={`absolute -top-2 left-4 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          'bg-[rgba(6,182,212,0.2)] text-[#06B6D4]'
                        }`}>
                          {opt.badge}
                        </span>
                      )}
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.04)] flex items-center justify-center text-[#94A3B8] mt-0.5">
                        {opt.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[13px] font-semibold text-[#F0F4F8]">{opt.name}</h4>
                          <span className="text-[10px] text-[#475569]">{opt.size}</span>
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-0.5">{opt.description}</p>
                      </div>
                      <div className="flex-shrink-0 self-center">
                        {downloaded === opt.id ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-8 h-8 rounded-lg bg-[rgba(16,185,129,0.12)] flex items-center justify-center"
                          >
                            <Check className="w-4 h-4 text-[#10B981]" />
                          </motion.div>
                        ) : opt.action === 'copy-command' ? (
                          <div className="w-8 h-8 rounded-lg bg-[rgba(37,99,235,0.08)] flex items-center justify-center">
                            <Copy className="w-4 h-4 text-[#3B82F6]" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.04)] flex items-center justify-center">
                            <Download className="w-4 h-4 text-[#475569]" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                /* ── Install Guide Tab ── */
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-[rgba(37,99,235,0.12)] flex items-center justify-center text-[#3B82F6] text-[11px] font-bold">1</div>
                      <div className="w-px h-8 bg-[rgba(255,255,255,0.06)]" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-semibold text-[#F0F4F8]">Open PowerShell as Administrator</h4>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">Right-click Start button → "Terminal (Admin)" or "Windows PowerShell (Admin)"</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-[rgba(37,99,235,0.12)] flex items-center justify-center text-[#3B82F6] text-[11px] font-bold">2</div>
                      <div className="w-px h-8 bg-[rgba(255,255,255,0.06)]" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-semibold text-[#F0F4F8]">Copy and paste the command</h4>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">Use the one-liner at the top of this dialog, or download the bootstrap script.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-[rgba(37,99,235,0.12)] flex items-center justify-center text-[#3B82F6] text-[11px] font-bold">3</div>
                      <div className="w-px h-8 bg-[rgba(255,255,255,0.06)]" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-semibold text-[#F0F4F8]">Press Enter and wait</h4>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">The script downloads all tools and runs the wizard. This takes 30–90 minutes depending on your internet.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-[rgba(16,185,129,0.12)] flex items-center justify-center text-[#10B981]">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[13px] font-semibold text-[#F0F4F8]">Start vibe-coding!</h4>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">After completion, open your terminal and type <code className="text-[#67E8F9]">kimi</code> to start.</p>
                    </div>
                  </div>

                  {/* Help note */}
                  <div className="p-3 rounded-xl border border-[rgba(245,158,11,0.15)] bg-[rgba(245,158,11,0.03)]">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-medium text-[#F59E0B]">Windows SmartScreen</p>
                        <p className="text-[10px] text-[#94A3B8] mt-0.5">
                          You may see a SmartScreen warning since the scripts are not code-signed yet. Click &quot;More info&quot; → &quot;Run anyway.&quot;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Want desktop app? */}
                  <div className="p-4 rounded-xl border border-[rgba(139,92,246,0.15)] bg-[rgba(139,92,246,0.03)]">
                    <div className="flex items-start gap-3">
                      <Github className="w-5 h-5 text-[#A78BFA] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12px] font-semibold text-[#A78BFA]">Desktop App Available</p>
                        <p className="text-[11px] text-[#94A3B8] mt-1">
                          The full Electron desktop app with native PowerShell integration is available on GitHub Releases.
                          Download the Portable or Setup version for the best experience.
                        </p>
                        <a
                          href="https://github.com/FlexNetOS/ai-workspace-configurator/releases/latest"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-[11px] text-[#3B82F6] hover:text-[#60A5FA]"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Download latest release
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <p className="text-[10px] text-[#475569]">Open Source • MIT License</p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-[#94A3B8] hover:text-[#F0F4F8] hover:bg-[rgba(255,255,255,0.04)] transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Compact Download Button
   ═══════════════════════════════════════════════════════════════ */

export function DownloadButton({ className = '' }: { className?: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white ${className}`}
        style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
        whileHover={{ y: -1, boxShadow: '0 0 20px rgba(37,99,235,0.25)' }}
        whileTap={{ scale: 0.97 }}
      >
        <Download className="w-4 h-4" />
        Download App
      </motion.button>
      <DownloadAppModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
