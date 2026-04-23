/**
 * MSW (Mock Service Worker) setup for API mocking in tests.
 * This mocks the Gemini API and other external services.
 */
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  // Mock Gemini API
  http.post('https://generativelanguage.googleapis.com/*', () => {
    return HttpResponse.json({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              dependencies: {
                base_image: 'ubuntu:22.04',
                pkg_manager_cmd: 'apt-get',
                system_packages: ['curl', 'git', 'build-essential'],
                pip_packages: ['numpy', 'pandas'],
                shell_and_path: 'ZSH',
                network_config: '8080:80',
                local_ai_setup: 'ollama',
                hooks_and_skills: 'pre-commit',
                forward_ports: [3000, 8080],
                vscode_extensions: ['ms-python.python'],
                post_create_command: 'echo "Setup complete"',
                docker_compose_services: '',
                cicd_pipelines: { github_actions: true },
                cloud_iac: { target_provider: 'none' }
              },
              metrics: {
                security_score: 95,
                est_cloud_monthly_cost: '$0',
                vulnerability_count: 0,
                best_practice_adherence: 98
              },
              readme: '# AI Workspace',
              lifecycle_plan: [
                { id: 1, title: 'Setup Environment', description: 'Install dependencies', status: 'pending', logs: [] }
              ]
            })
          }]
        }
      }]
    });
  }),

  // Mock any other external API calls
  http.get('*', ({ request }) => {
    console.warn(`Unhandled request: ${request.url}`);
    return new HttpResponse(null, { status: 404 });
  }),
];

export const server = setupServer(...handlers);
