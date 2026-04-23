import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import Confetti from 'react-confetti';
import ScriptPanel from '@/components/ScriptPanel';
import AutoDiscoveryPanel from '@/components/AutoDiscoveryPanel';
import HardwareRegistry from '@/components/HardwareRegistry';
import useHardwareRegistry from '@/store/hardwareRegistryStore';
import useWizardStore from '@/store/wizardStore';
import type { AccountStatus, CheckStatus } from '@/store/wizardStore';
import Terminal from '@/components/Terminal';
import StepSidebar, { type StepInfo } from '@/components/StepSidebar';
import ActionBar from '@/components/ActionBar';
import {
  Download, Settings, Save, Shield, Terminal as TerminalIcon,
  RefreshCw, Cpu, Monitor, Link2, CheckCircle2,
  Check,
  Globe, Sparkles, Database, Container,
  Github, Cloud, FileText, AlertTriangle, XCircle,
  Loader2, Wifi, HardDrive,
  FlaskConical, Code2, Server, Zap, Lock,
  Clock, Package, Chrome, Smile, Router, Info,
  ChevronDown,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

/* ────────── animation variants ────────── */
const stepVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -20 },
};
const containerVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.05 } },
  exit:    { opacity: 0 },
};
const cardVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};
const easeEnter: [number, number, number, number] = [0, 0, 0.2, 1];
const easeSmooth: [number, number, number, number] = [0.4, 0, 0.2, 1];

/* ────────── step definitions ────────── */
const WIZARD_STEPS: StepInfo[] = [
  { number: 1,  name: 'Initialize Configurator',    description: 'Welcome & setup',      icon: 'Download' },
  { number: 2,  name: 'Select Provider & Policy',     description: 'Choose services',      icon: 'Settings' },
  { number: 3,  name: 'Create Rollback Checkpoint',   description: 'Safety net',           icon: 'Save' },
  { number: 4,  name: 'Verify Security & Readiness',  description: 'System checks',        icon: 'Shield' },
  { number: 5,  name: 'Install PowerShell',           description: 'PowerShell 7.x',       icon: 'Terminal' },
  { number: 6,  name: 'Windows Update & Apps',        description: 'Update everything',    icon: 'RefreshCw' },
  { number: 7,  name: 'Discover Hardware',            description: 'Hardware scan',        icon: 'Cpu' },
  { number: 8,  name: 'Device Registration',          description: 'Register devices',     icon: 'Monitor' },
  { number: 9,  name: 'Link Accounts',                description: 'Connect accounts',     icon: 'Link2' },
  { number: 10, name: 'Approve Final Plan',           description: 'Review & approve',     icon: 'CheckCircle2' },
  { number: 11, name: 'Apply Configurations',         description: 'Run install scripts',  icon: 'Play' },
  { number: 12, name: 'Install Full Stack',           description: 'Dev environment',      icon: 'Layers' },
  { number: 13, name: 'Run E2E Tests',                description: 'Verify setup',         icon: 'TestTube' },
  { number: 14, name: 'Provision Environment',        description: 'Create workspaces',    icon: 'Boxes' },
  { number: 15, name: 'Hardware Tuning',              description: 'Optimize & celebrate', icon: 'Trophy' },
];

/* ═══════════════════════════════════════════════════════════════
   STEP 1 — Initialize Configurator
   ═══════════════════════════════════════════════════════════════ */
