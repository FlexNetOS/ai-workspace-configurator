import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Bot, User, RotateCcw,
  MessageSquare, Keyboard
} from 'lucide-react';
import useChatStore from '@/store/chatStore';
import useWizardStore from '@/store/wizardStore';
import useHardwareRegistry, { generateHardwareSkill } from '@/store/hardwareRegistryStore';
import { sendMessage, type Message as AIMessage } from '@/lib/aiService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ═══════════════════════════════════════════════════════════════
   Context-Aware Response Engine
   ═══════════════════════════════════════════════════════════════ */

const stepKnowledge: Record<number, { title: string; why: string; time: string; tip: string }> = {
  1: { title: 'Initialize Configurator', why: 'Sets up directories and prepares the workspace.', time: '~2 min', tip: 'Download the scripts panel below if you want to run them manually later.' },
  2: { title: 'Select Provider & Policy', why: 'Tells the installer what tools to set up for you.', time: '~3 min', tip: 'Docker is required — everything else is optional based on your goals.' },
  3: { title: 'Create Rollback Checkpoint', why: 'Creates a restore point so you can undo changes.', time: '~5 min', tip: 'This is your safety net. If anything goes wrong, you can roll back.' },
  4: { title: 'Verify Security & Readiness', why: 'Checks admin rights, virtualization, and updates.', time: '~3 min', tip: 'If virtualization is off, you may need to restart and enter BIOS.' },
  5: { title: 'Install PowerShell 7', why: 'Modern PowerShell for better script support.', time: '~5 min', tip: 'PowerShell 7 runs side-by-side with Windows PowerShell — nothing breaks.' },
  6: { title: 'Windows Update & Apps', why: 'Ensures Windows and all apps are fully current.', time: '~20 min', tip: 'This may take a while. Good time to grab coffee!' },
  7: { title: 'Discover Hardware', why: 'Scans CPU, GPU, RAM, storage, and network.', time: '~2 min', tip: 'WMI queries are read-only — your system is not modified.' },
  8: { title: 'Device Registration', why: 'Tracks serial numbers and warranty info.', time: '~5 min', tip: 'Optional — skip if you do not need vendor support tracking.' },
  9: { title: 'Link Accounts', why: 'Connects Docker, GitHub, HuggingFace, etc.', time: '~5 min', tip: 'You only need 3 accounts minimum. Connect the rest later.' },
  10: { title: 'Approve Final Plan', why: 'Reviews everything before changes are made.', time: '~2 min', tip: 'Read the summary carefully. This is your last checkpoint before installation.' },
  11: { title: 'Apply Configurations', why: 'Applies registry tweaks, environment variables, etc.', time: '~3 min', tip: 'All changes are logged and reversible via the rollback checkpoint.' },
  12: { title: 'Install Full Stack', why: 'Docker → WSL2 → Ubuntu → ZED → llama.cpp → Models.', time: '~30-60 min', tip: 'The longest step. Do not close the app — it is resume-safe.' },
  13: { title: 'Run E2E Tests', why: 'Verifies everything works: Docker, WSL, GPU, models.', time: '~5 min', tip: 'If a test fails, expand it to see the diagnostic output.' },
  14: { title: 'Provision Environment', why: 'Creates dev, sandbox, or simulation workspace.', time: '~3 min', tip: 'Choose "Development" for the full experience.' },
  15: { title: 'Hardware Tuning', why: 'Optimizes CPU/GPU settings for AI workloads.', time: '~5 min', tip: 'BIOS tweaks are optional — skip if you are not comfortable.' },
};

const PROVIDER_MODELS: Record<string, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-3-5-sonnet-20241022',
  kimi: 'kimi-k2-0711-preview',
  google_gemini: 'gemini-3-flash-preview',
};

