import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import useWizardStore from '@/store/wizardStore';
import { containerVariants, cardVariants } from './variants';

export default function Step12() {
  const { addTerminalLog, completeStep } = useWizardStore();
  const [subSteps, setSubSteps] = useState([
    { id: 'docker', name: 'Docker Desktop', desc: 'Container runtime and GUI', status: 'queued', progress: 0 },
    { id: 'wsl2', name: 'WSL2 Kernel', desc: 'Windows Subsystem for Linux', status: 'queued', progress: 0 },
    { id: 'ubuntu', name: 'Ubuntu Distro', desc: 'Ubuntu 22.04 LTS', status: 'queued', progress: 0 },
    { id: 'shell', name: 'Zsh + OhMyZsh', desc: 'Modern shell with plugins', status: 'queued', progress: 0 },
    { id: 'zed', name: 'ZED IDE', desc: 'High-performance code editor', status: 'queued', progress: 0 },
    { id: 'llama', name: 'llama.cpp Build', desc: 'Local AI inference engine', status: 'queued', progress: 0 },
    { id: 'models', name: 'AI Models', desc: 'Qwen 2.5 7B + optional models', status: 'queued', progress: 0 },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (subSteps.every((s) => s.status === 'done')) {
      completeStep(12);
    }
  }, [subSteps, completeStep]);

  const runInstall = () => {
    setIsRunning(true);
    let delay = 0;

    subSteps.forEach((step, idx) => {
      setTimeout(() => {
        setSubSteps((prev) => prev.map((s, i) => i === idx ? { ...s, status: 'running' } : s));
        addTerminalLog(`> [${step.name}] Starting installation...`);

        const stepLogs: Record<string, string[]> = {
          docker: ['> Pulling Docker Desktop 4.28.0...', '> Installing MSI package...', '> Starting Docker Desktop service...', '> ✓ Docker daemon running'],
          wsl2: ['> Updating WSL2 kernel...', '> Setting default version 2...', '> ✓ WSL2 kernel updated'],
          ubuntu: ['> Downloading Ubuntu 22.04...', '> [####------] 40%', '> [########--] 80%', '> [##########] 100%', '> Configuring default user...', '> ✓ Ubuntu installed'],
          shell: ['> Installing Zsh...', '> Cloning OhMyZsh...', '> Installing plugins (git, docker, vscode)...', '> ✓ Shell configured'],
          zed: ['> Downloading Zed IDE...', '> Installing extensions...', '> ✓ Zed IDE ready'],
          llama: ['> Cloning llama.cpp...', '> cmake -B build -DLLAMA_CUDA=ON...', '> cmake --build build --config Release -j24...', '> Installing to ~/.local/bin...', '> ✓ llama.cpp built with CUDA'],
          models: ['> Downloading Qwen 2.5 7B...', '> [######----] 60%', '> [##########] 100%', '> Verifying model integrity...', '> ✓ Model ready for inference'],
        };

        const logs = stepLogs[step.id] || ['> Installing...'];
        logs.forEach((l, li) => {
          setTimeout(() => {
            addTerminalLog(l);
            setSubSteps((prev) => prev.map((s, i) => i === idx ? { ...s, progress: ((li + 1) / logs.length) * 100 } : s));
          }, li * 300);
        });

        setTimeout(() => {
          setSubSteps((prev) => prev.map((s, i) => i === idx ? { ...s, status: 'done', progress: 100 } : s));
          addTerminalLog(`> ✓ [${step.name}] Complete`);
        }, logs.length * 300 + 200);
      }, delay);
      delay += 2500;
    });

    setTimeout(() => setIsRunning(false), delay + 500);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-5 h-5 text-[#10B981]" />;
      case 'running': return <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />;
      default: return <div className="w-5 h-5 rounded-full border-2 border-[#475569]" />;
    }
  };

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants}>
        <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Build Your Development Stack</h1>
        <p className="text-[14px] text-[#94A3B8]">Installing the full development environment layer by layer.</p>
      </motion.div>

      {!isRunning && subSteps[0].status === 'queued' && (
        <motion.button
          variants={cardVariants}
          onClick={runInstall}
          className="px-5 py-2.5 rounded-[10px] text-[13px] font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          Install Full Stack
        </motion.button>
      )}

      <div className="space-y-3">
        {subSteps.map((step, i) => (
          <motion.div
            key={step.id}
            variants={cardVariants}
            className={`rounded-2xl border p-5 transition-all ${
              step.status === 'done'
                ? 'border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.02)]'
                : 'border-[rgba(255,255,255,0.06)] bg-[#0B1120]'
            }`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-center gap-3">
              {statusIcon(step.status)}
              <div className="flex-1">
                <h3 className="text-[14px] font-semibold text-[#F0F4F8]">{step.name}</h3>
                <p className="text-[12px] text-[#64748B]">{step.desc}</p>
              </div>
              {step.status === 'done' && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#10B981]">Complete</span>
              )}
            </div>
            {step.status === 'running' && (
              <div className="mt-3">
                <Progress value={step.progress} className="h-1.5" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
