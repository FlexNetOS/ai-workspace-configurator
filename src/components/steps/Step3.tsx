import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Save, Info } from 'lucide-react';
import useWizardStore from '@/store/wizardStore';
import { containerVariants, cardVariants } from './variants';

export default function Step3() {
  const { addTerminalLog, completeStep } = useWizardStore();
  const [checkpointState, setCheckpointState] = useState<'idle' | 'creating' | 'done'>('idle');

  useEffect(() => {
    if (checkpointState === 'done') {
      completeStep(3);
    }
  }, [checkpointState, completeStep]);

  const handleCreate = () => {
    setCheckpointState('creating');
    const logs = [
      '> Creating system restore point...',
      '> Verifying Windows Recovery Environment...',
      "> Restore point 'AI-Workspace-Setup-Step-3' created successfully.",
      '> Snapshot saved to: ~/.ai-workspace/snapshots/step-3-snapshot.json',
      '> Checkpoint verified. Safe to proceed!',
    ];
    logs.forEach((l, i) => setTimeout(() => addTerminalLog(l), i * 300));
    setTimeout(() => setCheckpointState('done'), logs.length * 300 + 200);
  };

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants}>
        <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Create a Safety Net</h1>
        <p className="text-[14px] text-[#94A3B8]">
          This creates a restore point so you can roll back any changes if something goes wrong.
        </p>
      </motion.div>

      <motion.div
        variants={cardVariants}
        className="p-4 rounded-xl bg-[rgba(37,99,235,0.08)] border border-[rgba(37,99,235,0.2)] flex items-center gap-3"
      >
        <Info className="w-5 h-5 text-[#2563EB] shrink-0" />
        <p className="text-[13px] text-[#94A3B8]">
          <strong className="text-[#F0F4F8]">Rollback</strong> means you can undo all changes we make and return your
          computer to exactly how it is right now. Think of it like a save point in a video game.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          variants={cardVariants}
          className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] p-6 flex flex-col items-center text-center"
          whileHover={{ y: -2 }}
        >
          <motion.div
            className="w-16 h-16 rounded-2xl bg-[rgba(16,185,129,0.08)] flex items-center justify-center mb-4"
            animate={checkpointState === 'creating' ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: checkpointState === 'creating' ? Infinity : 0 }}
          >
            <Shield className="w-8 h-8 text-[#10B981]" />
          </motion.div>
          <h3 className="text-[18px] font-semibold text-[#F0F4F8] mb-2">Windows System Restore</h3>
          <p className="text-[13px] text-[#94A3B8] mb-6">
            Creates a Windows system restore point. This lets you undo system-level changes if needed.
          </p>
          <motion.button
            onClick={handleCreate}
            disabled={checkpointState !== 'idle'}
            className="px-6 py-2.5 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
            whileHover={checkpointState === 'idle' ? { y: -1 } : {}}
            whileTap={{ scale: 0.97 }}
          >
            {checkpointState === 'creating' ? 'Creating...' : checkpointState === 'done' ? 'Created!' : 'Create Restore Point'}
          </motion.button>
          {checkpointState === 'done' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-[12px] text-[#10B981]"
            >
              Created at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          variants={cardVariants}
          className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] p-6 flex flex-col items-center text-center"
          whileHover={{ y: -2 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-[rgba(6,182,212,0.08)] flex items-center justify-center mb-4">
            <Save className="w-8 h-8 text-[#06B6D4]" />
          </div>
          <h3 className="text-[18px] font-semibold text-[#F0F4F8] mb-2">Configuration Snapshot</h3>
          <p className="text-[13px] text-[#94A3B8] mb-6">
            Saves your current settings and plan to a JSON file for quick recovery.
          </p>
          <motion.button
            onClick={() => addTerminalLog('> Config snapshot exported to ~/.ai-workspace/snapshots/config-snapshot.json')}
            className="px-6 py-2.5 rounded-[10px] text-[13px] font-semibold text-[#94A3B8] border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)] transition-all"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            Save Snapshot
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
