import type { Period, Weekday } from './types';

export const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const WEEKDAY_NAMES: Record<Weekday, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

/** Day 1 is a Monday. */
export function weekday(day: number): Weekday {
  return WEEKDAYS[(day - 1) % 7];
}

export function dayName(day: number): string {
  return WEEKDAY_NAMES[weekday(day)];
}

export function isWorkday(day: number): boolean {
  const w = weekday(day);
  return w !== 'sat' && w !== 'sun';
}

/** "21:40" -> 1300. Times after midnight can be written "25:10". */
export function parseTime(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** 1300 -> "9:40 p.m." */
export function fmtTime(t: number): string {
  const total = ((Math.round(t) % 1440) + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const suffix = h24 < 12 ? 'a.m.' : 'p.m.';
  let h = h24 % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${suffix}`;
}

export function period(t: number): Period {
  const m = ((t % 1440) + 1440) % 1440;
  if (m < 5 * 60) return 'night';
  if (m < 7 * 60 + 30) return 'dawn';
  if (m < 11 * 60) return 'morning';
  if (m < 16 * 60) return 'day';
  if (m < 19 * 60 + 30) return 'evening';
  if (m < 21 * 60) return 'dusk';
  return 'night';
}

/** Is the clock inside an [open, close) window? Handles windows that pass midnight. */
export function inWindow(t: number, open: string, close: string): boolean {
  const o = parseTime(open);
  let c = parseTime(close);
  if (c <= o) c += 1440;
  return (t >= o && t < c) || (t + 1440 >= o && t + 1440 < c);
}
