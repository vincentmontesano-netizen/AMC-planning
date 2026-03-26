import { memo, useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { Employee } from '../utils/api';
import { ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { SHIFT_TYPES, getShiftType } from '../shifts/shiftTypes';
import { loadShiftAssignments, loadStationAssignments, saveShiftAssignments, saveStationAssignments } from '../shifts/storage';
import { List } from 'react-window';

type EmployeeWithDates = Employee & {
  startDate: Date | null;
  endDate: Date | null;
};
const DAY_OFFSETS = [0, 1, 2, 3, 4, 5, 6] as const;

const SHIFT_SELECT_OPTIONS = SHIFT_TYPES.map((s) => ({
  value: s.code,
  label: `${s.code} — ${s.name}`,
}));

const PAGE_SIZE = 25;

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
  const [dayCellWidth, setDayCellWidth] = useState<number>(96);
  const [pageIndex, setPageIndex] = useState(0);
  const scrollWrapRef = useRef<HTMLDivElement | null>(null);

  const weekStart = useMemo(() => startOfWeekMonday(weekCursor), [weekCursor]);
  const daysInView = 7;
  const nameColWidth = 228;
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

  // Tri + parsing dates : ne dépend pas de la semaine (évite de tout recalculer au clic ← →)
  const preparedTechnicians = useMemo(() => {
    return employees
      .map((e) => ({
        ...e,
        startDate: parseDate(e.dateenrol),
        endDate: parseDate(e.dateexit),
      }))
      .sort((a, b) => fullName(a).localeCompare(fullName(b), 'fr'));
  }, [employees]);

  const techniciansBase = useMemo(() => {
    const q = query.trim().toLowerCase();
    return preparedTechnicians.filter((e) => {
      const name = fullName(e).toLowerCase();
      const code = (e.empcode ?? '').toLowerCase();
      return !q || name.includes(q) || code.includes(q);
    });
  }, [preparedTechnicians, query]);

  const technicians = useMemo(() => {
    if (stationFilter === 'all') {
      return techniciansBase;
    }
    return techniciansBase.filter((e) => {
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
      return true;
    });
  }, [techniciansBase, stationFilter, stationSelections, dayMetas]);

  const totalTechnicians = technicians.length;
  const totalPages = Math.max(1, Math.ceil(totalTechnicians / PAGE_SIZE));
  const maxPageIndex = Math.max(0, totalPages - 1);

  const techniciansPage = useMemo(() => {
    const start = pageIndex * PAGE_SIZE;
    return technicians.slice(start, start + PAGE_SIZE);
  }, [technicians, pageIndex]);

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
      .map(
        (i) =>
          `linear-gradient(to right, transparent ${i * dayCellWidth}px, rgba(241,245,249,0.92) ${i * dayCellWidth}px, rgba(241,245,249,0.92) ${(i + 1) * dayCellWidth}px, transparent ${(i + 1) * dayCellWidth}px)`
      )
      .join(', ');

    const grid = `repeating-linear-gradient(to right, rgba(148,163,184,0.2) 0px, rgba(148,163,184,0.2) 1px, transparent 1px, transparent ${dayCellWidth}px)`;
    const bg = stripes ? `${stripes}, ${grid}` : grid;
    return { backgroundImage: bg };
  }, [weekendColumns, dayCellWidth]);

  const makeDayKey = useCallback(
    (empcode: string, dayOffset: number): string => `${empcode}-${dayMetas[dayOffset].keySuffix}`,
    [dayMetas]
  );

  const bumpWeek = useCallback((delta: number) => {
    startTransition(() => {
      setWeekCursor((d) => addDays(d, delta));
    });
  }, []);

  const rowProps = useMemo(
    () => ({
      technicians: techniciansPage,
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
      shiftOptions: SHIFT_SELECT_OPTIONS,
    }),
    [
      techniciansPage,
      weekStart,
      dayMetas,
      dayCellWidth,
      daySelectWidth,
      nameColWidth,
      daysInView,
      makeDayKey,
      stationOptions,
      stationSelections,
      shiftSelections,
      timelineBg,
    ]
  );

  useEffect(() => {
    setPageIndex(0);
  }, [query, stationFilter]);

  useEffect(() => {
    setPageIndex((p) => Math.min(p, maxPageIndex));
  }, [maxPageIndex]);

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
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium uppercase tracking-wide text-slate-500">Semaine</span>
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50/80 p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => bumpWeek(-7)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-sm"
                aria-label="Semaine précédente"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>
              <div className="min-w-[10.5rem] px-3 py-1.5 text-center sm:min-w-[13rem]">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Période</div>
                <div className="text-sm font-semibold text-slate-800 tabular-nums">
                  {weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} –{' '}
                  {addDays(weekStart, 6).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => bumpWeek(7)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-900 hover:shadow-sm"
                aria-label="Semaine suivante"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom ou code…"
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/30 sm:w-64"
            />
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/30 sm:w-52"
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
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4 text-slate-500" />
              Actualiser
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 sm:hidden">Faites défiler horizontalement pour voir toute la semaine.</p>
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{totalTechnicians}</span> employé
            {totalTechnicians !== 1 ? 's' : ''}
            {totalTechnicians > 0 && (
              <>
                {' '}
                <span className="text-slate-300">·</span> lignes{' '}
                <span className="font-semibold text-slate-900">
                  {pageIndex * PAGE_SIZE + 1}–{Math.min((pageIndex + 1) * PAGE_SIZE, totalTechnicians)}
                </span>
              </>
            )}
            <span className="text-slate-400"> · {PAGE_SIZE} par page</span>
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pageIndex <= 0}
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Précédent
            </button>
            <span className="min-w-[6rem] text-center text-sm font-medium text-slate-700 tabular-nums">
              {totalTechnicians === 0 ? 1 : pageIndex + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={pageIndex >= maxPageIndex}
              onClick={() => setPageIndex((p) => Math.min(maxPageIndex, p + 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollWrapRef}
        className="overflow-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm"
      >
        <div className="min-w-[760px]">
          {/* Header */}
          <div className="flex border-b border-slate-200 bg-gradient-to-b from-slate-50 to-slate-50/80">
            <div
              className="sticky left-0 z-20 border-r border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
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
                      className={`border-r border-slate-200/80 px-1 py-2.5 text-center text-[11px] font-semibold ${
                        isWeekend ? 'bg-slate-100/90 text-slate-500' : 'text-slate-700'
                      }`}
                      style={{ width: dayCellWidth }}
                    >
                      <div className="uppercase tracking-wide">{dayLabel}</div>
                      <div className="mt-0.5 text-[12px] text-slate-800 tabular-nums">{dateLabel}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="relative">
            <List
              key={pageIndex}
              defaultHeight={Math.min(
                560,
                Math.max(220, (typeof window !== 'undefined' ? window.innerHeight : 800) * 0.6)
              )}
              rowCount={techniciansPage.length}
              rowHeight={104}
              rowComponent={Row}
              rowProps={rowProps}
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
  if (!tech) return null;

  const rowStart = tech.startDate ?? new Date(1900, 0, 1);
  const rowEnd = tech.endDate ?? new Date(3000, 0, 1);
  const weekEnd = addDays(data.weekStart, 6);
  const visibleStart = rowStart > data.weekStart ? rowStart : data.weekStart;
  const visibleEnd = rowEnd < weekEnd ? rowEnd : weekEnd;
  const hasBar = visibleStart <= visibleEnd;

  const zebra = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/55';

  return (
    <div style={style} className={`border-b border-slate-100 ${zebra}`}>
      <div className={`flex h-[104px] ${zebra}`}>
        <div
          className={`sticky left-0 z-10 border-r border-slate-200/90 px-3 py-2 ${zebra}`}
          style={{ width: data.nameColWidth }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-tight text-slate-900 truncate">{fullName(tech)}</p>
            {hasBar && (
              <span
                className="hidden shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200 sm:inline"
                title="Période de contrat recoupant cette semaine"
              >
                Actif
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{tech.empcode}</p>
        </div>

        <div
          className={`relative ${zebra}`}
          style={{ width: data.daySelectWidth, ...data.timelineBg }}
        >
          <div className="absolute left-0 right-0 top-2 z-10 flex">
            {DAY_OFFSETS.map((i) => {
              const dayKey = data.makeDayKey(tech.empcode, i);
              const shiftCode = data.shiftSelections[dayKey] ?? '';
              const shiftType = getShiftType(shiftCode);
              const isShiftUnset = !shiftCode.trim();
              const shiftSelectClass = shiftType
                ? `${shiftType.color.badgeBg} ${shiftType.color.badgeText} border border-slate-900/10 shadow-sm ring-1 ring-slate-900/[0.06] hover:brightness-[0.98] focus:ring-slate-400/25`
                : isShiftUnset
                  ? 'border-red-300 bg-red-50 text-red-900 shadow-sm ring-1 ring-red-200/70 hover:border-red-400 hover:bg-red-100/85 focus:border-red-400 focus:ring-red-400/35'
                  : 'border-amber-200 bg-amber-50 text-amber-900 shadow-sm ring-1 ring-amber-200/60 focus:ring-amber-400/25';
              const chevronShiftClass = shiftType
                ? 'text-slate-600'
                : isShiftUnset
                  ? 'text-red-500'
                  : 'text-amber-600';
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
                      className={`h-8 w-full cursor-pointer appearance-none rounded-lg border pl-2 pr-7 text-[11px] font-semibold transition focus:outline-none focus:ring-2 ${shiftSelectClass}`}
                      title="Choisir un shift"
                      aria-label={`Shift ${dayKey}`}
                    >
                      <option value="">+ Shift</option>
                      {data.shiftOptions.map((s) => (
                        <option key={`${dayKey}-shift-${s.value}`} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <span
                      className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 ${chevronShiftClass}`}
                    >
                      <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute left-0 right-0 top-11 z-10 flex">
            {DAY_OFFSETS.map((i) => {
              const dayKey = data.makeDayKey(tech.empcode, i);
              const fallbackStation = data.stationSelections[tech.empcode] ?? (tech.princstation ?? '');
              const selectedStation = data.stationSelections[dayKey] ?? fallbackStation;
              const stationEmpty = !selectedStation.trim();
              const stationSelectClass = stationEmpty
                ? 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100/80 focus:ring-slate-400/25'
                : 'border-slate-200 bg-white text-slate-800 shadow-sm ring-1 ring-slate-900/[0.04] hover:border-slate-300 focus:ring-slate-400/25';
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
                      className={`h-8 w-full cursor-pointer appearance-none rounded-lg border py-1 pl-2 pr-7 text-[11px] font-medium transition focus:outline-none focus:ring-2 ${stationSelectClass}`}
                      aria-label={`Station ${dayKey}`}
                    >
                      <option value="">Station</option>
                      {data.stationOptions.map((station) => (
                        <option key={`${dayKey}-${station}`} value={station}>
                          {station}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
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

