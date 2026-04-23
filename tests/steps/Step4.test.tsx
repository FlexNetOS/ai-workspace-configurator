import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Step4 from '../../src/components/steps/Step4';
import useWizardStore from '../../src/store/wizardStore';
import { resetAllStores } from '../test-utils';

describe('Step4 - Security Readiness Check', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('renders the step title', () => {
    render(<Step4 />);
    expect(screen.getByText(/System Readiness Check/i)).toBeInTheDocument();
  });

  it('renders all 6 check cards', () => {
    render(<Step4 />);
    expect(screen.getByText(/Administrator Rights/i)).toBeInTheDocument();
    expect(screen.getByText(/UAC Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Virtualization/i)).toBeInTheDocument();
    expect(screen.getByText(/Windows Update/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Reboot/i)).toBeInTheDocument();
    expect(screen.getByText(/Disk Space/i)).toBeInTheDocument();
  });

  it('has run checks button enabled initially', () => {
    render(<Step4 />);
    const button = screen.getByRole('button', { name: /Run Checks/i });
    expect(button).toBeEnabled();
  });

  it('runs checks and updates statuses', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Step4 />);
    const button = screen.getByRole('button', { name: /Run Checks/i });
    fireEvent.click(button);

    await act(async () => {
      vi.advanceTimersByTime(8000);
    });

    const state = useWizardStore.getState();
    expect(state.securityChecks.admin).toBeDefined();
    vi.useRealTimers();
  });

  it('adds terminal logs during checks', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Step4 />);
    const button = screen.getByRole('button', { name: /Run Checks/i });
    fireEvent.click(button);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(useWizardStore.getState().terminalLogs.some((l) => l.includes('readiness'))).toBe(true);
    vi.useRealTimers();
  });

  it('completes step 4 when all checks finish', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Step4 />);
    const button = screen.getByRole('button', { name: /Run Checks/i });
    fireEvent.click(button);

    await act(async () => {
      vi.advanceTimersByTime(12000);
    });

    expect(useWizardStore.getState().completedSteps[3]).toBe(true);
    vi.useRealTimers();
  });
});
