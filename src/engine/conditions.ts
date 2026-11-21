// Conditions used in content files.
//
// A condition is a list of atoms. All atoms must be true.
//   "flagName"            the flag is set and truthy
//   "!flagName"           the flag is not set (or falsy)
//   "key>=3"              compare (=, !=, >=, <=, >, <)
//   "time>=21:40"         times can be written as clock times
//   "any:a|b|c"           true if any of the atoms a, b, c is true
// Keys:
//   day, weekday, time, place, room, stage, s3day, workday
//   open      the current place is open right now
//   today.X   values that reset every morning
//   count.X   running counts that only go up (returns, never streaks)
//   pull.X    escape pull: phone, drink, comfort, top (the strongest)
//   card.X    an earned card       seen.X   a scene seen once
//   seenToday.X                    quest.X  "active", "closed" or "none"
//   trait.X   line.ownership / line.purpose
//   purpose   the chosen purpose id
//   pattern   the escape the player leans on: phone, drink, comfort, or "none" (pull under 2)
//   anything else is a flag
import type { State } from './state';
import type { PlaceId } from './types';
import { placeById } from './content';
import { inWindow, parseTime, weekday, isWorkday } from './time';

/** Is a place open right now? Places with no hours are always open. */
export function placeOpen(s: State, id: PlaceId, t = s.t): boolean {
  const p = placeById[id];
  if (!p || !p.hours || p.hours.length === 0) return true;
  const wd = weekday(s.day);
  return p.hours.some((h) => (!h.days || h.days.includes(wd)) && inWindow(t, h.open, h.close));
}

type Val = number | string | boolean | undefined;

function readKey(s: State, key: string): Val {
  if (key === 'day') return s.day;
  if (key === 'weekday') return weekday(s.day);
  if (key === 'time') return s.t;
  if (key === 'place') return s.place;
  if (key === 'room') return s.room;
  if (key === 'stage') return s.stage;
  if (key === 's3day') return s.stage >= 3 ? s.day - s.stageStartDay : -1;
  if (key === 'workday') return isWorkday(s.day);
  if (key === 'open') return placeOpen(s, s.place);
  if (key === 'purpose') return (s.flags.purposeId as string) || '';
  if (key === 'standard') return s.standard ? true : false;
  if (key === 'pattern') {
    const top = Math.max(s.pull.phone, s.pull.drink, s.pull.comfort);
    if (top < 2) return 'none';
    if (s.pull.drink === top) return 'drink';
    if (s.pull.phone === top) return 'phone';
    return 'comfort';
  }
  const dot = key.indexOf('.');
  if (dot > 0) {
    const scope = key.slice(0, dot);
    const name = key.slice(dot + 1);
    switch (scope) {
      case 'today':
        return s.today[name];
      case 'count':
        return s.counts[name] ?? 0;
      case 'pull':
        if (name === 'top') return Math.max(s.pull.phone, s.pull.drink, s.pull.comfort);
        return s.pull[name as 'phone'] ?? 0;
      case 'card':
        return s.cards.includes(name);
      case 'seen':
        return s.seen.includes(name);
      case 'seenToday':
        return s.seenToday.includes(name);
      case 'quest':
        return s.quests[name]?.status ?? 'none';
      case 'trait':
        return s.traits.includes(name);
      case 'line':
        return s.lines[name as 'ownership'] ?? false;
      case 'proof':
        return s.proof[name as 'ownership']?.length ?? 0;
    }
  }
  return s.flags[key];
}

function parseVal(raw: string): Val {
  const v = raw.trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (/^\d{1,2}:\d{2}$/.test(v)) return parseTime(v);
  return v;
}

function truthy(v: Val): boolean {
  if (v === undefined || v === false || v === 0 || v === '' || v === 'none') return false;
  return true;
}

export function atom(s: State, a: string): boolean {
  const text = a.trim();
  if (!text) return true;
  if (text.startsWith('any:')) {
    return text
      .slice(4)
      .split('|')
      .some((x) => atom(s, x));
  }
  if (text.startsWith('!')) return !atom(s, text.slice(1));
  const m = /^([A-Za-z0-9_.\-]+)\s*(>=|<=|!=|=|>|<)\s*(.+)$/.exec(text);
  if (!m) return truthy(readKey(s, text));
  const left = readKey(s, m[1]);
  const right = parseVal(m[3]);
  const op = m[2];
  const ln = typeof left === 'boolean' ? (left ? 1 : 0) : left;
  const rn = typeof right === 'boolean' ? (right ? 1 : 0) : right;
  switch (op) {
    case '=':
      return (ln ?? 0) == rn; // eslint-disable-line eqeqeq
    case '!=':
      return (ln ?? 0) != rn; // eslint-disable-line eqeqeq
    case '>=':
      return Number(ln ?? 0) >= Number(rn);
    case '<=':
      return Number(ln ?? 0) <= Number(rn);
    case '>':
      return Number(ln ?? 0) > Number(rn);
    case '<':
      return Number(ln ?? 0) < Number(rn);
  }
  return false;
}

export function check(s: State, cond?: string[]): boolean {
  if (!cond || cond.length === 0) return true;
  return cond.every((a) => atom(s, a));
}
