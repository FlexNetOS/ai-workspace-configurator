import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogOut, Play, Loader2 } from 'lucide-react';

interface ActionBarProps {
  currentStep: number;
  totalSteps: number;
  isExecuting: boolean;
  canGoNext: boolean;
  canGoBack: boolean;
  onBack: () => void;
  onNext: () => void;
  onRun: () => void;
  onSaveExit?: () => void;
}

export default function ActionBar({
  currentStep,
  totalSteps,
  isExecuting,
  canGoNext,
  canGoBack,
  onBack,
  onNext,
  onRun,
  onSaveExit,
}: ActionBarProps) {
  const stepNames = [
    'Initialize Configurator',
    'Select Provider & Policy',
    'Create Rollback Checkpoint',
    'Verify Security & Readiness',
    'Install PowerShell',
    'Windows Update & Apps',
    'Discover Hardware',
    'Device Registration',
    'Link Accounts',
    'Approve Final Plan',
    'Apply Configurations',
    'Install Full Stack',
    'Run E2E Tests',
    'Provision Environment',
    'Hardware Tuning',
  ];

  const isLastStep = currentStep === totalSteps;

  return (
    <div className="h-[72px] bg-[#0B1120]/80 backdrop-blur-xl border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center">
        <motion.button
          onClick={onSaveExit}
          className="flex items-center gap-2 text-[13px] text-[#94A3B8] hover:text-[#F0F4F8] transition-colors px-3 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)]"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
        >
          <LogOut className="w-4 h-4" />
          <span>Save & Exit</span>
        </motion.button>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-mono font-bold tracking-[0.08em] text-[#64748B] uppercase">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-[12px] text-[#94A3B8]">{stepNames[currentStep - 1]}</span>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          onClick={onBack}
          disabled={!canGoBack || isExecuting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-medium text-[#94A3B8] hover:text-[#F0F4F8] hover:bg-[rgba(255,255,255,0.04)] transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-[rgba(255,255,255,0.08)]"
          whileHover={canGoBack && !isExecuting ? { y: -1 } : {}}
          whileTap={canGoBack && !isExecuting ? { scale: 0.97 } : {}}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </motion.button>

        {canGoNext ? (
          <motion.button
            onClick={onNext}
            disabled={isExecuting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[13px] font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
            whileHover={!isExecuting ? { y: -1, boxShadow: '0 0 20px rgba(37,99,235,0.25)' } : {}}
            whileTap={!isExecuting ? { scale: 0.97 } : {}}
          >
            {isLastStep ? (
              <>
                <span>Finish</span>
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        ) : (
          <motion.button
            onClick={onRun}
            disabled={isExecuting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[13px] font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
            whileHover={!isExecuting ? { y: -1, boxShadow: '0 0 20px rgba(37,99,235,0.25)' } : {}}
            whileTap={!isExecuting ? { scale: 0.97 } : {}}
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run This Step</span>
              </>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}
