import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Employee } from '../utils/api';
import { Pencil } from 'lucide-react';
import { SHIFT_TYPES, getShiftType } from '../shifts/shiftTypes';
import { loadShiftAssignments, loadStationAssignments, saveShiftAssignments, saveStationAssignments } from '../shifts/storage';
import { List } from 'react-window';

type EmployeeWithDates = Employee & {
  startDate: Date | null;
  endDate: Date | null;
};
const DAY_OFFSETS = [0, 1, 2, 3, 4, 5, 6] as const;

function fullName(e: Employee): string {
  return `${e.empfname ?? ''} ${e.emplname ?? ''}`.trim() || e.empcode;
}

function parseDate(input?: string | null): Date | null {
  if (!input) return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  // JS: 0=dimanche..6=samedi. On veut lundi=0
  const jsDay = x.getDay();
  const mondayBased = (jsDay + 6) % 7;
  x.setDate(x.getDate() - mondayBased);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function dayIndexInWeek(d: Date, weekStart: Date): number {
  const ms = d.getTime() - weekStart.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000)); // 0..6
}

export default function PlanningGantt(props: {
  employees: Employee[];
  isLoading: boolean;
  error: string;
  onRefresh: () => void;
}) {
  const { employees, isLoading, error, onRefresh } = props;
  const [weekCursor, setWeekCursor] = useState<Date>(startOfWeekMonday(new Date()));
  const [query, setQuery] = useState<string>('');
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [stationSelections, setStationSelections] = useState<Record<string, string>>({});
  const [shiftSelections, setShiftSelections] = useState<Record<string, string>>({});
  const [isCompactNames, setIsCompactNames] = useState<boolean>(false);
  const [dayCellWidth, setDayCellWidth] = useState<number>(96);
  const scrollWrapRef = useRef<HTMLDivElement | null>(null);

  const weekStart = useMemo(() => startOfWeekMonday(weekCursor), [weekCursor]);
  const daysInView = 7;
  const nameColWidth = isCompactNames ? 168 : 240;
  const daySelectWidth = daysInView * dayCellWidth;

  const dayMetas = useMemo(() => {
    return DAY_OFFSETS.map((offset) => {
      const date = addDays(weekStart, offset);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return {
        offset,
        date,
        keySuffix: `${y}-${m}-${d}`,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        dayLabel: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        dateLabel: date.toLocaleDateString('fr-FR', { day: '2-digit' }),
      };
    });
  }, [weekStart]);

  const technicians = useMemo(() => {
    const q = query.trim().toLowerCase();
    const prepared: EmployeeWithDates[] = employees
      .map((e) => ({
        ...e,
        startDate: parseDate(e.dateenrol),
        endDate: parseDate(e.dateexit),
      }))
      .sort((a, b) => fullName(a).localeCompare(fullName(b), 'fr'));

    return prepared.filter((e) => {
      if (stationFilter !== 'all') {
        const baseStation = (e.princstation ?? '').trim();
        let hasDayWithStation = false;
        for (const meta of dayMetas) {
          const key = `${e.empcode}-${meta.keySuffix}`;
          if ((stationSelections[key] ?? '').trim() === stationFilter) {
            hasDayWithStation = true;
            break;
          }
        }
        if (baseStation !== stationFilter && !hasDayWithStation) return false;
      }

      const name = fullName(e).toLowerCase();
      const code = (e.empcode ?? '').toLowerCase();
      return !q || name.includes(q) || code.includes(q);
    });
  }, [employees, query, stationFilter, dayMetas, stationSelections]);

  const stationOptions = useMemo(() => {
    return Array.from(
      new Set(
        employees
          .map((e) => (e.princstation ?? '').trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [employees]);

  const weekendColumns = useMemo(() => dayMetas.filter((d) => d.isWeekend).map((d) => d.offset), [dayMetas]);

  const timelineBg = useMemo(() => {
    // Fond performant: grille + colonnes week-end
    const stripes = weekendColumns
      .map((i) => `linear-gradient(to right, transparent ${i * dayCellWidth}px, rgba(248,250,252,1) ${i * dayCellWidth}px, rgba(248,250,252,1) ${(i + 1) * dayCellWidth}px, transparent ${(i + 1) * dayCellWidth}px)`)
      .join(', ');

    const grid = `repeating-linear-gradient(to right, rgba(148,163,184,0.25) 0px, rgba(148,163,184,0.25) 1px, transparent 1px, transparent ${dayCellWidth}px)`;
    const bg = stripes ? `${stripes}, ${grid}` : grid;
    return { backgroundImage: bg };
  }, [weekendColumns, dayCellWidth]);

  const makeDayKey = (empcode: string, dayOffset: number): string => `${empcode}-${dayMetas[dayOffset].keySuffix}`;

  // Persistance locale (UX) : stations + shifts
  useEffect(() => {
    setStationSelections(loadStationAssignments());
    setShiftSelections(loadShiftAssignments());
  }, []);

  useEffect(() => {
    const id = setTimeout(() => saveStationAssignments(stationSelections), 150);
    return () => clearTimeout(id);
  }, [stationSelections]);

  useEffect(() => {
    const id = setTimeout(() => saveShiftAssignments(shiftSelections), 150);
    return () => clearTimeout(id);
  }, [shiftSelections]);

  // Responsive: calcule la largeur de colonne jour pour étaler la semaine
  useEffect(() => {
    const el = scrollWrapRef.current;
    if (!el) return;

    const compute = () => {
      const w = el.clientWidth;
      // On vise 7 colonnes visibles sans scroll si possible
      const available = Math.max(0, w - nameColWidth);
      const ideal = Math.floor(available / daysInView);
      // Clamp: lisible sur mobile / pas gigantesque sur très grands écrans
      const clamped = clamp(ideal, 56, 140);
      // Si très petit écran, on garde une largeur minimale et on laisse le scroll horizontal
      setDayCellWidth(clamp(clamped, 44, 140));
    };

    compute();

    const ro = new ResizeObserver(() => compute());
    ro.observe(el);
    return () => ro.disconnect();
  }, [nameColWidth, daysInView]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-14 rounded-xl border border-gray-200 bg-gray-100" />
        <div className="h-80 rounded-xl border border-gray-200 bg-gray-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
        <div className="mt-3">
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 space-y-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekCursor((d) => addDays(d, -7))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              ←
            </button>
            <div className="rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800">
              {weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} –{' '}
              {addDays(weekStart, 6).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <button
              type="button"
              onClick={() => setWeekCursor((d) => addDays(d, 7))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              →
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher technicien (nom/code)…"
              className="w-full sm:w-72 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="w-full sm:w-56 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les stations</option>
              {stationOptions.map((station) => (
                <option key={`filter-${station}`} value={station}>
                  {station}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Actualiser
            </button>
            <button
              type="button"
              onClick={() => setIsCompactNames((v) => !v)}
              className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              {isCompactNames ? 'Colonne large' : 'Colonne compacte'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 sm:hidden">Astuce: glissez horizontalement pour voir la semaine.</p>
      </div>

      <div ref={scrollWrapRef} className="overflow-auto rounded-xl border border-gray-200 bg-white">
        <div className="min-w-[760px]">
          {/* Header */}
          <div className="flex border-b bg-gray-50">
            <div
              className="sticky left-0 z-20 border-r bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700"
              style={{ width: nameColWidth }}
            >
              <span className="hidden sm:inline">Technicien</span>
              <span className="sm:hidden">MEC</span>
            </div>
            <div className="relative" style={{ width: daySelectWidth }}>
              <div className="flex">
                {dayMetas.map(({ offset, isWeekend, dayLabel, dateLabel }) => {
                  return (
                    <div
                      key={`head-${offset}`}
                      className={`border-r px-1 py-2 text-center text-[11px] font-medium ${
                        isWeekend ? 'bg-slate-100 text-slate-500' : 'bg-gray-50 text-gray-700'
                      }`}
                      style={{ width: dayCellWidth }}
                    >
                      <div className="uppercase">{dayLabel}</div>
                      <div className="text-[12px] font-semibold">{dateLabel}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="relative">
            <List
              defaultHeight={Math.min(
                560,
                Math.max(220, (typeof window !== 'undefined' ? window.innerHeight : 800) * 0.6)
              )}
              rowCount={technicians.length}
              rowHeight={104}
              rowComponent={Row}
                      rowProps={{
                technicians,
                weekStart,
                        dayMetas,
                dayCellWidth,
                daySelectWidth,
                nameColWidth,
                daysInView,
                makeDayKey,
                stationOptions,
                stationSelections,
                setStationSelections,
                shiftSelections,
                setShiftSelections,
                        timelineBg,
                        shiftOptions: SHIFT_TYPES.map((s) => ({
                          value: s.code,
                          label: `${s.code} — ${s.name}`,
                        })),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type RowData = {
  technicians: EmployeeWithDates[];
  weekStart: Date;
  dayMetas: Array<{ offset: number; keySuffix: string }>;
  dayCellWidth: number;
  daySelectWidth: number;
  nameColWidth: number;
  daysInView: number;
  makeDayKey: (empcode: string, dayOffset: number) => string;
  stationOptions: string[];
  stationSelections: Record<string, string>;
  setStationSelections: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  shiftSelections: Record<string, string>;
  setShiftSelections: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  timelineBg: { backgroundImage: string };
  shiftOptions: Array<{ value: string; label: string }>;
};

const Row = memo(function Row(props: { index: number; style: React.CSSProperties } & RowData) {
  const { index, style, ...data } = props;
  const tech = data.technicians[index];
  const rowStart = tech.startDate ?? new Date(1900, 0, 1);
  const rowEnd = tech.endDate ?? new Date(3000, 0, 1);
  const weekEnd = addDays(data.weekStart, 6);
  const visibleStart = rowStart > data.weekStart ? rowStart : data.weekStart;
  const visibleEnd = rowEnd < weekEnd ? rowEnd : weekEnd;
  const hasBar = visibleStart <= visibleEnd;

  const startIdx = hasBar ? clamp(dayIndexInWeek(visibleStart, data.weekStart), 0, 6) : 0;
  const endIdx = hasBar ? clamp(dayIndexInWeek(visibleEnd, data.weekStart), 0, 6) : -1;

  const leftPx = startIdx * data.dayCellWidth;
  const widthPx = Math.max(0, (endIdx - startIdx + 1) * data.dayCellWidth);

  return (
    <div style={style} className="border-b">
      <div className="flex h-[104px]">
        <div className="sticky left-0 z-10 border-r bg-white px-3 py-2" style={{ width: data.nameColWidth }}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-900 leading-tight truncate">{fullName(tech)}</p>
            <span className="hidden sm:inline rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              ON
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mb-1 truncate">{tech.empcode}</p>
        </div>

        <div className="relative bg-white" style={{ width: data.daySelectWidth, ...data.timelineBg }}>
          {hasBar && widthPx > 0 && (
            <div
              className="pointer-events-none absolute top-2 h-8 rounded-md bg-blue-500/85 ring-1 ring-blue-600/30"
              style={{ left: leftPx, width: widthPx }}
            />
          )}

          <div className="absolute left-0 right-0 top-2 flex z-10">
            {DAY_OFFSETS.map((i) => {
              const activeDay = hasBar && i >= startIdx && i <= endIdx;
              const dayKey = data.makeDayKey(tech.empcode, i);
              const shiftCode = data.shiftSelections[dayKey] ?? '';
              const shiftType = getShiftType(shiftCode);
              return (
                <div key={`shift-${dayKey}`} className="px-[3px]" style={{ width: data.dayCellWidth }}>
                  <div className="relative">
                    <select
                      value={shiftCode}
                      onChange={(e) =>
                        data.setShiftSelections((prev) => ({
                          ...prev,
                          [dayKey]: e.target.value,
                        }))
                      }
                      className={`w-full h-8 appearance-none rounded-md border pl-2 pr-6 text-[11px] font-semibold ${
                        shiftType
                          ? `${shiftType.color.badgeBg} ${shiftType.color.badgeText} border-transparent hover:brightness-95`
                          : activeDay
                            ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            : 'bg-slate-50 text-gray-600 border-gray-200 hover:bg-white'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      title="Choisir un shift"
                    >
                      <option value="">{activeDay ? '+' : ''}</option>
                      {data.shiftOptions.map((s) => (
                        <option key={`${dayKey}-shift-${s.value}`} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-1 top-2 text-gray-600">
                      <Pencil size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute left-0 right-0 top-11 flex z-10">
            {DAY_OFFSETS.map((i) => {
              const activeDay = hasBar && i >= startIdx && i <= endIdx;
              const dayKey = data.makeDayKey(tech.empcode, i);
              const fallbackStation = data.stationSelections[tech.empcode] ?? (tech.princstation ?? '');
              const selectedStation = data.stationSelections[dayKey] ?? fallbackStation;
              return (
                <div key={dayKey} className="px-[2px]" style={{ width: data.dayCellWidth }}>
                  <div className="relative">
                    <select
                      value={selectedStation}
                      onChange={(e) =>
                        data.setStationSelections((prev) => ({
                          ...prev,
                          [dayKey]: e.target.value,
                        }))
                      }
                      className={`w-full appearance-none rounded-md border pl-2 pr-6 py-1 text-[11px] font-medium ${
                        activeDay
                          ? 'border-gray-300 bg-slate-50 text-gray-800 hover:bg-white'
                          : 'border-gray-200 bg-slate-50 text-gray-700 hover:bg-white'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">—</option>
                      {data.stationOptions.map((station) => (
                        <option key={`${dayKey}-${station}`} value={station}>
                          {station}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-1 top-1.5 text-gray-500">
                      <Pencil size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

