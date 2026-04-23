import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Code2, Server, Cpu, Package, Loader2 } from 'lucide-react';
import useWizardStore from '@/store/wizardStore';
import { containerVariants, cardVariants } from './variants';

export default function Step14() {
  const { addTerminalLog, environmentsProvisioned, addEnvironment, completeStep } = useWizardStore();
  const [provisioning, setProvisioning] = useState<string | null>(null);

  useEffect(() => {
    if (environmentsProvisioned.length > 0) {
      completeStep(14);
    }
  }, [environmentsProvisioned, completeStep]);

  const environments = [
    {
      id: 'sandbox',
      name: 'Sandbox',
      desc: 'A safe place to experiment with AI models and code without breaking anything.',
      icon: <FlaskConical className="w-8 h-8 text-[#F59E0B]" />,
      resources: '2 CPU cores, 4GB RAM, isolated network',
      includes: 'Jupyter Lab, sample notebooks, test data',
      color: '#F59E0B',
    },
    {
      id: 'development',
      name: 'Development',
      desc: 'Your main coding environment with all tools pre-configured.',
      icon: <Code2 className="w-8 h-8 text-[#2563EB]" />,
      resources: '4 CPU cores, 8GB RAM, Git integration',
      includes: 'Zed IDE, Git, pre-commit hooks, linting',
      color: '#2563EB',
    },
    {
      id: 'simulation',
      name: 'Production Simulation',
      desc: 'A mini production setup for testing deployments.',
      icon: <Server className="w-8 h-8 text-[#10B981]" />,
      resources: '2 CPU cores, 4GB RAM, Docker Compose stack',
      includes: 'Nginx, PostgreSQL, Redis, monitoring',
      color: '#10B981',
    },
  ];

  const provision = (env: typeof environments[0]) => {
    setProvisioning(env.id);
    addTerminalLog(`> Creating ${env.name.toLowerCase()} environment...`);

    const logs = [
      `> Pulling container images...`,
      `> Configuring isolated network...`,
      `> Mounting workspace volumes...`,
      `> Starting services...`,
      `> ✓ ${env.name} environment ready!`,
    ];
    logs.forEach((l, i) => setTimeout(() => addTerminalLog(l), i * 400));

    setTimeout(() => {
      addEnvironment(env.id);
      setProvisioning(null);
    }, logs.length * 400 + 200);
  };

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants}>
        <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Create Your Environments</h1>
        <p className="text-[14px] text-[#94A3B8] max-w-[600px] leading-[1.6]">
          Set up isolated workspaces for different types of work. Each environment is independent.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {environments.map((env) => {
          const isProvisioned = environmentsProvisioned.includes(env.id);
          const isProvisioning = provisioning === env.id;

          return (
            <motion.div
              key={env.id}
              variants={cardVariants}
              className={`rounded-2xl border p-6 transition-all ${
                isProvisioned
                  ? 'border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.02)]'
                  : 'border-[rgba(255,255,255,0.06)] bg-[#0B1120]'
              }`}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${env.color}15` }}>
                  {env.icon}
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-[#F0F4F8]">{env.name}</h3>
                  {isProvisioned && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-[10px] font-mono uppercase tracking-wider text-[#10B981]"
                    >
                      ✓ Provisioned
                    </motion.span>
                  )}
                </div>
              </div>

              <p className="text-[13px] text-[#94A3B8] mb-4 leading-[1.5]">{env.desc}</p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-[#64748B]" />
                  <span className="text-[12px] text-[#64748B]">{env.resources}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-[#64748B]" />
                  <span className="text-[12px] text-[#64748B]">{env.includes}</span>
                </div>
              </div>

              <motion.button
                onClick={() => provision(env)}
                disabled={isProvisioned || isProvisioning}
                className="w-full py-2.5 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-40 transition-all"
                style={!isProvisioned ? { background: `linear-gradient(135deg, ${env.color} 0%, ${env.color}88 100%)` } : {}}
                whileHover={!isProvisioned && !isProvisioning ? { y: -1 } : {}}
                whileTap={{ scale: 0.97 }}
              >
                {isProvisioning ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Provisioning...</span>
                ) : isProvisioned ? (
                  'Provisioned'
                ) : (
                  `Create ${env.name}`
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
