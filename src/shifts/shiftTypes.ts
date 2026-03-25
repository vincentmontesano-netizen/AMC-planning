import type { ShiftType } from './types';

export const SHIFT_TYPES: ShiftType[] = [
  {
    code: 'DS1',
    name: 'Jour Standard',
    start: '06:00',
    end: '14:00',
    durationHours: 8,
    category: 'Jour',
    color: {
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-700',
      pillBg: 'bg-amber-50',
      pillText: 'text-amber-700',
    },
  },
  {
    code: 'DS2',
    name: 'Jour Standard 2',
    start: '07:00',
    end: '15:00',
    durationHours: 8,
    category: 'Jour',
    color: {
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-700',
      pillBg: 'bg-amber-50',
      pillText: 'text-amber-700',
    },
  },
  {
    code: 'AFT1',
    name: 'Après-midi',
    start: '14:00',
    end: '22:00',
    durationHours: 8,
    category: 'Après-midi',
    color: {
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-700',
      pillBg: 'bg-orange-50',
      pillText: 'text-orange-700',
    },
  },
  {
    code: 'AFT2',
    name: 'Après-midi 2',
    start: '15:00',
    end: '23:00',
    durationHours: 8,
    category: 'Après-midi',
    color: {
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-700',
      pillBg: 'bg-orange-50',
      pillText: 'text-orange-700',
    },
  },
  {
    code: 'N1',
    name: 'Nuit',
    start: '22:00',
    end: '06:00',
    durationHours: 8,
    category: 'Nuit',
    color: {
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-700',
      pillBg: 'bg-indigo-50',
      pillText: 'text-indigo-700',
    },
  },
  {
    code: 'N2',
    name: 'Nuit 2',
    start: '23:00',
    end: '07:00',
    durationHours: 8,
    category: 'Nuit',
    color: {
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-700',
      pillBg: 'bg-indigo-50',
      pillText: 'text-indigo-700',
    },
  },
  {
    code: 'LD',
    name: 'Long Jour',
    start: '06:00',
    end: '18:00',
    durationHours: 12,
    category: 'Jour',
    color: {
      badgeBg: 'bg-yellow-100',
      badgeText: 'text-yellow-800',
      pillBg: 'bg-yellow-50',
      pillText: 'text-yellow-800',
    },
  },
  {
    code: 'LN',
    name: 'Longue Nuit',
    start: '18:00',
    end: '06:00',
    durationHours: 12,
    category: 'Nuit',
    color: {
      badgeBg: 'bg-violet-100',
      badgeText: 'text-violet-700',
      pillBg: 'bg-violet-50',
      pillText: 'text-violet-700',
    },
  },
  {
    code: 'ABS',
    name: 'Absence',
    category: 'Absence',
    color: {
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-700',
      pillBg: 'bg-rose-50',
      pillText: 'text-rose-700',
    },
  },
  {
    code: 'VCS',
    name: 'Vacances',
    category: 'Absence',
    color: {
      badgeBg: 'bg-pink-100',
      badgeText: 'text-pink-700',
      pillBg: 'bg-pink-50',
      pillText: 'text-pink-700',
    },
  },
  {
    code: 'FORM',
    name: 'Formation',
    start: '08:00',
    end: '17:00',
    durationHours: 8,
    category: 'Spécial',
    color: {
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-700',
      pillBg: 'bg-emerald-50',
      pillText: 'text-emerald-700',
    },
  },
  {
    code: 'REPOS',
    name: 'Repos',
    category: 'Absence',
    color: {
      badgeBg: 'bg-slate-200',
      badgeText: 'text-slate-700',
      pillBg: 'bg-slate-100',
      pillText: 'text-slate-700',
    },
  },
  {
    code: 'MAL',
    name: 'Maladie',
    category: 'Absence',
    color: {
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-700',
      pillBg: 'bg-red-50',
      pillText: 'text-red-700',
    },
  },
  {
    code: 'CONGE',
    name: 'Congé',
    category: 'Absence',
    color: {
      badgeBg: 'bg-fuchsia-100',
      badgeText: 'text-fuchsia-700',
      pillBg: 'bg-fuchsia-50',
      pillText: 'text-fuchsia-700',
    },
  },
];

export function getShiftType(code?: string | null): ShiftType | null {
  if (!code) return null;
  return SHIFT_TYPES.find((s) => s.code === code) ?? null;
}

