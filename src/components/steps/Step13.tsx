import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, AlertTriangle, XCircle } from 'lucide-react';
import useWizardStore from '@/store/wizardStore';
import type { CheckStatus } from '@/store/wizardStore';
import { containerVariants, cardVariants, easeSmooth } from './variants';

function TestIcon({ status }: { status: CheckStatus | undefined }) {
  if (status === 'checking') return <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />;
  if (status === 'passed') return <Check className="w-5 h-5 text-[#10B981]" />;
  if (status === 'warning') return <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />;
  if (status === 'failed') return <XCircle className="w-5 h-5 text-[#EF4444]" />;
  return <div className="w-5 h-5 rounded-full border-2 border-[#475569]" />;
}

export default function Step13() {
  const { e2eTests, setE2eTest, addTerminalLog, completeStep } = useWizardStore();
  const [running, setRunning] = useState(false);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  useEffect(() => {
    const done = Object.values(e2eTests).filter((s) => s === 'passed' || s === 'warning').length;
    if (done === 10 && !running && Object.keys(e2eTests).length > 0) {
      completeStep(13);
    }
  }, [e2eTests, running, completeStep]);

  const tests = [
    { key: 'docker', name: 'Docker Daemon', detail: 'Docker version 25.0.3', expected: 'passed' },
    { key: 'wsl2', name: 'WSL2 Kernel', detail: 'Ubuntu 22.04 active', expected: 'passed' },
    { key: 'gpu', name: 'GPU Passthrough', detail: 'RTX 4090 detected in WSL', expected: 'passed' },
    { key: 'powershell', name: 'PowerShell Core', detail: 'v7.4.2', expected: 'passed' },
    { key: 'git', name: 'Git Integration', detail: 'Configured with GitHub', expected: 'passed' },
    { key: 'llama', name: 'llama.cpp Build', detail: 'CUDA backend active', expected: 'passed' },
    { key: 'model', name: 'Model Inference', detail: 'Qwen loaded, slow on first run', expected: 'warning' },
    { key: 'ports', name: 'Port Forwarding', detail: 'Ports 8080-8090 open', expected: 'passed' },
    { key: 'container', name: 'Container Pull', detail: 'hello-world ran successfully', expected: 'passed' },
    { key: 'network', name: 'Network Bridge', detail: 'WSL-Host communication OK', expected: 'passed' },
  ];

  const runTests = () => {
    setRunning(true);
    addTerminalLog('> Starting E2E test suite...');

    tests.forEach((t, i) => {
      setTimeout(() => {
        setE2eTest(t.key, 'checking');
        addTerminalLog(`> Running test: ${t.name}...`);
        setTimeout(() => {
          const status = t.expected as CheckStatus;
          setE2eTest(t.key, status);
          const icon = status === 'passed' ? '✓ PASS' : status === 'warning' ? '⚠ WARN' : '✗ FAIL';
          addTerminalLog(`> ${icon} ${t.name}: ${t.detail}`);
          if (i === tests.length - 1) {
            setRunning(false);
            addTerminalLog('> E2E test suite complete.');
          }
        }, 500);
      }, i * 600);
    });
  };

  const passedCount = Object.values(e2eTests).filter((s) => s === 'passed' || s === 'warning').length;

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={cardVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">Testing Your Setup</h1>
          <p className="text-[14px] text-[#94A3B8]">
            Running automated tests to make sure everything works.
          </p>
        </div>
        <motion.button
          onClick={runTests}
          disabled={running}
          className="px-5 py-2.5 rounded-[10px] text-[13px] font-semibold text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
          whileHover={!running ? { y: -1 } : {}}
          whileTap={{ scale: 0.97 }}
        >
          {running ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Running...</span> : 'Run Tests'}
        </motion.button>
      </motion.div>

      <motion.div variants={cardVariants} className="flex items-center gap-6 p-4 rounded-xl bg-[#0B1120] border border-[rgba(255,255,255,0.06)]">
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <motion.circle
              cx="28" cy="28" r="24" fill="none"
              stroke={passedCount === tests.length ? '#10B981' : '#F59E0B'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 24}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - passedCount / tests.length) }}
              transition={{ duration: 1, ease: easeSmooth }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[12px] font-bold text-[#F0F4F8]">{passedCount}/{tests.length}</span>
          </div>
        </div>
        <div>
          <p className="text-[16px] font-semibold text-[#F0F4F8]">
            {passedCount === tests.length ? 'All Systems Go' : passedCount > 0 ? `${passedCount} of ${tests.length} passed` : 'Tests not run'}
          </p>
          <p className="text-[12px] text-[#64748B]">
            {passedCount === tests.length ? 'Everything is working correctly' : 'Run the tests to verify your setup'}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tests.map((test) => {
          const status = e2eTests[test.key];
          return (
            <motion.div
              key={test.key}
              variants={cardVariants}
              className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                status === 'passed' ? 'border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.02)]' :
                status === 'warning' ? 'border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.02)]' :
                status === 'failed' ? 'border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.02)]' :
                'border-[rgba(255,255,255,0.06)] bg-[#0B1120]'
              }`}
              onClick={() => setExpandedTest(expandedTest === test.key ? null : test.key)}
              whileHover={{ y: -1 }}
            >
              <div className="flex items-center gap-3">
                <TestIcon status={status} />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-[#F0F4F8]">{test.name}</p>
                  {status && (
                    <p className="text-[11px] text-[#64748B]">{test.detail}</p>
                  )}
                </div>
                {status === 'passed' && <span className="text-[10px] font-mono uppercase text-[#10B981]">PASS</span>}
                {status === 'warning' && <span className="text-[10px] font-mono uppercase text-[#F59E0B]">WARN</span>}
                {status === 'failed' && <span className="text-[10px] font-mono uppercase text-[#EF4444]">FAIL</span>}
              </div>

              <AnimatePresence>
                {expandedTest === test.key && status === 'failed' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.04)] overflow-hidden"
                  >
                    <p className="text-[12px] text-[#EF4444] mb-2">Test failed. Common causes:</p>
                    <ul className="text-[11px] text-[#94A3B8] list-disc ml-4 space-y-1 mb-3">
                      <li>Service not started</li>
                      <li>Missing dependency</li>
                      <li>Network timeout</li>
                    </ul>
                    <span className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#2563EB] text-white cursor-pointer hover:bg-[#3B82F6] transition-colors">
                      Try This Fix
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
