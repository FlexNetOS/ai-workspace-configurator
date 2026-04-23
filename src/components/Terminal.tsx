import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TerminalProps {
  logs: string[];
  isRunning?: boolean;
  className?: string;
}

export default function Terminal({ logs, isRunning = false, className = '' }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLineColor = (line: string): string => {
    if (line.includes('✓') || line.includes('SUCCESS') || line.includes('installed') || line.includes('complete') || line.includes('ready') || line.includes('verified')) {
      return 'text-[#10B981]';
    }
    if (line.includes('✗') || line.includes('ERROR') || line.includes('failed') || line.includes('FAIL')) {
      return 'text-[#EF4444]';
    }
    if (line.includes('⚠') || line.includes('WARN') || line.includes('Pending') || line.includes('pending')) {
      return 'text-[#F59E0B]';
    }
    if (line.includes('===') || line.includes('Checking') || line.includes('Downloading') || line.includes('Installing')) {
      return 'text-[#06B6D4]';
    }
    if (line.startsWith('>') || line.startsWith('$')) {
      return 'text-[#F0F4F8]';
    }
    return 'text-[#94A3B8]';
  };

  return (
    <div className={`rounded-xl border border-[rgba(255,255,255,0.05)] overflow-hidden bg-[#050A18] flex flex-col ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(255,255,255,0.05)]">
        <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
        <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
        <div className="w-3 h-3 rounded-full bg-[#10B981]" />
        <span className="ml-2 text-[11px] font-mono font-bold tracking-[0.08em] text-[#475569] uppercase">Terminal</span>
        {isRunning && (
          <motion.span
            className="ml-auto text-[10px] font-mono text-[#06B6D4] uppercase tracking-wider"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const }}
          >
            Running...
          </motion.span>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-[1.5] space-y-1 max-h-[400px]"
      >
        {logs.length === 0 && (
          <span className="text-[#475569]">No output yet. Start execution to see logs.</span>
        )}
        {logs.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={getLineColor(line)}
          >
            {line}
          </motion.div>
        ))}
        {isRunning && (
          <motion.span
            className="inline-block w-2 h-4 bg-[#06B6D4] ml-0.5 align-middle"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}