function Step1() {
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
        {/* Auto-Discovery Panel replaces manual checkboxes */}
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

        {/* Script Download Panel */}
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

/* ═══════════════════════════════════════════════════════════════
   STEP 2 — Select Provider & Policy
   ═══════════════════════════════════════════════════════════════ */
function Step2() {
  const { providers, toggleProvider, policies, setPolicy, completeStep } = useWizardStore();
  const [showPlan, setShowPlan] = useState(false);

  // Auto-complete when at least Docker (required) is selected
  useEffect(() => {
    const dockerSelected = providers.find((p) => p.id === 'docker')?.selected;
    if (dockerSelected) {
      completeStep(2);
    }
  }, [providers, completeStep]);

  const providerIcons: Record<string, React.ReactNode> = {
    docker: <Container className="w-5 h-5 text-[#2496ED]" />,
    github: <Github className="w-5 h-5 text-white" />,
    huggingface: <Database className="w-5 h-5 text-[#FFD21E]" />,
    openrouter: <Router className="w-5 h-5 text-[#8B5CF6]" />,
    notion: <FileText className="w-5 h-5 text-white" />,
    google: <Chrome className="w-5 h-5 text-[#4285F4]" />,
    cloudflare: <Cloud className="w-5 h-5 text-[#F48120]" />,
    custom: <Settings className="w-5 h-5 text-[#94A3B8]" />,
  };

  const policyKeys = [
    { key: 'gpuAcceleration', label: 'GPU acceleration if detected' },
    { key: 'nonRootUser', label: 'Non-root user for containers' },
    { key: 'secretsManagement', label: 'Secrets management (.env files)' },
    { key: 'dockerCompose', label: 'Docker Compose support' },
    { key: 'wsl2Isolation', label: 'WSL2 isolation' },
    { key: 'autoUpdate', label: 'Auto-update components' },
    { key: 'telemetry', label: 'Share anonymous usage metrics' },
  ];

  const selectedCount = providers.filter((p) => p.selected).length;

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants}>
        <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Choose Your Providers</h1>
        <p className="text-[14px] text-[#94A3B8] mb-4">
          Select which services and AI providers you want to use. You can change these later.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {providers.map((p) => (
            <motion.div
              key={p.id}
              onClick={() => !p.required && toggleProvider(p.id)}
              className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
                p.selected
                  ? 'border-[rgba(37,99,235,0.4)] bg-[rgba(37,99,235,0.08)]'
                  : 'border-[rgba(255,255,255,0.06)] bg-[#0B1120] hover:border-[rgba(255,255,255,0.10)]'
              }`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3 mb-2">
                {providerIcons[p.id] || <Globe className="w-5 h-5" />}
                <span className="text-[14px] font-semibold text-[#F0F4F8]">{p.name}</span>
                {p.required && (
                  <span className="ml-auto text-[10px] font-mono font-bold uppercase tracking-wider text-[#F59E0B]">Required</span>
                )}
              </div>
              <p className="text-[12px] text-[#64748B]">{p.description}</p>
              <div className={`absolute top-3 right-3 w-3 h-3 rounded-full border-2 ${
                p.selected ? 'bg-[#2563EB] border-[#2563EB]' : 'border-[#475569]'
              }`}>
                {p.selected && <Check className="w-2 h-2 text-white absolute -top-0.5 -left-0.5" />}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] p-6">
        <h2 className="text-[24px] font-semibold text-[#F0F4F8] tracking-[-0.01em] mb-4">Security & Privacy Preferences</h2>
        <div className="space-y-3">
          {policyKeys.map(({ key, label }) => (
            <motion.label
              key={key}
              className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] cursor-pointer"
              whileHover={{ y: -1 }}
            >
              <Checkbox
                checked={policies[key] || false}
                onCheckedChange={(c) => setPolicy(key, c === true)}
              />
              <span className="text-[13px] text-[#94A3B8]">{label}</span>
            </motion.label>
          ))}
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="flex justify-center">
        <motion.button
          onClick={() => setShowPlan(true)}
          className="px-6 py-3 rounded-[10px] text-[14px] font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
          whileHover={{ y: -1, boxShadow: '0 0 20px rgba(37,99,235,0.25)' }}
          whileTap={{ scale: 0.97 }}
        >
          Generate Plan Preview
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showPlan && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: easeSmooth }}
            className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] p-6 overflow-hidden"
          >
            <h3 className="text-[18px] font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#2563EB]" />
              Your Installation Plan
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Software', value: 'PowerShell 7.x, Docker Desktop, WSL2, Windows Terminal, Zed IDE, Git', icon: <Package className="w-4 h-4" /> },
                { label: 'AI Tools', value: 'llama.cpp, Ollama, HuggingFace CLI, OpenRouter CLI', icon: <Sparkles className="w-4 h-4" /> },
                { label: 'Accounts', value: `${selectedCount} providers selected`, icon: <Link2 className="w-4 h-4" /> },
                { label: 'Security', value: 'System restore point, UAC verification, firewall rules', icon: <Shield className="w-4 h-4" /> },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] flex items-center gap-3"
                >
                  <div className="text-[#2563EB]">{item.icon}</div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#F0F4F8]">{item.label}</div>
                    <div className="text-[12px] text-[#64748B]">{item.value}</div>
                  </div>
                </motion.div>
              ))}
              <div className="flex gap-3 pt-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-[rgba(37,99,235,0.1)] text-[#2563EB] border border-[rgba(37,99,235,0.25)]">
                  Est. Time: ~45 min
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.25)]">
                  Disk Space: ~12 GB
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 3 — Create Rollback Checkpoint
   ═══════════════════════════════════════════════════════════════ */
function Step3() {
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

/* ═══════════════════════════════════════════════════════════════
   STEP 4 — Verify Security & Readiness
   ═══════════════════════════════════════════════════════════════ */
function Step4() {
  const { securityChecks, setSecurityCheck, addTerminalLog, completeStep } = useWizardStore();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const allDone = ['admin', 'uac', 'virtualization', 'windowsUpdate', 'reboot', 'diskSpace'].every((k) => securityChecks[k] && securityChecks[k] !== 'checking');
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

  const StatusIcon = ({ status }: { status: CheckStatus | undefined }) => {
    switch (status) {
      case 'checking': return <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />;
      case 'passed':   return <CheckCircle2 className="w-5 h-5 text-[#10B981]" />;
      case 'warning':  return <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />;
      case 'failed':   return <XCircle className="w-5 h-5 text-[#EF4444]" />;
      default:         return <div className="w-5 h-5 rounded-full border-2 border-[#475569]" />;
    }
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

/* ═══════════════════════════════════════════════════════════════
   STEP 5 — Install PowerShell
   ═══════════════════════════════════════════════════════════════ */
function Step5() {
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

/* ═══════════════════════════════════════════════════════════════
   STEP 6 — Windows Update & Apps
   ═══════════════════════════════════════════════════════════════ */
function Step6() {
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

/* ═══════════════════════════════════════════════════════════════
   STEP 7 — Discover Hardware
   ═══════════════════════════════════════════════════════════════ */
function Step7() {
  const { hardwareDiscovered, setHardwareDiscovered, addTerminalLog, completeStep } = useWizardStore();
  const [activeTab, setActiveTab] = useState('hardware');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (hardwareDiscovered) {
      completeStep(7);
    }
  }, [hardwareDiscovered, completeStep]);

  const tabs = [
    { key: 'hardware', label: 'Hardware', icon: <Cpu className="w-4 h-4" /> },
    { key: 'drivers', label: 'Drivers', icon: <Monitor className="w-4 h-4" /> },
    { key: 'network', label: 'Network', icon: <Wifi className="w-4 h-4" /> },
    { key: 'storage', label: 'Storage', icon: <HardDrive className="w-4 h-4" /> },
  ];

  const hardware = [
    { component: 'CPU', detected: 'Intel Core i9-14900K (24 cores)', status: '✓' },
    { component: 'GPU', detected: 'NVIDIA RTX 4090 (24GB VRAM)', status: '✓' },
    { component: 'RAM', detected: '64GB DDR5-5600', status: '✓' },
    { component: 'Motherboard', detected: 'ASUS ROG STRIX Z790-E', status: '✓' },
    { component: 'Display', detected: '2 monitors (3840x2160, 2560x1440)', status: '✓' },
  ];

  const drivers = [
    { device: 'NVIDIA GPU', version: '551.23', status: '✓ Current' },
    { device: 'Intel Chipset', version: '10.1.19439.8364', status: '✓ Current' },
    { device: 'Network (Intel)', version: '28.2.14.0', status: '⚠ Update available' },
    { device: 'Audio (Realtek)', version: '6.0.9235.1', status: '✓ Current' },
  ];

  const networks = [
    { interface: 'Ethernet', ip: '192.168.1.105', status: 'Connected', speed: '1 Gbps' },
    { interface: 'Wi-Fi', ip: '192.168.1.106', status: 'Connected', speed: 'Wi-Fi 6' },
    { interface: 'WSL Virtual', ip: '172.28.128.1', status: 'Active', speed: 'Virtual' },
  ];

  const storage = [
    { drive: 'C:\\', type: 'NVMe SSD', total: '2TB', free: '1.2TB', health: 'Good' },
    { drive: 'D:\\', type: 'SATA SSD', total: '1TB', free: '800GB', health: 'Good' },
  ];

  const runDiscovery = () => {
    setScanning(true);
    addTerminalLog('> Starting hardware discovery...');
    ['Scanning CPU...', 'Scanning GPU...', 'Scanning memory...', 'Scanning storage...', 'Scanning network...', 'Scanning drivers...'].forEach((l, i) => {
      setTimeout(() => addTerminalLog(`> ${l}`), i * 300);
    });
    setTimeout(() => {
      setScanning(false);
      setHardwareDiscovered(true);
      addTerminalLog('> ✓ Hardware discovery complete.');
      addTerminalLog('> Inventory saved to ~/.ai-workspace/artifacts/hardware-inventory.json');
    }, 2000);
  };

  const Table = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[rgba(255,255,255,0.06)]">
            {headers.map((h) => <th key={h} className="text-left py-2.5 px-3 text-[12px] font-medium text-[#64748B] tracking-wider uppercase">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)]"
            >
              {row.map((cell, j) => <td key={j} className="py-2.5 px-3 text-[#94A3B8]">{cell}</td>)}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Hardware & Network Discovery</h1>
          <p className="text-[14px] text-[#94A3B8]">Scanning your system to understand what hardware you have.</p>
        </div>
        <motion.button
          onClick={runDiscovery}
          disabled={scanning}
          className="px-5 py-2.5 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
          whileHover={!scanning ? { y: -1 } : {}}
          whileTap={{ scale: 0.97 }}
        >
          {scanning ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Scanning...</span> : 'Run Discovery'}
        </motion.button>
      </motion.div>

      {scanning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-1 w-full rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden"
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(135deg, #2563EB, #06B6D4)' }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' as const }}
          />
        </motion.div>
      )}

      {hardwareDiscovered && (
        <motion.div variants={cardVariants} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0B1120] overflow-hidden">
          <div className="flex border-b border-[rgba(255,255,255,0.06)]">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3 text-[13px] font-medium transition-colors border-b-2 ${
                  activeTab === t.key
                    ? 'text-[#2563EB] border-[#2563EB]'
                    : 'text-[#64748B] border-transparent hover:text-[#94A3B8]'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'hardware' && <Table headers={['Component', 'Detected', 'Status']} rows={hardware.map((h) => [h.component, h.detected, h.status])} />}
            {activeTab === 'drivers' && <Table headers={['Device', 'Version', 'Status']} rows={drivers.map((d) => [d.device, d.version, d.status])} />}
            {activeTab === 'network' && <Table headers={['Interface', 'IP Address', 'Status', 'Speed']} rows={networks.map((n) => [n.interface, n.ip, n.status, n.speed])} />}
            {activeTab === 'storage' && <Table headers={['Drive', 'Type', 'Total', 'Free', 'Health']} rows={storage.map((s) => [s.drive, s.type, s.total, s.free, s.health])} />}
          </div>
        </motion.div>
      )}

      {hardwareDiscovered && (
        <motion.div variants={cardVariants} className="flex justify-end">
          <motion.button
            onClick={() => addTerminalLog('> Inventory report saved to ~/.ai-workspace/artifacts/hardware-inventory.json')}
            className="px-4 py-2 rounded-[10px] text-[13px] font-medium text-[#94A3B8] border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)] transition-all flex items-center gap-2"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            <Download className="w-4 h-4" />
            Save Inventory Report
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 8 — Device Registration
   ═══════════════════════════════════════════════════════════════ */
function Step8() {
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

/* ═══════════════════════════════════════════════════════════════
   STEP 9 — Link Accounts
   ═══════════════════════════════════════════════════════════════ */
function Step9() {
  const { linkedAccounts, setAccountStatus, addTerminalLog, completeStep } = useWizardStore();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    const connected = linkedAccounts.filter((a) => a.status === 'connected').length;
    if (connected >= 3) {
      completeStep(9);
    }
  }, [linkedAccounts, completeStep]);

  const accountIcons: Record<string, React.ReactNode> = {
    docker: <Container className="w-8 h-8 text-[#2496ED]" />,
    github: <Github className="w-8 h-8 text-white" />,
    huggingface: <Smile className="w-8 h-8 text-[#FFD21E]" />,
    openrouter: <Router className="w-8 h-8 text-[#8B5CF6]" />,
    notion: <FileText className="w-8 h-8 text-white" />,
    google: <Chrome className="w-8 h-8 text-[#4285F4]" />,
    cloudflare: <Cloud className="w-8 h-8 text-[#F48120]" />,
  };

  const connectAccount = (id: string, name: string) => {
    setConnectingId(id);
    setAccountStatus(id, 'connecting');
    addTerminalLog(`> Initiating OAuth flow for ${name}...`);
    addTerminalLog(`> Opening browser for authentication...`);

    setTimeout(() => {
      setAccountStatus(id, 'connected', `${id}_token_${Math.random().toString(36).slice(2, 10)}`);
      addTerminalLog(`> ✓ ${name} linked successfully`);
      addTerminalLog(`> Token: ${id.slice(0, 3)}****... authenticated`);
      setConnectingId(null);
    }, 2000);
  };

  const statusBadge = (status: AccountStatus) => {
    switch (status) {
      case 'connected': return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.25)] flex items-center gap-1"><Check className="w-3 h-3" />Linked</span>;
      case 'connecting': return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(37,99,235,0.1)] text-[#2563EB] border border-[rgba(37,99,235,0.25)] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Connecting</span>;
      case 'failed': return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.25)]">Failed</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(255,255,255,0.04)] text-[#64748B] border border-[rgba(255,255,255,0.08)]">Not Connected</span>;
    }
  };

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants}>
        <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Link Your Accounts</h1>
        <p className="text-[14px] text-[#94A3B8] max-w-[600px] leading-[1.6]">
          Connect the services you'll use for AI development. Each connection is verified automatically.
        </p>
        <p className="text-[12px] text-[#06B6D4] mt-2 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          Tip: You can skip any account and link it later from Settings.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {linkedAccounts.map((account) => (
          <motion.div
            key={account.id}
            variants={cardVariants}
            className={`rounded-2xl border p-5 transition-all ${
              account.status === 'connected'
                ? 'border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.04)]'
                : 'border-[rgba(255,255,255,0.06)] bg-[#0B1120]'
            }`}
            whileHover={{ y: -2, borderColor: account.status === 'connected' ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.10)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              {accountIcons[account.id] || <Globe className="w-8 h-8 text-[#94A3B8]" />}
              <div className="flex-1">
                <h3 className="text-[16px] font-semibold text-[#F0F4F8]">{account.name}</h3>
              </div>
              {statusBadge(account.status)}
            </div>
            <p className="text-[12px] text-[#64748B] mb-4">{account.description}</p>

            {account.status === 'connected' && account.token && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-3 p-2 rounded-lg bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.15)]"
              >
                <p className="text-[10px] text-[#64748B] font-mono uppercase tracking-wider">Token</p>
                <p className="text-[11px] text-[#10B981] font-mono">{account.token}</p>
              </motion.div>
            )}

            <motion.button
              onClick={() => account.status === 'disconnected' ? connectAccount(account.id, account.name) : setAccountStatus(account.id, 'disconnected')}
              disabled={connectingId === account.id}
              className={`w-full py-2 rounded-[10px] text-[13px] font-semibold transition-all disabled:opacity-40 ${
                account.status === 'connected'
                  ? 'text-[#EF4444] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.05)]'
                  : 'text-white'
              }`}
              style={account.status !== 'connected' ? { background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' } : {}}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              {connectingId === account.id ? 'Connecting...' : account.status === 'connected' ? 'Disconnect' : 'Connect'}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 10 — Approve Final Plan
   ═══════════════════════════════════════════════════════════════ */
function Step10() {
  const { providers, linkedAccounts, planApproved, setPlanApproved, completeStep } = useWizardStore();
  const [understandChecked, setUnderstandChecked] = useState(false);

  useEffect(() => {
    if (planApproved) {
      completeStep(10);
    }
  }, [planApproved, completeStep]);

  const selectedProviders = providers.filter((p) => p.selected);
  const connectedAccounts = linkedAccounts.filter((a) => a.status === 'connected');
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

/* ═══════════════════════════════════════════════════════════════
   STEP 11 — Apply Configurations
   ═══════════════════════════════════════════════════════════════ */
function Step11() {
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

/* ═══════════════════════════════════════════════════════════════
   STEP 12 — Install Full Stack
   ═══════════════════════════════════════════════════════════════ */
function Step12() {
  const { addTerminalLog, completeStep } = useWizardStore();
  const [subSteps, setSubSteps] = useState([
    { id: 'docker', name: 'Docker Desktop', desc: 'Container runtime and GUI', status: 'queued', progress: 0 },
    { id: 'wsl2', name: 'WSL2 Kernel', desc: 'Windows Subsystem for Linux', status: 'queued', progress: 0 },
    { id: 'ubuntu', name: 'Ubuntu Distro', desc: 'Ubuntu 22.04 LTS', status: 'queued', progress: 0 },
    { id: 'shell', name: 'Zsh + OhMyZsh', desc: 'Modern shell with plugins', status: 'queued', progress: 0 },
    { id: 'zed', name: 'ZED IDE', desc: 'High-performance code editor', status: 'queued', progress: 0 },
    { id: 'llama', name: 'llama.cpp Build', desc: 'Local AI inference engine', status: 'queued', progress: 0 },
    { id: 'models', name: 'AI Models', desc: 'Qwen 2.5 7B + optional models', status: 'queued', progress: 0 },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (subSteps.every((s) => s.status === 'done')) {
      completeStep(12);
    }
  }, [subSteps, completeStep]);

  const runInstall = () => {
    setIsRunning(true);
    let delay = 0;

    subSteps.forEach((step, idx) => {
      setTimeout(() => {
        setSubSteps((prev) => prev.map((s, i) => i === idx ? { ...s, status: 'running' } : s));
        addTerminalLog(`> [${step.name}] Starting installation...`);

        const stepLogs: Record<string, string[]> = {
          docker: ['> Pulling Docker Desktop 4.28.0...', '> Installing MSI package...', '> Starting Docker Desktop service...', '> ✓ Docker daemon running'],
          wsl2: ['> Updating WSL2 kernel...', '> Setting default version 2...', '> ✓ WSL2 kernel updated'],
          ubuntu: ['> Downloading Ubuntu 22.04...', '> [####------] 40%', '> [########--] 80%', '> [##########] 100%', '> Configuring default user...', '> ✓ Ubuntu installed'],
          shell: ['> Installing Zsh...', '> Cloning OhMyZsh...', '> Installing plugins (git, docker, vscode)...', '> ✓ Shell configured'],
          zed: ['> Downloading Zed IDE...', '> Installing extensions...', '> ✓ Zed IDE ready'],
          llama: ['> Cloning llama.cpp...', '> cmake -B build -DLLAMA_CUDA=ON...', '> cmake --build build --config Release -j24...', '> Installing to ~/.local/bin...', '> ✓ llama.cpp built with CUDA'],
          models: ['> Downloading Qwen 2.5 7B...', '> [######----] 60%', '> [##########] 100%', '> Verifying model integrity...', '> ✓ Model ready for inference'],
        };

        const logs = stepLogs[step.id] || ['> Installing...'];
        logs.forEach((l, li) => {
          setTimeout(() => {
            addTerminalLog(l);
            setSubSteps((prev) => prev.map((s, i) => i === idx ? { ...s, progress: ((li + 1) / logs.length) * 100 } : s));
          }, li * 300);
        });

        setTimeout(() => {
          setSubSteps((prev) => prev.map((s, i) => i === idx ? { ...s, status: 'done', progress: 100 } : s));
          addTerminalLog(`> ✓ [${step.name}] Complete`);
        }, logs.length * 300 + 200);
      }, delay);
      delay += 2500;
    });

    setTimeout(() => setIsRunning(false), delay + 500);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-5 h-5 text-[#10B981]" />;
      case 'running': return <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />;
      default: return <div className="w-5 h-5 rounded-full border-2 border-[#475569]" />;
    }
  };

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants}>
        <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Build Your Development Stack</h1>
        <p className="text-[14px] text-[#94A3B8]">Installing the full development environment layer by layer.</p>
      </motion.div>

      {!isRunning && subSteps[0].status === 'queued' && (
        <motion.button
          variants={cardVariants}
          onClick={runInstall}
          className="px-5 py-2.5 rounded-[10px] text-[13px] font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          Install Full Stack
        </motion.button>
      )}

      <div className="space-y-3">
        {subSteps.map((step, i) => (
          <motion.div
            key={step.id}
            variants={cardVariants}
            className={`rounded-2xl border p-5 transition-all ${
              step.status === 'done'
                ? 'border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.02)]'
                : 'border-[rgba(255,255,255,0.06)] bg-[#0B1120]'
            }`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-center gap-3">
              {statusIcon(step.status)}
              <div className="flex-1">
                <h3 className="text-[14px] font-semibold text-[#F0F4F8]">{step.name}</h3>
                <p className="text-[12px] text-[#64748B]">{step.desc}</p>
              </div>
              {step.status === 'done' && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#10B981]">Complete</span>
              )}
            </div>
            {step.status === 'running' && (
              <div className="mt-3">
                <Progress value={step.progress} className="h-1.5" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 13 — Run E2E Tests
   ═══════════════════════════════════════════════════════════════ */
function Step13() {
  const { e2eTests, setE2eTest, addTerminalLog, completeStep } = useWizardStore();
  const [running, setRunning] = useState(false);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  useEffect(() => {
    const done = Object.values(e2eTests).filter((s) => s === 'passed' || s === 'warning').length;
    if (done === 10 && !running && Object.keys(e2eTests).length > 0) {
      completeStep(13);
    }
  }, [e2eTests, running, completeStep]);

  const tests = [
    { key: 'docker', name: 'Docker Daemon', detail: 'Docker version 25.0.3', expected: 'passed' },
    { key: 'wsl2', name: 'WSL2 Kernel', detail: 'Ubuntu 22.04 active', expected: 'passed' },
    { key: 'gpu', name: 'GPU Passthrough', detail: 'RTX 4090 detected in WSL', expected: 'passed' },
    { key: 'powershell', name: 'PowerShell Core', detail: 'v7.4.2', expected: 'passed' },
    { key: 'git', name: 'Git Integration', detail: 'Configured with GitHub', expected: 'passed' },
    { key: 'llama', name: 'llama.cpp Build', detail: 'CUDA backend active', expected: 'passed' },
    { key: 'model', name: 'Model Inference', detail: 'Qwen loaded, slow on first run', expected: 'warning' },
    { key: 'ports', name: 'Port Forwarding', detail: 'Ports 8080-8090 open', expected: 'passed' },
    { key: 'container', name: 'Container Pull', detail: 'hello-world ran successfully', expected: 'passed' },
    { key: 'network', name: 'Network Bridge', detail: 'WSL-Host communication OK', expected: 'passed' },
  ];

  const runTests = () => {
    setRunning(true);
    addTerminalLog('> Starting E2E test suite...');

    tests.forEach((t, i) => {
      setTimeout(() => {
        setE2eTest(t.key, 'checking');
        addTerminalLog(`> Running test: ${t.name}...`);
        setTimeout(() => {
          const status = t.expected as CheckStatus;
          setE2eTest(t.key, status);
          const icon = status === 'passed' ? '✓ PASS' : status === 'warning' ? '⚠ WARN' : '✗ FAIL';
          addTerminalLog(`> ${icon} ${t.name}: ${t.detail}`);
          if (i === tests.length - 1) {
            setRunning(false);
            addTerminalLog('> E2E test suite complete.');
          }
        }, 500);
      }, i * 600);
    });
  };

  const passedCount = Object.values(e2eTests).filter((s) => s === 'passed' || s === 'warning').length;

  const TestIcon = ({ status }: { status: CheckStatus | undefined }) => {
    if (status === 'checking') return <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />;
    if (status === 'passed') return <Check className="w-5 h-5 text-[#10B981]" />;
    if (status === 'warning') return <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />;
    if (status === 'failed') return <XCircle className="w-5 h-5 text-[#EF4444]" />;
    return <div className="w-5 h-5 rounded-full border-2 border-[#475569]" />;
  };

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Testing Your Setup</h1>
          <p className="text-[14px] text-[#94A3B8]">
            Running automated tests to make sure everything works.
          </p>
        </div>
        <motion.button
          onClick={runTests}
          disabled={running}
          className="px-5 py-2.5 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
          whileHover={!running ? { y: -1 } : {}}
          whileTap={{ scale: 0.97 }}
        >
          {running ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Running...</span> : 'Run Tests'}
        </motion.button>
      </motion.div>

      <motion.div variants={cardVariants} className="flex items-center gap-6 p-4 rounded-xl bg-[#0B1120] border border-[rgba(255,255,255,0.06)]">
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <motion.circle
              cx="28" cy="28" r="24" fill="none"
              stroke={passedCount === tests.length ? '#10B981' : '#F59E0B'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 24}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - passedCount / tests.length) }}
              transition={{ duration: 1, ease: easeSmooth }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[12px] font-bold text-[#F0F4F8]">{passedCount}/{tests.length}</span>
          </div>
        </div>
        <div>
          <p className="text-[16px] font-semibold text-[#F0F4F8]">
            {passedCount === tests.length ? 'All Systems Go' : passedCount > 0 ? `${passedCount} of ${tests.length} passed` : 'Tests not run'}
          </p>
          <p className="text-[12px] text-[#64748B]">
            {passedCount === tests.length ? 'Everything is working correctly' : 'Run the tests to verify your setup'}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tests.map((test) => {
          const status = e2eTests[test.key];
          return (
            <motion.div
              key={test.key}
              variants={cardVariants}
              className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                status === 'passed' ? 'border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.02)]' :
                status === 'warning' ? 'border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.02)]' :
                status === 'failed' ? 'border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.02)]' :
                'border-[rgba(255,255,255,0.06)] bg-[#0B1120]'
              }`}
              onClick={() => setExpandedTest(expandedTest === test.key ? null : test.key)}
              whileHover={{ y: -1 }}
            >
              <div className="flex items-center gap-3">
                <TestIcon status={status} />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-[#F0F4F8]">{test.name}</p>
                  {status && (
                    <p className="text-[11px] text-[#64748B]">{test.detail}</p>
                  )}
                </div>
                {status === 'passed' && <span className="text-[10px] font-mono uppercase text-[#10B981]">PASS</span>}
                {status === 'warning' && <span className="text-[10px] font-mono uppercase text-[#F59E0B]">WARN</span>}
                {status === 'failed' && <span className="text-[10px] font-mono uppercase text-[#EF4444]">FAIL</span>}
              </div>

              <AnimatePresence>
                {expandedTest === test.key && status === 'failed' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.04)] overflow-hidden"
                  >
                    <p className="text-[12px] text-[#EF4444] mb-2">Test failed. Common causes:</p>
                    <ul className="text-[11px] text-[#94A3B8] list-disc ml-4 space-y-1 mb-3">
                      <li>Service not started</li>
                      <li>Missing dependency</li>
                      <li>Network timeout</li>
                    </ul>
                    <span className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#2563EB] text-white cursor-pointer hover:bg-[#3B82F6] transition-colors">
                      Try This Fix
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 14 — Provision Environment
   ═══════════════════════════════════════════════════════════════ */
function Step14() {
  const { addTerminalLog, environmentsProvisioned, addEnvironment, completeStep } = useWizardStore();
  const [provisioning, setProvisioning] = useState<string | null>(null);

  useEffect(() => {
    if (environmentsProvisioned.length > 0) {
      completeStep(14);
    }
  }, [environmentsProvisioned, completeStep]);

  const environments = [
    {
      id: 'sandbox',
      name: 'Sandbox',
      desc: 'A safe place to experiment with AI models and code without breaking anything.',
      icon: <FlaskConical className="w-8 h-8 text-[#F59E0B]" />,
      resources: '2 CPU cores, 4GB RAM, isolated network',
      includes: 'Jupyter Lab, sample notebooks, test data',
      color: '#F59E0B',
    },
    {
      id: 'development',
      name: 'Development',
      desc: 'Your main coding environment with all tools pre-configured.',
      icon: <Code2 className="w-8 h-8 text-[#2563EB]" />,
      resources: '4 CPU cores, 8GB RAM, Git integration',
      includes: 'Zed IDE, Git, pre-commit hooks, linting',
      color: '#2563EB',
    },
    {
      id: 'simulation',
      name: 'Production Simulation',
      desc: 'A mini production setup for testing deployments.',
      icon: <Server className="w-8 h-8 text-[#10B981]" />,
      resources: '2 CPU cores, 4GB RAM, Docker Compose stack',
      includes: 'Nginx, PostgreSQL, Redis, monitoring',
      color: '#10B981',
    },
  ];

  const provision = (env: typeof environments[0]) => {
    setProvisioning(env.id);
    addTerminalLog(`> Creating ${env.name.toLowerCase()} environment...`);

    const logs = [
      `> Pulling container images...`,
      `> Configuring isolated network...`,
      `> Mounting workspace volumes...`,
      `> Starting services...`,
      `> ✓ ${env.name} environment ready!`,
    ];
    logs.forEach((l, i) => setTimeout(() => addTerminalLog(l), i * 400));

    setTimeout(() => {
      addEnvironment(env.id);
      setProvisioning(null);
    }, logs.length * 400 + 200);
  };

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants}>
        <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Create Your Environments</h1>
        <p className="text-[14px] text-[#94A3B8] max-w-[600px] leading-[1.6]">
          Set up isolated workspaces for different types of work. Each environment is independent.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {environments.map((env) => {
          const isProvisioned = environmentsProvisioned.includes(env.id);
          const isProvisioning = provisioning === env.id;

          return (
            <motion.div
              key={env.id}
              variants={cardVariants}
              className={`rounded-2xl border p-6 transition-all ${
                isProvisioned
                  ? 'border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.02)]'
                  : 'border-[rgba(255,255,255,0.06)] bg-[#0B1120]'
              }`}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${env.color}15` }}>
                  {env.icon}
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-[#F0F4F8]">{env.name}</h3>
                  {isProvisioned && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-[10px] font-mono uppercase tracking-wider text-[#10B981]"
                    >
                      ✓ Provisioned
                    </motion.span>
                  )}
                </div>
              </div>

              <p className="text-[13px] text-[#94A3B8] mb-4 leading-[1.5]">{env.desc}</p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-[#64748B]" />
                  <span className="text-[12px] text-[#64748B]">{env.resources}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-[#64748B]" />
                  <span className="text-[12px] text-[#64748B]">{env.includes}</span>
                </div>
              </div>

              <motion.button
                onClick={() => provision(env)}
                disabled={isProvisioned || isProvisioning}
                className="w-full py-2.5 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-40 transition-all"
                style={!isProvisioned ? { background: `linear-gradient(135deg, ${env.color} 0%, ${env.color}88 100%)` } : {}}
                whileHover={!isProvisioned && !isProvisioning ? { y: -1 } : {}}
                whileTap={{ scale: 0.97 }}
              >
                {isProvisioning ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Provisioning...</span>
                ) : isProvisioned ? (
                  'Provisioned'
                ) : (
                  `Create ${env.name}`
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 15 — Hardware Tuning & Celebration
   ═══════════════════════════════════════════════════════════════ */
function Step15() {
  const { completedSteps, tuningApplied, setTuningApplied, completeStep } = useWizardStore();
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
              <Check className="w-4 h-4 text-[#10B981] inline mr-2" />5 accounts connected
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
                  accounts: 'Linked',
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

/* ═══════════════════════════════════════════════════════════════
   MAIN WIZARD COMPONENT
   ═══════════════════════════════════════════════════════════════ */
/* ────────── Resume Prompt ────────── */
function ResumePrompt({ onResume, onRestart }: { onResume: () => void; onRestart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(2,6,23,0.85)] backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0B1120] p-8 max-w-[420px] w-full mx-4 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-[rgba(37,99,235,0.08)] flex items-center justify-center mx-auto mb-5">
          <Save className="w-7 h-7 text-[#2563EB]" />
        </div>
        <h2 className="text-[22px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">
          Welcome Back!
        </h2>
        <p className="text-[14px] text-[#94A3B8] mb-6 leading-[1.5]">
          You have a saved setup in progress. Would you like to resume where you left off or start fresh?
        </p>
        <div className="flex flex-col gap-3">
          <motion.button
            onClick={onResume}
            className="w-full py-3 rounded-[10px] text-[14px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
            whileHover={{ y: -1, boxShadow: '0 0 20px rgba(37,99,235,0.25)' }}
            whileTap={{ scale: 0.97 }}
          >
            Resume Setup
          </motion.button>
          <motion.button
            onClick={onRestart}
            className="w-full py-3 rounded-[10px] text-[14px] font-semibold text-[#94A3B8] border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)] transition-all"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            Start Fresh
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Wizard() {
  const currentStep = useWizardStore((s) => s.currentStep);
  const completedSteps = useWizardStore((s) => s.completedSteps);
  const isExecuting = useWizardStore((s) => s.isExecuting);
  const setIsExecuting = useWizardStore((s) => s.setIsExecuting);
  const setCurrentStep = useWizardStore((s) => s.setCurrentStep);
  const terminalLogs = useWizardStore((s) => s.terminalLogs);
  const showTerminal = useWizardStore((s) => s.showTerminal);
  const setShowTerminal = useWizardStore((s) => s.setShowTerminal);
  const clearTerminalLogs = useWizardStore((s) => s.clearTerminalLogs);
  const reset = useWizardStore((s) => s.reset);

  const totalSteps = 15;
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  // Resume prompt state
  const [showResumePrompt, setShowResumePrompt] = useState(() => {
    const saved = localStorage.getItem('workspace_wizard_state');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return data.state && data.state.completedSteps && data.state.completedSteps.some(Boolean);
      } catch { /* ignore */ }
    }
    return false;
  });

  const canGoBack = currentStep > 1 && !isExecuting;
  const canGoNext = completedSteps[currentStep - 1] && !isExecuting;

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      clearTerminalLogs();
    }
  }, [currentStep, setCurrentStep, clearTerminalLogs]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps && completedSteps[currentStep - 1]) {
      setCurrentStep(currentStep + 1);
      clearTerminalLogs();
    }
  }, [currentStep, completedSteps, setCurrentStep, clearTerminalLogs]);

  const handleRun = useCallback(() => {
    setIsExecuting(true);
    setShowTerminal(true);
    // Steps are responsible for calling completeStep() when their execution finishes
  }, [setIsExecuting, setShowTerminal]);

  const handleStepClick = useCallback((step: number) => {
    if (step <= currentStep + 1 || completedSteps[step - 1]) {
      setCurrentStep(step);
      clearTerminalLogs();
    }
  }, [currentStep, completedSteps, setCurrentStep, clearTerminalLogs]);

  const handleSaveExit = useCallback(() => {
    // State is auto-saved via Zustand persist. Show confirmation toast.
    if (typeof window !== 'undefined') {
      alert('Your progress has been saved! You can resume anytime by reopening the wizard.');
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (canGoNext) handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (canGoBack) handleBack();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canGoNext, canGoBack, handleNext, handleBack]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:  return <Step1 />;
      case 2:  return <Step2 />;
      case 3:  return <Step3 />;
      case 4:  return <Step4 />;
      case 5:  return <Step5 />;
      case 6:  return <Step6 />;
      case 7:  return <Step7 />;
      case 8:  return <Step8 />;
      case 9:  return <Step9 />;
      case 10: return <Step10 />;
      case 11: return <Step11 />;
      case 12: return <Step12 />;
      case 13: return <Step13 />;
      case 14: return <Step14 />;
      case 15: return <Step15 />;
      default: return <Step1 />;
    }
  };

  return (
    <>
      {showResumePrompt && (
        <ResumePrompt
          onResume={() => setShowResumePrompt(false)}
          onRestart={() => {
            reset();
            setShowResumePrompt(false);
          }}
        />
      )}
      <div className="flex h-screen bg-[#020617] overflow-hidden">
      {/* Step Sidebar */}
      <StepSidebar
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Progress Bar */}
        <div className="h-1 bg-[rgba(255,255,255,0.04)] shrink-0">
          <motion.div
            className="h-full"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: easeSmooth }}
          />
        </div>

        {/* Content + Terminal */}
        <div className="flex flex-1 overflow-hidden">
          {/* Step Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: easeEnter }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Terminal Side Panel */}
          <AnimatePresence>
            {showTerminal && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 380, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: easeSmooth }}
                className="border-l border-[rgba(255,255,255,0.06)] bg-[#020617] overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(255,255,255,0.06)]">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">Execution Log</span>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={clearTerminalLogs}
                      className="text-[10px] text-[#64748B] hover:text-[#94A3B8] transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      Clear
                    </motion.button>
                    <motion.button
                      onClick={() => setShowTerminal(false)}
                      className="text-[10px] text-[#64748B] hover:text-[#94A3B8] transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      Hide
                    </motion.button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Terminal logs={terminalLogs} isRunning={isExecuting} className="h-full border-0 rounded-none" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Action Bar */}
        <ActionBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          isExecuting={isExecuting}
          canGoNext={canGoNext}
          canGoBack={canGoBack}
          onBack={handleBack}
          onNext={handleNext}
          onRun={handleRun}
          onSaveExit={handleSaveExit}
        />
      </div>
    </div>
    </>
  );
}
