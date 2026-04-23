import { useState, useCallback } from 'react';
import type { NotificationType } from '../components/Notifications';

export interface NotificationEntry {
  id: string;
  message: string;
  type: NotificationType;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);

  const notify = useCallback((message: string, type: NotificationType = 'info') => {
    const id = `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return { notifications, notify, removeNotification };
};
