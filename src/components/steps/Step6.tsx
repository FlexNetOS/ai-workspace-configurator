import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Package, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import useWizardStore from '@/store/wizardStore';
import { containerVariants, cardVariants } from './variants';

export default function Step6() {
  const { addTerminalLog, completeStep } = useWizardStore();
  const [updateState, setUpdateState] = useState<'idle' | 'updating' | 'done'>('idle');

  useEffect(() => {
    if (updateState === 'done') {
      completeStep(6);
    }
  }, [updateState, completeStep]);

  const [pass, setPass] = useState(0);
  const [apps, setApps] = useState([
    { name: 'Docker Desktop', from: '4.27.0', to: '4.28.0', status: 'queued' },
    { name: 'Git', from: '2.42.0', to: '2.43.0', status: 'queued' },
    { name: 'VS Code', from: '1.86.0', to: '1.87.0', status: 'queued' },
    { name: 'Node.js', from: '20.10.0', to: '20.11.0', status: 'queued' },
    { name: 'Windows Terminal', from: '1.18', to: '1.19', status: 'queued' },
  ]);

  const runUpdates = () => {
    setUpdateState('updating');
    setPass(1);
    addTerminalLog('> Checking for Windows updates...');
    addTerminalLog('> Found 12 updates available');

    const updateLogs = [
      '> Downloading: KB5034441, KB5035853...',
      '> Installing updates (this may take a while)...',
      '> Pass 1 complete. 3 updates remaining.',
      '> Retrying...',
      '> Pass 2 complete. All updates installed!',
    ];
    updateLogs.forEach((l, i) => setTimeout(() => addTerminalLog(l), (i + 2) * 400));

    setTimeout(() => setPass(2), 6 * 400);
    setTimeout(() => {
      setPass(3);
      addTerminalLog('> Running winget upgrade --all...');
      apps.forEach((app, i) => {
        setTimeout(() => {
          setApps((prev) => prev.map((a, j) => j === i ? { ...a, status: 'upgrading' } : a));
          addTerminalLog(`> Upgrading ${app.name} ${app.from} → ${app.to}...`);
          setTimeout(() => {
            setApps((prev) => prev.map((a, j) => j === i ? { ...a, status: 'done' } : a));
            addTerminalLog(`> ✓ ${app.name} upgraded successfully`);
          }, 500);
        }, i * 700 + 8 * 400);
      });
    }, 12 * 400);

    setTimeout(() => {
      setUpdateState('done');
      addTerminalLog('> ✓ All updates complete. System is fully current.');
    }, 12 * 400 + apps.length * 700 + 1000);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'done': return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.25)]">Done</span>;
      case 'upgrading': return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(37,99,235,0.1)] text-[#2563EB] border border-[rgba(37,99,235,0.25)] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Upgrading</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(255,255,255,0.04)] text-[#64748B] border border-[rgba(255,255,255,0.08)]">Queued</span>;
    }
  };

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants}>
        <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Update Everything</h1>
        <p className="text-[14px] text-[#94A3B8] max-w-[600px] leading-[1.6]">
          Let's get your system fully up to date. This runs Windows Update and updates all your apps automatically.
        </p>
      </motion.div>

      <motion.div variants={cardVariants} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <RefreshCw className={`w-5 h-5 text-[#2563EB] ${updateState === 'updating' ? 'animate-spin' : ''}`} />
            <h3 className="text-[18px] font-semibold text-[#F0F4F8]">Windows Update</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-[11px] font-medium ${
            updateState === 'done' ? 'bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.25)]' :
            updateState === 'updating' ? 'bg-[rgba(37,99,235,0.1)] text-[#2563EB] border border-[rgba(37,99,235,0.25)]' :
            'bg-[rgba(255,255,255,0.04)] text-[#64748B] border border-[rgba(255,255,255,0.08)]'
          }`}>
            {updateState === 'done' ? 'Up to date' : updateState === 'updating' ? `Pass ${Math.min(pass, 2)} of 2` : 'Pending'}
          </span>
        </div>
        {updateState === 'updating' && (
          <Progress value={Math.min((pass / 3) * 100, 100)} className="mb-4" />
        )}
        {updateState === 'idle' && (
          <motion.button
            onClick={runUpdates}
            className="px-5 py-2.5 rounded-[10px] text-[13px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            Start Updates
          </motion.button>
        )}
      </motion.div>

      <motion.div variants={cardVariants} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] p-6">
        <h3 className="text-[18px] font-semibold text-[#F0F4F8] mb-4">App Upgrades (winget)</h3>
        <div className="space-y-2">
          {apps.map((app, i) => (
            <motion.div
              key={app.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]"
            >
              <Package className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span className="text-[13px] text-[#F0F4F8] flex-1">{app.name}</span>
              <span className="text-[11px] text-[#64748B] font-mono">{app.from} → {app.to}</span>
              {statusBadge(app.status)}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
