import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package, Link2, HardDrive, Clock, Check, ChevronDown,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import useWizardStore from '@/store/wizardStore';
import { isLinkedAccountStatus } from '@/store/wizardStore';
import { containerVariants, cardVariants, easeSmooth } from './variants';

export default function Step10() {
  const { providers, linkedAccounts, planApproved, setPlanApproved, completeStep } = useWizardStore();
  const [understandChecked, setUnderstandChecked] = useState(false);

  useEffect(() => {
    if (planApproved) {
      completeStep(10);
    }
  }, [planApproved, completeStep]);

  const selectedProviders = providers.filter((p) => p.selected);
  const connectedAccounts = linkedAccounts.filter((a) => isLinkedAccountStatus(a.status));
  const securityScore = Math.round(((providers.filter((p) => p.selected).length / 8) * 40) + ((connectedAccounts.length / 7) * 30) + 30);

  const planSections = [
    { title: 'Core System', items: ['PowerShell Core 7.x', 'WSL2', 'Windows Terminal'] },
    { title: 'Containers', items: ['Docker Desktop', 'Docker Engine', 'NVIDIA Container Toolkit'] },
    { title: 'Development Tools', items: ['Zed IDE', 'Git', 'Windows Terminal', 'VS Code extensions'] },
    { title: 'AI Stack', items: ['llama.cpp', 'Ollama', 'HuggingFace CLI', 'OpenRouter CLI'] },
    { title: 'WSL2 Distro', items: ['Ubuntu 22.04 LTS', 'ZSH', 'Oh My Zsh', 'dev tooling'] },
    { title: 'Security', items: ['System restore point', 'Firewall rules', '.env secrets'] },
  ];

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants}>
        <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Review Your Plan</h1>
        <p className="text-[14px] text-[#94A3B8]">
          Everything looks good! Here's a summary of what will be installed and configured.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <Package className="w-5 h-5" />, value: '8', label: 'Packages' },
          { icon: <Link2 className="w-5 h-5" />, value: `${connectedAccounts.length}`, label: 'Accounts' },
          { icon: <HardDrive className="w-5 h-5" />, value: '~12 GB', label: 'Disk Space' },
          { icon: <Clock className="w-5 h-5" />, value: '~30 min', label: 'Est. Time' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] p-5 text-center"
            whileHover={{ y: -2 }}
          >
            <div className="flex justify-center mb-2 text-[#2563EB]">{stat.icon}</div>
            <motion.div
              className="text-[24px] font-bold text-[#F0F4F8] tracking-[-0.01em]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {stat.value}
            </motion.div>
            <div className="text-[12px] text-[#64748B]">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        variants={cardVariants}
        className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <motion.circle
                cx="32" cy="32" r="28" fill="none"
                stroke="url(#grad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 28}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - securityScore / 100) }}
                transition={{ duration: 1.5, ease: easeSmooth }}
              />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[14px] font-bold text-[#F0F4F8]">{securityScore}%</span>
            </div>
          </div>
          <div>
            <h3 className="text-[18px] font-semibold text-[#F0F4F8]">Security Score</h3>
            <p className="text-[13px] text-[#94A3B8]">Based on providers and accounts selected</p>
          </div>
        </div>

        {selectedProviders.length > 0 && (
          <div className="mb-4">
            <p className="text-[12px] text-[#64748B] uppercase tracking-wider font-medium mb-2">Selected Providers</p>
            <div className="flex flex-wrap gap-2">
              {selectedProviders.map((p) => (
                <span key={p.id} className="px-3 py-1 rounded-full text-[11px] font-medium bg-[rgba(37,99,235,0.1)] text-[#2563EB] border border-[rgba(37,99,235,0.25)]">
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {planSections.map((section, i) => (
            <motion.div key={i} className="rounded-xl border border-[rgba(255,255,255,0.04)] overflow-hidden">
              <details className="group">
                <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <span className="text-[13px] font-medium text-[#F0F4F8]">{section.title}</span>
                  <ChevronDown className="w-4 h-4 text-[#64748B] group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-3 pb-3">
                  <div className="flex flex-wrap gap-2">
                    {section.items.map((item, j) => (
                      <span key={j} className="px-2 py-1 rounded-md text-[11px] text-[#94A3B8] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.04)]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </details>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] p-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={understandChecked} onCheckedChange={(c) => setUnderstandChecked(c === true)} className="mt-0.5" />
          <span className="text-[14px] text-[#94A3B8]">
            I understand this will install software and make system changes. I've reviewed the plan above.
          </span>
        </label>
        <motion.button
          onClick={() => { setPlanApproved(true); }}
          disabled={!understandChecked}
          className="w-full mt-4 py-3.5 rounded-[10px] text-[15px] font-semibold text-white disabled:opacity-40 transition-all"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
          whileHover={understandChecked ? { y: -1, boxShadow: '0 0 20px rgba(37,99,235,0.25)' } : {}}
          whileTap={{ scale: 0.97 }}
        >
          Approve & Begin Installation
        </motion.button>
        {planApproved && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-center text-[12px] text-[#10B981]">
            <Check className="w-4 h-4 inline mr-1" />Plan approved!
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
