import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  Download,
  Copy,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Monitor,
  Zap,
  Container,
  Globe,
  Cpu,
  Save,
  FileCode,
  ChevronDown,
  ChevronUp,
  Filter,
  Check,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type LogLevel = "INFO" | "SUCCESS" | "WARN" | "ERROR" | "DEBUG";
type LogSource = "all" | "wizard" | "system" | "docker" | "wsl" | "network" | "hardware" | "tests";

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source: string;
}

interface Artifact {
  name: string;
  size: string;
  desc: string;
  icon: React.ElementType;
  color: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const LEVEL_COLORS: Record<LogLevel, { bg: string; text: string; border: string }> = {
  INFO: { bg: "rgba(37,99,235,0.1)", text: "#2563EB", border: "rgba(37,99,235,0.25)" },
  SUCCESS: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.25)" },
  WARN: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.25)" },
  ERROR: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.25)" },
  DEBUG: { bg: "rgba(255,255,255,0.04)", text: "#94A3B8", border: "rgba(255,255,255,0.08)" },
};

const LOG_SOURCES: { key: LogSource; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "All", icon: Filter },
  { key: "wizard", label: "Wizard", icon: Zap },
  { key: "system", label: "System", icon: Monitor },
  { key: "docker", label: "Docker", icon: Container },
  { key: "wsl", label: "WSL", icon: Globe },
  { key: "network", label: "Network", icon: FileCode },
  { key: "hardware", label: "Hardware", icon: Cpu },
  { key: "tests", label: "Tests", icon: CheckCircle2 },
];

const ARTIFACTS: Artifact[] = [
  { name: "setup_host.ps1", size: "12.4 KB", desc: "Windows setup script", icon: FileCode, color: "#3B82F6" },
  { name: "setup_host.sh", size: "8.1 KB", desc: "Linux setup script", icon: FileCode, color: "#10B981" },
  { name: "workspace-config.json", size: "4.2 KB", desc: "Full configuration export", icon: FileCode, color: "#F59E0B" },
  { name: "checkpoint-step-3.json", size: "2.8 KB", desc: "Rollback checkpoint", icon: Save, color: "#06B6D4" },
  { name: "hardware-inventory.json", size: "6.5 KB", desc: "Hardware discovery results", icon: Cpu, color: "#8B5CF6" },
  { name: "e2e-test-results.json", size: "3.1 KB", desc: "Test results", icon: CheckCircle2, color: "#10B981" },
];

