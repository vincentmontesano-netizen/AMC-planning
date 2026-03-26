import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Employee } from '../utils/api';

const PAGE_SIZE = 25;

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR');
}

function fullName(e: Employee): string {
  return `${e.empfname ?? ''} ${e.emplname ?? ''}`.trim();
}

function isActive(e: Employee): boolean {
  return !e.dateexit;
}

export default function EmployeeList(props: {
  employees: Employee[];
  isLoading: boolean;
  error: string;
  updatedAt: Date | null;
  onRefresh: () => void;
}) {
  const { employees, isLoading, error, updatedAt, onRefresh } = props;
  const [query, setQuery] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [activeOnly, setActiveOnly] = useState<boolean>(false);
  const [pageIndex, setPageIndex] = useState(0);

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        employees
          .map((e) => (e.dept ?? '').trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [employees]);

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(isActive).length;
    const inactive = total - active;
    const stations = new Set(employees.map((e) => e.princstation).filter(Boolean)).size;
    return { total, active, inactive, stations };
  }, [employees]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      if (activeOnly && !isActive(e)) return false;
      if (deptFilter !== 'all' && (e.dept ?? '') !== deptFilter) return false;

      if (!q) return true;
      const hay = [
        e.empcode,
        fullName(e),
        e.empemail,
        e.dept,
        e.empcategory,
        e.princstation,
        e.compfunction,
        e.mainbasecode,
        e.author_ref,
        e.empphone1,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [employees, query, deptFilter, activeOnly]);

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const maxPageIndex = Math.max(0, totalPages - 1);

  const filteredPage = useMemo(() => {
    const start = pageIndex * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageIndex]);

  useEffect(() => {
    setPageIndex(0);
  }, [query, deptFilter, activeOnly]);

  useEffect(() => {
    setPageIndex((p) => Math.min(p, maxPageIndex));
  }, [maxPageIndex]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl border border-gray-200 bg-gray-100" />
          ))}
        </div>
        <div className="h-12 rounded-xl border border-gray-200 bg-gray-100" />
        <div className="h-72 rounded-xl border border-gray-200 bg-gray-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Réessayer
          </button>
          <p className="text-xs text-red-600">
            Vérifiez aussi le token et la réponse de <code className="font-mono">/v1/employee</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-xs text-blue-700">Total MEC</p>
          <p className="text-2xl font-semibold text-blue-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-xs text-emerald-700">Actifs</p>
          <p className="text-2xl font-semibold text-emerald-900">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
          <p className="text-xs text-amber-700">Sortis</p>
          <p className="text-2xl font-semibold text-amber-900">{stats.inactive}</p>
        </div>
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
          <p className="text-xs text-violet-700">Stations</p>
          <p className="text-2xl font-semibold text-violet-900">{stats.stations}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{totalFiltered}</span> résultat
            {totalFiltered !== 1 ? 's' : ''} (filtre) sur{' '}
            <span className="font-medium text-slate-800">{employees.length}</span> MEC
            {updatedAt ? (
              <span className="text-slate-400">
                {' '}
                · maj {updatedAt.toLocaleTimeString('fr-FR')}
              </span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4 text-slate-500" />
            Actualiser
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (nom, code, station, email, tél…)…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
          />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
          >
            <option value="all">Tous les départements</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded border-slate-300 text-slate-700 focus:ring-slate-400/40"
            />
            Actifs uniquement
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            {totalFiltered > 0 && (
              <>
                Lignes{' '}
                <span className="font-semibold text-slate-900 tabular-nums">
                  {pageIndex * PAGE_SIZE + 1}–{Math.min((pageIndex + 1) * PAGE_SIZE, totalFiltered)}
                </span>
                <span className="text-slate-400"> · {PAGE_SIZE} par page</span>
              </>
            )}
            {totalFiltered === 0 && <span className="text-slate-500">Aucune ligne à afficher</span>}
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
              {totalFiltered === 0 ? 1 : pageIndex + 1} / {totalPages}
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

      <div className="overflow-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-slate-50/90 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Code</th>
              <th className="px-3 py-2 text-left font-medium">Nom</th>
              <th className="px-3 py-2 text-left font-medium">Fonction</th>
              <th className="px-3 py-2 text-left font-medium">Dépt</th>
              <th className="px-3 py-2 text-left font-medium">Station</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium">Téléphone</th>
              <th className="px-3 py-2 text-left font-medium">Entrée</th>
              <th className="px-3 py-2 text-left font-medium">Sortie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredPage.map((e) => (
              <tr key={e.empcode} className="transition hover:bg-slate-50/80">
                <td className="px-3 py-2 font-mono text-xs text-gray-800">{e.empcode}</td>
                <td className="px-3 py-2 text-gray-900">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                      {(e.empfname?.[0] ?? '') + (e.emplname?.[0] ?? '') || 'M'}
                    </span>
                    <span>{fullName(e) || '—'}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-gray-700">{e.compfunction || '—'}</td>
                <td className="px-3 py-2 text-gray-700">{e.dept || '—'}</td>
                <td className="px-3 py-2 text-gray-700">{e.princstation || '—'}</td>
                <td className="px-3 py-2 text-gray-700">{e.empemail || '—'}</td>
                <td className="px-3 py-2 text-gray-700">{e.empphone1 || '—'}</td>
                <td className="px-3 py-2 text-gray-700">{formatDate(e.dateenrol) || '—'}</td>
                <td className="px-3 py-2 text-gray-700">
                  {e.dateexit ? (
                    formatDate(e.dateexit)
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Actif
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {totalFiltered === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-600" colSpan={9}>
                  Aucun résultat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

