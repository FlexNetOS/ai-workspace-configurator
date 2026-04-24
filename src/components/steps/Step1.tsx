import { motion } from 'framer-motion';
import {
  Shield, Terminal as TerminalIcon, Zap, Cpu, Link2, Sparkles, Download,
  Globe, Compass, Flame, Radio, Satellite, Rocket,
} from 'lucide-react';
import useWizardStore from '@/store/wizardStore';
import AutoDiscoveryPanel from '@/components/AutoDiscoveryPanel';
import ScriptPanel from '@/components/ScriptPanel';
import { containerVariants, cardVariants } from './variants';

const browserOptions = [
  { id: 'chrome', name: 'Chrome', icon: <Globe className="w-5 h-5 text-[#4285F4]" /> },
  { id: 'edge', name: 'Edge', icon: <Compass className="w-5 h-5 text-[#0078D7]" /> },
  { id: 'firefox', name: 'Firefox', icon: <Flame className="w-5 h-5 text-[#FF7139]" /> },
  { id: 'chromium', name: 'Chromium', icon: <Radio className="w-5 h-5 text-[#4C8BF5]" /> },
  { id: 'safari', name: 'Safari', icon: <Satellite className="w-5 h-5 text-[#00D8FF]" /> },
  { id: 'comet', name: 'Comet', icon: <Rocket className="w-5 h-5 text-[#8B5CF6]" /> },
];

export default function Step1() {
  const { preferredBrowser, setPreferredBrowser } = useWizardStore();
  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] overflow-hidden">
        <div className="p-8 text-center">
          <img src="/hero-illustration.png" alt="Hero" className="w-full max-w-[400px] mx-auto rounded-2xl mb-6" />
          <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-3">
            Your AI Workspace, Automated
          </h1>
          <p className="text-[14px] text-[#94A3B8] max-w-[480px] mx-auto leading-[1.6]">
            Go from a fresh Windows 11 install to a fully configured vibe-coding environment
            in 15 guided steps. No technical experience required.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={cardVariants} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-[#10B981]" />
            <h3 className="text-[18px] font-semibold text-[#F0F4F8]">System Readiness Check</h3>
          </div>
          <p className="text-[12px] text-[#94A3B8] mb-4">
            We&apos;ll automatically check your computer. No need to understand technical details — we&apos;ll guide you through any fixes needed.
          </p>
          <AutoDiscoveryPanel />
        </motion.div>

        <motion.div variants={cardVariants} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] p-6">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <TerminalIcon className="w-5 h-5 text-[#2563EB]" />, text: 'Guided terminal commands, explained in plain English' },
              { icon: <Shield className="w-5 h-5 text-[#10B981]" />, text: 'Automatic security checks and rollback protection' },
              { icon: <Zap className="w-5 h-5 text-[#F59E0B]" />, text: 'One-click installs with resume-safe progress' },
              { icon: <Cpu className="w-5 h-5 text-[#06B6D4]" />, text: 'Hardware auto-detection and driver management' },
              { icon: <Link2 className="w-5 h-5 text-[#8B5CF6]" />, text: 'Account linking for GitHub, Docker, HuggingFace & more' },
              { icon: <Sparkles className="w-5 h-5 text-[#EC4899]" />, text: 'AI-powered configuration recommendations' },
            ].map((f, i) => (
              <motion.div
                key={i}
                className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] flex flex-col gap-2"
                whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.10)' }}
                transition={{ duration: 0.2 }}
              >
                {f.icon}
                <span className="text-[12px] text-[#94A3B8] leading-[1.4]">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-5 p-5 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120]"
        >
          <h3 className="text-[15px] font-semibold text-[#F0F4F8] mb-1 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#3B82F6]" />
            Preferred Browser
          </h3>
          <p className="text-[12px] text-[#64748B] mb-4">
            Select the browser you want to use for OAuth logins and web-based setup steps.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {browserOptions.map((b) => (
              <motion.button
                key={b.id}
                onClick={() => setPreferredBrowser(b.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  preferredBrowser === b.id
                    ? 'border-[rgba(37,99,235,0.4)] bg-[rgba(37,99,235,0.08)]'
                    : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.12)]'
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                {b.icon}
                <span className="text-[11px] font-medium text-[#94A3B8]">{b.name}</span>
                {preferredBrowser === b.id && (
                  <motion.div
                    layoutId="browserCheck"
                    className="w-4 h-4 rounded-full bg-[#2563EB] flex items-center justify-center"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-5 p-5 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120]"
        >
          <h3 className="text-[15px] font-semibold text-[#F0F4F8] mb-1 flex items-center gap-2">
            <Download className="w-4 h-4 text-[#3B82F6]" />
            Download Setup Scripts
          </h3>
          <p className="text-[12px] text-[#64748B] mb-4">
            These PowerShell scripts run on your machine to perform the actual setup.
            Each script is self-contained and requires no external tools.
          </p>
          <ScriptPanel />
        </motion.div>
      </div>
    </motion.div>
  );
}
