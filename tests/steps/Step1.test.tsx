import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Step1 from '@/components/steps/Step1';
import useWizardStore from '@/store/wizardStore';
import { resetAllStores } from '../test-utils';

describe('Step1', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('renders title and welcome content', () => {
    render(<Step1 />);
    expect(screen.getByText('Your AI Workspace, Automated')).toBeInTheDocument();
    expect(screen.getByText('System Readiness Check')).toBeInTheDocument();
  });

  it('renders browser selection section', () => {
    render(<Step1 />);
    expect(screen.getByText('Preferred Browser')).toBeInTheDocument();
    expect(screen.getByText('Chrome')).toBeInTheDocument();
    expect(screen.getByText('Edge')).toBeInTheDocument();
    expect(screen.getByText('Firefox')).toBeInTheDocument();
    expect(screen.getByText('Chromium')).toBeInTheDocument();
    expect(screen.getByText('Safari')).toBeInTheDocument();
    expect(screen.getByText('Comet')).toBeInTheDocument();
  });

  it('updates store when browser is selected', () => {
    render(<Step1 />);
    const chromeButton = screen.getByText('Chrome').closest('button');
    expect(chromeButton).toBeTruthy();
    fireEvent.click(chromeButton!);
    expect(useWizardStore.getState().preferredBrowser).toBe('chrome');
  });

  it('shows download setup scripts section', () => {
    render(<Step1 />);
    expect(screen.getByText('Download Setup Scripts')).toBeInTheDocument();
  });
});
