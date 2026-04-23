import { describe, it, expect } from 'vitest';
import * as Generators from '../src/lib/generators';

const mockResult = {
  dependencies: {
    base_image: 'ubuntu:22.04',
    pkg_manager_cmd: 'apt-get',
    system_packages: ['curl', 'git'],
    pip_packages: ['numpy'],
    shell_and_path: 'ZSH',
    network_config: '8080:80',
    local_ai_setup: 'none',
    hooks_and_skills: 'none',
    forward_ports: [3000],
    vscode_extensions: ['ms-python.python'],
    post_create_command: 'echo setup',
    docker_compose_services: '',
    cicd_pipelines: {},
    cloud_iac: { target_provider: 'none' }
  },
  metrics: {
    security_score: 95,
    est_cloud_monthly_cost: '$0',
    vulnerability_count: 0,
    best_practice_adherence: 98
  },
  readme: '# Test Project',
  lifecycle_plan: []
};

describe('Generators Logic', () => {
  it('should generate a valid Dockerfile', () => {
    const dockerfile = Generators.generateDockerfile(mockResult as any, false, true, true);
    expect(dockerfile).toContain('FROM ubuntu:22.04');
    expect(dockerfile).toContain('USER $USERNAME');
  });

  it('should generate a README with correct project title', () => {
    const readme = Generators.generateReadme(mockResult as any, false, true, false, true);
    expect(readme).toContain('# Test Project');
  });

  it('should generate a Windows setup script', () => {
    const script = Generators.generateWindowsSetup();
    expect(script).toContain('Write-Host');
  });
});