const glossary: Record<string, string> = {
  'wsl2': 'Windows Subsystem for Linux 2. A lightweight Linux VM inside Windows. Runs real Linux apps without dual-booting.',
  'docker': 'A tool that packages apps into "containers" — self-contained boxes that run anywhere. Think of it as a shipping container for software.',
  'vhdx': 'A virtual hard disk file. WSL2 uses this as your Linux C: drive. Can be resized if you need more space.',
  'virtualization': 'A CPU feature that lets your computer run multiple operating systems at once. Required for WSL2 and Docker. Usually enabled in BIOS.',
  'gpu passthrough': 'Letting the Linux VM inside WSL2 use your real NVIDIA GPU. Required for fast AI model inference.',
  'winget': 'Windows Package Manager. Like an app store for command-line tools. "winget install Docker.DockerDesktop" installs Docker.',
  'llama.cpp': 'A C++ engine that runs AI models locally on your GPU or CPU. Fast, private, no cloud needed.',
  'gguf': 'A file format for AI models. Compressed, efficient, runs on consumer hardware. Think of it as MP3 for AI.',
  'zsh': 'A modern shell (command-line interface). Replaces the default bash. Has better auto-completion and themes.',
  'ohmyzsh': 'A framework that makes Zsh beautiful and powerful. Adds plugins, themes, and shortcuts.',
  'zed': 'A modern code editor built for speed and AI integration. Zed.dev — runs native on Windows with WSL support.',
  'kimi': 'Kimi Code CLI — an AI coding assistant that runs in your terminal. Helps write, debug, and explain code.',
  'agent client protocol': 'ACP — a standard way for code editors to talk to AI assistants. Like USB for AI tools.',
};

function generateResponse(userMsg: string, currentStep: number, completedSteps: boolean[]): string {
  const lower = userMsg.toLowerCase();

  // ── Check hardware registry knowledge first ──
  const registry = useHardwareRegistry.getState();
  const hwEntry = registry.entries.find((e) => {
    const modelLower = e.model.toLowerCase();
    const vendorLower = e.vendor.toLowerCase();
    return lower.includes(modelLower) || lower.includes(vendorLower) || lower.includes(e.componentType.toLowerCase());
  });
  if (hwEntry && hwEntry.skillId) {
    const skill = generateHardwareSkill(hwEntry);
    if (lower.includes('issue') || lower.includes('problem') || lower.includes('trouble') || lower.includes('fix') || lower.includes('not work')) {
      return `**${hwEntry.vendor} ${hwEntry.model} — Known Issues**\n\n${skill.knownIssues.map((i) => `• ${i}`).join('\n')}\n\n**Quick diagnostic commands:**\n${skill.quickCommands.map((c) => `• ${c.label}: \`${c.command}\``).join('\n')}\n\n**Resource links:**\n${skill.relatedDocs.slice(0, 3).map((url) => `• ${url}`).join('\n')}`;
    }
    if (lower.includes('optim') || lower.includes('tune') || lower.includes('setting') || lower.includes('config')) {
      return `**${hwEntry.vendor} ${hwEntry.model} — Optimization**\n\n${skill.capabilities.optimize.map((cap) => `• ${cap}`).join('\n')}\n\n**Quick commands:**\n${skill.quickCommands.map((c) => `• ${c.label}: \`${c.command}\``).join('\n')}`;
    }
    if (lower.includes('spec') || lower.includes('what is') || lower.includes('capable') || lower.includes('detail')) {
      return `**${hwEntry.vendor} ${hwEntry.model} — Specifications**\n\n${Object.entries(hwEntry.discoveredSpecs).map(([k, v]) => `• **${k}:** ${v}`).join('\n')}\n\n**Status:** ${hwEntry.status}\n**Serial:** ${hwEntry.serialNumber || 'Not registered'}\n**Warranty:** ${hwEntry.warrantyExpiry || 'Not set'}\n\n**Resource links:**\n${skill.relatedDocs.slice(0, 3).map((url) => `• ${url}`).join('\n')}`;
    }
    // Generic component knowledge
    return `I know about your **${hwEntry.vendor} ${hwEntry.model}** (${hwEntry.componentType})!\n\n**Status:** ${hwEntry.status}\n**Specs:** ${Object.entries(hwEntry.discoveredSpecs).map(([k, v]) => `${k}: ${v}`).join(', ')}\n\nAsk me about:\n• Known issues with this ${hwEntry.componentType}\n• How to optimize it\n• Its full specifications\n• Driver/firmware updates`;
  }

  const stepMatch = lower.match(/step (\d{1,2})/);
  if (stepMatch || lower.includes('what does') || lower.includes('explain')) {
    const stepNum = stepMatch ? parseInt(stepMatch[1]) : currentStep;
    const k = stepKnowledge[stepNum];
    if (k) {
      return `**Step ${stepNum}: ${k.title}**\n\n${k.why}\n\n⏱️ Estimated time: ${k.time}\n\n💡 Tip: ${k.tip}`;
    }
  }

  if (lower.includes('progress') || lower.includes('how much longer') || lower.includes('almost done') || lower.includes('how far')) {
    const done = completedSteps.filter(Boolean).length;
    const pct = Math.round((done / 15) * 100);
    const remaining = 15 - done;
    return `You're at **${pct}%** — **${done} of 15 steps** completed.\n\n${remaining > 0 ? `${remaining} steps to go. At the current pace, about **${remaining * 5}–${remaining * 10} minutes** remaining.` : 'All steps complete! 🎉'}\n\nCurrent step: **Step ${currentStep}**`;
  }

  if (lower.includes('safe') || lower.includes('delete') || lower.includes('privacy') || lower.includes('undo') || lower.includes('rollback')) {
    return `**Yes, this is designed to be safe.**\n\n🔒 **What it does NOT do:**\n• Delete your files or documents\n• Change your passwords\n• Block setup if OAuth is slow or unavailable\n• Modify system settings without your approval\n\n✅ **What protects you:**\n• A **System Restore Point** is created at Step 3\n• All scripts are **read-only** during the scan phases\n• You **approve the final plan** at Step 10 before anything is installed\n• Account linking uses **synthetic status tokens** first, then optional real OAuth upgrade\n\n💾 Synthetic status tokens are continuity metadata, not API secrets.`;
  }

  if (lower.includes('which account') || lower.includes('do i need') || lower.includes('minimum') || lower.includes('all accounts')) {
    return `**Minimum required: 2 accounts**\n\n✅ **Docker Hub** — Required. Needed to pull and run containers.\n✅ **GitHub** — Required. Needed to clone repos and use GitHub Actions.\n\n🔹 **Recommended additions:**\n• **HuggingFace** — For downloading AI models (free)\n• **OpenRouter** — For cloud AI API access (pay-as-you-go)\n\n🔸 **Optional:**\n• Notion — Documentation sync\n• Google — Cloud storage / Gemini API\n• Cloudflare — DNS / edge AI\n\nYou can always connect more accounts later in Settings.`;
  }

  for (const [term, def] of Object.entries(glossary)) {
    if (lower.includes(term.toLowerCase()) || lower.includes(term.replace('.', ''))) {
      return `**${term.toUpperCase()}**\n\n${def}`;
    }
  }

  if (lower.includes('stuck') || lower.includes('error') || lower.includes('fail') || lower.includes('help') || lower.includes('fix')) {
    return `I'd love to help! To diagnose this properly, tell me:\n\n1. **Which step** are you on? (Step ${currentStep}?)\n2. **What error message** do you see?\n3. **What happened** right before it failed?\n\nCommon quick fixes:\n• **Restart** — Many issues clear after a reboot\n• **Run as Administrator** — Right-click PowerShell → "Run as administrator"\n• **Check internet** — Some steps need to download tools\n\nYou can also check the **Logs** tab for detailed error output.`;
  }

  if (lower.includes('next') || lower.includes('what should i do') || lower.includes('continue')) {
    const k = stepKnowledge[currentStep];
    return k
      ? `You're on **Step ${currentStep}: ${k.title}**.\n\n${k.why}\n\nClick **"Run This Step"** in the bottom bar to start it. After it completes, click **Next** to move to Step ${currentStep + 1}.`
      : `Click **"Run This Step"** to execute the current step, then **Next** to proceed.`;
  }

  return `I'm here to help with your workspace setup!\n\nI can help you:\n• **Explain any step** — just ask "What does Step 4 do?"\n• **Check your progress** — ask "How much longer?"\n• **Fix errors** — tell me what failed and I'll guide you\n• **Explain tech terms** — ask "What is WSL2?"\n• **Navigate** — say "Go to Settings" or "Show me logs"\n\nWhat would you like to know?`;
}

