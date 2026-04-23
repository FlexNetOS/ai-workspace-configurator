import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import {
  Link2,
  Save,
  Activity,
  Terminal,
  Settings,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Package,
  HeartPulse,
  Zap,
  Play,
  FileCode,
  Cpu,
  Globe,
  Monitor,
  Container,
  Github,
  Smile,
  Chrome,
  FileText,
  Router,
  Cloud,
  ChevronRight,
  Circle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WizardState {
  currentStep: number;
  completedSteps: number[];
  linkedAccounts: string[];
  checkpoints: { step: number; timestamp: string }[];
}

interface ActivityItem {
  id: string;
  time: string;
  type: "success" | "warning" | "error" | "info";
  message: string;
  source: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function loadWizardState(): WizardState {
  try {
    const raw = localStorage.getItem("workspace_wizard_state");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        currentStep: parsed.currentStep ?? 0,
        completedSteps: parsed.completedSteps ?? [],
        linkedAccounts: parsed.linkedAccounts ?? [],
        checkpoints: parsed.checkpoints ?? [],
      };
    }
  } catch { /* ignore */ }
  return { currentStep: 0, completedSteps: [], linkedAccounts: [], checkpoints: [] };
}

function saveWizardState(state: WizardState) {
  localStorage.setItem("workspace_wizard_state", JSON.stringify(state));
}

