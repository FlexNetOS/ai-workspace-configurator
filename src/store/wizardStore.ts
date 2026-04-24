import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CheckStatus = 'pending' | 'checking' | 'passed' | 'warning' | 'failed';
export type AccountStatus =
  | 'disconnected'
  | 'synthetic_pending'
  | 'synthetic_linked'
  | 'real_linked'
  | 'failed';
export type AccountLinkKind = 'synthetic' | 'real';

export interface AiProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: AccountStatus;
  authRef?: string;
  authKind?: AccountLinkKind;
  lastLinkedAt?: string;
  lastError?: string;
  cliPackage: string;
  installCommand: string;
}

export interface Provider {
  id: string;
  name: string;
  description: string;
  icon: string;
  selected: boolean;
  required?: boolean;
}

export interface Account {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: AccountStatus;
  authRef?: string;
  authKind?: AccountLinkKind;
  lastLinkedAt?: string;
  lastError?: string;
}

export type AccountStatusUpdate = Partial<
  Pick<Account, 'authRef' | 'authKind' | 'lastLinkedAt' | 'lastError'>
>;

export const isLinkedAccountStatus = (status: AccountStatus): boolean =>
  status === 'synthetic_linked' || status === 'real_linked';

export interface WizardState {
  currentStep: number;
  completedSteps: boolean[];
  isExecuting: boolean;
  terminalLogs: string[];
  checkpoints: string[];
  providers: Provider[];
  policies: Record<string, boolean>;
  linkedAccounts: Account[];
  securityChecks: Record<string, CheckStatus>;
  hardwareDiscovered: boolean;
  e2eTests: Record<string, CheckStatus>;
  planApproved: boolean;
  environmentsProvisioned: string[];
  tuningApplied: boolean;
  welcomeSeen: boolean;
  prerequisites: boolean[];
  showTerminal: boolean;
  preferredBrowser: string;
  aiProviders: AiProvider[];
  pendingCliInstalls: string[];

  setCurrentStep: (step: number) => void;
  completeStep: (step: number) => void;
  uncompleteStepsFrom: (step: number) => void;
  setIsExecuting: (executing: boolean) => void;
  addTerminalLog: (log: string) => void;
  clearTerminalLogs: () => void;
  toggleProvider: (id: string) => void;
  setPolicy: (key: string, value: boolean) => void;
  setAccountStatus: (id: string, status: AccountStatus, meta?: AccountStatusUpdate) => void;
  setSecurityCheck: (key: string, status: CheckStatus) => void;
  setHardwareDiscovered: (discovered: boolean) => void;
  setE2eTest: (key: string, status: CheckStatus) => void;
  setPlanApproved: (approved: boolean) => void;
  addEnvironment: (env: string) => void;
  setTuningApplied: (applied: boolean) => void;
  setWelcomeSeen: (seen: boolean) => void;
  setPrerequisite: (index: number, value: boolean) => void;
  setShowTerminal: (show: boolean) => void;
  setPreferredBrowser: (browser: string) => void;
  setAiProviderStatus: (id: string, status: AccountStatus, meta?: AccountStatusUpdate) => void;
  queueCliInstall: (packageName: string) => void;
  clearCliQueue: () => void;
  reset: () => void;
}

const STORAGE_VERSION = 2;

const initialProviders: Provider[] = [
  { id: 'docker', name: 'Docker', description: 'Container management platform', icon: 'Container', selected: false, required: true },
  { id: 'github', name: 'GitHub', description: 'Code repositories and CI/CD', icon: 'Github', selected: false },
  { id: 'huggingface', name: 'HuggingFace', description: 'Open-source AI models', icon: 'Database', selected: false },
  { id: 'openrouter', name: 'OpenRouter', description: 'Unified AI API access', icon: 'Router', selected: false },
  { id: 'notion', name: 'Notion', description: 'Documentation and notes', icon: 'FileText', selected: false },
  { id: 'google', name: 'Google', description: 'Cloud services and Gemini API', icon: 'Chrome', selected: false },
  { id: 'cloudflare', name: 'Cloudflare', description: 'DNS and edge services', icon: 'Cloud', selected: false },
  { id: 'custom', name: 'Custom', description: 'Other providers', icon: 'Settings', selected: false },
];

const initialAccounts: Account[] = [
  { id: 'docker', name: 'Docker Hub', description: 'Container registry', icon: 'Container', status: 'disconnected' },
  { id: 'github', name: 'GitHub', description: 'Code repositories', icon: 'Github', status: 'disconnected' },
  { id: 'huggingface', name: 'HuggingFace', description: 'AI models and datasets', icon: 'Smile', status: 'disconnected' },
  { id: 'openrouter', name: 'OpenRouter', description: 'Unified AI API', icon: 'Router', status: 'disconnected' },
  { id: 'notion', name: 'Notion', description: 'Documentation sync', icon: 'FileText', status: 'disconnected' },
  { id: 'google', name: 'Google', description: 'Cloud and Gemini', icon: 'Chrome', status: 'disconnected' },
  { id: 'cloudflare', name: 'Cloudflare', description: 'DNS and edge AI', icon: 'Cloud', status: 'disconnected' },
];

