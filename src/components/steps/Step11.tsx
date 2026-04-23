import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import useWizardStore from '@/store/wizardStore';
import { containerVariants, cardVariants } from './variants';

export default function Step11() {
  const { addTerminalLog, completeStep } = useWizardStore();
  const [configProgress, setConfigProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (configProgress >= 100 && !isRunning && configProgress > 0) {
      completeStep(11);
    }
  }, [configProgress, isRunning, completeStep]);

  const configs = [
    { name: 'PowerShell Profile', description: 'Install modules, set theme' },
    { name: 'Windows Settings', description: 'Developer mode, file extensions' },
    { name: 'WSL Configuration', description: 'Memory limits, default version' },
    { name: 'Environment Variables', description: 'Add tools to PATH' },
    { name: 'Registry Tweaks', description: 'Performance, context menu' },
  ];

  const runConfigs = () => {
    setIsRunning(true);
    addTerminalLog('[11:23:04] === AI Workspace Installation ===');
    addTerminalLog('[11:23:04] Checkpoint: step-3-snapshot.json loaded');

    const logs: string[] = [
      '[11:23:05] Applying Windows registry settings...',
      '[11:23:05] ✓ WSL2 enabled in registry',
      '[11:23:06] ✓ Virtual Machine Platform enabled',
      '[11:23:08] Installing PowerShell modules...',
      '[11:23:10] ✓ PSGallery configured',
      '[11:23:12] ✓ Terminal-Icons installed',
      '[11:23:15] ✓ PSReadLine updated',
      '[11:23:18] Applying Windows settings...',
      '[11:23:20] ✓ Developer mode enabled',
      '[11:23:22] ✓ File extensions shown',
      '[11:23:25] Configuring WSL2...',
      '[11:23:28] ✓ .wslconfig written',
      '[11:23:30] ✓ Default WSL version set to 2',
      '[11:23:35] Setting environment variables...',
      '[11:23:38] ✓ ~/.local/bin added to PATH',
      '[11:23:40] ✓ CUDA paths configured',
      '[11:23:42] Applying registry tweaks...',
      '[11:23:45] ✓ Context menu entries added',
      '[11:23:48] ✓ Performance settings applied',
      '[11:23:50] === Configuration Complete ===',
    ];

    logs.forEach((l, i) => {
      setTimeout(() => {
        addTerminalLog(l);
        setConfigProgress(Math.min(((i + 1) / logs.length) * 100, 100));
      }, i * 200);
    });

    setTimeout(() => setIsRunning(false), logs.length * 200 + 300);
  };

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants}>
        <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Running Installation</h1>
        <p className="text-[14px] text-[#94A3B8] max-w-[600px] leading-[1.6]">
          Sit back and relax. We're installing everything now. This step is resume-safe.
        </p>
      </motion.div>

      <motion.div
        variants={cardVariants}
        className="p-3 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] flex items-center gap-3"
      >
        <Clock className="w-5 h-5 text-[#F59E0B] shrink-0" />
        <p className="text-[13px] text-[#94A3B8]">This may take 20-30 minutes. You can minimize this window.</p>
      </motion.div>

      <motion.div variants={cardVariants} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-semibold text-[#F0F4F8]">Configuration Progress</h3>
          <span className="text-[12px] text-[#64748B] font-mono">{Math.round(configProgress)}%</span>
        </div>
        <Progress value={configProgress} className="mb-6" />
        <div className="space-y-2">
          {configs.map((cfg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                configProgress >= ((i + 1) / configs.length) * 100
                  ? 'bg-[rgba(16,185,129,0.04)] border-[rgba(16,185,129,0.15)]'
                  : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.04)]'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                configProgress >= ((i + 1) / configs.length) * 100 ? 'bg-[#10B981]' : 'border-2 border-[#475569]'
              }`}>
                {configProgress >= ((i + 1) / configs.length) * 100 && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-[#F0F4F8]">{cfg.name}</p>
                <p className="text-[11px] text-[#64748B]">{cfg.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
        {!isRunning && configProgress === 0 && (
          <motion.button
            onClick={runConfigs}
            className="mt-4 px-5 py-2.5 rounded-[10px] text-[13px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            Apply Configurations
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
