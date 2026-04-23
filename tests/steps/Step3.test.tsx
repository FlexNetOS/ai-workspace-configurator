import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Step3 from '../../src/components/steps/Step3';
import useWizardStore from '../../src/store/wizardStore';
import { resetAllStores } from '../test-utils';

describe('Step3 - Create Rollback Checkpoint', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('renders the step title and description', () => {
    render(<Step3 />);
    expect(screen.getByText(/Create a Safety Net/i)).toBeInTheDocument();
    expect(screen.getByText(/roll back any changes/i)).toBeInTheDocument();
  });

  it('renders both checkpoint cards', () => {
    render(<Step3 />);
    expect(screen.getByRole('heading', { name: /Windows System Restore/i })).toBeInTheDocument();
    expect(screen.getByText(/Configuration Snapshot/i)).toBeInTheDocument();
  });

  it('has create restore point button enabled initially', () => {
    render(<Step3 />);
    const button = screen.getByRole('button', { name: /Create Restore Point/i });
    expect(button).toBeEnabled();
  });

  it('shows creating state when restore point is triggered', () => {
    render(<Step3 />);
    const button = screen.getByRole('button', { name: /Create Restore Point/i });
    fireEvent.click(button);
    expect(screen.getByText(/Creating.../i)).toBeInTheDocument();
  });

  it('adds terminal logs during restore point creation', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Step3 />);
    const button = screen.getByRole('button', { name: /Create Restore Point/i });
    fireEvent.click(button);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    const logs = useWizardStore.getState().terminalLogs;
    expect(logs.some((l) => l.includes('restore point'))).toBe(true);
    vi.useRealTimers();
  });

  it('completes step 3 after restore point finishes', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Step3 />);
    const button = screen.getByRole('button', { name: /Create Restore Point/i });
    fireEvent.click(button);

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(useWizardStore.getState().completedSteps[2]).toBe(true);
    vi.useRealTimers();
  });

  it('save snapshot button adds terminal log', () => {
    render(<Step3 />);
    const button = screen.getByRole('button', { name: /Save Snapshot/i });
    fireEvent.click(button);

    expect(useWizardStore.getState().terminalLogs.some((l) => l.includes('config-snapshot'))).toBe(true);
  });
});
