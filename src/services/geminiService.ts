import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

const resolveGeminiApiKey = (): string => {
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  if (viteEnv?.VITE_GEMINI_API_KEY) return viteEnv.VITE_GEMINI_API_KEY;
  if (viteEnv?.GEMINI_API_KEY) return viteEnv.GEMINI_API_KEY;
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  return '';
};

const getAiClient = (): GoogleGenAI => {
  if (aiClient) return aiClient;
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Set VITE_GEMINI_API_KEY.');
  }
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
};

export interface WorkspaceDependencies {
  base_image: string;
  pkg_manager_cmd: string;
  system_packages: string[];
  pip_packages: string[];
  shell_and_path: string;
  network_config: string;
  local_ai_setup: string;
  hooks_and_skills: string;
  forward_ports: number[];
  vscode_extensions: string[];
  post_create_command: string;
  docker_compose_services: string;
  cicd_pipelines: {
    github_actions?: string;
    gitlab_ci?: string;
    jenkinsfile?: string;
  };
  cloud_iac?: {
    terraform?: string;
    pulumi?: string;
    target_provider: 'aws' | 'gcp' | 'azure' | 'none';
  };
}

export interface ProjectMetrics {
  security_score: number;
  est_cloud_monthly_cost: string;
  vulnerability_count: number;
  best_practice_adherence: number;
}

export interface LifecycleStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'idle';
  logs: string[];
}

export interface GenerationResult {
  dependencies: WorkspaceDependencies;
  metrics: ProjectMetrics;
  readme: string;
  lifecycle_plan: LifecycleStep[];
}

export async function generateDevOpsWorkspace(prompt: string): Promise<GenerationResult> {
  const ai = getAiClient();
  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{
      role: "user",
      parts: [{
        text: `You are a Principal AI Infrastructure Architect. Synthesize a complete high-performance environment and a 15-step workforce lifecycle plan for: "${prompt}".
        
        CRITICAL INVOLVEMENT:
        1. Base: Prioritize high-performance distros: AthenaOS (Nix-based) or Pop!_OS with NVIDIA 595+ driver stack support.
        2. Drivers: Mention Pop!_OS NVIDIA 595 driver PRs if relevant to GPU setups.
        3. Shell: Enforce ZSH + Oh My Zsh. Configure ~/.local/bin/ in PATH.
        4. Hardware: Dynamic optimization for RTX 5090 (CUDA 13.2+).
        5. Lifecycle: You MUST strictly generate exactly 15 steps in the 'lifecycle_plan' matching these mandates:
           1. Install configurator + initialize logs/artifacts
           2. User selects provider + policy → generate plan preview
           3. Create rollback checkpoint (restore point + snapshots)
           4. Verify permissions/security/install readiness (admin, UAC, virtualization, reboot pending)
           5. Install latest PowerShell via MSI + verify
           6. Run Windows Update loop + upgrade all apps (winget) until fully current
           7. Auto-discover hardware/drivers/network → inventory artifacts
           8. Identify each device; user-assisted vendor login/registration + serial/warranty + resource tagging
           9. Link accounts (Docker, GitHub, HF, OpenRouter, Notion, Google, Cloudflare, …) + validate
           10. User approves final plan
           11. Apply configs + run idempotent install scripts (resume-safe)
           12. Install stack: Docker → WSL2 → IDE/terminal → distro/home scaffolding → llama.cpp → models → CLIs
           13. Run E2E tests
           14. Provision sandbox/dev/sim environment
           15. Hardware tests + tuning + optional BIOS adjustments
        
        Return the result in JSON format.`
      }]
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dependencies: {
            type: Type.OBJECT,
            properties: {
              base_image: { type: Type.STRING },
              pkg_manager_cmd: { type: Type.STRING },
              system_packages: { type: Type.ARRAY, items: { type: Type.STRING } },
              pip_packages: { type: Type.ARRAY, items: { type: Type.STRING } },
              shell_and_path: { type: Type.STRING },
              network_config: { type: Type.STRING },
              local_ai_setup: { type: Type.STRING },
              hooks_and_skills: { type: Type.STRING },
              forward_ports: { type: Type.ARRAY, items: { type: Type.INTEGER } },
              vscode_extensions: { type: Type.ARRAY, items: { type: Type.STRING } },
              post_create_command: { type: Type.STRING },
              docker_compose_services: { type: Type.STRING },
              cicd_pipelines: {
                type: Type.OBJECT,
                properties: {
                  github_actions: { type: Type.STRING },
                  gitlab_ci: { type: Type.STRING },
                  jenkinsfile: { type: Type.STRING }
                }
              },
              cloud_iac: {
                type: Type.OBJECT,
                properties: {
                  terraform: { type: Type.STRING },
                  pulumi: { type: Type.STRING },
                  target_provider: { type: Type.STRING, enum: ['aws', 'gcp', 'azure', 'none'] }
                }
              }
            },
            required: ["base_image", "pkg_manager_cmd", "system_packages", "pip_packages", "forward_ports", "vscode_extensions", "cicd_pipelines"]
          },
          metrics: {
            type: Type.OBJECT,
            properties: {
              security_score: { type: Type.NUMBER },
              est_cloud_monthly_cost: { type: Type.STRING },
              vulnerability_count: { type: Type.NUMBER },
              best_practice_adherence: { type: Type.NUMBER }
            },
            required: ["security_score", "est_cloud_monthly_cost", "vulnerability_count", "best_practice_adherence"]
          },
          readme: { type: Type.STRING },
          lifecycle_plan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                status: { type: Type.STRING, enum: ['pending', 'running', 'completed', 'failed', 'idle'] },
                logs: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["id", "title", "description", "status", "logs"]
            }
          }
        },
        required: ["dependencies", "metrics", "readme", "lifecycle_plan"]
      }
    }
  });

  try {
    const data = JSON.parse(result.text || "{}") as GenerationResult;
    // Map initial status to idle for all steps
    data.lifecycle_plan = data.lifecycle_plan.map(s => ({ ...s, status: 'idle' }));
    return data;
  } catch (e) {
    console.error("Failed to parse Gemini response:", e);
    throw new Error("Invalid response format from AI");
  }
}

export async function validateDockerfile(dockerfile: string): Promise<{ valid: boolean, logs: string[] }> {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        role: "user",
        parts: [{
          text: `You are a Senior Docker Security & Performance Auditor. Analyze the following Dockerfile and identify errors, inconsistencies, and best practice violations.
          
          ENFORCE THESE CHECKS:
          1. Dependency Hierarchy: Check if pip packages are compatible with the base image OS and Python version.
          2. Layer Optimization: Identify if 'apt-get update' and 'install' are combined and if lists are cleaned up properly to reduce image size.
          3. Security Audit: Check for non-root user enforcement, sensitive credential leaks, and insecure 'pip install' flags.
          4. Performance: Verify parallel build flags (MAKEFLAGS) are utilized and OMP_NUM_THREADS is set.
          5. Syntax & Typos: Find typos in package names or incorrect Docker instructions.
          
          Dockerfile:
          \n\n${dockerfile}\n\n
          
          Respond in strict JSON: { "valid": boolean, "logs": [ "Detailed finding string with [CATEGORY] prefix" ] }`
        }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            valid: { type: Type.BOOLEAN },
            logs: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["valid", "logs"]
        }
      }
    });

    return JSON.parse(response.text || '{"valid": false, "logs": ["Service unreachable"]}') as { valid: boolean, logs: string[] };
  } catch (err) {
    console.error("Validation failed:", err);
    return { valid: false, logs: ["Critical Service Error: Validation sequence interrupted."] };
  }
}