const MOCK_LOGS: LogEntry[] = [
  { id: "1", timestamp: "2025-01-15 08:00:00", level: "INFO", message: "App initialized · v3.0.0", source: "system" },
  { id: "2", timestamp: "2025-01-15 08:00:02", level: "INFO", message: "Windows 11 Pro 23H2 (22631.3155) detected", source: "system" },
  { id: "3", timestamp: "2025-01-15 08:00:03", level: "INFO", message: "CPU: Intel Core i9-14900K, 24 cores", source: "hardware" },
  { id: "4", timestamp: "2025-01-15 08:00:04", level: "SUCCESS", message: "GPU: NVIDIA RTX 4090 (24GB VRAM)", source: "hardware" },
  { id: "5", timestamp: "2025-01-15 08:00:05", level: "SUCCESS", message: "Running with Administrator privileges", source: "system" },
  { id: "6", timestamp: "2025-01-15 08:00:10", level: "INFO", message: "Step 1 started: Welcome & Overview", source: "wizard" },
  { id: "7", timestamp: "2025-01-15 08:00:15", level: "SUCCESS", message: "Step 1 completed · advancing to Step 2", source: "wizard" },
  { id: "8", timestamp: "2025-01-15 08:00:20", level: "INFO", message: "Step 2 started: System Requirements Check", source: "wizard" },
  { id: "9", timestamp: "2025-01-15 08:00:45", level: "SUCCESS", message: "All system requirements met", source: "wizard" },
  { id: "10", timestamp: "2025-01-15 08:00:46", level: "SUCCESS", message: "Step 2 completed · advancing to Step 3", source: "wizard" },
  { id: "11", timestamp: "2025-01-15 08:01:00", level: "INFO", message: "Step 3 started: Create Rollback Checkpoint", source: "wizard" },
  { id: "12", timestamp: "2025-01-15 08:01:05", level: "SUCCESS", message: "Checkpoint created at step 3", source: "wizard" },
  { id: "13", timestamp: "2025-01-15 08:01:30", level: "INFO", message: "Step 4 started: Windows Security Setup", source: "wizard" },
  { id: "14", timestamp: "2025-01-15 08:02:00", level: "INFO", message: "Configuring UAC level", source: "system" },
  { id: "15", timestamp: "2025-01-15 08:02:30", level: "SUCCESS", message: "UAC configured successfully", source: "system" },
  { id: "16", timestamp: "2025-01-15 08:02:45", level: "WARN", message: "Windows Defender exclusion already exists", source: "system" },
  { id: "17", timestamp: "2025-01-15 08:03:00", level: "SUCCESS", message: "Step 4 completed · advancing to Step 5", source: "wizard" },
  { id: "18", timestamp: "2025-01-15 08:03:30", level: "INFO", message: "Step 5 started: Install PowerShell 7", source: "wizard" },
  { id: "19", timestamp: "2025-01-15 08:04:00", level: "INFO", message: "Downloading PowerShell 7.4.2...", source: "wizard" },
  { id: "20", timestamp: "2025-01-15 08:04:45", level: "SUCCESS", message: "PowerShell 7.4.2 installed", source: "wizard" },
  { id: "21", timestamp: "2025-01-15 08:05:00", level: "INFO", message: "Step 6 started: Windows Updates", source: "wizard" },
  { id: "22", timestamp: "2025-01-15 08:05:30", level: "WARN", message: "Optional update KB5034441 available", source: "system" },
  { id: "23", timestamp: "2025-01-15 08:06:00", level: "SUCCESS", message: "Critical updates installed", source: "system" },
  { id: "24", timestamp: "2025-01-15 08:06:30", level: "INFO", message: "Step 7 started: Hardware Detection", source: "wizard" },
  { id: "25", timestamp: "2025-01-15 08:06:35", level: "INFO", message: "Scanning PCI devices...", source: "hardware" },
  { id: "26", timestamp: "2025-01-15 08:06:40", level: "SUCCESS", message: "Hardware inventory complete", source: "hardware" },
  { id: "27", timestamp: "2025-01-15 08:07:00", level: "INFO", message: "Step 8 started: Network Configuration", source: "wizard" },
  { id: "28", timestamp: "2025-01-15 08:07:15", level: "INFO", message: "WSL network mode: mirrored", source: "network" },
  { id: "29", timestamp: "2025-01-15 08:07:30", level: "SUCCESS", message: "Port forwarding rules applied", source: "network" },
  { id: "30", timestamp: "2025-01-15 08:08:00", level: "INFO", message: "Step 9 started: Account Linking", source: "wizard" },
  { id: "31", timestamp: "2025-01-15 08:08:10", level: "INFO", message: "Initiating GitHub OAuth flow...", source: "tests" },
  { id: "32", timestamp: "2025-01-15 08:08:25", level: "SUCCESS", message: "GitHub connected · @username", source: "tests" },
  { id: "33", timestamp: "2025-01-15 08:08:40", level: "SUCCESS", message: "Docker Hub connected · username", source: "tests" },
  { id: "34", timestamp: "2025-01-15 08:09:00", level: "SUCCESS", message: "HuggingFace connected · @username", source: "tests" },
  { id: "35", timestamp: "2025-01-15 08:10:00", level: "INFO", message: "Step 10 started: Install WSL2", source: "wizard" },
  { id: "36", timestamp: "2025-01-15 08:10:30", level: "INFO", message: "WSL2 kernel version: 5.15.133.1", source: "wsl" },
  { id: "37", timestamp: "2025-01-15 08:11:00", level: "SUCCESS", message: "Ubuntu 22.04 started", source: "wsl" },
  { id: "38", timestamp: "2025-01-15 08:12:00", level: "INFO", message: "Step 11 started: Install Docker Desktop", source: "wizard" },
  { id: "39", timestamp: "2025-01-15 08:12:30", level: "INFO", message: "Docker Desktop starting...", source: "docker" },
  { id: "40", timestamp: "2025-01-15 08:13:00", level: "SUCCESS", message: "Docker engine ready · v25.0.3", source: "docker" },
  { id: "41", timestamp: "2025-01-15 08:13:30", level: "INFO", message: "Pulling image nvidia/cuda:12.3.1-devel-ubuntu22.04", source: "docker" },
  { id: "42", timestamp: "2025-01-15 08:15:00", level: "SUCCESS", message: "Step 11 completed · advancing to Step 12", source: "wizard" },
  { id: "43", timestamp: "2025-01-15 08:15:30", level: "INFO", message: "Step 12 started: Install AI Stack", source: "wizard" },
  { id: "44", timestamp: "2025-01-15 08:16:00", level: "INFO", message: "Installing llama.cpp...", source: "wizard" },
  { id: "45", timestamp: "2025-01-15 08:17:00", level: "SUCCESS", message: "llama.cpp installed · b2800", source: "wizard" },
  { id: "46", timestamp: "2025-01-15 08:17:30", level: "INFO", message: "Downloading model: qwen2.5-7b", source: "wizard" },
  { id: "47", timestamp: "2025-01-15 08:20:00", level: "SUCCESS", message: "Model loaded successfully", source: "wizard" },
  { id: "48", timestamp: "2025-01-15 08:20:30", level: "WARN", message: "WSL memory at 80% — consider increasing limit", source: "wsl" },
  { id: "49", timestamp: "2025-01-15 08:21:00", level: "ERROR", message: "Docker service hiccup — auto-recovered", source: "docker" },
  { id: "50", timestamp: "2025-01-15 08:21:30", level: "SUCCESS", message: "Docker Desktop restarted successfully", source: "docker" },
  { id: "51", timestamp: "2025-01-15 08:22:00", level: "INFO", message: "Step 13 started: Configure IDE", source: "wizard" },
  { id: "52", timestamp: "2025-01-15 08:22:30", level: "INFO", message: "Installing Zed IDE...", source: "wizard" },
  { id: "53", timestamp: "2025-01-15 08:23:00", level: "SUCCESS", message: "ZED v0.130.0 installed", source: "wizard" },
  { id: "54", timestamp: "2025-01-15 08:25:00", level: "SUCCESS", message: "Daily health check passed — all green", source: "tests" },
  { id: "55", timestamp: "2025-01-15 08:30:00", level: "INFO", message: "Sandbox environment started on port 8888", source: "wizard" },
  { id: "56", timestamp: "2025-01-15 09:00:00", level: "SUCCESS", message: "System backup completed", source: "system" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function LevelIcon({ level }: { level: LogLevel }) {
  switch (level) {
    case "SUCCESS": return <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />;
    case "WARN": return <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />;
    case "ERROR": return <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />;
    case "DEBUG": return <Info className="w-3.5 h-3.5 text-[#94A3B8]" />;
    default: return <Info className="w-3.5 h-3.5 text-[#2563EB]" />;
  }
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Logs() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | LogLevel>("all");
  const [source, setSource] = useState<LogSource>("all");
  const [expandedArtifact, setExpandedArtifact] = useState(true);
  const [copiedArtifact, setCopiedArtifact] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  /* Filter logs */
  const filtered = MOCK_LOGS.filter((log) => {
    const matchSearch = !search || log.message.toLowerCase().includes(search.toLowerCase()) || log.timestamp.includes(search);
    const matchFilter = filter === "all" || log.level === filter;
    const matchSource = source === "all" || log.source === source;
    return matchSearch && matchFilter && matchSource;
  });

  /* Stats */
  const total = filtered.length;
  const warnings = filtered.filter((l) => l.level === "WARN").length;
  const errors = filtered.filter((l) => l.level === "ERROR").length;
  const infoCount = filtered.filter((l) => l.level === "INFO").length;

  /* Auto-scroll */
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filtered, autoScroll]);

  /* Handle scroll to toggle auto-scroll */
  const handleScroll = useCallback(() => {
    if (!logsContainerRef.current) return;
    const el = logsContainerRef.current;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setAutoScroll(nearBottom);
  }, []);

  const handleExport = useCallback(() => {
    const text = filtered.map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workspace-logs.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const handleCopyArtifact = useCallback((name: string) => {
    navigator.clipboard.writeText(`Download: ${name}`);
    setCopiedArtifact(name);
    setTimeout(() => setCopiedArtifact(null), 2000);
  }, []);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#020617] text-[#F0F4F8] px-6 py-8 flex flex-col">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col flex-1 gap-4">

        {/* ── Header ── */}
        <div>
          <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-tight mb-1">Logs & Artifacts</h1>
          <p className="text-[#94A3B8] text-sm">Terminal output, execution logs, and downloadable artifacts</p>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg pl-9 pr-3 py-2 text-[13px] text-[#F0F4F8] placeholder:text-[#475569] outline-none focus:border-[#2563EB] transition-colors"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | LogLevel)}
            className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-[#F0F4F8] text-[13px] rounded-lg px-3 py-2 outline-none focus:border-[#2563EB]"
          >
            <option value="all">All Levels</option>
            <option value="INFO">Info</option>
            <option value="SUCCESS">Success</option>
            <option value="WARN">Warning</option>
            <option value="ERROR">Error</option>
            <option value="DEBUG">Debug</option>
          </select>

          <div className="flex gap-1">
            {LOG_SOURCES.map((s) => (
              <button
                key={s.key}
                onClick={() => setSource(s.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                  source === s.key
                    ? "bg-[rgba(37,99,235,0.12)] text-[#2563EB] border border-[rgba(37,99,235,0.3)]"
                    : "bg-[rgba(255,255,255,0.03)] text-[#64748B] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
                )}
              >
                <s.icon className="w-3 h-3" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-[#94A3B8] border border-[rgba(255,255,255,0.12)] rounded-lg hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.18)] transition-all ml-auto"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>

        {/* ── Terminal ── */}
        <div className="flex-1 min-h-0 bg-[#050A18] border border-[rgba(255,255,255,0.05)] rounded-xl overflow-hidden flex flex-col">
          {/* Terminal top bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[rgba(255,255,255,0.05)]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            </div>
            <span className="text-[11px] text-[#475569] ml-2 font-mono">
              {source === "all" ? "All Sources" : source.charAt(0).toUpperCase() + source.slice(1)} — {total} entries
            </span>
          </div>

          {/* Log lines */}
          <div
            ref={logsContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-2 font-mono text-[12px] leading-[1.6]"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}
          >
            {filtered.map((log) => {
              const colors = LEVEL_COLORS[log.level];
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-2 px-2 py-1 rounded hover:bg-[rgba(255,255,255,0.02)] transition-colors group"
                >
                  <span className="text-[#475569] shrink-0 w-[130px] text-right">[{log.timestamp}]</span>
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                    style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                  >
                    <LevelIcon level={log.level} />
                    {log.level}
                  </span>
                  <span
                    className={cn(
                      "flex-1 break-all",
                      log.level === "ERROR" && "text-[#EF4444]",
                      log.level === "WARN" && "text-[#F59E0B]",
                      log.level === "SUCCESS" && "text-[#10B981]",
                      log.level === "INFO" && "text-[#F0F4F8]",
                      log.level === "DEBUG" && "text-[#94A3B8]",
                    )}
                  >
                    {log.message}
                  </span>
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#475569] hover:text-[#F0F4F8] hover:bg-[rgba(255,255,255,0.04)] transition-all shrink-0"
                    onClick={() => navigator.clipboard.writeText(`[${log.timestamp}] [${log.level}] ${log.message}`)}
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-[rgba(255,255,255,0.05)] text-[11px] text-[#64748B]">
            <span>Total: <strong className="text-[#F0F4F8]">{total}</strong></span>
            <span>Info: <strong className="text-[#2563EB]">{infoCount}</strong></span>
            <span>Warnings: <strong className="text-[#F59E0B]">{warnings}</strong></span>
            <span>Errors: <strong className="text-[#EF4444]">{errors}</strong></span>
            <div className="ml-auto flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>Live</span>
            </div>
          </div>
        </div>

        {/* ── Artifacts Panel ── */}
        <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.04)] rounded-xl overflow-hidden">
          <button
            onClick={() => setExpandedArtifact(!expandedArtifact)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[14px] font-semibold text-[#F0F4F8]">Generated Artifacts</span>
              <span className="text-[11px] text-[#64748B] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 rounded-full">{ARTIFACTS.length}</span>
            </div>
            {expandedArtifact ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
          </button>
          {expandedArtifact && (
            <div className="px-5 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ARTIFACTS.map((a) => (
                  <div
                    key={a.name}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#050A18] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.08)] transition-all group"
                  >
                    <a.icon className="w-5 h-5 shrink-0" style={{ color: a.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-mono text-[#F0F4F8] truncate">{a.name}</p>
                      <p className="text-[11px] text-[#475569]">{a.size} · {a.desc}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopyArtifact(a.name)}
                        className="p-1.5 rounded-md text-[#475569] hover:text-[#F0F4F8] hover:bg-[rgba(255,255,255,0.04)] transition-all"
                      >
                        {copiedArtifact === a.name ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button className="p-1.5 rounded-md text-[#475569] hover:text-[#F0F4F8] hover:bg-[rgba(255,255,255,0.04)] transition-all">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </div>
  );
}
