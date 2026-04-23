import { ReactNode } from 'react';
import { render as rtlRender } from '@testing-library/react';
import useWizardStore from '../src/store/wizardStore';
import useHardwareRegistry from '../src/store/hardwareRegistryStore';

/**
 * Reset all Zustand stores to initial state.
 * Call this in beforeEach() to ensure test isolation.
 */
export function resetAllStores() {
  useWizardStore.getState().reset();
  useHardwareRegistry.getState().reset();
  // Clear localStorage to prevent persisted state leaks
  window.localStorage.clear();
}

/**
 * Wrapper for rendering components that depend on Zustand stores.
 * Automatically resets stores before rendering.
 */
export function renderWithStores(ui: ReactNode) {
  resetAllStores();
  return rtlRender(<>{ui}</>);
}

/**
 * Advance timers and wait for state updates in Zustand stores.
 */
export async function waitForStoreUpdate(
  predicate: () => boolean,
  timeout = 1000
): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeout) {
      throw new Error('Store update timeout');
    }
    await new Promise((r) => setTimeout(r, 10));
  }
}
