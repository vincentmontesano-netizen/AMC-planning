const SHIFT_ASSIGNMENTS_KEY = 'planning:shiftAssignments';
const STATION_ASSIGNMENTS_KEY = 'planning:stationAssignments';

export function loadMap(key: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

export function saveMap(key: string, value: Record<string, string>): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function loadShiftAssignments(): Record<string, string> {
  return loadMap(SHIFT_ASSIGNMENTS_KEY);
}

export function saveShiftAssignments(value: Record<string, string>): void {
  saveMap(SHIFT_ASSIGNMENTS_KEY, value);
}

export function loadStationAssignments(): Record<string, string> {
  return loadMap(STATION_ASSIGNMENTS_KEY);
}

export function saveStationAssignments(value: Record<string, string>): void {
  saveMap(STATION_ASSIGNMENTS_KEY, value);
}