const initialAiProviders: AiProvider[] = [
  { id: 'openai', name: 'OpenAI', description: 'ChatGPT Plus & API access', icon: 'Sparkles', status: 'disconnected', cliPackage: '@openai/cli', installCommand: 'npm install -g openai' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude Pro & API access', icon: 'MessageSquare', status: 'disconnected', cliPackage: '@anthropic-ai/cli', installCommand: 'npm install -g @anthropic-ai/cli' },
  { id: 'kimi', name: 'Kimi', description: 'Moonshot AI & Kimi Code CLI', icon: 'Zap', status: 'disconnected', cliPackage: '@moonshot-ai/kimi-cli', installCommand: 'npm install -g kimi-cli' },
  { id: 'google_gemini', name: 'Google Gemini', description: 'Gemini API & Google Cloud', icon: 'Chrome', status: 'disconnected', cliPackage: '@google/gemini-cli', installCommand: 'npm install -g @google/gemini-cli' },
];

const initialPolicies: Record<string, boolean> = {
  gpuAcceleration: true,
  nonRootUser: true,
  secretsManagement: true,
  dockerCompose: true,
  wsl2Isolation: true,
  autoUpdate: true,
  telemetry: false,
};

const createSyntheticStatusRef = (id: string): string =>
  `syn_${id}_${Math.random().toString(36).slice(2, 10)}`;

const mapLegacyAccountStatus = (status: unknown): AccountStatus => {
  if (status === 'connected') return 'synthetic_linked';
  if (status === 'connecting') return 'synthetic_pending';
  if (status === 'failed') return 'failed';
  if (status === 'real_linked') return 'real_linked';
  if (status === 'synthetic_linked') return 'synthetic_linked';
  if (status === 'synthetic_pending') return 'synthetic_pending';
  return 'disconnected';
};

const normalizeAccount = (accountLike: unknown): Account | null => {
  if (typeof accountLike === 'string') {
    const base = initialAccounts.find((a) => a.id === accountLike);
    if (!base) return null;
    return {
      ...base,
      status: 'synthetic_linked',
      authKind: 'synthetic',
      authRef: createSyntheticStatusRef(base.id),
      lastLinkedAt: new Date().toISOString(),
    };
  }

  if (!accountLike || typeof accountLike !== 'object') {
    return null;
  }

  const legacy = accountLike as Record<string, unknown>;
  if (typeof legacy.id !== 'string') return null;

  const base = initialAccounts.find((a) => a.id === legacy.id) ?? {
    id: legacy.id,
    name: typeof legacy.name === 'string' ? legacy.name : legacy.id,
    description: typeof legacy.description === 'string' ? legacy.description : '',
    icon: typeof legacy.icon === 'string' ? legacy.icon : 'Globe',
    status: 'disconnected' as const,
  };

  const status = mapLegacyAccountStatus(legacy.status);
  const maybeAuthRef =
    typeof legacy.authRef === 'string'
      ? legacy.authRef
      : typeof legacy.token === 'string'
        ? legacy.token
        : undefined;

  const authKind: AccountLinkKind | undefined =
    status === 'real_linked'
      ? 'real'
      : status === 'synthetic_linked' || status === 'synthetic_pending'
        ? 'synthetic'
        : undefined;

  return {
    ...base,
    name: typeof legacy.name === 'string' ? legacy.name : base.name,
    description: typeof legacy.description === 'string' ? legacy.description : base.description,
    icon: typeof legacy.icon === 'string' ? legacy.icon : base.icon,
    status,
    authKind,
    authRef:
      status === 'synthetic_linked' || status === 'synthetic_pending'
        ? maybeAuthRef ?? createSyntheticStatusRef(base.id)
        : maybeAuthRef,
    lastLinkedAt: typeof legacy.lastLinkedAt === 'string' ? legacy.lastLinkedAt : undefined,
    lastError: typeof legacy.lastError === 'string' ? legacy.lastError : undefined,
  };
};

const normalizePersistedLinkedAccounts = (raw: unknown): Account[] => {
  if (!Array.isArray(raw)) {
    return initialAccounts.map((a) => ({ ...a }));
  }

  const normalized = raw
    .map((entry) => normalizeAccount(entry))
    .filter((entry): entry is Account => entry !== null);

  const byId = new Map(normalized.map((a) => [a.id, a]));
  return initialAccounts.map((a) => byId.get(a.id) ?? { ...a });
};

const makeInitialState = () => ({
  currentStep: 1,
  completedSteps: new Array(15).fill(false),
  isExecuting: false,
  terminalLogs: [],
  checkpoints: [],
  providers: initialProviders.map((p) => ({ ...p })),
  policies: { ...initialPolicies },
  linkedAccounts: initialAccounts.map((a) => ({ ...a })),
  securityChecks: {},
  hardwareDiscovered: false,
  e2eTests: {},
  planApproved: false,
  environmentsProvisioned: [],
  tuningApplied: false,
  welcomeSeen: false,
  prerequisites: new Array(4).fill(false),
  showTerminal: false,
  preferredBrowser: 'default',
  aiProviders: initialAiProviders.map((p) => ({ ...p })),
  pendingCliInstalls: [],
});

const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      ...makeInitialState(),

      setCurrentStep: (step) => set({ currentStep: step }),
      completeStep: (step) =>
        set((state) => {
          const newCompleted = [...state.completedSteps];
          newCompleted[step - 1] = true;
          return { completedSteps: newCompleted };
        }),
      uncompleteStepsFrom: (step) =>
        set((state) => {
          const newCompleted = [...state.completedSteps];
          for (let i = step - 1; i < newCompleted.length; i++) {
            newCompleted[i] = false;
          }
          return { completedSteps: newCompleted };
        }),
      setIsExecuting: (executing) => set({ isExecuting: executing }),
      addTerminalLog: (log) =>
        set((state) => ({ terminalLogs: [...state.terminalLogs, log] })),
      clearTerminalLogs: () => set({ terminalLogs: [] }),
      toggleProvider: (id) =>
        set((state) => ({
          providers: state.providers.map((p) =>
            p.id === id ? { ...p, selected: !p.selected } : p
          ),
        })),
      setPolicy: (key, value) =>
        set((state) => ({
          policies: { ...state.policies, [key]: value },
        })),
      setAccountStatus: (id, status, meta) =>
        set((state) => ({
          linkedAccounts: state.linkedAccounts.map((a) => {
            if (a.id !== id) return a;

            if (status === 'disconnected') {
              return {
                ...a,
                status,
                authKind: undefined,
                authRef: undefined,
                lastLinkedAt: undefined,
                lastError: undefined,
              };
            }

            return {
              ...a,
              status,
              authKind: meta?.authKind ?? a.authKind,
              authRef: meta?.authRef ?? a.authRef,
              lastLinkedAt: meta?.lastLinkedAt ?? a.lastLinkedAt,
              lastError: meta?.lastError ?? a.lastError,
            };
          }),
        })),
      setSecurityCheck: (key, status) =>
        set((state) => ({
          securityChecks: { ...state.securityChecks, [key]: status },
        })),
      setHardwareDiscovered: (discovered) => set({ hardwareDiscovered: discovered }),
      setE2eTest: (key, status) =>
        set((state) => ({
          e2eTests: { ...state.e2eTests, [key]: status },
        })),
      setPlanApproved: (approved) => set({ planApproved: approved }),
      addEnvironment: (env) =>
        set((state) => ({
          environmentsProvisioned: [...state.environmentsProvisioned, env],
        })),
      setTuningApplied: (applied) => set({ tuningApplied: applied }),
      setWelcomeSeen: (seen) => set({ welcomeSeen: seen }),
      setPrerequisite: (index, value) =>
        set((state) => {
          const newPrereqs = [...state.prerequisites];
          newPrereqs[index] = value;
          return { prerequisites: newPrereqs };
        }),
      setShowTerminal: (show) => set({ showTerminal: show }),
      setPreferredBrowser: (browser) => set({ preferredBrowser: browser }),
      setAiProviderStatus: (id, status, meta) =>
        set((state) => ({
          aiProviders: state.aiProviders.map((p) => {
            if (p.id !== id) return p;
            if (status === 'disconnected') {
              return {
                ...p,
                status,
                authKind: undefined,
                authRef: undefined,
                lastLinkedAt: undefined,
                lastError: undefined,
              };
            }
            return {
              ...p,
              status,
              authKind: meta?.authKind ?? p.authKind,
              authRef: meta?.authRef ?? p.authRef,
              lastLinkedAt: meta?.lastLinkedAt ?? p.lastLinkedAt,
              lastError: meta?.lastError ?? p.lastError,
            };
          }),
        })),
      queueCliInstall: (packageName) =>
        set((state) => ({
          pendingCliInstalls: state.pendingCliInstalls.includes(packageName)
            ? state.pendingCliInstalls
            : [...state.pendingCliInstalls, packageName],
        })),
      clearCliQueue: () => set({ pendingCliInstalls: [] }),
      reset: () => set({ ...makeInitialState() }),
    }),
    {
      name: 'workspace_wizard_state',
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Record<string, unknown>;
        return {
          ...state,
          linkedAccounts: normalizePersistedLinkedAccounts(state.linkedAccounts),
        } as WizardState;
      },
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        providers: state.providers,
        policies: state.policies,
        linkedAccounts: state.linkedAccounts,
        securityChecks: state.securityChecks,
        hardwareDiscovered: state.hardwareDiscovered,
        e2eTests: state.e2eTests,
        planApproved: state.planApproved,
        environmentsProvisioned: state.environmentsProvisioned,
        tuningApplied: state.tuningApplied,
        welcomeSeen: state.welcomeSeen,
        prerequisites: state.prerequisites,
        checkpoints: state.checkpoints,
        preferredBrowser: state.preferredBrowser,
        aiProviders: state.aiProviders,
        pendingCliInstalls: state.pendingCliInstalls,
      }),
    }
  )
);

export default useWizardStore;
