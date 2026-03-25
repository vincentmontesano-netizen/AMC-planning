import { SHIFT_TYPES } from '../shifts/shiftTypes';

function fmtDuration(hours?: number): string {
  if (!hours) return '';
  return `${hours.toFixed(2)}h`.replace('.00', '');
}

export default function ShiftsModule() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SHIFT_TYPES.map((s) => (
          <div key={s.code} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-semibold ${s.color.badgeBg} ${s.color.badgeText}`}>
                {s.code}
              </div>
            </div>
            <div className="mt-3">
              <p className="text-base font-semibold text-gray-900">{s.name}</p>
              {s.start && s.end && (
                <p className="mt-1 text-sm text-gray-600">
                  <span className="font-mono">{s.start}</span> – <span className="font-mono">{s.end}</span>
                  {s.durationHours ? <span className="text-gray-500"> ({fmtDuration(s.durationHours)})</span> : null}
                </p>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${s.color.pillBg} ${s.color.pillText}`}>
                {s.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