const buildAiConversation = (
  history: { role: 'assistant' | 'user' | 'system'; content: string }[],
  userText: string
): AIMessage[] => {
  const trimmed = history
    .filter((m) => m.role === 'assistant' || m.role === 'user')
    .slice(-10)
    .map((m): AIMessage => {
      const role: AIMessage['role'] = m.role === 'assistant' ? 'model' : 'user';
      return {
        role,
        text: m.content,
      };
    });

  return [...trimmed, { role: 'user', text: userText }];
};

/* ═══════════════════════════════════════════════════════════════
   ChatPanel — Redesigned with no overlapping elements
   ═══════════════════════════════════════════════════════════════ */

export default function ChatPanel() {
  const { isOpen, toggle, close, messages, addMessage, isTyping, setTyping, suggestedPrompts, setSuggestedPrompts, selectedProviderId, setSelectedProviderId } = useChatStore();
  const currentStep = useWizardStore((s) => s.currentStep);
  const completedSteps = useWizardStore((s) => s.completedSteps);
  const linkedAccounts = useWizardStore((s) => s.linkedAccounts);
  const aiProviders = useWizardStore((s) => s.aiProviders);

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const linkedAiProviders = useMemo(
    () => aiProviders.filter((p) => p.status === 'real_linked' || p.status === 'synthetic_linked'),
    [aiProviders]
  );

  /* ── Auto-select first linked provider when none selected ── */
  useEffect(() => {
    if (!selectedProviderId && linkedAiProviders.length > 0) {
      setSelectedProviderId(linkedAiProviders[0].id);
    }
    if (selectedProviderId && !linkedAiProviders.some((p) => p.id === selectedProviderId)) {
      setSelectedProviderId(linkedAiProviders.length > 0 ? linkedAiProviders[0].id : null);
    }
  }, [selectedProviderId, linkedAiProviders, setSelectedProviderId]);

  /* ── Scroll to bottom on new messages ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* ── Focus input when opened ── */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  /* ── Escape key to close ── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
      // Ctrl+K or Cmd+K to toggle
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, close, toggle]);

  /* ── Update suggested prompts based on current step ── */
  useEffect(() => {
    const stepPrompts: Record<number, string[]> = {
      1: ['What does this app do?', 'Is my system ready?', 'How do I run the check?'],
      2: ['Which providers do I need?', 'What is Docker?', 'Do I need all accounts?'],
      3: ['What is a rollback?', 'Can I undo changes?', 'Is this safe?'],
      4: ['How do I enable virtualization?', 'What is UAC?', 'Why do I need admin rights?'],
      5: ['What is PowerShell 7?', 'Why not use default PowerShell?'],
      6: ['How long does this take?', 'Can I use my computer during updates?'],
      7: ['What hardware is detected?', 'Do I need a GPU?', 'What is WMI?'],
      8: ['Do I need to register devices?', 'Where do I find serial numbers?'],
      9: ['Which accounts are required?', 'What is OpenRouter?', 'Is HuggingFace free?'],
      10: ['What am I approving?', 'Can I change my mind later?', 'What gets installed?'],
      11: ['What configs are applied?', 'Will this change my settings?'],
      12: ['How long does this take?', 'What is llama.cpp?', 'Can I pause this?'],
      13: ['What is E2E testing?', 'A test failed — what now?', 'Do I need all tests to pass?'],
      14: ['What is a sandbox environment?', 'Which environment should I choose?'],
      15: ['Should I change BIOS settings?', 'What is GPU tuning?', 'Is this risky?'],
    };
    setSuggestedPrompts(stepPrompts[currentStep] || ['What does this step do?', 'How much longer?', 'Explain WSL2']);
  }, [currentStep, setSuggestedPrompts]);

  const runAssistantReply = useCallback(async (userText: string) => {
    const fallback = generateResponse(userText, currentStep, completedSteps);
    const registry = useHardwareRegistry.getState();
    const dynamicSkills = registry.entries
      .filter((entry) => entry.skillId)
      .map((entry) => `${entry.vendor} ${entry.model} (${entry.componentType})`)
      .join(', ');

    try {
      const aiResponse = await sendMessage(
        buildAiConversation(messages, userText),
        {
          lastPrompt: userText,
          metrics: `${completedSteps.filter(Boolean).length}/15 steps complete`,
          accounts: linkedAccounts
            .filter((a) => a.status === 'synthetic_linked' || a.status === 'real_linked')
            .map((a) => `${a.name}:${a.status}`)
            .join(', '),
          enclaveStatus: 'active',
          dynamicSkills,
          providerId: selectedProviderId ?? undefined,
          model: selectedProviderId ? PROVIDER_MODELS[selectedProviderId] : undefined,
        }
      );

      // If API key is missing or service fallback text is returned, keep local deterministic response.
      const lowerResponse = aiResponse.toLowerCase();
      const responseText =
        lowerResponse.includes('not configured') || lowerResponse.includes('not yet supported')
          ? fallback
          : aiResponse;
      addMessage({ role: 'assistant', content: responseText, stepContext: currentStep });
    } catch {
      addMessage({ role: 'assistant', content: fallback, stepContext: currentStep });
    } finally {
      setTyping(false);
    }
  }, [currentStep, completedSteps, linkedAccounts, messages, addMessage, setTyping, selectedProviderId]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isTyping) return;
    const userText = input.trim();
    setInput('');
    addMessage({ role: 'user', content: userText, stepContext: currentStep });
    setTyping(true);
    void runAssistantReply(userText);
  }, [input, isTyping, currentStep, addMessage, setTyping, runAssistantReply]);

  const handlePromptClick = useCallback((prompt: string) => {
    if (isTyping) return;
    addMessage({ role: 'user', content: prompt, stepContext: currentStep });
    setTyping(true);
    void runAssistantReply(prompt);
  }, [isTyping, currentStep, addMessage, setTyping, runAssistantReply]);

  return (
    <>
      {/* ════════ FAB (hidden when chat is open) ════════ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={toggle}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 24px rgba(37,99,235,0.35)' }}
            whileTap={{ scale: 0.95 }}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ delay: 1, type: 'spring', damping: 20, stiffness: 200 }}
          >
            <MessageSquare className="w-6 h-6" />
            {/* Unread indicator */}
            {messages.length > 1 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] text-[10px] text-white flex items-center justify-center font-bold">
                {Math.min(messages.length - 1, 9)}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ════════ Backdrop Overlay ════════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-30 bg-[rgba(2,6,23,0.5)] backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      {/* ════════ Chat Panel ════════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 z-40 w-full sm:w-[420px] h-screen bg-[#0B1120] border-l border-[rgba(255,255,255,0.06)] flex flex-col shadow-2xl"
          >
            {/* ── Header ── */}
            <div className="flex-shrink-0 h-14 px-4 flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[rgba(37,99,235,0.12)] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-[#3B82F6]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold text-[#F0F4F8] leading-tight">Claw</h3>
                  {linkedAiProviders.length > 0 ? (
                    <Select
                      value={selectedProviderId ?? ''}
                      onValueChange={(value) => setSelectedProviderId(value)}
                    >
                      <SelectTrigger
                        className="h-5 text-[10px] border-0 bg-transparent p-0 pr-4 text-[#64748B] hover:text-[#94A3B8] focus:ring-0 focus:ring-offset-0 shadow-none gap-1 w-auto [&>svg]:size-3"
                      >
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-[#0F172A] border-[rgba(255,255,255,0.08)] text-[#F0F4F8]">
                        {linkedAiProviders.map((p) => (
                          <SelectItem
                            key={p.id}
                            value={p.id}
                            className="text-[11px] text-[#94A3B8] focus:bg-[rgba(37,99,235,0.12)] focus:text-[#F0F4F8] cursor-pointer"
                          >
                            {p.name} / {PROVIDER_MODELS[p.id] ?? p.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      <span className="text-[10px] text-[#64748B]">AI Workspace Assistant</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => useChatStore.getState().clearHistory()}
                  className="p-2 rounded-lg text-[#475569] hover:text-[#94A3B8] hover:bg-[rgba(255,255,255,0.04)] transition-all"
                  title="Clear history"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={close}
                  className="p-2 rounded-lg text-[#475569] hover:text-[#94A3B8] hover:bg-[rgba(255,255,255,0.04)] transition-all"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Messages Area ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                    msg.role === 'user'
                      ? 'bg-[rgba(6,182,212,0.1)] text-[#06B6D4]'
                      : 'bg-[rgba(37,99,235,0.1)] text-[#3B82F6]'
                  }`}>
                    {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div className={`max-w-[300px] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[rgba(6,182,212,0.1)] text-[#F0F4F8] rounded-tr-sm'
                      : 'bg-[rgba(255,255,255,0.04)] text-[#94A3B8] rounded-tl-sm'
                  }`}>
                    {msg.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="text-[#F0F4F8]">{part.slice(2, -2)}</strong>;
                      }
                      return part;
                    })}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[rgba(37,99,235,0.1)] flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-[#3B82F6]" />
                  </div>
                  <div className="px-3.5 py-2.5 rounded-2xl bg-[rgba(255,255,255,0.04)] rounded-tl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#64748B] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#64748B] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#64748B] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* ── Suggested Prompts ── */}
            {suggestedPrompts.length > 0 && !isTyping && (
              <div className="flex-shrink-0 px-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {suggestedPrompts.slice(0, 4).map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handlePromptClick(prompt)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] text-[#94A3B8] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(37,99,235,0.25)] hover:text-[#3B82F6] transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Input Area ── */}
            <div className="flex-shrink-0 p-3 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask Claw anything..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#050A18] border border-[rgba(255,255,255,0.08)] text-[#F0F4F8] text-[13px] placeholder-[#475569] focus:outline-none focus:border-[rgba(37,99,235,0.4)]"
                />
                <motion.button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-30 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="flex items-center justify-center gap-3 mt-1.5">
                <p className="text-[10px] text-[#475569]">Uses app context • History saved locally</p>
                <span className="flex items-center gap-1 text-[10px] text-[#475569]">
                  <Keyboard className="w-3 h-3" />
                  Esc to close
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
