import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import {
  Container, Github, Database, Router, FileText, Chrome, Cloud, Settings,
  Globe, Check, Package, Sparkles, Link2, Shield, CheckCircle2, HardDrive, Loader2,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import useWizardStore from '@/store/wizardStore';
import { generateDevOpsWorkspace, type GenerationResult } from '@/services/geminiService';
import { containerVariants, cardVariants, easeSmooth } from './variants';

export default function Step2() {
  const { providers, toggleProvider, policies, setPolicy, completeStep } = useWizardStore();
  const [showPlan, setShowPlan] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GenerationResult | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

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
  const selectedProviderNames = providers.filter((p) => p.selected).map((p) => p.name);

  const handleGeneratePlan = useCallback(async () => {
    setShowPlan(true);
    if (generatedPlan || isGeneratingPlan) return;

    setIsGeneratingPlan(true);
    setPlanError(null);

    const policySummary = Object.entries(policies)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key)
      .join(', ');
    const providerSummary = selectedProviderNames.length > 0 ? selectedProviderNames.join(', ') : 'Docker';

    try {
      const result = await generateDevOpsWorkspace(
        `Generate an AI workspace plan for Windows 11 with providers: ${providerSummary}. Enabled policies: ${policySummary}.`
      );
      setGeneratedPlan(result);
    } catch (error) {
      setPlanError(error instanceof Error ? error.message : 'Unable to synthesize plan preview.');
    } finally {
      setIsGeneratingPlan(false);
    }
  }, [generatedPlan, isGeneratingPlan, policies, selectedProviderNames]);

  const planCards = generatedPlan
    ? [
        { label: 'Base Image', value: generatedPlan.dependencies.base_image, icon: <Container className="w-4 h-4" /> },
        { label: 'Security Score', value: `${generatedPlan.metrics.security_score}/100`, icon: <Shield className="w-4 h-4" /> },
        { label: 'Lifecycle', value: `${generatedPlan.lifecycle_plan.length} steps generated`, icon: <CheckCircle2 className="w-4 h-4" /> },
        { label: 'Cloud Cost', value: generatedPlan.metrics.est_cloud_monthly_cost, icon: <HardDrive className="w-4 h-4" /> },
      ]
    : [
        { label: 'Software', value: 'PowerShell 7.x, Docker Desktop, WSL2, Windows Terminal, Zed IDE, Git', icon: <Package className="w-4 h-4" /> },
        { label: 'AI Tools', value: 'llama.cpp, Ollama, HuggingFace CLI, OpenRouter CLI', icon: <Sparkles className="w-4 h-4" /> },
        { label: 'Accounts', value: `${selectedCount} providers selected`, icon: <Link2 className="w-4 h-4" /> },
        { label: 'Security', value: 'System restore point, UAC verification, firewall rules', icon: <Shield className="w-4 h-4" /> },
      ];

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
          onClick={() => void handleGeneratePlan()}
          disabled={isGeneratingPlan}
          className="px-6 py-3 rounded-[10px] text-[14px] font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
          whileHover={{ y: -1, boxShadow: '0 0 20px rgba(37,99,235,0.25)' }}
          whileTap={{ scale: 0.97 }}
        >
          {isGeneratingPlan ? 'Synthesizing...' : 'Generate Plan Preview'}
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
            {isGeneratingPlan && (
              <div className="mb-3 text-[12px] text-[#94A3B8] flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                Generating lifecycle and dependency plan...
              </div>
            )}
            {planError && (
              <div className="mb-3 text-[12px] text-[#F59E0B]">
                AI synthesis unavailable: {planError}. Showing baseline safe plan.
              </div>
            )}
            <div className="space-y-2">
              {planCards.map((item, i) => (
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
              {generatedPlan && generatedPlan.lifecycle_plan.length > 0 && (
                <div className="pt-2">
                  <p className="text-[12px] text-[#94A3B8] mb-2">Lifecycle preview</p>
                  <div className="space-y-1">
                    {generatedPlan.lifecycle_plan.slice(0, 3).map((step) => (
                      <div key={step.id} className="text-[11px] text-[#64748B]">
                        Step {step.id}: {step.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-[rgba(37,99,235,0.1)] text-[#2563EB] border border-[rgba(37,99,235,0.25)]">
                  Est. Time: {generatedPlan ? '~30-45 min' : '~45 min'}
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.25)]">
                  Disk Space: {generatedPlan ? '~10-14 GB' : '~12 GB'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
