import type { Role } from './data';

export function load<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

export function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function minutes(time?: string) {
  if (!time) return 0;
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

export function duration(start?: string, end?: string, pause = 0) {
  if (!start || !end) return 0;
  return Math.max(0, minutes(end) - minutes(start) - pause);
}

export function formatHours(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}h${String(mins).padStart(2, '0')}`;
}

export function roleLabel(role: Role) {
  if (role === 'admin') return 'Admin';
  if (role === 'manager') return 'Manager';
  return 'Salarié';
}
