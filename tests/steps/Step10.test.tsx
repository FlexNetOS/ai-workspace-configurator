import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Step10 from '../../src/components/steps/Step10';
import useWizardStore from '../../src/store/wizardStore';
import { resetAllStores } from '../test-utils';

describe('Step10 - Review Your Plan', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('renders the step title', () => {
    render(<Step10 />);
    expect(screen.getByText(/Review Your Plan/i)).toBeInTheDocument();
  });

  it('renders stats summary', () => {
    render(<Step10 />);
    // Use getAllByText since "Accounts" appears in multiple places
    const packages = screen.getAllByText(/Packages/i);
    expect(packages.length).toBeGreaterThan(0);
    const diskSpace = screen.getAllByText(/Disk Space/i);
    expect(diskSpace.length).toBeGreaterThan(0);
  });

  it('renders security score section', () => {
    render(<Step10 />);
    expect(screen.getByText(/Security Score/i)).toBeInTheDocument();
  });

  it('renders plan sections with details', () => {
    render(<Step10 />);
    expect(screen.getByText(/Core System/i)).toBeInTheDocument();
    expect(screen.getByText(/Containers/i)).toBeInTheDocument();
    expect(screen.getByText(/Development Tools/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Stack/i)).toBeInTheDocument();
  });

  it('checkbox is unchecked initially', () => {
    render(<Step10 />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('approve button is disabled when checkbox is unchecked', () => {
    render(<Step10 />);
    const button = screen.getByRole('button', { name: /Approve & Begin Installation/i });
    expect(button).toBeDisabled();
  });

  it('can check the understanding checkbox', () => {
    render(<Step10 />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('approve button is enabled after checking', () => {
    render(<Step10 />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const button = screen.getByRole('button', { name: /Approve & Begin Installation/i });
    expect(button).toBeEnabled();
  });

  it('approving sets planApproved and completes step 10', () => {
    render(<Step10 />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const button = screen.getByRole('button', { name: /Approve & Begin Installation/i });
    fireEvent.click(button);

    expect(useWizardStore.getState().planApproved).toBe(true);
    expect(useWizardStore.getState().completedSteps[9]).toBe(true);
  });

  it('shows selected providers when providers are selected', () => {
    useWizardStore.getState().toggleProvider('docker');
    useWizardStore.getState().toggleProvider('github');

    render(<Step10 />);
    expect(screen.getByText(/Selected Providers/i)).toBeInTheDocument();
    // Provider names appear as tags
    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });
});