function useCountUp(target: number, duration = 1000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.floor(p * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const SYSTEM_HEALTH = {
  docker: { status: "running" as const, version: "v25.0.3" },
  wsl2: { status: "running" as const, distro: "Ubuntu 22.04", kernel: "5.15.133.1" },
  gpu: { status: "detected" as const, name: "NVIDIA RTX 4090", driver: "551.23", vram: "24 GB" },
  ide: { status: "detected" as const, name: "ZED", version: "0.130.0" },
};

const COMPONENTS = [
  "PowerShell 7",
  "Docker Desktop",
  "WSL2",
  "Ubuntu",
  "Zsh",
  "Git",
  "GitHub CLI",
  "HF CLI",
  "llama.cpp",
  "Python",
  "Node.js",
];

const ACTIVITY_FEED: ActivityItem[] = [
  { id: "1", time: "14:32:05", type: "success", message: "Docker Desktop restarted successfully", source: "Dashboard" },
  { id: "2", time: "14:28:33", type: "success", message: "llama.cpp model 'qwen2.5-7b' loaded", source: "Sandbox" },
  { id: "3", time: "14:15:00", type: "warning", message: "WSL memory at 80% — consider increasing limit", source: "System" },
  { id: "4", time: "13:45:22", type: "success", message: "GitHub account reconnected", source: "Accounts" },
  { id: "5", time: "12:00:00", type: "success", message: "Daily health check passed — all green", source: "Auto" },
  { id: "6", time: "11:30:15", type: "success", message: "New model downloaded: llama-3-8b", source: "AI Stack" },
  { id: "7", time: "10:15:03", type: "success", message: "Sandbox environment started", source: "Environments" },
  { id: "8", time: "09:00:00", type: "success", message: "System backup completed", source: "Auto" },
  { id: "9", time: "08:45:12", type: "info", message: "Checkpoint created at step 10", source: "Wizard" },
  { id: "10", time: "08:30:00", type: "success", message: "Step 12 completed — Stack installed", source: "Wizard" },
  { id: "11", time: "08:15:30", type: "success", message: "Docker account linked", source: "Accounts" },
  { id: "12", time: "08:00:00", type: "info", message: "Wizard resumed from step 8", source: "Wizard" },
];

const ACCOUNT_DATA = [
  { key: "github", name: "GitHub", icon: Github, user: "@username", connected: true },
  { key: "docker", name: "Docker Hub", icon: Container, user: "username", connected: true },
  { key: "huggingface", name: "HuggingFace", icon: Smile, user: "@username", connected: true },
  { key: "google", name: "Google", icon: Chrome, user: "email@gmail.com", connected: true },
  { key: "notion", name: "Notion", icon: FileText, user: "workspace", connected: true },
  { key: "openrouter", name: "OpenRouter", icon: Router, user: undefined, connected: false },
  { key: "cloudflare", name: "Cloudflare", icon: Cloud, user: undefined, connected: false },
];

const SPARKLINE_DATA = Array.from({ length: 24 }, () => Math.floor(Math.random() * 40) + 10);

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function CircularProgress({
  percentage,
  size = 56,
  stroke = 4,
  color = "#2563EB",
}: {
  percentage: number;
  size?: number;
  stroke?: number;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

function StatusBadge({ status, text }: { status: "success" | "warning" | "error" | "info" | "neutral"; text: string }) {
  const map = {
    success: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.25)" },
    warning: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.25)" },
    error: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.25)" },
    info: { bg: "rgba(37,99,235,0.1)", text: "#2563EB", border: "rgba(37,99,235,0.25)" },
    neutral: { bg: "rgba(255,255,255,0.04)", text: "#94A3B8", border: "rgba(255,255,255,0.08)" },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {status === "success" && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />}
      {text}
    </span>
  );
}

function MiniSparkline({ data, color = "#2563EB", height = 32 }: { data: number[]; color?: string; height?: number }) {
  const w = 100;
  const h = height;
  const max = Math.max(...data, 100);
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const navigate = useNavigate();
  const [state, setState] = useState<WizardState>(loadWizardState);
  const [e2eRunning, setE2eRunning] = useState(false);
  const [e2eProgress, setE2eProgress] = useState(0);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const activityRef = useRef<HTMLDivElement>(null);

  const completedCount = state.completedSteps.length;
  const hasStarted = completedCount > 0;
  const setupPct = Math.round((completedCount / 15) * 100);
  const linkedCount = state.linkedAccounts.length;
  const systemHealthy = true;

  const animatedPct = useCountUp(setupPct);
  const animatedLinked = useCountUp(linkedCount);
  const animatedPackages = useCountUp(12);
  const animatedHealth = useCountUp(98);

  const handleStartSetup = () => navigate("/");
  const handleViewLogs = () => navigate("/logs");
  const handleOpenSettings = () => navigate("/settings");

  const handleRunE2E = useCallback(() => {
    setE2eRunning(true);
    setE2eProgress(0);
    const interval = setInterval(() => {
      setE2eProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setE2eRunning(false);
          return 100;
        }
        return p + 5;
      });
    }, 150);
  }, []);

  const handleCreateCheckpoint = useCallback(() => {
    const cp = { step: completedCount || 1, timestamp: new Date().toISOString() };
    const next = { ...state, checkpoints: [...state.checkpoints, cp] };
    setState(next);
    saveWizardState(next);
  }, [state, completedCount]);

  /* Auto-save demo state if empty */
  useEffect(() => {
    if (completedCount === 0) {
      const demo: WizardState = {
        currentStep: 13,
        completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        linkedAccounts: ["github", "docker", "huggingface", "google", "notion"],
        checkpoints: [
          { step: 3, timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
          { step: 7, timestamp: new Date(Date.now() - 86400000).toISOString() },
          { step: 10, timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
        ],
      };
      setState(demo);
      saveWizardState(demo);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Empty state */
  if (!hasStarted && completedCount === 0) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="w-full aspect-[3/2] mb-8 rounded-2xl overflow-hidden bg-[#0B1120] border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
            <div className="text-center">
              <Package className="w-16 h-16 text-[#475569] mx-auto mb-4" />
              <p className="text-[#475569] text-sm">dashboard-empty.png</p>
            </div>
          </div>
          <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-tight mb-3">
            Start the Setup Wizard
          </h1>
          <p className="text-[#94A3B8] text-sm mb-8 leading-relaxed">
            Configure your workspace to unlock the dashboard. The wizard will guide you through installing all necessary tools and linking accounts.
          </p>
          <button
            onClick={handleStartSetup}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] hover:bg-[#3B82F6] text-white font-semibold text-sm rounded-[10px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(37,99,235,0.25)] active:scale-[0.97]"
          >
            <Zap className="w-4 h-4" />
            Start Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#020617] text-[#F0F4F8] px-6 py-8">
      <div className="max-w-[1440px] mx-auto space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium text-[#64748B] tracking-wide mb-1">Dashboard / Workspace Overview</p>
            <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-tight leading-tight">Your Workspace</h1>
            <p className="text-[#94A3B8] text-sm mt-1">
              Everything is running smoothly. Last checked: 2 minutes ago.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleViewLogs}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-[#94A3B8] hover:text-[#F0F4F8] hover:bg-[rgba(255,255,255,0.04)] rounded-[10px] text-sm font-medium transition-all border border-transparent hover:border-[rgba(255,255,255,0.08)]"
            >
              <Terminal className="w-4 h-4" />
              View Logs
            </button>
            <button
              onClick={handleOpenSettings}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-transparent border border-[rgba(255,255,255,0.12)] text-[#94A3B8] hover:text-[#F0F4F8] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.18)] rounded-[10px] text-sm font-medium transition-all"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Overall Status */}
          <div className="relative bg-[#0B1120] border border-[rgba(255,255,255,0.04)] rounded-xl p-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#10B981] to-[#06B6D4]" />
            <div className="flex items-start justify-between mb-3">
              <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              <div className="flex items-center gap-2">
                <CircularProgress percentage={animatedPct} size={40} stroke={3} color="#2563EB" />
                <StatusBadge status={systemHealthy ? "success" : "warning"} text={systemHealthy ? "All Good" : "Issues"} />
              </div>
            </div>
            <p className="text-[24px] font-semibold text-[#F0F4F8] leading-tight">
              {completedCount === 15 ? "All Systems Go" : `${15 - completedCount} Remaining`}
            </p>
            <p className="text-[12px] text-[#64748B] mt-1">{completedCount}/15 steps completed</p>
            <div className="flex gap-0.5 mt-3">
              {Array.from({ length: 15 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    i < completedCount ? "bg-gradient-to-r from-[#10B981] to-[#06B6D4]" : "bg-[rgba(255,255,255,0.06)]"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Software Installed */}
          <div className="relative bg-[#0B1120] border border-[rgba(255,255,255,0.04)] rounded-xl p-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#2563EB] to-[#06B6D4]" />
            <div className="flex items-start justify-between mb-3">
              <Package className="w-6 h-6 text-[#2563EB]" />
            </div>
            <p className="text-[24px] font-semibold text-[#F0F4F8]">{animatedPackages} packages</p>
            <p className="text-[12px] text-[#64748B] mt-1">8 running, 4 stopped</p>
            <div className="flex items-center gap-2 mt-3">
              <Container className="w-3.5 h-3.5 text-[#3B82F6]" />
              <Globe className="w-3.5 h-3.5 text-[#10B981]" />
              <Monitor className="w-3.5 h-3.5 text-[#F59E0B]" />
              <FileCode className="w-3.5 h-3.5 text-[#06B6D4]" />
            </div>
          </div>

          {/* Accounts Linked */}
          <div className="relative bg-[#0B1120] border border-[rgba(255,255,255,0.04)] rounded-xl p-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#2563EB] to-[#06B6D4]" />
            <div className="flex items-start justify-between mb-3">
              <Link2 className="w-6 h-6 text-[#2563EB]" />
            </div>
            <p className="text-[24px] font-semibold text-[#F0F4F8]">{animatedLinked} accounts</p>
            <p className="text-[12px] text-[#64748B] mt-1">{Math.max(0, 7 - linkedCount)} not connected</p>
            <div className="flex items-center gap-1.5 mt-3">
              {ACCOUNT_DATA.slice(0, 5).map((a) => (
                <a.icon key={a.key} className={cn("w-4 h-4", a.connected ? "text-[#10B981]" : "text-[#475569]")} />
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="relative bg-[#0B1120] border border-[rgba(255,255,255,0.04)] rounded-xl p-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#10B981] to-[#06B6D4]" />
            <div className="flex items-start justify-between mb-3">
              <HeartPulse className="w-6 h-6 text-[#10B981]" />
              <CircularProgress percentage={animatedHealth} size={36} stroke={3} />
            </div>
            <p className="text-[24px] font-semibold text-[#F0F4F8]">{animatedHealth}%</p>
            <p className="text-[12px] text-[#64748B] mt-1">CPU 12% · RAM 45% · Disk 62%</p>
            <div className="mt-2">
              <MiniSparkline data={SPARKLINE_DATA} color="#10B981" height={24} />
            </div>
          </div>
        </div>

        {/* ── Installed Components + Linked Accounts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.04)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-[#2563EB]" />
              <h2 className="text-[18px] font-semibold text-[#F0F4F8]">Installed Components</h2>
              <span className="ml-auto text-[11px] font-medium text-[#64748B] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 rounded-full">
                {COMPONENTS.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {COMPONENTS.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.25)]"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.04)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="w-5 h-5 text-[#2563EB]" />
              <h2 className="text-[18px] font-semibold text-[#F0F4F8]">Linked Accounts</h2>
              <span className="ml-auto text-[11px] font-medium text-[#64748B] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 rounded-full">
                {linkedCount}/7 connected
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_DATA.map((a) => (
                <div
                  key={a.key}
                  className={cn(
                    "flex items-center gap-2.5 p-2.5 rounded-lg border transition-all",
                    a.connected
                      ? "bg-[rgba(16,185,129,0.04)] border-[rgba(16,185,129,0.15)]"
                      : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.04)] opacity-50"
                  )}
                >
                  <a.icon className={cn("w-5 h-5 shrink-0", a.connected ? "text-[#F0F4F8]" : "text-[#475569]")} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#F0F4F8] truncate">{a.name}</p>
                    <p className="text-[10px] text-[#64748B] truncate">{a.connected ? (a.user ?? "Connected") : "Not linked"}</p>
                  </div>
                  <Circle
                    className={cn(
                      "w-2 h-2 ml-auto shrink-0 rounded-full",
                      a.connected ? "text-[#10B981] fill-[#10B981]" : "text-[#475569] fill-[#475569]"
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── System Health Grid ── */}
        <div>
          <h2 className="text-[18px] font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#2563EB]" />
            System Health
            <span className="inline-flex items-center gap-1 ml-2 text-[10px] font-bold text-[#10B981] bg-[rgba(16,185,129,0.1)] px-2 py-0.5 rounded-full border border-[rgba(16,185,129,0.25)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              LIVE
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Docker */}
            <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Container className="w-5 h-5 text-[#3B82F6]" />
                <span className="text-[14px] font-semibold text-[#F0F4F8]">Docker</span>
                <StatusBadge status="success" text="Running" />
              </div>
              <p className="text-[12px] text-[#64748B]">Version {SYSTEM_HEALTH.docker.version}</p>
              <p className="text-[11px] text-[#475569] mt-1">Engine ready</p>
            </div>

            {/* WSL2 */}
            <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-[#10B981]" />
                <span className="text-[14px] font-semibold text-[#F0F4F8]">WSL2</span>
                <StatusBadge status="success" text="Running" />
              </div>
              <p className="text-[12px] text-[#64748B]">{SYSTEM_HEALTH.wsl2.distro}</p>
              <p className="text-[11px] text-[#475569] mt-1">Kernel {SYSTEM_HEALTH.wsl2.kernel}</p>
            </div>

            {/* GPU */}
            <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-5 h-5 text-[#F59E0B]" />
                <span className="text-[14px] font-semibold text-[#F0F4F8]">GPU</span>
                <StatusBadge status="success" text="Detected" />
              </div>
              <p className="text-[12px] text-[#64748B]">{SYSTEM_HEALTH.gpu.name}</p>
              <p className="text-[11px] text-[#475569] mt-1">Driver {SYSTEM_HEALTH.gpu.driver} · {SYSTEM_HEALTH.gpu.vram} VRAM</p>
            </div>

            {/* IDE */}
            <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="w-5 h-5 text-[#06B6D4]" />
                <span className="text-[14px] font-semibold text-[#F0F4F8]">IDE</span>
                <StatusBadge status="success" text="Active" />
              </div>
              <p className="text-[12px] text-[#64748B]">{SYSTEM_HEALTH.ide.name}</p>
              <p className="text-[11px] text-[#475569] mt-1">v{SYSTEM_HEALTH.ide.version}</p>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.04)] rounded-xl p-5">
          <h2 className="text-[18px] font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#F59E0B]" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={handleRunE2E}
              disabled={e2eRunning}
              className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-[rgba(37,99,235,0.08)] border border-[rgba(37,99,235,0.15)] hover:border-[rgba(37,99,235,0.35)] hover:bg-[rgba(37,99,235,0.12)] transition-all group disabled:opacity-60"
            >
              <Play className="w-5 h-5 text-[#2563EB] group-hover:scale-110 transition-transform" />
              <span className="text-[13px] font-medium text-[#F0F4F8]">
                {e2eRunning ? `Running ${e2eProgress}%` : "Run E2E Tests"}
              </span>
            </button>
            <button
              onClick={handleCreateCheckpoint}
              className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] hover:border-[rgba(16,185,129,0.35)] hover:bg-[rgba(16,185,129,0.12)] transition-all group"
            >
              <Save className="w-5 h-5 text-[#10B981] group-hover:scale-110 transition-transform" />
              <span className="text-[13px] font-medium text-[#F0F4F8]">Create Checkpoint</span>
            </button>
            <button
              onClick={handleViewLogs}
              className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-[rgba(6,182,212,0.08)] border border-[rgba(6,182,212,0.15)] hover:border-[rgba(6,182,212,0.35)] hover:bg-[rgba(6,182,212,0.12)] transition-all group"
            >
              <Terminal className="w-5 h-5 text-[#06B6D4] group-hover:scale-110 transition-transform" />
              <span className="text-[13px] font-medium text-[#F0F4F8]">View Logs</span>
            </button>
            <button
              onClick={handleOpenSettings}
              className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.06)] transition-all group"
            >
              <Settings className="w-5 h-5 text-[#94A3B8] group-hover:scale-110 transition-transform" />
              <span className="text-[13px] font-medium text-[#F0F4F8]">Open Settings</span>
            </button>
          </div>
          {e2eRunning && (
            <div className="mt-3 h-1 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4] rounded-full transition-all duration-150"
                style={{ width: `${e2eProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* ── Activity Feed ── */}
        <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.04)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-semibold text-[#F0F4F8] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#2563EB]" />
              Recent Activity
            </h2>
            <button
              onClick={() => setShowAllActivity(!showAllActivity)}
              className="text-[12px] text-[#2563EB] hover:text-[#3B82F6] font-medium flex items-center gap-1 transition-colors"
            >
              {showAllActivity ? "Show Less" : "View All"}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div
            ref={activityRef}
            className="space-y-1 max-h-[320px] overflow-y-auto pr-1"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}
          >
            {(showAllActivity ? ACTIVITY_FEED : ACTIVITY_FEED.slice(0, 6)).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.02)] transition-colors"
              >
                <span className="text-[10px] font-mono font-bold text-[#475569] w-[52px] shrink-0">{item.time}</span>
                {item.type === "success" && <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />}
                {item.type === "warning" && <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />}
                {item.type === "error" && <XCircle className="w-4 h-4 text-[#EF4444] shrink-0" />}
                {item.type === "info" && <Activity className="w-4 h-4 text-[#2563EB] shrink-0" />}
                <span className="text-[13px] text-[#94A3B8] flex-1 min-w-0">{item.message}</span>
                <span className="text-[10px] text-[#475569] shrink-0">{item.source}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom padding ── */}
        <div className="h-4" />
      </div>
    </div>
  );
}
