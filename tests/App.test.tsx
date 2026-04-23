import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../src/App';
import * as GeminiService from '../src/services/geminiService';

// Mock high-level services
vi.mock('../src/services/geminiService', () => ({
  generateDevOpsWorkspace: vi.fn(),
  validateDockerfile: vi.fn(),
}));

describe('App E2E Integration', () => {
  it('renders the initial state correctly', () => {
    render(<App />);
    expect(screen.getByText(/Architect_AI_v2.0/i)).toBeInTheDocument();
  });

  it('triggers generation and displays results', async () => {
    const mockData = {
      dependencies: {
        base_image: 'ubuntu:22.04',
        pkg_manager_cmd: 'apt',
        system_packages: [],
        pip_packages: [],
        forward_ports: [],
        vscode_extensions: [],
        cicd_pipelines: {},
        docker_compose_services: '',
        cloud_iac: { target_provider: 'none' }
      },
      metrics: {
        security_score: 95,
        est_cloud_monthly_cost: '$0',
        vulnerability_count: 0,
        best_practice_adherence: 98
      },
      readme: '# Documentation',
      lifecycle_plan: [
        { id: 1, title: 'Bootstrap', description: 'Init system', status: 'idle', logs: [] }
      ]
    };

    (GeminiService.generateDevOpsWorkspace as any).mockResolvedValue(mockData);

    render(<App />);
    
    // Switch to generator tab
    const genTab = screen.getByText(/Config Generator/i);
    fireEvent.click(genTab);

    // Wait for the textarea to be in the document
    const input = await screen.findByPlaceholderText(/INPUT_DEFINITION/i);
    fireEvent.change(input, { target: { value: 'test' } });
    
    const button = screen.getByText(/Synthesize_Config/i);
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Synthesis Output Resume/i)).toBeInTheDocument();
    }, { timeout: 4000 });
  });
});
