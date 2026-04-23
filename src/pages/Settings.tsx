import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import useWizardStore, { isLinkedAccountStatus } from "@/store/wizardStore";
import {
  Settings as SettingsIcon,
  Users,
  Shield,
  Bell,
  SlidersHorizontal,
  Moon,
  Sun,
  Monitor,
  Globe,
  Check,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  Github,
  Container,
  Smile,
  Chrome,
  FileText,
  Router,
  Cloud,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Save,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TabId = "general" | "accounts" | "apikeys" | "security" | "notifications" | "advanced";

interface ApiKeyField {
  name: string;
  env: string;
  value: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "accounts", label: "Accounts", icon: Users },
  { id: "apikeys", label: "API Keys", icon: Shield },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "advanced", label: "Advanced", icon: SlidersHorizontal },
];

const ACCOUNTS = [
  { key: "github", name: "GitHub", icon: Github, color: "#F0F4F8" },
  { key: "docker", name: "Docker", icon: Container, color: "#3B82F6" },
  { key: "huggingface", name: "HuggingFace", icon: Smile, color: "#F59E0B" },
  { key: "openrouter", name: "OpenRouter", icon: Router, color: "#8B5CF6" },
  { key: "notion", name: "Notion", icon: FileText, color: "#F0F4F8" },
  { key: "google", name: "Google", icon: Chrome, color: "#10B981" },
  { key: "cloudflare", name: "Cloudflare", icon: Cloud, color: "#F97316" },
];

const DEFAULT_API_KEYS: ApiKeyField[] = [
  { name: "Gemini API Key", env: "GEMINI_API_KEY", value: "" },
  { name: "OpenAI API Key", env: "OPENAI_API_KEY", value: "" },
  { name: "GitHub Token", env: "GITHUB_TOKEN", value: "" },
  { name: "HuggingFace Token", env: "HF_TOKEN", value: "" },
  { name: "Docker Token", env: "DOCKER_TOKEN", value: "" },
  { name: "Cloudflare API Key", env: "CLOUDFLARE_API_KEY", value: "" },
];

function loadApiKeys(): ApiKeyField[] {
  try {
    const raw = localStorage.getItem("workspace_api_keys");
    if (raw) {
      const parsed = JSON.parse(raw);
      return DEFAULT_API_KEYS.map((k) => ({ ...k, value: parsed[k.env] ?? "" }));
    }
  } catch { /* ignore */ }
  return DEFAULT_API_KEYS;
}

