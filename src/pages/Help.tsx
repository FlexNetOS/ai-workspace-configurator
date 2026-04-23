import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import {
  Search,
  BookOpen,
  Link2,
  Wrench,
  Cpu,
  Shield,
  Settings,
  ChevronDown,
  ExternalLink,
  Zap,
  Github,
  FileText,
  Monitor,
  Globe,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Mail,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FaqItem {
  question: string;
  answer: string;
  category: "general" | "wizard" | "technical" | "accounts";
}

interface TroubleshootingIssue {
  title: string;
  symptoms: string[];
  causes: string[];
  solutions: string[];
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const FAQ_DATA: FaqItem[] = [
  {
    question: "What is vibe coding?",
    answer: "Vibe coding is a development approach where AI assists with writing code. You describe what you want in natural language, and AI tools help generate, refine, and debug the code. It's a collaborative workflow between humans and AI that makes programming more accessible and productive.",
    category: "general",
  },
  {
    question: "Do I need Windows 11 Pro?",
    answer: "Windows 11 Home works fine for most features. Pro edition is only needed for some advanced Docker networking features and Hyper-V. The setup wizard will detect your edition and adjust accordingly. WSL2 works great on both Home and Pro.",
    category: "general",
  },
  {
    question: "Will this delete my files?",
    answer: "No, the configurator only installs software and creates configuration files. It does not modify, move, or delete any of your personal files. Before making system changes, it creates a Windows System Restore Point so you can undo everything if needed.",
    category: "general",
  },
  {
    question: "Can I rollback changes?",
    answer: "Yes, checkpoints are created at step 3 and after each major milestone. You can rollback to any previous checkpoint from the Logs page. Additionally, Windows System Restore Points are created before making system-level changes.",
    category: "wizard",
  },
  {
    question: "What accounts do I need?",
    answer: "At minimum GitHub and Docker Hub accounts are recommended. GitHub is used for code repositories and Git configuration. Docker Hub is needed for pulling container images. HuggingFace is optional but recommended for downloading AI models. Google, Notion, OpenRouter, and Cloudflare are all optional.",
    category: "accounts",
  },
  {
    question: "How long does setup take?",
    answer: "Typically 2-4 hours depending on your internet speed and computer. The actual software installation takes about 30-60 minutes, but downloading AI models (3-8 GB each) and Docker images can add significant time. You can leave it running and resume anytime.",
    category: "general",
  },
  {
    question: "What GPU do I need?",
    answer: "NVIDIA RTX 20-series or newer is recommended for local AI model inference. The setup will work without a GPU (using CPU mode), but model responses will be significantly slower. AMD GPUs are not currently supported for local inference. The wizard will detect your GPU and configure accordingly.",
    category: "technical",
  },
  {
    question: "Is WSL2 required?",
    answer: "Yes, WSL2 is used for the Linux environment where most AI development tools run. It's a Microsoft feature that's free and built into Windows 11. The wizard will enable it for you if it's not already active. WSL2 provides near-native performance and full compatibility with Linux AI tools.",
    category: "technical",
  },
  {
    question: "Can I use VS Code instead of ZED?",
    answer: "Yes, the setup installs both ZED and VS Code by default. You can choose your preferred editor during setup or switch between them at any time. Both are excellent choices with great AI integration support.",
    category: "technical",
  },
  {
    question: "Where are my API keys stored?",
    answer: "All API keys are stored locally in your browser's localStorage in an encrypted format. They are never transmitted to any external server. The keys are only used to authenticate with the respective services (e.g., your GitHub token only goes to GitHub's servers).",
    category: "accounts",
  },
  {
    question: "What happens if a step fails?",
    answer: "If a step fails, you'll see a clear error message with options to retry, skip, or rollback to the last checkpoint. Most common failures are due to network issues or permission problems, which can be resolved by retrying. The Logs page has detailed error information.",
    category: "wizard",
  },
  {
    question: "Can I stop and resume later?",
    answer: "Absolutely! Your progress is automatically saved after each step. You can close the app, restart your computer, or do anything else. When you return, the wizard will offer to resume exactly where you left off.",
    category: "wizard",
  },
];

const CATEGORY_CARDS = [
  {
    title: "Getting Started",
    icon: BookOpen,
    desc: "Learn the basics of workspace setup",
    color: "#2563EB",
    borderGlow: "hover:shadow-[0_0_20px_rgba(37,99,235,0.15)]",
  },
  {
    title: "Account Linking",
    icon: Link2,
    desc: "Connect your Docker, GitHub, and other accounts",
    color: "#10B981",
    borderGlow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
  },
  {
    title: "Troubleshooting",
    icon: Wrench,
    desc: "Fix common setup issues",
    color: "#F59E0B",
    borderGlow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  },
  {
    title: "Hardware Guide",
    icon: Cpu,
    desc: "GPU, drivers, and performance tuning",
    color: "#06B6D4",
    borderGlow: "hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]",
  },
  {
    title: "Security",
    icon: Shield,
    desc: "Permissions, UAC, and best practices",
    color: "#EF4444",
    borderGlow: "hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]",
  },
  {
    title: "Advanced",
    icon: Settings,
    desc: "WSL config, BIOS, and power user topics",
    color: "#94A3B8",
    borderGlow: "hover:shadow-[0_0_20px_rgba(148,163,184,0.15)]",
  },
];

const TROUBLESHOOTING: TroubleshootingIssue[] = [
  {
    title: "Docker Desktop won't start",
    symptoms: ["Docker Desktop shows error on launch", "Docker engine status shows 'stopped'"],
    causes: ["WSL2 not enabled", "Hyper-V disabled", "Corrupted Docker installation"],
    solutions: [
      "Ensure WSL2 is enabled: run 'wsl --install' in PowerShell as Admin",
      "Check Hyper-V is enabled in Windows Features",
      "Reinstall Docker Desktop from official website",
      "Restart Docker service: 'net start com.docker.service'",
    ],
  },
  {
    title: "GPU not detected in WSL",
    symptoms: ["nvidia-smi shows error in WSL", "AI models run on CPU only"],
    causes: ["NVIDIA driver not installed on Windows", "CUDA toolkit missing in WSL", "WSL kernel outdated"],
    solutions: [
      "Install latest NVIDIA drivers on Windows host",
      "Install CUDA toolkit inside WSL: 'sudo apt install nvidia-cuda-toolkit'",
      "Update WSL kernel: 'wsl --update'",
      "Verify with 'nvidia-smi' in WSL terminal",
    ],
  },
  {
    title: "Permission denied errors",
    symptoms: ["Access denied during installation", "Scripts fail to execute"],
    causes: ["Not running as Administrator", "UAC blocking operations", "Execution policy restrictions"],
    solutions: [
      "Run the app as Administrator",
      "Check UAC settings in Security tab",
      "Set execution policy: 'Set-ExecutionPolicy RemoteSigned' in PowerShell",
      "Ensure your user account has admin privileges",
    ],
  },
  {
    title: "Slow model inference",
    symptoms: ["AI responses take very long", "High CPU usage during inference"],
    causes: ["GPU passthrough not working", "Model too large for available VRAM", "WSL memory limit too low"],
    solutions: [
      "Check GPU is detected: run 'nvidia-smi' in WSL",
      "Use a smaller model (e.g., 7B instead of 70B parameters)",
      "Increase WSL memory limit in .wslconfig file",
      "Close other GPU-intensive applications",
    ],
  },
];

const QUICK_LINKS = [
  { label: "GitHub Repository", url: "https://github.com/flexnetos/ai-workspace-configurator", icon: Github },
  { label: "Docker Documentation", url: "https://docs.docker.com", icon: FileText },
  { label: "WSL Documentation", url: "https://learn.microsoft.com/windows/wsl", icon: Monitor },
  { label: "NVIDIA Drivers", url: "https://www.nvidia.com/drivers", icon: Cpu },
  { label: "ZED IDE", url: "https://zed.dev", icon: Globe },
];

const FAQ_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "general", label: "General" },
  { key: "wizard", label: "Wizard" },
  { key: "technical", label: "Technical" },
  { key: "accounts", label: "Accounts" },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden bg-[#0B1120]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[rgba(255,255,255,0.02)] transition-colors"
      >
        <span className="text-[14px] font-semibold text-[#F0F4F8]">{item.question}</span>
        <ChevronDown
          className={cn("w-4 h-4 text-[#64748B] shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-4">
          <p className="text-[13px] text-[#94A3B8] leading-relaxed max-w-[680px]">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

function TroubleshootingCard({ issue }: { issue: TroubleshootingIssue }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Wrench className="w-5 h-5 text-[#F59E0B] shrink-0" />
          <span className="text-[14px] font-semibold text-[#F0F4F8]">{issue.title}</span>
        </div>
        <ChevronDown
          className={cn("w-4 h-4 text-[#64748B] shrink-0 transition-transform duration-200", expanded && "rotate-180")}
        />
      </button>
      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          <div>
            <p className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-wider mb-2">Symptoms</p>
            <ul className="space-y-1">
              {issue.symptoms.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-[#94A3B8]">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B] mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#EF4444] uppercase tracking-wider mb-2">Possible Causes</p>
            <ul className="space-y-1">
              {issue.causes.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-[#94A3B8]">
                  <XCircle className="w-3.5 h-3.5 text-[#EF4444] mt-0.5 shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider mb-2">Solutions</p>
            <ol className="space-y-2">
              {issue.solutions.map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#94A3B8]">
                  <span className="w-5 h-5 rounded-full bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.25)] text-[#10B981] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Help() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [faqCategory, setFaqCategory] = useState<string>("all");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const filteredFaq = useMemo(() => {
    let items = FAQ_DATA;
    if (faqCategory !== "all") {
      items = items.filter((f) => f.category === faqCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
      );
    }
    return items;
  }, [faqCategory, search]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setOpenFaqIndex(null);
  }, []);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#020617] text-[#F0F4F8] px-6 py-8">
      <div className="max-w-[1100px] mx-auto space-y-10">

        {/* ── Search Hero ── */}
        <div className="text-center space-y-5">
          <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-tight">
            How can we help you?
          </h1>
          <p className="text-[#94A3B8] text-sm">
            Search for answers, browse guides, or watch tutorials.
          </p>
          <div className="max-w-[600px] mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#475569]" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search help articles..."
              className="w-full h-[52px] bg-[#0B1120] border border-[rgba(255,255,255,0.08)] rounded-xl pl-12 pr-4 text-[14px] text-[#F0F4F8] placeholder:text-[#475569] outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all"
            />
          </div>
        </div>

        {/* ── Category Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORY_CARDS.map((card) => (
            <div
              key={card.title}
              className={cn(
                "bg-[#0B1120] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 cursor-pointer transition-all hover:-translate-y-0.5",
                card.borderGlow,
                "hover:border-[rgba(255,255,255,0.12)]"
              )}
            >
              <card.icon className="w-6 h-6 mb-3" style={{ color: card.color }} />
              <h3 className="text-[16px] font-semibold text-[#F0F4F8] mb-1">{card.title}</h3>
              <p className="text-[13px] text-[#94A3B8] leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* ── FAQ Section ── */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <h2 className="text-[24px] font-semibold text-[#F0F4F8] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#2563EB]" />
              Frequently Asked Questions
            </h2>
            <div className="flex gap-1 flex-wrap">
              {FAQ_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => { setFaqCategory(cat.key); setOpenFaqIndex(null); }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all",
                    faqCategory === cat.key
                      ? "bg-[rgba(37,99,235,0.12)] text-[#2563EB] border border-[rgba(37,99,235,0.3)]"
                      : "bg-[rgba(255,255,255,0.03)] text-[#94A3B8] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {filteredFaq.length === 0 ? (
            <div className="text-center py-10">
              <Search className="w-10 h-10 text-[#475569] mx-auto mb-3" />
              <p className="text-[#64748B] text-sm">No results found for &ldquo;{search}&rdquo;</p>
              <p className="text-[#475569] text-xs mt-1">Try different keywords</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFaq.map((item, idx) => (
                <AccordionItem
                  key={`${item.question}-${idx}`}
                  item={item}
                  isOpen={openFaqIndex === idx}
                  onToggle={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Troubleshooting Section ── */}
        <div>
          <h2 className="text-[24px] font-semibold text-[#F0F4F8] mb-2 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#F59E0B]" />
            Troubleshooting
          </h2>
          <p className="text-[#94A3B8] text-sm mb-5">
            Follow these guided flows to fix common issues
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {TROUBLESHOOTING.map((issue) => (
              <TroubleshootingCard key={issue.title} issue={issue} />
            ))}
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div>
          <h2 className="text-[24px] font-semibold text-[#F0F4F8] mb-5 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-[#06B6D4]" />
            Quick Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUICK_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-[#0B1120] border border-[rgba(255,255,255,0.06)] rounded-xl hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.02)] transition-all group"
              >
                <link.icon className="w-5 h-5 text-[#64748B] group-hover:text-[#2563EB] transition-colors" />
                <span className="text-[13px] font-medium text-[#F0F4F8] flex-1">{link.label}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#475569] group-hover:text-[#94A3B8] transition-colors" />
              </a>
            ))}
          </div>
        </div>

        {/* ── Contact Section ── */}
        <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.06)] rounded-xl p-8">
          <h2 className="text-[24px] font-semibold text-[#F0F4F8] text-center mb-2">Still Need Help?</h2>
          <p className="text-[#94A3B8] text-sm text-center mb-6">
            Our community and support team are here to assist you.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <a
              href="#"
              className="flex flex-col items-center gap-3 p-5 rounded-xl bg-[#050A18] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(37,99,235,0.3)] transition-all group"
            >
              <MessageSquare className="w-8 h-8 text-[#2563EB]" />
              <span className="text-[14px] font-semibold text-[#F0F4F8]">Community Forum</span>
              <span className="text-[12px] text-[#64748B]">Ask questions and get help</span>
            </a>
            <a
              href="https://github.com/flexnetos/ai-workspace-configurator/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 p-5 rounded-xl bg-[#050A18] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.12)] transition-all group"
            >
              <Github className="w-8 h-8 text-[#F0F4F8]" />
              <span className="text-[14px] font-semibold text-[#F0F4F8]">Report a Bug</span>
              <span className="text-[12px] text-[#64748B]">Open an issue on GitHub</span>
            </a>
            <a
              href="mailto:support@flexnetos.com"
              className="flex flex-col items-center gap-3 p-5 rounded-xl bg-[#050A18] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(6,182,212,0.3)] transition-all group"
            >
              <Mail className="w-8 h-8 text-[#06B6D4]" />
              <span className="text-[14px] font-semibold text-[#F0F4F8]">Email Support</span>
              <span className="text-[12px] text-[#64748B]">Get personalized help</span>
            </a>
          </div>

          {/* ── CTA ── */}
          <div className="text-center border-t border-[rgba(255,255,255,0.04)] pt-8">
            <h3 className="text-[18px] font-semibold text-[#F0F4F8] mb-3">Ready to start?</h3>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] hover:bg-[#3B82F6] text-white font-semibold text-sm rounded-[10px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(37,99,235,0.25)] active:scale-[0.97]"
            >
              <Zap className="w-4 h-4" />
              Launch Setup Wizard
            </button>
          </div>
        </div>

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </div>
  );
}
