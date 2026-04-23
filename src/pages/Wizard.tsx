import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';

import Step1 from '@/components/steps/Step1';
import Step2 from '@/components/steps/Step2';
import Step3 from '@/components/steps/Step3';
import Step4 from '@/components/steps/Step4';
import Step5 from '@/components/steps/Step5';
import Step6 from '@/components/steps/Step6';
import Step7 from '@/components/steps/Step7';
import Step8 from '@/components/steps/Step8';
import Step9 from '@/components/steps/Step9';
import Step10 from '@/components/steps/Step10';
import Step11 from '@/components/steps/Step11';
import Step12 from '@/components/steps/Step12';
import Step13 from '@/components/steps/Step13';
import Step14 from '@/components/steps/Step14';
import Step15 from '@/components/steps/Step15';

import useWizardStore from '@/store/wizardStore';

import Terminal from '@/components/Terminal';
import StepSidebar, { type StepInfo } from '@/components/StepSidebar';
import ActionBar from '@/components/ActionBar';
import { Save } from 'lucide-react';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ animation variants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const stepVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -20 },
};
const easeEnter: [number, number, number, number] = [0, 0, 0.2, 1];
const easeSmooth: [number, number, number, number] = [0.4, 0, 0.2, 1];

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ step definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const WIZARD_STEPS: StepInfo[] = [
  { number: 1,  name: 'Initialize Configurator',    description: 'Welcome & setup',      icon: 'Download' },
  { number: 2,  name: 'Select Provider & Policy',     description: 'Choose services',      icon: 'Settings' },
  { number: 3,  name: 'Create Rollback Checkpoint',   description: 'Safety net',           icon: 'Save' },
  { number: 4,  name: 'Verify Security & Readiness',  description: 'System checks',        icon: 'Shield' },
  { number: 5,  name: 'Install PowerShell',           description: 'PowerShell 7.x',       icon: 'Terminal' },
  { number: 6,  name: 'Windows Update & Apps',        description: 'Update everything',    icon: 'RefreshCw' },
  { number: 7,  name: 'Discover Hardware',            description: 'Hardware scan',        icon: 'Cpu' },
  { number: 8,  name: 'Device Registration',          description: 'Register devices',     icon: 'Monitor' },
  { number: 9,  name: 'Link Accounts',                description: 'Connect accounts',     icon: 'Link2' },
  { number: 10, name: 'Approve Final Plan',           description: 'Review & approve',     icon: 'CheckCircle2' },
  { number: 11, name: 'Apply Configurations',         description: 'Run install scripts',  icon: 'Play' },
  { number: 12, name: 'Install Full Stack',           description: 'Dev environment',      icon: 'Layers' },
  { number: 13, name: 'Run E2E Tests',                description: 'Verify setup',         icon: 'TestTube' },
  { number: 14, name: 'Provision Environment',        description: 'Create workspaces',    icon: 'Boxes' },
  { number: 15, name: 'Hardware Tuning',              description: 'Optimize & celebrate', icon: 'Trophy' },
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN WIZARD COMPONENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Resume Prompt â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ResumePrompt({ onResume, onRestart }: { onResume: () => void; onRestart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(2,6,23,0.85)] backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0B1120] p-8 max-w-[420px] w-full mx-4 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-[rgba(37,99,235,0.08)] flex items-center justify-center mx-auto mb-5">
          <Save className="w-7 h-7 text-[#2563EB]" />
        </div>
        <h2 className="text-[22px] font-bold text-[#F0F4F8] tracking-[-0.02em] mb-2">
          Welcome Back!
        </h2>
        <p className="text-[14px] text-[#94A3B8] mb-6 leading-[1.5]">
          You have a saved setup in progress. Would you like to resume where you left off or start fresh?
        </p>
        <div className="flex flex-col gap-3">
          <motion.button
            onClick={onResume}
            className="w-full py-3 rounded-[10px] text-[14px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
            whileHover={{ y: -1, boxShadow: '0 0 20px rgba(37,99,235,0.25)' }}
            whileTap={{ scale: 0.97 }}
          >
            Resume Setup
          </motion.button>
          <motion.button
            onClick={onRestart}
            className="w-full py-3 rounded-[10px] text-[14px] font-semibold text-[#94A3B8] border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)] transition-all"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            Start Fresh
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Wizard() {
  const currentStep = useWizardStore((s) => s.currentStep);
  const completedSteps = useWizardStore((s) => s.completedSteps);
  const isExecuting = useWizardStore((s) => s.isExecuting);
  const setIsExecuting = useWizardStore((s) => s.setIsExecuting);
  const setCurrentStep = useWizardStore((s) => s.setCurrentStep);
  const terminalLogs = useWizardStore((s) => s.terminalLogs);
  const showTerminal = useWizardStore((s) => s.showTerminal);
  const setShowTerminal = useWizardStore((s) => s.setShowTerminal);
  const clearTerminalLogs = useWizardStore((s) => s.clearTerminalLogs);
  const reset = useWizardStore((s) => s.reset);

  const totalSteps = 15;
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  // Resume prompt state
  const [showResumePrompt, setShowResumePrompt] = useState(() => {
    const saved = localStorage.getItem('workspace_wizard_state');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return data.state && data.state.completedSteps && data.state.completedSteps.some(Boolean);
      } catch { /* ignore */ }
    }
    return false;
  });

  const canGoBack = currentStep > 1 && !isExecuting;
  const canGoNext = completedSteps[currentStep - 1] && !isExecuting;

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      clearTerminalLogs();
    }
  }, [currentStep, setCurrentStep, clearTerminalLogs]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps && completedSteps[currentStep - 1]) {
      setCurrentStep(currentStep + 1);
      clearTerminalLogs();
    }
  }, [currentStep, completedSteps, setCurrentStep, clearTerminalLogs]);

  const handleRun = useCallback(() => {
    setIsExecuting(true);
    setShowTerminal(true);
    // Steps are responsible for calling completeStep() when their execution finishes
  }, [setIsExecuting, setShowTerminal]);

  const handleStepClick = useCallback((step: number) => {
    if (step <= currentStep + 1 || completedSteps[step - 1]) {
      setCurrentStep(step);
      clearTerminalLogs();
    }
  }, [currentStep, completedSteps, setCurrentStep, clearTerminalLogs]);

  const handleSaveExit = useCallback(() => {
    // State is auto-saved via Zustand persist. Show confirmation toast.
    if (typeof window !== 'undefined') {
      alert('Your progress has been saved! You can resume anytime by reopening the wizard.');
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (canGoNext) handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (canGoBack) handleBack();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canGoNext, canGoBack, handleNext, handleBack]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:  return <Step1 />;
      case 2:  return <Step2 />;
      case 3:  return <Step3 />;
      case 4:  return <Step4 />;
      case 5:  return <Step5 />;
      case 6:  return <Step6 />;
      case 7:  return <Step7 />;
      case 8:  return <Step8 />;
      case 9:  return <Step9 />;
      case 10: return <Step10 />;
      case 11: return <Step11 />;
      case 12: return <Step12 />;
      case 13: return <Step13 />;
      case 14: return <Step14 />;
      case 15: return <Step15 />;
      default: return <Step1 />;
    }
  };

  return (
    <>
      {showResumePrompt && (
        <ResumePrompt
          onResume={() => setShowResumePrompt(false)}
          onRestart={() => {
            reset();
            setShowResumePrompt(false);
          }}
        />
      )}
      <div className="flex h-screen bg-[#020617] overflow-hidden">
      {/* Step Sidebar */}
      <StepSidebar
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Progress Bar */}
        <div className="h-1 bg-[rgba(255,255,255,0.04)] shrink-0">
          <motion.div
            className="h-full"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: easeSmooth }}
          />
        </div>

        {/* Content + Terminal */}
        <div className="flex flex-1 overflow-hidden">
          {/* Step Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: easeEnter }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Terminal Side Panel */}
          <AnimatePresence>
            {showTerminal && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 380, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: easeSmooth }}
                className="border-l border-[rgba(255,255,255,0.06)] bg-[#020617] overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(255,255,255,0.06)]">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">Execution Log</span>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={clearTerminalLogs}
                      className="text-[10px] text-[#64748B] hover:text-[#94A3B8] transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      Clear
                    </motion.button>
                    <motion.button
                      onClick={() => setShowTerminal(false)}
                      className="text-[10px] text-[#64748B] hover:text-[#94A3B8] transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      Hide
                    </motion.button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Terminal logs={terminalLogs} isRunning={isExecuting} className="h-full border-0 rounded-none" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Action Bar */}
        <ActionBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          isExecuting={isExecuting}
          canGoNext={canGoNext}
          canGoBack={canGoBack}
          onBack={handleBack}
          onNext={handleNext}
          onRun={handleRun}
          onSaveExit={handleSaveExit}
        />
      </div>
    </div>
    </>
  );
}
