import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Step8 from '../../src/components/steps/Step8';
import useWizardStore from '../../src/store/wizardStore';
import useHardwareRegistry from '../../src/store/hardwareRegistryStore';
import { resetAllStores } from '../test-utils';

// Mock HardwareRegistry component
vi.mock('../../src/components/HardwareRegistry', () => ({
  default: () => <div data-testid="hardware-registry">HardwareRegistry Mock</div>,
}));

describe('Step8 - Device Registration', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('renders the step title', () => {
    render(<Step8 />);
    expect(screen.getByText(/Hardware Registry/i)).toBeInTheDocument();
  });

  it('renders the hardware registry component', () => {
    render(<Step8 />);
    expect(screen.getByTestId('hardware-registry')).toBeInTheDocument();
  });

  it('auto-completes when all entries are registered', () => {
    useHardwareRegistry.getState().addEntry({
      componentType: 'gpu',
      vendor: 'NVIDIA',
      model: 'RTX 4090',
      resourceTags: [],
      webhooks: {},
      discoveredSpecs: {},
      status: 'registered',
    });

    render(<Step8 />);

    expect(useWizardStore.getState().completedSteps[7]).toBe(true);
  });

  it('auto-completes when all entries are active', () => {
    useHardwareRegistry.getState().addEntry({
      componentType: 'cpu',
      vendor: 'Intel',
      model: 'i9-14900K',
      resourceTags: [],
      webhooks: {},
      discoveredSpecs: {},
      status: 'active',
    });

    render(<Step8 />);

    expect(useWizardStore.getState().completedSteps[7]).toBe(true);
  });

  it('does not complete with discovered-only entries', () => {
    useHardwareRegistry.getState().addEntry({
      componentType: 'gpu',
      vendor: 'NVIDIA',
      model: 'RTX 4090',
      resourceTags: [],
      webhooks: {},
      discoveredSpecs: {},
      status: 'discovered',
    });

    render(<Step8 />);

    expect(useWizardStore.getState().completedSteps[7]).toBe(false);
  });
});
