import { motion } from 'framer-motion';
import {
  Check,
  Settings,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

export interface StepInfo {
  number: number;
  name: string;
  description: string;
  icon: string;
}

interface StepSidebarProps {
  steps: StepInfo[];
  currentStep: number;
  completedSteps: boolean[];
  onStepClick: (step: number) => void;
}

export default function StepSidebar({ steps, currentStep, completedSteps, onStepClick }: StepSidebarProps) {
  const completedCount = completedSteps.filter(Boolean).length;

  return (
    <div className="w-[280px] min-w-[280px] bg-[#0B1120] border-r border-[rgba(255,255,255,0.06)] flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#06B6D4] flex items-center justify-center">
            <Settings className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[18px] font-semibold text-[#F0F4F8] tracking-[-0.01em]">Setup Wizard</span>
        </div>
        <p className="text-[12px] text-[#64748B] tracking-[0.02em]">
          {completedCount} of {steps.length} steps completed
        </p>
        <div className="mt-3 h-1 w-full rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' }}
            animate={{ width: `${(completedCount / steps.length) * 100}%` }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {steps.map((step) => {
          const isCompleted = completedSteps[step.number - 1];
          const isActive = currentStep === step.number;
          const isClickable = isCompleted || isActive || step.number <= completedCount + 1;

          return (
            <motion.button
              key={step.number}
              onClick={() => isClickable && onStepClick(step.number)}
              className={`relative w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                isClickable ? 'cursor-pointer hover:bg-[rgba(255,255,255,0.02)]' : 'cursor-default opacity-50'
              }`}
              whileHover={isClickable ? { x: 2 } : {}}
              transition={{ duration: 0.15 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeStep"
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full"
                  style={{ background: 'linear-gradient(180deg, #2563EB, #06B6D4)' }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
                />
              )}

              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                  isCompleted
                    ? 'bg-[#10B981] text-white'
                    : isActive
                    ? 'bg-[#2563EB] text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]'
                    : 'border border-[#475569] text-[#64748B]'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px] font-mono font-bold tracking-[0.08em]">{step.number}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className={`text-[13px] font-medium truncate ${
                  isActive ? 'text-[#F0F4F8]' : isCompleted ? 'text-[#94A3B8]' : 'text-[#64748B]'
                }`}>
                  {step.name}
                </div>
                <div className="text-[11px] text-[#475569] truncate">{step.description}</div>
              </div>

              {isCompleted && (
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
              )}
              {isActive && (
                <ChevronRight className="w-4 h-4 text-[#2563EB] shrink-0" />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
        <p className="text-[11px] text-[#475569] tracking-[0.02em]">
          Est. time remaining: ~{Math.max(0, Math.round((15 - completedCount) * 3))} min
        </p>
      </div>
    </div>
  );
}
