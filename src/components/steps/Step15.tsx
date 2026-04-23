import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { Check, Sparkles, Download, ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import useWizardStore from '@/store/wizardStore';
import { isLinkedAccountStatus } from '@/store/wizardStore';
import { containerVariants, cardVariants, easeEnter, easeSmooth } from './variants';

export default function Step15() {
  const { completedSteps, tuningApplied, setTuningApplied, completeStep, linkedAccounts } = useWizardStore();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (tuningApplied) {
      completeStep(15);
    }
  }, [tuningApplied, completeStep]);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const benchmarks = [
    { label: 'CPU Multi-Core', value: 24500, unit: 'points', max: 30000, color: '#2563EB' },
    { label: 'GPU CUDA', value: 18200, unit: 'points', max: 25000, color: '#10B981' },
    { label: 'Disk Read', value: 6800, unit: 'MB/s', max: 8000, color: '#06B6D4' },
    { label: 'Memory Bandwidth', value: 78, unit: 'GB/s', max: 100, color: '#F59E0B' },
  ];

  const tuningItems = [
    { key: 'wslMemory', label: 'WSL memory limit set to 48GB (80% of 64GB)', checked: true },
    { key: 'cpuAffinity', label: 'CPU affinity configured for 20 cores', checked: true },
    { key: 'gpuPower', label: 'GPU power management set to maximum performance', checked: true },
    { key: 'resizableBar', label: 'Enable Resizable BAR in BIOS (optional, +5% GPU perf)', checked: false },
    { key: 'hpet', label: 'Disable HPET for lower latency (optional)', checked: false },
  ];

  const [tuningState, setTuningState] = useState<Record<string, boolean>>({
    wslMemory: true,
    cpuAffinity: true,
    gpuPower: true,
    resizableBar: false,
    hpet: false,
  });

  const handleComplete = () => {
    setTuningApplied(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const completedCount = completedSteps.filter(Boolean).length;
  const linkedCount = linkedAccounts.filter((account) => isLinkedAccountStatus(account.status)).length;

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
          colors={['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#EC4899']}
        />
      )}

      <motion.div variants={cardVariants}>
        <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Final Validation & Tuning</h1>
        <p className="text-[14px] text-[#94A3B8]">Running performance benchmarks and applying final optimizations.</p>
      </motion.div>

      <motion.div variants={cardVariants} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] p-6">
        <h3 className="text-[18px] font-semibold text-[#F0F4F8] mb-4">Benchmark Results</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {benchmarks.map((bm, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-[#64748B]">{bm.label}</span>
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: bm.color }}>{bm.unit}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <motion.span
                  className="text-[24px] font-bold text-[#F0F4F8] tracking-[-0.01em]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {bm.value.toLocaleString()}
                </motion.span>
              </div>
              <div className="h-2 rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: bm.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(bm.value / bm.max) * 100}%` }}
                  transition={{ duration: 1.5, ease: easeSmooth }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] p-6">
        <h3 className="text-[18px] font-semibold text-[#F0F4F8] mb-4">Tuning Checklist</h3>
        <div className="space-y-2">
          {tuningItems.map((item) => (
            <motion.label
              key={item.key}
              className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] cursor-pointer hover:border-[rgba(255,255,255,0.08)] transition-colors"
              whileHover={{ y: -1 }}
            >
              <Checkbox
                checked={tuningState[item.key] || false}
                onCheckedChange={(c) => setTuningState((prev) => ({ ...prev, [item.key]: c === true }))}
              />
              <span className={`text-[13px] ${tuningState[item.key] ? 'text-[#10B981] line-through' : 'text-[#94A3B8]'}`}>
                {item.label}
              </span>
            </motion.label>
          ))}
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] p-6">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer">
            <span className="text-[14px] font-medium text-[#F0F4F8]">Optional BIOS Adjustments</span>
            <ChevronDown className="w-4 h-4 text-[#64748B] group-open:rotate-180 transition-transform" />
          </summary>
          <div className="mt-4 space-y-2 text-[13px] text-[#94A3B8]">
            <p>These changes require entering your BIOS/UEFI settings:</p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Restart your computer</li>
              <li>Press DEL or F2 during boot</li>
              <li>Navigate to Advanced settings</li>
              <li>Enable Resizable BAR / Above 4G Decoding</li>
              <li>Save and exit (F10)</li>
            </ol>
          </div>
        </details>
      </motion.div>

      {!tuningApplied ? (
        <motion.div variants={cardVariants} className="flex justify-center">
          <motion.button
            onClick={handleComplete}
            className="px-8 py-4 rounded-[12px] text-[16px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
            whileHover={{ y: -2, boxShadow: '0 0 30px rgba(37,99,235,0.35)' }}
            whileTap={{ scale: 0.95 }}
          >
            Finish Setup & Celebrate
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: easeEnter }}
          className="rounded-2xl border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.04)] p-8 text-center"
        >
          <motion.img
            src="/step-complete.png"
            alt="Setup Complete"
            className="w-full max-w-[300px] mx-auto rounded-2xl mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          />
          <motion.h2
            className="text-[36px] font-extrabold text-[#F0F4F8] tracking-[-0.02em] mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Your Workspace is Ready!
          </motion.h2>
          <motion.div
            className="space-y-2 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-[14px] text-[#94A3B8]">
              <Check className="w-4 h-4 text-[#10B981] inline mr-2" />{completedCount} steps completed
            </p>
            <p className="text-[14px] text-[#94A3B8]">
              <Check className="w-4 h-4 text-[#10B981] inline mr-2" />8 software packages installed
            </p>
            <p className="text-[14px] text-[#94A3B8]">
              <Check className="w-4 h-4 text-[#10B981] inline mr-2" />{linkedCount} accounts connected
            </p>
            <p className="text-[14px] text-[#94A3B8]">
              <Check className="w-4 h-4 text-[#10B981] inline mr-2" />3 environments provisioned
            </p>
          </motion.div>
          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              onClick={() => window.open('https://zed.dev', '_blank')}
              className="px-6 py-3 rounded-[10px] text-[14px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
              whileHover={{ y: -1, boxShadow: '0 0 20px rgba(37,99,235,0.25)' }}
              whileTap={{ scale: 0.97 }}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />Start Vibe Coding!
            </motion.button>
            <motion.button
              onClick={() => {
                const report = {
                  date: new Date().toISOString(),
                  completedSteps: completedSteps.filter(Boolean).length,
                  totalSteps: 15,
                  providers: completedSteps.filter(Boolean).length > 0 ? 'Configured' : 'Pending',
                  accounts: `${linkedCount} linked`,
                  environments: 'Provisioned',
                  version: '3.0.0',
                };
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'workspace-setup-report.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-6 py-3 rounded-[10px] text-[14px] font-semibold text-[#94A3B8] border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)] transition-all"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <Download className="w-4 h-4 inline mr-2" />Download Setup Report
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
