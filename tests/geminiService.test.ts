import { describe, it, expect, vi } from 'vitest';
import { generateDevOpsWorkspace } from '../src/services/geminiService';

// Mocking the GoogleGenAI SDK as a class
vi.mock('@google/genai', () => {
  const mockGenerateContent = vi.fn().mockResolvedValue({
    text: JSON.stringify({
      dependencies: {
        base_image: 'pop-os:latest',
        pkg_manager_cmd: 'apt',
        system_packages: [],
        pip_packages: [],
        forward_ports: [8080],
        vscode_extensions: [],
        cicd_pipelines: {}
      },
      metrics: {
        security_score: 90,
        est_cloud_monthly_cost: '$50',
        vulnerability_count: 2,
        best_practice_adherence: 85
      },
      readme: '# AI Project',
      lifecycle_plan: [
        { id: 1, title: 'Step 1', description: 'Desc 1', status: 'pending', logs: [] }
      ]
    })
  });

  return {
    GoogleGenAI: vi.fn().mockImplementation(function (this: any) {
      this.models = {
        generateContent: mockGenerateContent
      };
    }),
    Type: {
      OBJECT: 'object',
      STRING: 'string',
      ARRAY: 'array',
      NUMBER: 'number',
      BOOLEAN: 'boolean',
      INTEGER: 'integer'
    }
  };
});

describe('Gemini Service', () => {
  it('should process and return a valid workspace configuration', async () => {
    const result = await generateDevOpsWorkspace('test prompt');
    expect(result.dependencies.base_image).toBe('pop-os:latest');
    expect(result.lifecycle_plan).toHaveLength(1);
    // Verify status mapping in service level
    expect(result.lifecycle_plan[0].status).toBe('idle');
  });
});
