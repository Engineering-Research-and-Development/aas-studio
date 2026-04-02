import { createContext, useState, useContext, ReactNode } from 'react';
import { getDefaultColor } from '@/utils/utils';

interface CellSettings {
  showBookingNames: boolean; showBookingTimes: boolean; showPrices: boolean;
  showNotes: boolean; useLabels: boolean; useCustomCoachColors: boolean;
  useStaticCellWidth: boolean; cellWidth: number; enablePeriodicAlertCheck: boolean;
}
interface FieldColor { field_id: number; name: string; color: string; }
interface TagColor { tag_id: number; name: string; color: string; }
interface CoachColor { user_id: number; name: string; color: string; }
interface CardSettings {
  fidelityCardExpirationDays: number; subscriptionCardExpirationDays: number;
  membershipCardExpirationDays: number; lessonCardExpirationDays: number;
}
interface OperatorPreferences {
  cellSettings: CellSettings; fieldColors: FieldColor[];
  tagColors: TagColor[]; coachColors: CoachColor[]; cardSettings: CardSettings;
}

const defaultSettings: OperatorPreferences = {
  cellSettings: {
    showBookingNames: false, showBookingTimes: false, showPrices: false, showNotes: false,
    useLabels: false, useCustomCoachColors: false, useStaticCellWidth: false,
    cellWidth: 150, enablePeriodicAlertCheck: true,
  },
  fieldColors: [],
  tagColors: [
    { tag_id: 0, name: 'Prenotazione classica', color: '#6B7280' },
    { tag_id: 1, name: 'Prenotazione periodica', color: '#8B5CF6' },
    { tag_id: 2, name: 'Torneo', color: '#F59E0B' },
    { tag_id: 3, name: 'Campionato', color: '#EF4444' },
    { tag_id: 4, name: 'Lezione', color: '#3B82F6' },
    { tag_id: 5, name: 'Lezione periodica', color: '#6366F1' },
    { tag_id: 6, name: 'Lezione neofita', color: '#22C55E' },
    { tag_id: 7, name: 'Partita omaggio', color: '#10B981' },
    { tag_id: 8, name: 'Socio', color: '#F97316' },
    { tag_id: 9, name: 'Partita organizzata', color: '#0EA5E9' },
    { tag_id: 10, name: 'BookIt AI', color: '#64748B' },
    { tag_id: 16, name: 'Prenotazione App', color: '#A855F7' },
    { tag_id: 17, name: 'Partita pubblica', color: '#14B8A6' },
    { tag_id: 18, name: 'Sfida', color: '#DC2626' },
  ],
  coachColors: [],
  cardSettings: { fidelityCardExpirationDays: 30, subscriptionCardExpirationDays: 365, membershipCardExpirationDays: 365, lessonCardExpirationDays: 365 },
};

interface OperatorPreferencesContextType {
  settings: OperatorPreferences;
  updateSettings: (s: Partial<OperatorPreferences>) => void;
  setCellSettings: (s: Partial<CellSettings>) => void;
  resetCellSettings: () => void;
  setFieldColor: (id: number, color: string) => void;
  resetFieldColors: () => void;
  setTagColor: (id: number, color: string) => void;
  resetTagColors: () => void;
  setCoachColor: (id: number, color: string) => void;
  resetCoachColors: () => void;
  initializeFieldColors: (fields: { field_id: number; name: string }[]) => void;
  initializeCoachColors: (coaches: { user_id: number; name: string }[]) => void;
  setCardSettings: (s: Partial<CardSettings>) => void;
  resetCardSettings: () => void;
}

const OperatorPreferencesContext = createContext<OperatorPreferencesContextType | undefined>(undefined);

export function OperatorPreferencesProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<OperatorPreferences>(() => {
    const saved = localStorage.getItem('preferences');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const updateSettings = (newSettings: Partial<OperatorPreferences>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('preferences', JSON.stringify(updated));
  };

  const setCellSettings = (s: Partial<CellSettings>) => updateSettings({ cellSettings: { ...settings.cellSettings, ...s } });
  const resetCellSettings = () => updateSettings({ cellSettings: defaultSettings.cellSettings });
  const setFieldColor = (field_id: number, color: string) =>
    updateSettings({ fieldColors: settings.fieldColors.map(f => f.field_id === field_id ? { ...f, color } : f) });
  const resetFieldColors = () =>
    updateSettings({ fieldColors: settings.fieldColors.map((f, i) => ({ ...f, color: getDefaultColor(i) })) });
  const setTagColor = (tag_id: number, color: string) =>
    updateSettings({ tagColors: settings.tagColors.map(t => t.tag_id === tag_id ? { ...t, color } : t) });
  const resetTagColors = () => updateSettings({ tagColors: defaultSettings.tagColors });
  const setCoachColor = (user_id: number, color: string) =>
    updateSettings({ coachColors: settings.coachColors.map(c => c.user_id === user_id ? { ...c, color } : c) });
  const resetCoachColors = () =>
    updateSettings({ coachColors: settings.coachColors.map((c, i) => ({ ...c, color: getDefaultColor(i) })) });

  const initializeCoachColors = (coaches: { user_id: number; name: string }[]) => {
    if (settings.coachColors.length > 0) {
      const existing = settings.coachColors.map(c => c.user_id);
      const newOnes = coaches.filter(c => !existing.includes(c.user_id))
        .map((c, i) => ({ user_id: c.user_id, name: c.name, color: getDefaultColor(i + settings.coachColors.length) }));
      if (newOnes.length > 0) updateSettings({ coachColors: [...settings.coachColors, ...newOnes] });
    } else {
      updateSettings({ coachColors: coaches.map((c, i) => ({ user_id: c.user_id, name: c.name, color: getDefaultColor(i) })) });
    }
  };

  const initializeFieldColors = (fields: { field_id: number; name: string }[]) => {
    if (settings.fieldColors.length > 0) {
      const existing = settings.fieldColors.map(f => f.field_id);
      const newOnes = fields.filter(f => !existing.includes(f.field_id))
        .map((f, i) => ({ field_id: f.field_id, name: f.name, color: getDefaultColor(i) }));
      if (newOnes.length > 0) updateSettings({ fieldColors: [...settings.fieldColors, ...newOnes] });
    } else {
      updateSettings({ fieldColors: fields.map((f, i) => ({ field_id: f.field_id, name: f.name, color: getDefaultColor(i) })) });
    }
  };

  const setCardSettings = (s: Partial<CardSettings>) => {
    const updated = { ...settings, cardSettings: { ...settings.cardSettings, ...s } };
    setSettings(updated);
    localStorage.setItem('preferences', JSON.stringify(updated));
  };
  const resetCardSettings = () => updateSettings({ cardSettings: defaultSettings.cardSettings });

  return (
    <OperatorPreferencesContext.Provider value={{
      settings, updateSettings, setCellSettings, resetCellSettings,
      setFieldColor, resetFieldColors, setTagColor, resetTagColors,
      setCoachColor, resetCoachColors, initializeFieldColors, initializeCoachColors,
      setCardSettings, resetCardSettings,
    }}>
      {children}
    </OperatorPreferencesContext.Provider>
  );
}

export const useOperatorPreferencesContext = () => {
  const context = useContext(OperatorPreferencesContext);
  if (context === undefined) throw new Error('useOperatorPreferencesContext deve essere usato dentro OperatorPreferencesProvider');
  return context;
};
