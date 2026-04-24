import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import {
  Container, Github, Database, Router, FileText, Chrome, Cloud, Settings,
  Globe, Check, Package, Sparkles, Link2, Shield, CheckCircle2, HardDrive, Loader2,
  MessageSquare, Zap, KeyRound, X, ExternalLink,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import useWizardStore from '@/store/wizardStore';
import { generateDevOpsWorkspace, type GenerationResult } from '@/services/geminiService';
import { containerVariants, cardVariants, easeSmooth } from './variants';
import type { AccountStatus } from '@/store/wizardStore';

const aiProviderIcons: Record<string, React.ReactNode> = {
  openai: <Sparkles className="w-5 h-5 text-[#10A37F]" />,
  anthropic: <MessageSquare className="w-5 h-5 text-[#D97757]" />,
  kimi: <Zap className="w-5 h-5 text-[#8B5CF6]" />,
  google_gemini: <Chrome className="w-5 h-5 text-[#4285F4]" />,
};

export default function Step2() {
  const {
    providers, toggleProvider, policies, setPolicy, completeStep,
    aiProviders, setAiProviderStatus, queueCliInstall, preferredBrowser,
  } = useWizardStore();
  const [showPlan, setShowPlan] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GenerationResult | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [apiKeyModal, setApiKeyModal] = useState<{ open: boolean; providerId: string; providerName: string } | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [connectingAiId, setConnectingAiId] = useState<string | null>(null);

  // Auto-complete when at least Docker (required) is selected AND at least one AI provider is linked
  useEffect(() => {
    const dockerSelected = providers.find((p) => p.id === 'docker')?.selected;
    const aiLinked = aiProviders.some((p) => p.status === 'synthetic_linked' || p.status === 'real_linked');
    if (dockerSelected && aiLinked) {
      completeStep(2);
    }
  }, [providers, aiProviders, completeStep]);

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

  const handleAiConnect = async (providerId: string) => {
    const provider = aiProviders.find((p) => p.id === providerId);
    if (!provider) return;

    setConnectingAiId(providerId);

    // Google Gemini uses OAuth via existing server endpoint
    if (providerId === 'google_gemini') {
      try {
        const urlResp = await fetch(
          `/api/auth/url/google?origin=${encodeURIComponent(window.location.origin)}`,
          { method: 'GET' }
        );
        if (!urlResp.ok) throw new Error(`Auth API ${urlResp.status}`);
        const data = await urlResp.json() as {
          available: boolean; authUrl?: string; state?: string; reason?: string;
        };
        if (!data.available || !data.authUrl) {
          // Fallback to synthetic link
          setAiProviderStatus(providerId, 'synthetic_linked', {
            authKind: 'synthetic',
            authRef: `syn_${providerId}_${Math.random().toString(36).slice(2, 10)}`,
            lastLinkedAt: new Date().toISOString(),
          });
          queueCliInstall(provider.cliPackage);
          setConnectingAiId(null);
          return;
        }
        window.open(data.authUrl, `oauth_${providerId}`, 'width=540,height=740,noopener,noreferrer');
        setConnectingAiId(null);
        return;
      } catch {
        // Fallback to synthetic
        setAiProviderStatus(providerId, 'synthetic_linked', {
          authKind: 'synthetic',
          authRef: `syn_${providerId}_${Math.random().toString(36).slice(2, 10)}`,
          lastLinkedAt: new Date().toISOString(),
        });
        queueCliInstall(provider.cliPackage);
        setConnectingAiId(null);
        return;
      }
    }

    // OpenAI, Anthropic, Kimi use API key modal
    setApiKeyModal({ open: true, providerId, providerName: provider.name });
    setConnectingAiId(null);
  };

  const submitApiKey = () => {
    if (!apiKeyModal || !apiKeyInput.trim()) return;
    const provider = aiProviders.find((p) => p.id === apiKeyModal.providerId);
    if (!provider) return;

    setAiProviderStatus(apiKeyModal.providerId, 'real_linked', {
      authKind: 'real',
      authRef: apiKeyInput.trim(),
      lastLinkedAt: new Date().toISOString(),
    });
    queueCliInstall(provider.cliPackage);
    setApiKeyModal(null);
    setApiKeyInput('');
  };

  const disconnectAiProvider = (providerId: string) => {
    setAiProviderStatus(providerId, 'disconnected');
  };

  const aiStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case 'real_linked': return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.25)] flex items-center gap-1"><Check className="w-3 h-3" />Connected</span>;
      case 'synthetic_linked': return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(37,99,235,0.1)] text-[#2563EB] border border-[rgba(37,99,235,0.25)] flex items-center gap-1"><Link2 className="w-3 h-3" />Linked</span>;
      default: return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(255,255,255,0.04)] text-[#64748B] border border-[rgba(255,255,255,0.08)]">Not Connected</span>;
    }
  };

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
      {/* ── AI Provider Connection ── */}
      <motion.div variants={cardVariants}>
        <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Connect Your AI</h1>
        <p className="text-[14px] text-[#94A3B8] mb-4">
          Link your preferred AI provider. API keys are stored locally. CLIs will be installed after PowerShell setup.
        </p>
        {preferredBrowser !== 'default' && (
          <p className="text-[12px] text-[#06B6D4] mb-3 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            OAuth flows will open in {preferredBrowser.charAt(0).toUpperCase() + preferredBrowser.slice(1)}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {aiProviders.map((p) => (
            <motion.div
              key={p.id}
              className={`relative p-4 rounded-2xl border transition-all ${
                p.status === 'real_linked' || p.status === 'synthetic_linked'
                  ? 'border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.04)]'
                  : 'border-[rgba(255,255,255,0.06)] bg-[#0B1120]'
              }`}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-3 mb-2">
                {aiProviderIcons[p.id] || <Globe className="w-5 h-5" />}
                <span className="text-[14px] font-semibold text-[#F0F4F8]">{p.name}</span>
              </div>
              <p className="text-[12px] text-[#64748B] mb-3">{p.description}</p>
              <div className="flex items-center justify-between">
                {aiStatusBadge(p.status)}
                <div className="flex gap-2">
                  {(p.status === 'real_linked' || p.status === 'synthetic_linked') ? (
                    <motion.button
                      onClick={() => disconnectAiProvider(p.id)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#EF4444] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.05)]"
                      whileTap={{ scale: 0.97 }}
                    >
                      Disconnect
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={() => void handleAiConnect(p.id)}
                      disabled={connectingAiId === p.id}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {connectingAiId === p.id ? 'Connecting...' : 'Connect'}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Service Providers ── */}
      <motion.div variants={cardVariants}>
        <h2 className="text-[24px] font-semibold text-[#F0F4F8] tracking-[-0.01em] mb-2">Service Providers</h2>
        <p className="text-[14px] text-[#94A3B8] mb-4">
          Select which infrastructure services you want to integrate.
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

      {/* ── API Key Modal ── */}
      <AnimatePresence>
        {apiKeyModal?.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(2,6,23,0.85)] backdrop-blur-sm"
            onClick={() => { setApiKeyModal(null); setApiKeyInput(''); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-[420px] max-w-[calc(100vw-32px)] rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0B1120] p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-bold text-[#F0F4F8]">Connect {apiKeyModal.providerName}</h3>
                <button
                  onClick={() => { setApiKeyModal(null); setApiKeyInput(''); }}
                  className="text-[#64748B] hover:text-[#F0F4F8]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[13px] text-[#94A3B8] mb-4">
                Enter your API key for {apiKeyModal.providerName}. This is stored locally in your browser and never sent to our servers.
              </p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.15)] mb-4">
                <KeyRound className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                <p className="text-[11px] text-[#F59E0B]">
                  Keep your key secure. You can revoke it from the provider dashboard anytime.
                </p>
              </div>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-..."
                className="w-full p-3 rounded-xl bg-[#050A18] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#F0F4F8] placeholder:text-[#475569] focus:outline-none focus:border-[#2563EB] mb-4"
              />
              <div className="flex gap-3">
                <motion.button
                  onClick={submitApiKey}
                  disabled={!apiKeyInput.trim()}
                  className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  Connect
                </motion.button>
                <button
                  onClick={() => { setApiKeyModal(null); setApiKeyInput(''); }}
                  className="px-4 py-2.5 rounded-[10px] text-[13px] font-medium text-[#94A3B8] border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)]"
                >
                  Cancel
                </button>
              </div>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(apiKeyModal.providerName + ' API key')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[11px] text-[#3B82F6] hover:text-[#60A5FA]"
              >
                <ExternalLink className="w-3 h-3" />
                How do I get an API key?
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