function saveApiKeys(keys: ApiKeyField[]) {
  const obj: Record<string, string> = {};
  keys.forEach((k) => (obj[k.env] = k.value));
  localStorage.setItem("workspace_api_keys", JSON.stringify(obj));
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-[rgba(255,255,255,0.04)] last:border-0">
      <div className="flex-1 min-w-0">
        <h3 className="text-[14px] font-semibold text-[#F0F4F8]">{title}</h3>
        {description && <p className="text-[13px] text-[#64748B] mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0B1120] border border-[rgba(255,255,255,0.04)] rounded-xl p-5 mb-4">
      <h3 className="text-[16px] font-semibold text-[#F0F4F8] mb-1">{title}</h3>
      {description && <p className="text-[13px] text-[#64748B] mb-4">{description}</p>}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: General                                                       */
/* ------------------------------------------------------------------ */

function GeneralTab() {
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [autoSave, setAutoSave] = useState(true);
  const [resumeStartup, setResumeStartup] = useState(true);

  return (
    <div>
      <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-tight mb-1">General Settings</h1>
      <p className="text-[#94A3B8] text-sm mb-6">App preferences and display options</p>

      <SectionCard title="Appearance" description="Choose how the app looks.">
        <div className="grid grid-cols-3 gap-3">
          {(["dark", "light", "system"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                theme === t
                  ? "border-[#2563EB] bg-[rgba(37,99,235,0.08)]"
                  : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.14)]"
              )}
            >
              {t === "dark" && <Moon className="w-5 h-5 text-[#94A3B8]" />}
              {t === "light" && <Sun className="w-5 h-5 text-[#F59E0B]" />}
              {t === "system" && <Monitor className="w-5 h-5 text-[#64748B]" />}
              <span className="text-[13px] font-medium text-[#F0F4F8] capitalize">{t}</span>
              {theme === t && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Language" description="Interface language.">
        <div className="flex items-center gap-3">
          <Globe className="w-4 h-4 text-[#64748B]" />
          <select
            className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-[#F0F4F8] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#2563EB]"
            defaultValue="en"
          >
            <option value="en">English (US)</option>
            <option value="es" disabled>Español (soon)</option>
            <option value="fr" disabled>Français (soon)</option>
          </select>
        </div>
      </SectionCard>

      <SectionCard title="Auto-Save & Startup">
        <SettingRow title="Auto-Save Progress" description="Automatically save wizard progress every 30 seconds.">
          <Switch checked={autoSave} onCheckedChange={setAutoSave} />
        </SettingRow>
        <SettingRow title="Resume on Startup" description="Automatically resume the wizard where you left off.">
          <Switch checked={resumeStartup} onCheckedChange={setResumeStartup} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Updates">
        <SettingRow title="Check for Updates" description="Manually check if a new version is available.">
          <button className="px-4 py-2 text-sm font-medium text-[#94A3B8] border border-[rgba(255,255,255,0.12)] rounded-lg hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.18)] transition-all">
            Check Now
          </button>
        </SettingRow>
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Accounts                                                      */
/* ------------------------------------------------------------------ */

function AccountsTab() {
  const linkedAccounts = useWizardStore((s) => s.linkedAccounts);
  const setAccountStatus = useWizardStore((s) => s.setAccountStatus);

  const getAccountStatusLabel = useCallback((status: string) => {
    if (status === "real_linked") return "Real OAuth linked";
    if (status === "synthetic_linked") return "Synthetic continuity linked";
    if (status === "synthetic_pending") return "Synthetic link pending";
    if (status === "failed") return "Link failed";
    return "Not linked";
  }, []);

  return (
    <div>
      <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-tight mb-1">Connected Accounts</h1>
      <p className="text-[#94A3B8] text-sm mb-6">Manage synthetic continuity links and real OAuth upgrades</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ACCOUNTS.map((acct) => {
          const account = linkedAccounts.find((a) => a.id === acct.key);
          const isLinked = account ? isLinkedAccountStatus(account.status) : false;
          return (
            <div
              key={acct.key}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all",
                isLinked
                  ? "bg-[rgba(16,185,129,0.04)] border-[rgba(16,185,129,0.15)]"
                  : "bg-[#0B1120] border-[rgba(255,255,255,0.04)]"
              )}
            >
              <acct.icon className="w-8 h-8 shrink-0" style={{ color: acct.color, opacity: isLinked ? 1 : 0.4 }} />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#F0F4F8]">{acct.name}</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  {account ? getAccountStatusLabel(account.status) : "Not linked"}
                </p>
              </div>
              <button
                onClick={() => {
                  if (!account) return;
                  if (isLinked || account.status === "synthetic_pending") {
                    setAccountStatus(account.id, "disconnected");
                    return;
                  }
                  const syntheticRef = account.authRef ?? `syn_${account.id}_${Math.random().toString(36).slice(2, 10)}`;
                  setAccountStatus(account.id, "synthetic_linked", {
                    authKind: "synthetic",
                    authRef: syntheticRef,
                    lastLinkedAt: new Date().toISOString(),
                    lastError: undefined,
                  });
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all",
                  isLinked
                    ? "text-[#EF4444] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.2)]"
                    : "text-[#2563EB] bg-[rgba(37,99,235,0.1)] border border-[rgba(37,99,235,0.2)] hover:bg-[rgba(37,99,235,0.2)]"
                )}
              >
                {isLinked || account?.status === "synthetic_pending" ? "Disconnect" : "Link Synthetic"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: API Keys                                                      */
/* ------------------------------------------------------------------ */

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKeyField[]>(loadApiKeys);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const updateKey = useCallback((env: string, value: string) => {
    setKeys((prev) => {
      const next = prev.map((k) => (k.env === env ? { ...k, value } : k));
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    saveApiKeys(keys);
  }, [keys]);

  const handleCopy = useCallback((env: string, value: string) => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(env);
      setTimeout(() => setCopied(null), 2000);
    }
  }, []);

  return (
    <div>
      <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-tight mb-1">API Keys</h1>
      <p className="text-[#94A3B8] text-sm mb-6">Manage provider API keys separately from synthetic account status tokens</p>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgba(37,99,235,0.08)] border border-[rgba(37,99,235,0.15)] mb-6">
        <Shield className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
        <p className="text-[13px] text-[#94A3B8]">
          API keys are local configuration values. Synthetic continuity tokens are not API secrets and are managed in the Accounts tab.
        </p>
      </div>

      <div className="space-y-3">
        {keys.map((k) => (
          <div key={k.env} className="bg-[#0B1120] border border-[rgba(255,255,255,0.04)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[14px] font-semibold text-[#F0F4F8]">{k.name}</p>
                <p className="text-[11px] text-[#475569] font-mono mt-0.5">{k.env}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setVisible((v) => ({ ...v, [k.env]: !v[k.env] }))}
                  className="p-2 rounded-lg text-[#64748B] hover:text-[#F0F4F8] hover:bg-[rgba(255,255,255,0.04)] transition-all"
                >
                  {visible[k.env] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleCopy(k.env, k.value)}
                  className="p-2 rounded-lg text-[#64748B] hover:text-[#F0F4F8] hover:bg-[rgba(255,255,255,0.04)] transition-all"
                >
                  {copied === k.env ? <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <input
              type={visible[k.env] ? "text" : "password"}
              value={k.value}
              onChange={(e) => updateKey(k.env, e.target.value)}
              placeholder={`Enter ${k.name}`}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-[13px] text-[#F0F4F8] placeholder:text-[#475569] outline-none focus:border-[#2563EB] font-mono transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#3B82F6] text-white font-semibold text-sm rounded-[10px] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(37,99,235,0.25)] active:scale-[0.97]"
        >
          <Save className="w-4 h-4" />
          Save Keys
        </button>
        <span className="text-[12px] text-[#475569]">Stored in localStorage only</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Security                                                      */
/* ------------------------------------------------------------------ */

function SecurityTab() {
  const [uacLevel, setUacLevel] = useState([2]);
  const [defenderExclusion, setDefenderExclusion] = useState(true);
  const [firewallRule, setFirewallRule] = useState(true);
  const [encryptSecrets, setEncryptSecrets] = useState(true);
  const [shareMetrics, setShareMetrics] = useState(false);

  return (
    <div>
      <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-tight mb-1">Security Settings</h1>
      <p className="text-[#94A3B8] text-sm mb-6">Permissions, privacy, and protection options</p>

      <SectionCard title="UAC Level" description="Windows User Account Control setting.">
        <div className="px-1">
          <Slider value={uacLevel} onValueChange={setUacLevel} max={3} step={1} className="my-4" />
          <div className="flex justify-between text-[11px] text-[#64748B]">
            <span>Never notify</span>
            <span>Default</span>
            <span>Always notify</span>
          </div>
          <p className="text-[12px] text-[#94A3B8] mt-2">
            Current: {uacLevel[0] === 0 ? "Never notify" : uacLevel[0] === 1 ? "Notify only" : uacLevel[0] === 2 ? "Default" : "Always notify"}
          </p>
        </div>
      </SectionCard>

      <SectionCard title="System Protection">
        <SettingRow title="Windows Defender Exclusion" description="Add setup folders to Defender exclusions for faster installs.">
          <Switch checked={defenderExclusion} onCheckedChange={setDefenderExclusion} />
        </SettingRow>
        <SettingRow title="Firewall Rule" description="Auto-configure Windows Firewall rules for WSL and Docker.">
          <Switch checked={firewallRule} onCheckedChange={setFirewallRule} />
        </SettingRow>
        <SettingRow title="Protect Local API Keys" description="Store API keys only on this device. Synthetic continuity tokens are non-secret metadata.">
          <Switch checked={encryptSecrets} onCheckedChange={setEncryptSecrets} />
        </SettingRow>
        <SettingRow title="Share Anonymous Metrics" description="Help improve by sharing anonymous usage data. No personal info.">
          <Switch checked={shareMetrics} onCheckedChange={setShareMetrics} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Danger Zone">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-[14px] font-semibold text-[#EF4444]">Reset Security Settings</h3>
            <p className="text-[13px] text-[#64748B] mt-0.5">Restore all security settings to their defaults.</p>
          </div>
          <button className="px-4 py-2 text-sm font-semibold text-[#EF4444] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg hover:bg-[rgba(239,68,68,0.2)] transition-all flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Notifications                                                 */
/* ------------------------------------------------------------------ */

function NotificationsTab() {
  const [stepComplete, setStepComplete] = useState(true);
  const [errorAlerts, setErrorAlerts] = useState(true);
  const [updateNotifs, setUpdateNotifs] = useState(true);
  const [toastDuration, setToastDuration] = useState<3 | 6 | 10>(6);
  const [dnd, setDnd] = useState(false);

  return (
    <div>
      <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-tight mb-1">Notification Preferences</h1>
      <p className="text-[#94A3B8] text-sm mb-6">Control how and when you get notified</p>

      <SectionCard title="Notification Types">
        <SettingRow title="Step Completion Notifications" description="Get notified when a wizard step finishes.">
          <Switch checked={stepComplete} onCheckedChange={setStepComplete} />
        </SettingRow>
        <SettingRow title="Error Alerts" description="Show alerts for errors and failures during setup.">
          <Switch checked={errorAlerts} onCheckedChange={setErrorAlerts} />
        </SettingRow>
        <SettingRow title="Update Notifications" description="Notify when software updates are available.">
          <Switch checked={updateNotifs} onCheckedChange={setUpdateNotifs} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Toast Duration">
        <p className="text-[13px] text-[#64748B] mb-3">How long notification toasts stay visible.</p>
        <div className="flex gap-2">
          {([3, 6, 10] as const).map((d) => (
            <button
              key={d}
              onClick={() => setToastDuration(d)}
              className={cn(
                "px-4 py-2 rounded-lg text-[13px] font-medium transition-all",
                toastDuration === d
                  ? "bg-[rgba(37,99,235,0.12)] text-[#2563EB] border border-[rgba(37,99,235,0.3)]"
                  : "bg-[rgba(255,255,255,0.03)] text-[#94A3B8] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.14)]"
              )}
            >
              {d}s
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Do Not Disturb">
        <SettingRow title="Enable Do Not Disturb" description="Pause all non-critical notifications.">
          <Switch checked={dnd} onCheckedChange={setDnd} />
        </SettingRow>
        {dnd && (
          <div className="mt-3 flex items-center gap-3 text-[13px] text-[#94A3B8]">
            <span>From</span>
            <input type="time" defaultValue="22:00" className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-[#F0F4F8]" />
            <span>to</span>
            <input type="time" defaultValue="08:00" className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg px-2 py-1 text-[#F0F4F8]" />
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab: Advanced                                                      */
/* ------------------------------------------------------------------ */

function AdvancedTab() {
  const [logLevel, setLogLevel] = useState<"debug" | "info" | "warn" | "error">("info");
  const [parallelJobs, setParallelJobs] = useState([4]);
  const [timeout, setTimeout] = useState("30");
  const [devMode, setDevMode] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = useCallback(() => {
    localStorage.removeItem("workspace_wizard_state");
    localStorage.removeItem("workspace_api_keys");
    setShowResetConfirm(false);
    window.location.reload();
  }, []);

  return (
    <div>
      <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-tight mb-1">Advanced Settings</h1>
      <p className="text-[#94A3B8] text-sm mb-6 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
        Power user options — be careful!
      </p>

      <SectionCard title="Developer Mode">
        <SettingRow title="Developer Mode" description="Show advanced options, debug info, and raw config files.">
          <Switch checked={devMode} onCheckedChange={setDevMode} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Logging">
        <div className="mb-4">
          <p className="text-[14px] font-semibold text-[#F0F4F8] mb-2">Log Level</p>
          <div className="flex gap-2">
            {(["debug", "info", "warn", "error"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLogLevel(l)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-medium capitalize transition-all",
                  logLevel === l
                    ? "bg-[rgba(37,99,235,0.12)] text-[#2563EB] border border-[rgba(37,99,235,0.3)]"
                    : "bg-[rgba(255,255,255,0.03)] text-[#94A3B8] border border-[rgba(255,255,255,0.08)]"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Performance">
        <div className="mb-4">
          <p className="text-[14px] font-semibold text-[#F0F4F8] mb-2">Parallel Jobs: {parallelJobs[0]}</p>
          <Slider value={parallelJobs} onValueChange={setParallelJobs} min={1} max={8} step={1} />
          <p className="text-[12px] text-[#64748B] mt-1">Number of concurrent installation tasks.</p>
        </div>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[rgba(255,255,255,0.04)]">
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-[#F0F4F8]">Network Timeout (seconds)</p>
            <p className="text-[12px] text-[#64748B]">Max wait time for network operations.</p>
          </div>
          <input
            type="number"
            value={timeout}
            onChange={(e) => setTimeout(e.target.value)}
            min={5}
            max={300}
            className="w-20 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-[13px] text-[#F0F4F8] text-center outline-none focus:border-[#2563EB]"
          />
        </div>
      </SectionCard>

      <SectionCard title="Reset All Settings">
        <div className="flex items-start gap-3">
          <Trash2 className="w-5 h-5 text-[#EF4444] mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-[#EF4444] mb-1">Reset Everything</p>
            <p className="text-[13px] text-[#64748B] mb-3">
              This will reset all settings, clear all data, and restart the app. This action cannot be undone.
            </p>
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 text-sm font-semibold text-[#EF4444] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg hover:bg-[rgba(239,68,68,0.2)] transition-all"
              >
                Reset All Settings
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#EF4444] rounded-lg hover:bg-[#DC2626] transition-all"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-[#94A3B8] border border-[rgba(255,255,255,0.12)] rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#020617] text-[#F0F4F8] px-6 py-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Sidebar Tabs ── */}
          <aside className="lg:w-[160px] shrink-0">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all",
                    activeTab === t.id
                      ? "bg-[rgba(37,99,235,0.08)] text-[#2563EB] border-l-[3px] border-[#2563EB]"
                      : "text-[#94A3B8] hover:bg-[rgba(255,255,255,0.02)] border-l-[3px] border-transparent"
                  )}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── Content ── */}
          <main className="flex-1 min-w-0">
            {activeTab === "general" && <GeneralTab />}
            {activeTab === "accounts" && <AccountsTab />}
            {activeTab === "apikeys" && <ApiKeysTab />}
            {activeTab === "security" && <SecurityTab />}
            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "advanced" && <AdvancedTab />}
          </main>
        </div>
      </div>
    </div>
  );
}
