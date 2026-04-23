import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCircle2, Loader2 } from 'lucide-react';
import useWizardStore from '@/store/wizardStore';
import { containerVariants, cardVariants } from './variants';

export default function Step5() {
  const { addTerminalLog, completeStep } = useWizardStore();
  const [installPhase, setInstallPhase] = useState(-1);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (installPhase === 5) {
      completeStep(5);
    }
  }, [installPhase, completeStep]);

  const phases = [
    'Download PowerShell Core MSI from GitHub releases',
    'Verify download checksum',
    'Install via MSI (silent mode)',
    'Add to PATH environment variable',
    'Verify installation',
  ];

  const runInstall = () => {
    setIsInstalling(true);
    setInstallPhase(0);
    const logs = [
      '> Checking installed PowerShell version...',
      '> Found Windows PowerShell 5.1 — upgrade needed',
      '> Downloading PowerShell-7.4.2-win-x64.msi...',
      '> [##########] 100% Downloaded (95 MB)',
      '> Download complete. SHA256: a1b2c3d4... verified.',
      '> Installing PowerShell Core...',
      '> msiexec /i PowerShell-7.4.2-win-x64.msi /quiet /norestart',
      '> Installation successful. Path updated.',
      '> pwsh --version',
      '> PowerShell 7.4.2',
      '> ✓ PowerShell Core is ready!',
    ];
    logs.forEach((l, i) => {
      setTimeout(() => {
        addTerminalLog(l);
        if (l.includes('Downloading')) setInstallPhase(1);
        if (l.includes('SHA256')) setInstallPhase(2);
        if (l.includes('msiexec')) setInstallPhase(3);
        if (l.includes('Installation successful')) setInstallPhase(4);
      }, i * 250);
    });
    setTimeout(() => {
      setIsInstalling(false);
      setInstallPhase(5);
    }, logs.length * 250 + 300);
  };

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants}>
        <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Install PowerShell Core</h1>
        <p className="text-[14px] text-[#94A3B8] max-w-[600px] leading-[1.6]">
          PowerShell Core (v7.x) is the modern command-line tool we'll use throughout this setup.
          It's more powerful than the built-in Windows PowerShell.
        </p>
      </motion.div>

      <motion.div variants={cardVariants} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] p-6">
        <h3 className="text-[18px] font-semibold text-[#F0F4F8] mb-4">Installation Progress</h3>
        <div className="space-y-4">
          {phases.map((phase, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                installPhase > i ? 'bg-[#10B981] text-white' :
                installPhase === i ? 'bg-[#2563EB] text-white' :
                'border-2 border-[#475569] text-[#475569]'
              }`}>
                {installPhase > i ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px] font-mono font-bold">{i + 1}</span>}
              </div>
              <span className={`text-[13px] ${installPhase >= i ? 'text-[#F0F4F8]' : 'text-[#64748B]'}`}>{phase}</span>
              {installPhase === i && isInstalling && <Loader2 className="w-4 h-4 animate-spin text-[#2563EB] ml-auto" />}
              {installPhase > i && <Check className="w-4 h-4 text-[#10B981] ml-auto" />}
            </motion.div>
          ))}
        </div>

        {!isInstalling && installPhase < 0 && (
          <motion.button
            onClick={runInstall}
            className="mt-6 px-6 py-2.5 rounded-[10px] text-[13px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
            whileHover={{ y: -1, boxShadow: '0 0 20px rgba(37,99,235,0.25)' }}
            whileTap={{ scale: 0.97 }}
          >
            Install PowerShell
          </motion.button>
        )}

        {installPhase === 5 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-xl bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)]"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
              <div>
                <p className="text-[14px] font-semibold text-[#10B981]">PowerShell 7.4.2 Installed</p>
                <p className="text-[12px] text-[#64748B] font-mono">C:\Program Files\PowerShell\7\pwsh.exe</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
