import { useMemo, useState } from 'react';
import { Employee } from '../utils/api';

function isActive(e: Employee): boolean {
  return !e.dateexit;
}

function normalizeStation(station?: string | null): string {
  return (station ?? '').trim();
}

export default function StationsView(props: {
  employees: Employee[];
  isLoading: boolean;
  error: string;
  onRefresh: () => void;
}) {
  const { employees, isLoading, error, onRefresh } = props;
  const [query, setQuery] = useState<string>('');

  const stations = useMemo(() => {
    const map = new Map<
      string,
      { station: string; total: number; active: number; inactive: number }
    >();

    for (const e of employees) {
      const station = normalizeStation(e.princstation);
      if (!station) continue;
      const entry = map.get(station) ?? { station, total: 0, active: 0, inactive: 0 };
      entry.total += 1;
      if (isActive(e)) entry.active += 1;
      else entry.inactive += 1;
      map.set(station, entry);
    }

    const list = Array.from(map.values()).sort((a, b) => a.station.localeCompare(b.station, 'fr'));
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => s.station.toLowerCase().includes(q));
  }, [employees, query]);

  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const totalStations = new Set(employees.map((e) => normalizeStation(e.princstation)).filter(Boolean)).size;
    const activeEmployees = employees.filter(isActive).length;
    return { totalEmployees, totalStations, activeEmployees };
  }, [employees]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
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
            Cette vue utilise les stations depuis <code className="font-mono">/v1/employee</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-xs text-blue-700">Employés (total)</p>
          <p className="text-2xl font-semibold text-blue-900">{stats.totalEmployees}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-xs text-emerald-700">Employés actifs</p>
          <p className="text-2xl font-semibold text-emerald-900">{stats.activeEmployees}</p>
        </div>
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
          <p className="text-xs text-violet-700">Stations</p>
          <p className="text-2xl font-semibold text-violet-900">{stats.totalStations}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 space-y-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-gray-600">{stations.length} station{stations.length > 1 ? 's' : ''}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="self-start rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Actualiser
          </button>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une station…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Station</th>
              <th className="px-3 py-2 text-right font-medium">MEC total</th>
              <th className="px-3 py-2 text-right font-medium">Actifs</th>
              <th className="px-3 py-2 text-right font-medium">Sortis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {stations.map((s) => (
              <tr key={s.station} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-900">{s.station}</td>
                <td className="px-3 py-2 text-right text-gray-800 tabular-nums">{s.total}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {s.active}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-gray-700">{s.inactive}</td>
              </tr>
            ))}
            {stations.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-600" colSpan={4}>
                  Aucune station trouvée (champ <code className="font-mono">princstation</code> vide sur les employés).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

