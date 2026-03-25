export type ShiftCategory = 'Jour' | 'Après-midi' | 'Nuit' | 'Absence' | 'Spécial';

export type ShiftType = {
  code: string;
  name: string;
  start?: string; // "06:00"
  end?: string;   // "14:00"
  durationHours?: number;
  category: ShiftCategory;
  color: {
    badgeBg: string;
    badgeText: string;
    pillBg: string;
    pillText: string;
  };
};

