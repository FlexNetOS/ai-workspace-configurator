import { useCallback } from 'react';
import useHardwareRegistry, { generateHardwareSkill } from '@/store/hardwareRegistryStore';
import useWizardStore from '@/store/wizardStore';
import { sendMessage, type Message as AIMessage } from '@/lib/aiService';

export interface ChatEngineMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface SendMessageContext {
  lastPrompt: string;
  metrics: string;
  accounts: string;
  enclaveStatus: string;
  dynamicSkills?: string;
}

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

function generateLocalResponse(userMsg: string, currentStep: number, completedSteps: boolean[]): string {
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

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `👋 Hello! I'm your AI Workspace setup assistant.\n\nI can help you with:\n• Explaining any of the 15 setup steps\n• Answering questions about hardware, accounts, or security\n• Checking your progress\n• Explaining technical terms in plain English\n\nWhat would you like to know?`;
  }

  return `I'm not sure I understand. Try asking me about:\n• A specific step (e.g., "What does Step 7 do?")\n• Your progress ("How far am I?")\n• A technical term (e.g., "What is WSL2?")\n• Safety or rollback questions\n• Required accounts`;
}

export interface UseChatEngineReturn {
  generateResponse: (userMsg: string) => string;
  sendAIMessage: (messages: { role: string; content: string }[], context: SendMessageContext) => Promise<string>;
}

export function useChatEngine(): UseChatEngineReturn {
  const { currentStep, completedSteps } = useWizardStore();

  const generateResponse = useCallback(
    (userMsg: string) => generateLocalResponse(userMsg, currentStep, completedSteps),
    [currentStep, completedSteps]
  );

  const sendAIMessage = useCallback(
    async (messages: { role: string; content: string }[], context: SendMessageContext) => {
      const aiMessages: AIMessage[] = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        text: m.content,
      }));
      return sendMessage(aiMessages, context);
    },
    []
  );

  return { generateResponse, sendAIMessage };
}
