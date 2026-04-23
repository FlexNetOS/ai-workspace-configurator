import { beforeEach, describe, expect, it } from 'vitest';
import useWizardStore, { isLinkedAccountStatus } from '../src/store/wizardStore';

describe('wizardStore account linking states', () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
  });

  it('keeps continuity with synthetic link states', () => {
    const store = useWizardStore.getState();
    store.setAccountStatus('github', 'synthetic_pending', {
      authKind: 'synthetic',
      authRef: 'syn_github_12345678',
    });
    store.setAccountStatus('github', 'synthetic_linked', {
      authKind: 'synthetic',
      authRef: 'syn_github_12345678',
    });

    const account = useWizardStore.getState().linkedAccounts.find((a) => a.id === 'github');
    expect(account?.status).toBe('synthetic_linked');
    expect(account?.authKind).toBe('synthetic');
    expect(isLinkedAccountStatus(account!.status)).toBe(true);
  });

  it('upgrades synthetic links to real OAuth links without losing state', () => {
    const store = useWizardStore.getState();
    store.setAccountStatus('docker', 'synthetic_linked', {
      authKind: 'synthetic',
      authRef: 'syn_docker_abcd1234',
    });
    store.setAccountStatus('docker', 'real_linked', {
      authKind: 'real',
      authRef: 'real_docker_9876',
    });

    const account = useWizardStore.getState().linkedAccounts.find((a) => a.id === 'docker');
    expect(account?.status).toBe('real_linked');
    expect(account?.authKind).toBe('real');
    expect(account?.authRef).toContain('real_docker_');
  });
});
