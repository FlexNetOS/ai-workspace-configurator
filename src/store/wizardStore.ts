import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CheckStatus = 'pending' | 'checking' | 'passed' | 'warning' | 'failed';
export type AccountStatus = 'disconnected' | 'connecting' | 'connected' | 'failed';

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
  token?: string;
}

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

  setCurrentStep: (step: number) => void;
  completeStep: (step: number) => void;
  uncompleteStepsFrom: (step: number) => void;
  setIsExecuting: (executing: boolean) => void;
  addTerminalLog: (log: string) => void;
  clearTerminalLogs: () => void;
  toggleProvider: (id: string) => void;
  setPolicy: (key: string, value: boolean) => void;
  setAccountStatus: (id: string, status: AccountStatus, token?: string) => void;
  setSecurityCheck: (key: string, status: CheckStatus) => void;
  setHardwareDiscovered: (discovered: boolean) => void;
  setE2eTest: (key: string, status: CheckStatus) => void;
  setPlanApproved: (approved: boolean) => void;
  addEnvironment: (env: string) => void;
  setTuningApplied: (applied: boolean) => void;
  setWelcomeSeen: (seen: boolean) => void;
  setPrerequisite: (index: number, value: boolean) => void;
  setShowTerminal: (show: boolean) => void;
  reset: () => void;
}

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

const initialPolicies: Record<string, boolean> = {
  gpuAcceleration: true,
  nonRootUser: true,
  secretsManagement: true,
  dockerCompose: true,
  wsl2Isolation: true,
  autoUpdate: true,
  telemetry: false,
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
      setAccountStatus: (id, status, token) =>
        set((state) => ({
          linkedAccounts: state.linkedAccounts.map((a) =>
            a.id === id ? { ...a, status, token: token || a.token } : a
          ),
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
      reset: () => set({ ...makeInitialState() }),
    }),
    {
      name: 'workspace_wizard_state',
      storage: createJSONStorage(() => localStorage),
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
      }),
    }
  )
);

export default useWizardStore;
