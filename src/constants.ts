import { Shield, Code2, Brain, type LucideIcon } from 'lucide-react';

export interface Blueprint {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: LucideIcon;
  tags: string[];
}

export const BLUEPRINTS: Blueprint[] = [
  {
    id: 'ai-scientist',
    title: 'AI/ML Data Scientist',
    description: 'NVIDIA CUDA development stack with Jupyter, PyTorch, and TensorBoard integration.',
    prompt: 'Generate an AI/ML environment with CUDA 13.2 support, PyTorch, Jupyter Lab, and automated model versioning via DVC.',
    icon: Brain,
    tags: ['GPU', 'Python', 'ML']
  },
  {
    id: 'fullstack-dev',
    title: 'Modern Fullstack Dev',
    description: 'Turbo-optimized Node.js/React environment with Redis, Postgres, and Docker Compose orchestration.',
    prompt: 'Generate a fullstack Node.js and React development stack using Docker Compose, including PostgreSQL, Redis, and a custom nginx proxy.',
    icon: Code2,
    tags: ['Web', 'Node', 'SQL']
  },
  {
    id: 'sec-auditor',
    title: 'Security Auditor',
    description: 'Hardened Kali-based environment with automated scanning tools and isolated network namespaces.',
    prompt: 'Synthesize a security auditing workspace with Kali Linux base, Metasploit, Nmap, and automated report generation scripts.',
    icon: Shield,
    tags: ['Security', 'Linux', 'Audit']
  }
];

export const HARDWARE_TAGS = ['Workstation', 'Laptop', 'Edge Node', 'Cloud Runner', 'Cluster Node'];
