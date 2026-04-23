import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Step15 from '../../src/components/steps/Step15';
import useWizardStore from '../../src/store/wizardStore';
import { resetAllStores } from '../test-utils';

describe('Step15 - Final Validation & Tuning', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('renders the step title', () => {
    render(<Step15 />);
    expect(screen.getByText(/Final Validation & Tuning/i)).toBeInTheDocument();
  });

  it('renders benchmark results section', () => {
    render(<Step15 />);
    expect(screen.getByText(/Benchmark Results/i)).toBeInTheDocument();
    expect(screen.getByText(/CPU Multi-Core/i)).toBeInTheDocument();
    expect(screen.getByText(/GPU CUDA/i)).toBeInTheDocument();
  });

  it('renders tuning items', () => {
    render(<Step15 />);
    expect(screen.getByText(/WSL memory limit/i)).toBeInTheDocument();
    expect(screen.getByText(/CPU affinity/i)).toBeInTheDocument();
    expect(screen.getByText(/GPU power management/i)).toBeInTheDocument();
  });

  it('completes step 15 when tuning is applied', () => {
    render(<Step15 />);
    const button = screen.getByRole('button', { name: /Finish Setup & Celebrate/i });
    fireEvent.click(button);

    expect(useWizardStore.getState().tuningApplied).toBe(true);
    expect(useWizardStore.getState().completedSteps[14]).toBe(true);
  });

  it('shows completion stats after finishing', () => {
    // Complete some steps first
    const store = useWizardStore.getState();
    store.completeStep(1);
    store.completeStep(2);
    store.completeStep(3);

    render(<Step15 />);
    // Click finish to show completion stats
    const button = screen.getByRole('button', { name: /Finish Setup & Celebrate/i });
    fireEvent.click(button);

    // Now the completion stats should be visible
    expect(document.body.textContent).toMatch(/\d+\s+steps\s+completed/i);
    expect(document.body.textContent).toMatch(/Your Workspace is Ready/i);
  });
});
