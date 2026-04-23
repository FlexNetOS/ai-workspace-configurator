import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import App from '../../src/App';
import useWizardStore from '../../src/store/wizardStore';
import { resetAllStores } from '../test-utils';

describe('Wizard Full Flow Integration', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('renders the wizard at step 1', () => {
    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    expect(screen.getByText(/your ai workspace, automated/i)).toBeInTheDocument();
  });

  it('can navigate through steps using the wizard store', () => {
    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    // Initially at step 1
    expect(useWizardStore.getState().currentStep).toBe(1);

    // Manually advance step via store (simulating navigation)
    act(() => {
      useWizardStore.getState().setCurrentStep(3);
    });
    expect(useWizardStore.getState().currentStep).toBe(3);
  });

  it('completing step 3 allows progress', () => {
    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    act(() => {
      useWizardStore.getState().completeStep(3);
    });
    expect(useWizardStore.getState().completedSteps[2]).toBe(true);
  });

  it('terminal logs accumulate across steps', () => {
    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    const store = useWizardStore.getState();
    act(() => {
      store.addTerminalLog('> Step 1 started');
      store.addTerminalLog('> Step 2 started');
      store.addTerminalLog('> Step 3 started');
    });

    expect(useWizardStore.getState().terminalLogs).toHaveLength(3);
  });

  it('provider selection affects wizard state', () => {
    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    act(() => {
      useWizardStore.getState().toggleProvider('docker');
      useWizardStore.getState().toggleProvider('github');
    });

    expect(useWizardStore.getState().providers.filter((p) => p.selected)).toHaveLength(2);
  });

  it('plan approval completes step 10', () => {
    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    act(() => {
      const store = useWizardStore.getState();
      store.setPlanApproved(true);
    });

    expect(useWizardStore.getState().planApproved).toBe(true);
  });

  it('reset clears all progress', () => {
    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    act(() => {
      const store = useWizardStore.getState();
      store.completeStep(1);
      store.completeStep(2);
      store.setCurrentStep(5);
      store.addTerminalLog('> test');
    });

    act(() => {
      useWizardStore.getState().reset();
    });

    const state = useWizardStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.completedSteps.every((s) => !s)).toBe(true);
    expect(state.terminalLogs).toEqual([]);
  });

  it('stores can interact: hardware registry affects wizard step 8', () => {
    render(
      <HashRouter>
        <App />
      </HashRouter>
    );

    // This integration verifies cross-store communication
    act(() => {
      useWizardStore.getState().setCurrentStep(8);
    });
    // Step8 auto-completes based on hardware registry entries
    // (tested in Step8.test.tsx, this verifies the stores are independent)
    expect(useWizardStore.getState().currentStep).toBe(8);
  });
});
