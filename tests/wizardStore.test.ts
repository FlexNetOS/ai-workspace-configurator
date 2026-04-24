import { beforeEach, describe, expect, it } from 'vitest';
import useWizardStore, { isLinkedAccountStatus } from '../src/store/wizardStore';
import { resetAllStores } from './test-utils';

describe('wizardStore', () => {
  beforeEach(() => {
    resetAllStores();
  });

  describe('initial state', () => {
    it('starts at step 1 with no completed steps', () => {
      const state = useWizardStore.getState();
      expect(state.currentStep).toBe(1);
      expect(state.completedSteps.every((s) => !s)).toBe(true);
      expect(state.completedSteps).toHaveLength(15);
    });

    it('has all 8 providers unselected except Docker marked required', () => {
      const state = useWizardStore.getState();
      expect(state.providers).toHaveLength(8);
      const docker = state.providers.find((p) => p.id === 'docker');
      expect(docker?.required).toBe(true);
      expect(docker?.selected).toBe(false);
    });

    it('has all 7 accounts disconnected', () => {
      const state = useWizardStore.getState();
      expect(state.linkedAccounts).toHaveLength(7);
      expect(state.linkedAccounts.every((a) => a.status === 'disconnected')).toBe(true);
    });

    it('has default policies', () => {
      const state = useWizardStore.getState();
      expect(state.policies.gpuAcceleration).toBe(true);
      expect(state.policies.telemetry).toBe(false);
    });

    it('has empty terminal logs', () => {
      expect(useWizardStore.getState().terminalLogs).toEqual([]);
    });
  });

  describe('step navigation', () => {
    it('can change current step', () => {
      useWizardStore.getState().setCurrentStep(5);
      expect(useWizardStore.getState().currentStep).toBe(5);
    });

    it('can complete a step', () => {
      useWizardStore.getState().completeStep(3);
      expect(useWizardStore.getState().completedSteps[2]).toBe(true);
    });

    it('can uncomplete steps from a given index', () => {
      const store = useWizardStore.getState();
      store.completeStep(3);
      store.completeStep(5);
      store.completeStep(7);

      store.uncompleteStepsFrom(5);

      const state = useWizardStore.getState();
      expect(state.completedSteps[2]).toBe(true); // step 3
      expect(state.completedSteps[4]).toBe(false); // step 5
      expect(state.completedSteps[6]).toBe(false); // step 7
    });
  });

  describe('terminal logs', () => {
    it('can add logs', () => {
      useWizardStore.getState().addTerminalLog('> Test log');
      expect(useWizardStore.getState().terminalLogs).toContain('> Test log');
    });

    it('can clear logs', () => {
      const store = useWizardStore.getState();
      store.addTerminalLog('> Log 1');
      store.addTerminalLog('> Log 2');
      store.clearTerminalLogs();
      expect(useWizardStore.getState().terminalLogs).toEqual([]);
    });
  });

  describe('providers', () => {
    it('can toggle provider selection', () => {
      useWizardStore.getState().toggleProvider('github');
      const github = useWizardStore.getState().providers.find((p) => p.id === 'github');
      expect(github?.selected).toBe(true);

      useWizardStore.getState().toggleProvider('github');
      expect(useWizardStore.getState().providers.find((p) => p.id === 'github')?.selected).toBe(false);
    });
  });

  describe('policies', () => {
    it('can update a policy', () => {
      useWizardStore.getState().setPolicy('telemetry', true);
      expect(useWizardStore.getState().policies.telemetry).toBe(true);
    });
  });

  describe('security checks', () => {
    it('can set security check status', () => {
      useWizardStore.getState().setSecurityCheck('admin', 'passed');
      expect(useWizardStore.getState().securityChecks.admin).toBe('passed');
    });
  });

  describe('e2e tests', () => {
    it('can set e2e test status', () => {
      useWizardStore.getState().setE2eTest('docker', 'passed');
      expect(useWizardStore.getState().e2eTests.docker).toBe('passed');
    });
  });

  describe('environments', () => {
    it('can provision an environment', () => {
      useWizardStore.getState().addEnvironment('development');
      expect(useWizardStore.getState().environmentsProvisioned).toContain('development');
    });
  });

  describe('plan approval', () => {
    it('can approve the plan', () => {
      useWizardStore.getState().setPlanApproved(true);
      expect(useWizardStore.getState().planApproved).toBe(true);
    });
  });

  describe('hardware discovery', () => {
    it('can set hardware discovered', () => {
      useWizardStore.getState().setHardwareDiscovered(true);
      expect(useWizardStore.getState().hardwareDiscovered).toBe(true);
    });
  });

  describe('tuning', () => {
    it('can set tuning applied', () => {
      useWizardStore.getState().setTuningApplied(true);
      expect(useWizardStore.getState().tuningApplied).toBe(true);
    });
  });

  describe('execution state', () => {
    it('can set executing flag', () => {
      useWizardStore.getState().setIsExecuting(true);
      expect(useWizardStore.getState().isExecuting).toBe(true);
    });

    it('can toggle terminal visibility', () => {
      useWizardStore.getState().setShowTerminal(true);
      expect(useWizardStore.getState().showTerminal).toBe(true);
    });
  });

  describe('account linking', () => {
    it('can set account status with metadata', () => {
      const store = useWizardStore.getState();
      store.setAccountStatus('github', 'synthetic_linked', {
        authKind: 'synthetic',
        authRef: 'syn_github_abc123',
        lastLinkedAt: '2024-01-01T00:00:00Z',
      });

      const account = useWizardStore.getState().linkedAccounts.find((a) => a.id === 'github');
      expect(account?.status).toBe('synthetic_linked');
      expect(account?.authKind).toBe('synthetic');
      expect(account?.authRef).toBe('syn_github_abc123');
    });

    it('can disconnect an account (clears auth data)', () => {
      const store = useWizardStore.getState();
      store.setAccountStatus('github', 'synthetic_linked', {
        authKind: 'synthetic',
        authRef: 'syn_github_abc123',
      });
      store.setAccountStatus('github', 'disconnected');

      const account = useWizardStore.getState().linkedAccounts.find((a) => a.id === 'github');
      expect(account?.status).toBe('disconnected');
      expect(account?.authKind).toBeUndefined();
      expect(account?.authRef).toBeUndefined();
    });

    it('isLinkedAccountStatus correctly identifies linked states', () => {
      expect(isLinkedAccountStatus('synthetic_linked')).toBe(true);
      expect(isLinkedAccountStatus('real_linked')).toBe(true);
      expect(isLinkedAccountStatus('synthetic_pending')).toBe(false);
      expect(isLinkedAccountStatus('disconnected')).toBe(false);
      expect(isLinkedAccountStatus('failed')).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      const store = useWizardStore.getState();
      store.setCurrentStep(5);
      store.completeStep(3);
      store.addTerminalLog('> test');
      store.toggleProvider('github');

      store.reset();

      const state = useWizardStore.getState();
      expect(state.currentStep).toBe(1);
      expect(state.completedSteps.every((s) => !s)).toBe(true);
      expect(state.terminalLogs).toEqual([]);
      expect(state.providers.every((p) => !p.selected)).toBe(true);
    });
  });

  describe('welcome and prerequisites', () => {
    it('can set welcome seen', () => {
      useWizardStore.getState().setWelcomeSeen(true);
      expect(useWizardStore.getState().welcomeSeen).toBe(true);
    });

    it('can set prerequisite', () => {
      useWizardStore.getState().setPrerequisite(0, true);
      expect(useWizardStore.getState().prerequisites[0]).toBe(true);
    });
  });

  describe('browser preference', () => {
    it('defaults to default browser', () => {
      expect(useWizardStore.getState().preferredBrowser).toBe('default');
    });

    it('can set preferred browser', () => {
      useWizardStore.getState().setPreferredBrowser('chrome');
      expect(useWizardStore.getState().preferredBrowser).toBe('chrome');
    });
  });

  describe('AI providers', () => {
    it('has 4 AI providers initially disconnected', () => {
      const state = useWizardStore.getState();
      expect(state.aiProviders).toHaveLength(4);
      expect(state.aiProviders.every((p) => p.status === 'disconnected')).toBe(true);
    });

    it('can link an AI provider with API key', () => {
      useWizardStore.getState().setAiProviderStatus('openai', 'real_linked', {
        authKind: 'real',
        authRef: 'sk-test123',
      });
      const openai = useWizardStore.getState().aiProviders.find((p) => p.id === 'openai');
      expect(openai?.status).toBe('real_linked');
      expect(openai?.authRef).toBe('sk-test123');
      expect(openai?.authKind).toBe('real');
    });

    it('can disconnect an AI provider', () => {
      useWizardStore.getState().setAiProviderStatus('openai', 'real_linked', {
        authKind: 'real',
        authRef: 'sk-test',
      });
      useWizardStore.getState().setAiProviderStatus('openai', 'disconnected');
      const openai = useWizardStore.getState().aiProviders.find((p) => p.id === 'openai');
      expect(openai?.status).toBe('disconnected');
      expect(openai?.authRef).toBeUndefined();
    });
  });

  describe('CLI install queue', () => {
    it('starts empty', () => {
      expect(useWizardStore.getState().pendingCliInstalls).toEqual([]);
    });

    it('can queue a CLI package', () => {
      useWizardStore.getState().queueCliInstall('@openai/cli');
      expect(useWizardStore.getState().pendingCliInstalls).toContain('@openai/cli');
    });

    it('does not duplicate queued packages', () => {
      useWizardStore.getState().queueCliInstall('@openai/cli');
      useWizardStore.getState().queueCliInstall('@openai/cli');
      expect(useWizardStore.getState().pendingCliInstalls).toEqual(['@openai/cli']);
    });

    it('can clear the queue', () => {
      useWizardStore.getState().queueCliInstall('@openai/cli');
      useWizardStore.getState().queueCliInstall('@anthropic-ai/cli');
      useWizardStore.getState().clearCliQueue();
      expect(useWizardStore.getState().pendingCliInstalls).toEqual([]);
    });
  });
});
