import { useEffect } from 'react';
import { motion } from 'framer-motion';
import HardwareRegistry from '@/components/HardwareRegistry';
import useHardwareRegistry from '@/store/hardwareRegistryStore';
import useWizardStore from '@/store/wizardStore';
import { containerVariants, cardVariants } from './variants';

export default function Step8() {
  const { completeStep } = useWizardStore();
  const entries = useHardwareRegistry((s) => s.entries);

  // Auto-complete when all entries have skills generated
  useEffect(() => {
    if (entries.length > 0 && entries.every((e) => e.status === 'registered' || e.status === 'active')) {
      completeStep(8);
    }
  }, [entries, completeStep]);

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants}>
        <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Hardware Registry</h1>
        <p className="text-[14px] text-[#94A3B8] max-w-[600px] leading-[1.6]">
          Identify each device, link vendor accounts, capture serial/warranty info, and resource-tag components.
          Each registered component generates an AI Skill that connects to Claw.
        </p>
      </motion.div>

      <HardwareRegistry />
    </motion.div>
  );
}
