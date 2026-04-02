import { createContext, useContext, useEffect, useState, Dispatch, ReactNode, SetStateAction } from 'react';

import UserNotification from '@/models/Notification';

const STORAGE_KEY = 'aasNotifications';
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

interface NotificationContextProps {
  requestPermission: () => Promise<void>;
  notifications: UserNotification[];
  setNotifications: Dispatch<SetStateAction<UserNotification[]>>;
  clearNotifications: () => void;
  isSupported: boolean;
  showBadge: boolean;
  hideBadge: () => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

const cleanOldNotifications = (list: UserNotification[]): UserNotification[] => {
  const oneWeekAgo = Date.now() - WEEK_IN_MS;
  return list.filter(n => new Date(n.received_at).getTime() > oneWeekAgo);
};

const loadFromStorage = (): UserNotification[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return cleanOldNotifications(JSON.parse(stored) as UserNotification[]);
  } catch {
    // ignore parse errors
  }
  return [];
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<UserNotification[]>(loadFromStorage);
  const [showBadge, setShowBadge] = useState(false);

  // Persist to localStorage whenever notifications change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // ignore quota errors
    }
  }, [notifications]);

  const clearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hideBadge = () => setShowBadge(false);

  // No-op: push permission is not relevant without Firebase/Capacitor
  const requestPermission = async () => {};

  return (
    <NotificationContext.Provider value={{
      requestPermission,
      notifications,
      setNotifications,
      clearNotifications,
      isSupported: false,
      showBadge,
      hideBadge,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext deve essere usato all\'interno di NotificationProvider');
  }
  return context;
};