import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Lock, Cpu, Monitor, RefreshCw, HardDrive,
  Loader2, CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react';
import useWizardStore from '@/store/wizardStore';
import type { CheckStatus } from '@/store/wizardStore';
import { containerVariants, cardVariants } from './variants';

function StatusIcon({ status }: { status: CheckStatus | undefined }) {
  switch (status) {
    case 'checking': return <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />;
    case 'passed':   return <CheckCircle2 className="w-5 h-5 text-[#10B981]" />;
    case 'warning':  return <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />;
    case 'failed':   return <XCircle className="w-5 h-5 text-[#EF4444]" />;
    default:         return <div className="w-5 h-5 rounded-full border-2 border-[#475569]" />;
  }
}

export default function Step4() {
  const { securityChecks, setSecurityCheck, addTerminalLog, completeStep } = useWizardStore();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const allDone = ['admin', 'uac', 'virtualization', 'windowsUpdate', 'reboot', 'diskSpace'].every(
      (k) => securityChecks[k] && securityChecks[k] !== 'checking'
    );
    if (allDone && Object.keys(securityChecks).length > 0 && !checking) {
      completeStep(4);
    }
  }, [securityChecks, checking, completeStep]);

  const checks = [
    { key: 'admin',     label: 'Administrator Rights', icon: <Shield className="w-5 h-5" />, expected: 'passed', detail: 'Required for system changes' },
    { key: 'uac',       label: 'UAC Settings',         icon: <Lock className="w-5 h-5" />, expected: 'passed', detail: 'Recommended for security' },
    { key: 'virtualization', label: 'Virtualization',  icon: <Cpu className="w-5 h-5" />, expected: 'passed', detail: 'Required for WSL2/Docker' },
    { key: 'windowsUpdate',  label: 'Windows Update',  icon: <Monitor className="w-5 h-5" />, expected: 'passed', detail: 'Check for pending updates' },
    { key: 'reboot',    label: 'Pending Reboot',       icon: <RefreshCw className="w-5 h-5" />, expected: 'warning', detail: 'Updates may need restart' },
    { key: 'diskSpace', label: 'Disk Space',           icon: <HardDrive className="w-5 h-5" />, expected: 'passed', detail: 'Sufficient for all components' },
  ];

  const runChecks = () => {
    setChecking(true);
    addTerminalLog('> Running system readiness checks...');
    checks.forEach((c, i) => {
      setTimeout(() => {
        setSecurityCheck(c.key, 'checking');
        addTerminalLog(`> Checking ${c.label}...`);
        setTimeout(() => {
          const status = c.expected as CheckStatus;
          setSecurityCheck(c.key, status);
          const icon = status === 'passed' ? '✓' : status === 'warning' ? '⚠' : '✗';
          addTerminalLog(`> ${icon} ${c.label}: ${status.toUpperCase()}`);
          if (i === checks.length - 1) {
            setChecking(false);
            addTerminalLog('> System readiness check complete.');
          }
        }, 600);
      }, i * 800);
    });
  };

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    checking: { bg: 'bg-[rgba(37,99,235,0.08)]', text: 'text-[#2563EB]', border: 'border-[rgba(37,99,235,0.2)]' },
    passed:   { bg: 'bg-[rgba(16,185,129,0.08)]', text: 'text-[#10B981]', border: 'border-[rgba(16,185,129,0.2)]' },
    warning:  { bg: 'bg-[rgba(245,158,11,0.08)]', text: 'text-[#F59E0B]', border: 'border-[rgba(245,158,11,0.2)]' },
    failed:   { bg: 'bg-[rgba(239,68,68,0.08)]', text: 'text-[#EF4444]', border: 'border-[rgba(239,68,68,0.2)]' },
    pending:  { bg: 'bg-[rgba(255,255,255,0.02)]', text: 'text-[#64748B]', border: 'border-[rgba(255,255,255,0.06)]' },
  };

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants}>
        <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">System Readiness Check</h1>
        <p className="text-[14px] text-[#94A3B8] mb-4">
          Before installing anything, let's make sure your system is ready.
        </p>
        <motion.button
          onClick={runChecks}
          disabled={checking}
          className="px-5 py-2.5 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-40 mb-4"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
          whileHover={!checking ? { y: -1 } : {}}
          whileTap={{ scale: 0.97 }}
        >
          {checking ? 'Checking...' : 'Run Checks'}
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {checks.map((c) => {
          const status = securityChecks[c.key] || 'pending';
          const colors = statusColors[status];
          return (
            <motion.div
              key={c.key}
              variants={cardVariants}
              className={`rounded-2xl border p-5 transition-all ${colors.bg} ${colors.border}`}
              animate={status === 'checking' ? { boxShadow: ['0 0 0 rgba(37,99,235,0)', '0 0 20px rgba(37,99,235,0.15)', '0 0 0 rgba(37,99,235,0)'] } : {}}
              transition={status === 'checking' ? { duration: 2, repeat: Infinity } : {}}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={colors.text}>{c.icon}</div>
                <span className="text-[14px] font-semibold text-[#F0F4F8]">{c.label}</span>
                <div className="ml-auto"><StatusIcon status={status} /></div>
              </div>
              <p className="text-[12px] text-[#64748B] mb-1">{c.detail}</p>
              {status === 'warning' && c.key === 'reboot' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-2 overflow-hidden">
                  <p className="text-[12px] text-[#F59E0B]">Windows has pending updates that require a restart.</p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#F59E0B] text-black cursor-pointer hover:bg-[#F59E0B]/80">Reboot Now</span>
                    <span className="px-3 py-1.5 rounded-lg text-[11px] text-[#94A3B8] border border-[rgba(255,255,255,0.08)] cursor-pointer hover:bg-[rgba(255,255,255,0.04)]">Skip for Now</span>
                  </div>
                </motion.div>
              )}
              {status === 'passed' && (
                <p className="text-[11px] text-[#10B981] font-mono uppercase tracking-wider">Running as Admin</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
