import { createContext, useState, useContext, ReactNode } from 'react';

const STORAGE_KEY = 'operatorPreferences';

interface OperatorPreferences {
  visibleAlerting: boolean;
}

const defaultSettings: OperatorPreferences = {
  visibleAlerting: true,
};

interface OperatorPreferencesContextType {
  settings: OperatorPreferences;
  updateSettings: (s: Partial<OperatorPreferences>) => void;
}

const OperatorPreferencesContext = createContext<OperatorPreferencesContextType | undefined>(undefined);

export function OperatorPreferencesProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<OperatorPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const updateSettings = (newSettings: Partial<OperatorPreferences>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <OperatorPreferencesContext.Provider value={{ settings, updateSettings }}>
      {children}
    </OperatorPreferencesContext.Provider>
  );
}

export const useOperatorPreferencesContext = () => {
  const context = useContext(OperatorPreferencesContext);
  if (context === undefined) throw new Error('useOperatorPreferencesContext deve essere usato dentro OperatorPreferencesProvider');
  return context;
};
