import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Step2 from '@/components/steps/Step2';
import useWizardStore from '@/store/wizardStore';
import { resetAllStores } from '../test-utils';

describe('Step2', () => {
  beforeEach(() => {
    resetAllStores();
    vi.restoreAllMocks();
  });

  it('renders AI provider section title', () => {
    render(<Step2 />);
    expect(screen.getByText('Connect Your AI')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Anthropic')).toBeInTheDocument();
    expect(screen.getByText('Kimi')).toBeInTheDocument();
    expect(screen.getByText('Google Gemini')).toBeInTheDocument();
  });

  it('renders service provider section', () => {
    render(<Step2 />);
    expect(screen.getByText('Service Providers')).toBeInTheDocument();
    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('opens API key modal when connecting OpenAI', async () => {
    render(<Step2 />);
    // Get the Connect button inside the OpenAI card specifically
    const openaiCard = screen.getByText('OpenAI').closest('div')?.parentElement;
    const connectBtn = openaiCard?.querySelector('button');
    expect(connectBtn).toBeTruthy();
    expect(connectBtn?.textContent).toBe('Connect');

    await act(async () => {
      fireEvent.click(connectBtn!);
    });

    await waitFor(() => {
      expect(screen.getByText('Connect OpenAI')).toBeInTheDocument();
    });
  });

  it('links AI provider when API key is submitted', async () => {
    render(<Step2 />);

    // Open modal for OpenAI
    const openaiCard = screen.getByText('OpenAI').closest('div')?.parentElement;
    const connectBtn = openaiCard?.querySelector('button');
    await act(async () => { fireEvent.click(connectBtn!); });

    // Enter API key
    const input = screen.getByPlaceholderText('sk-...');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'sk-test123' } });
    });

    // Submit via the modal's Connect button (specific button inside modal)
    const modal = screen.getByText('Connect OpenAI').closest('div')?.parentElement;
    const submitBtn = modal?.querySelector('button[style*="linear-gradient"]');
    await act(async () => {
      fireEvent.click(submitBtn!);
    });

    await waitFor(() => {
      const openai = useWizardStore.getState().aiProviders.find((p) => p.id === 'openai');
      expect(openai?.status).toBe('real_linked');
      expect(openai?.authRef).toBe('sk-test123');
    });
  });

  it('queues CLI install when AI provider is linked', async () => {
    render(<Step2 />);

    const openaiCard = screen.getByText('OpenAI').closest('div')?.parentElement;
    const connectBtn = openaiCard?.querySelector('button');
    await act(async () => { fireEvent.click(connectBtn!); });

    const input = screen.getByPlaceholderText('sk-...');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'sk-test' } });
    });

    const modal = screen.getByText('Connect OpenAI').closest('div')?.parentElement;
    const submitBtn = modal?.querySelector('button[style*="linear-gradient"]');
    await act(async () => {
      fireEvent.click(submitBtn!);
    });

    await waitFor(() => {
      expect(useWizardStore.getState().pendingCliInstalls).toContain('@openai/cli');
    });
  });

  it('can disconnect an AI provider', async () => {
    // Pre-link OpenAI
    useWizardStore.getState().setAiProviderStatus('openai', 'real_linked', {
      authKind: 'real',
      authRef: 'sk-test',
    });

    render(<Step2 />);

    // Find Disconnect button in OpenAI card
    const openaiCard = screen.getByText('OpenAI').closest('div')?.parentElement;
    const disconnectBtn = openaiCard?.querySelector('button');
    expect(disconnectBtn?.textContent).toBe('Disconnect');

    await act(async () => {
      fireEvent.click(disconnectBtn!);
    });

    await waitFor(() => {
      const openai = useWizardStore.getState().aiProviders.find((p) => p.id === 'openai');
      expect(openai?.status).toBe('disconnected');
    });
  });

  it('shows preferred browser hint when browser is selected', () => {
    useWizardStore.getState().setPreferredBrowser('chrome');
    render(<Step2 />);
    expect(screen.getByText(/OAuth flows will open in Chrome/i)).toBeInTheDocument();
  });
});
