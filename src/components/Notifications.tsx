import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationProps {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

export const Notifications: React.FC<NotificationProps> = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed bottom-12 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`pointer-events-auto p-4 rounded-lg shadow-2xl border flex gap-3 items-start backdrop-blur-md ${
              n.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100' :
              n.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-100' :
              'bg-blue-950/90 border-blue-500/50 text-blue-100'
            }`}
          >
            <div className="mt-0.5">
              {n.type === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
              {n.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
              {n.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
            </div>
            <div className="flex-1">
              <p className="text-xs font-mono font-bold leading-tight uppercase tracking-wider">{n.type === 'success' ? 'SYSTEM_CONFIRM' : n.type === 'error' ? 'CRITICAL_FAULT' : 'ARCHITECT_INFO'}</p>
              <p className="text-[11px] mt-1 opacity-80 leading-relaxed font-medium">{n.message}</p>
            </div>
            <button 
              onClick={() => removeNotification(n.id)}
              className="mt-0.5 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
