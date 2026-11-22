// Review mode: a dev-only scene jump for Jim's edit pass. It opens only with ?review=1 in
// the URL, and nothing in the game links to it.
//
// It lists every scene and encounter in Scene Book order (src/content/review.json), opens
// one in place with its art, runs it on the real engine, and lets you set the state it
// reads. It never touches the player's save: the review game doesn't save, and settling
// after a scene doesn't run the next scene by itself.
//
// Words come from content files: review.json for this screen's labels, the scenes and
// encounters for the story. This file only arranges them.
import reviewJson from '../content/review.json';
import { actions, cards, encounters, line, placeById, places, scenes } from '../engine/content';
import { check, placeOpen } from '../engine/conditions';
import * as enc from '../engine/encounter';
import { Game } from '../engine/game';
import { checkStandard } from '../engine/standard';
import { newState, type State } from '../engine/state';
import { WEEKDAYS, dayName, fmtTime, parseTime, period } from '../engine/time';
import type { EncounterDef, Node, PlaceId, Scene, Trigger, Weekday } from '../engine/types';
import { artFor, esc, renderReview, tagBox } from '../ui/app';

type Kind = 'scene' | 'encounter';
interface Item {
  kind: Kind;
  id: string;
  title: string;
  status: string;
  group: string;
  notes: string[];
}

const R = reviewJson as unknown as {
  groups: { id: string; title: string; items: string[] }[];
  unsortedTitle: string;
  labels: Record<string, string>;
};
const L = (k: string) => R.labels[k] ?? `[missing label: ${k}]`;

/** The review game runs the real engine but never saves and never moves on by itself. */
class ReviewGame extends Game {
  private fns: (() => void)[] = [];
  onChange(fn: () => void): void {
    this.fns.push(fn);
  }
  emit(): void {
    for (const fn of this.fns) fn();
  }
  settle(): void {
    if (this.s.scene) this.s.phase = 'scene';
    this.emit();
  }
  /** A placeholder with nothing behind it yet shows its name, so the gap is visible. */
  fill(text: string): string {
    const s = this.s;
    const empty: Record<string, boolean> = {
      standard: !s.standard,
      purpose: !s.purpose,
      floor: !s.flags.floorLabel,
      ceiling: !s.flags.ceilingLabel,
      morningLine: !s.flags.morningLabel,
    };
    const marked = text
      .replace(/\{(standard|purpose|floor|ceiling|morningLine)\}/g, (m, k: string) => (empty[k] ? `‹${k}›` : m))
      .replace(/\{flag\.([A-Za-z0-9_]+)\}/g, (m, k: string) => (s.flags[k] === undefined || s.flags[k] === '' ? `‹flag.${k}›` : m));
    return super.fill(marked);
  }
}

// ---------- the list ----------

function buildItems(): { groups: { title: string; items: Item[] }[]; flat: Item[] } {
  const all = new Map<string, Item>();
  for (const sc of Object.values(scenes)) all.set(`scene:${sc.id}`, item('scene', sc));
  for (const e of Object.values(encounters)) all.set(`encounter:${e.id}`, item('encounter', e));
  const groups: { title: string; items: Item[] }[] = [];
  const used = new Set<string>();
  for (const g of R.groups) {
    const list: Item[] = [];
    for (const key of g.items) {
      const it = all.get(key);
      if (!it || used.has(key)) continue;
      used.add(key);
      it.group = g.title;
      list.push(it);
    }
    groups.push({ title: g.title, items: list });
  }
  const rest = [...all.entries()].filter(([k]) => !used.has(k)).map(([, it]) => ({ ...it, group: R.unsortedTitle }));
  if (rest.length) groups.push({ title: R.unsortedTitle, items: rest });
  return { groups, flat: groups.flatMap((g) => g.items) };
}

function item(kind: Kind, x: Scene | EncounterDef): Item {
  return { kind, id: x.id, title: x.title, status: x.status, group: '', notes: x.notes ?? [] };
}

const { groups, flat } = buildItems();
const isLocked = (it: Item) => it.status === 'locked';

// ---------- who starts what (for a sensible starting state) ----------

type Ref = { kind: Kind; id: string } | { action: string };
const refs = new Map<string, Ref[]>();
function addRef(key: string, r: Ref) {
  const list = refs.get(key) ?? [];
  list.push(r);
  refs.set(key, list);
}
function walkRefs(v: unknown, from: Ref) {
  if (typeof v === 'string') {
    const m = /^(scene|encounter):([a-z0-9-]+)$/.exec(v);
    if (m) addRef(`${m[1]}:${m[2]}`, from);
  } else if (Array.isArray(v)) v.forEach((x) => walkRefs(x, from));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => walkRefs(x, from));
}
for (const sc of Object.values(scenes)) walkRefs(sc.nodes, { kind: 'scene', id: sc.id });
for (const e of Object.values(encounters)) walkRefs(e, { kind: 'encounter', id: e.id });
for (const a of actions) {
  if (a.scene) addRef(`scene:${a.scene}`, { action: a.id });
  walkRefs(a.effects ?? [], { action: a.id });
}

// ---------- reading and setting state ----------

type Val = number | string | boolean | undefined;

function getVal(s: State, key: string): Val {
  switch (key) {
    case 'day':
      return s.day;
    case 'time':
      return s.t;
    case 'place':
      return s.place;
    case 'room':
      return s.room;
    case 'stage':
      return s.stage;
    case 's3day':
      return s.stage >= 3 ? s.day - s.stageStartDay : -1;
    case 'purpose':
      return (s.flags.purposeId as string) || '';
    case 'standard':
      return !!s.standard;
  }
  const dot = key.indexOf('.');
  if (dot > 0) {
    const scope = key.slice(0, dot);
    const name = key.slice(dot + 1);
    switch (scope) {
      case 'today':
        return s.today[name];
      case 'tomorrow':
        return s.flags[`_tmr_${name}`];
      case 'count':
        return s.counts[name] ?? 0;
      case 'pull':
        return name === 'top' ? Math.max(s.pull.phone, s.pull.drink, s.pull.comfort) : s.pull[name as 'phone'] ?? 0;
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

const toggle = (list: string[], name: string, on: boolean) => {
  const i = list.indexOf(name);
  if (on && i < 0) list.push(name);
  if (!on && i >= 0) list.splice(i, 1);
};
const off = (v: Val) => v === undefined || v === false || v === '' || v === 'none' || v === 0;

function setVal(s: State, key: string, v: Val): void {
  switch (key) {
    case 'day':
      s.day = Math.max(1, Math.round(Number(v)) || 1);
      if (s.stageStartDay > s.day) s.stageStartDay = s.day;
      return;
    case 'weekday': {
      const idx = WEEKDAYS.indexOf(v as Weekday);
      if (idx < 0) return;
      let d = s.day - ((s.day - 1) % 7) + idx;
      if (d < 1) d += 7;
      s.day = d;
      return;
    }
    case 'workday': {
      const wd = (s.day - 1) % 7;
      if (v && wd >= 5) s.day += 7 - wd;
      if (!v && wd < 5) s.day += 5 - wd;
      return;
    }
    case 'time':
      s.t = Number(v) || 0;
      return;
    case 'place':
      s.place = (placeById[String(v)] ? v : 'home') as PlaceId;
      if (s.place === 'home') {
        if (!placeById.home.rooms?.some((r) => r.id === s.room)) s.room = 'living';
      } else s.room = '';
      return;
    case 'room':
      s.room = String(v ?? '');
      return;
    case 'stage': {
      const n = Math.max(1, Math.min(3, Number(v) || 1));
      s.stage = n;
      if (n >= 2 && s.day < 2) s.day = 2;
      if (n >= 3 && s.day < 8) s.day = 8;
      s.stageStartDay = s.day;
      return;
    }
    case 's3day': {
      if (s.stage < 3) setVal(s, 'stage', 3);
      const n = Math.max(0, Number(v) || 0);
      if (s.day - n < 1) s.day = n + 1;
      s.stageStartDay = s.day - n;
      return;
    }
    case 'pattern':
      s.pull = { phone: 0, drink: 0, comfort: 0 };
      if (v === 'phone' || v === 'drink' || v === 'comfort') s.pull[v] = 2;
      return;
    case 'purpose':
      if (off(v)) delete s.flags.purposeId;
      else s.flags.purposeId = String(v);
      return;
    case 'standard':
      s.standard = off(v) ? '' : L('sampleStandard');
      return;
    case 'open':
      return;
  }
  const dot = key.indexOf('.');
  if (dot > 0) {
    const scope = key.slice(0, dot);
    const name = key.slice(dot + 1);
    switch (scope) {
      case 'today':
        if (off(v) && typeof v !== 'number') delete s.today[name];
        else s.today[name] = v as number | string | boolean;
        return;
      case 'tomorrow':
        if (off(v) && typeof v !== 'number') delete s.flags[`_tmr_${name}`];
        else s.flags[`_tmr_${name}`] = v as number | string | boolean;
        return;
      case 'count':
        s.counts[name] = Math.max(0, Number(v) || 0);
        return;
      case 'pull':
        if (name === 'top') s.pull.phone = Math.max(0, Number(v) || 0);
        else s.pull[name as 'phone'] = Math.max(0, Number(v) || 0);
        return;
      case 'card':
        toggle(s.cards, name, !off(v));
        return;
      case 'seen':
        toggle(s.seen, name, !off(v));
        return;
      case 'seenToday':
        toggle(s.seenToday, name, !off(v));
        return;
      case 'trait':
        toggle(s.traits, name, !off(v));
        return;
      case 'line':
        s.lines[name as 'ownership'] = !off(v);
        return;
      case 'proof':
        s.proof[name as 'ownership'] = Array.from({ length: Math.max(0, Number(v) || 0) }, () => ({ day: s.day, t: s.t, text: L('sampleProof') }));
        if (s.proof[name as 'ownership'].length) s.lines[name as 'ownership'] = true;
        return;
      case 'quest':
        if (off(v)) {
          delete s.quests[name];
          s.questOrder = s.questOrder.filter((q) => q !== name);
        } else {
          s.quests[name] = { id: name, title: s.quests[name]?.title ?? name, kind: s.quests[name]?.kind ?? 'side', status: v === 'closed' ? 'closed' : 'active', objective: s.quests[name]?.objective ?? '', updatedDay: s.day };
          if (!s.questOrder.includes(name)) s.questOrder.push(name);
        }
        return;
    }
  }
  if (off(v) && typeof v !== 'number') delete s.flags[key];
  else s.flags[key] = v as number | string | boolean;
}

const ATOM = /^([A-Za-z0-9_.\-]+)\s*(>=|<=|!=|=|>|<)\s*(.+)$/;
const FLIP: Record<string, string> = { '=': '!=', '!=': '=', '>=': '<', '<=': '>', '>': '<=', '<': '>=' };

function numeric(raw: string): number | null {
  const v = raw.trim();
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (/^\d{1,2}:\d{2}$/.test(v)) return parseTime(v);
  if (v === 'true') return 1;
  if (v === 'false') return 0;
  return null;
}

/** Change the state as little as it takes for the atom to come out as wanted. */
function satisfyAtom(s: State, atom: string, want = true): void {
  const t = atom.trim();
  if (!t || check(s, [t]) === want) return;
  if (t.startsWith('any:')) {
    const parts = t.slice(4).split('|');
    if (want) satisfyAtom(s, parts[0], true);
    else parts.forEach((p) => satisfyAtom(s, p, false));
    return;
  }
  if (t.startsWith('!')) return satisfyAtom(s, t.slice(1), !want);
  const m = ATOM.exec(t);
  if (!m) {
    setVal(s, t, want);
    return;
  }
  const key = m[1];
  const op = want ? m[2] : FLIP[m[2]];
  const n = numeric(m[3]);
  if (n !== null) {
    const cur = Number(getVal(s, key) ?? 0);
    const table: Record<string, number> = { '=': n, '!=': cur === n ? n + 1 : cur, '>=': n, '>': n + 1, '<=': n, '<': n - 1 };
    const v = table[op] ?? n;
    setVal(s, key, v);
    return;
  }
  setVal(s, key, op === '=' ? m[3].trim() : undefined);
}

function satisfy(s: State, cond?: string[]): void {
  for (const a of cond ?? []) satisfyAtom(s, a, true);
}

function firstOpen(s: State, place: PlaceId): number {
  for (let t = 6 * 60 + 30; t < 26 * 60; t += 10) if (placeOpen(s, place, t)) return t;
  return 12 * 60;
}

function applyTrigger(s: State, tr: Trigger): void {
  switch (tr.at) {
    case 'wake':
      s.t = 6 * 60 + 30;
      s.place = 'home';
      s.room = 'bedroom';
      break;
    case 'bedtime':
      s.t = 22 * 60 + 30;
      s.place = 'home';
      s.room = 'bedroom';
      break;
    case 'enter': {
      const p = ([] as PlaceId[]).concat(tr.place ?? 'home')[0];
      setVal(s, 'place', p);
      if (tr.room) s.room = tr.room;
      s.t = firstOpen(s, p);
      break;
    }
    case 'time':
      s.t = tr.time ? parseTime(tr.time) : 12 * 60;
      s.room = 'living';
      break;
    default:
      break;
  }
  satisfy(s, tr.if);
  if (tr.at === 'enter' && !placeOpen(s, s.place)) s.t = firstOpen(s, s.place);
}

function freshState(): State {
  const s = newState({ name: L('defaultName'), pronouns: 'they', look: { skin: 2, hair: 0, hairColor: 1, build: 1, clothes: 0 }, start: 'drifting' });
  s.phase = 'play';
  return s;
}

/** A starting state that fits the scene: its trigger holds, or the trigger of what starts it. */
function initialFor(kind: Kind, id: string, depth = 0): State {
  const s = freshState();
  const tr = kind === 'scene' && scenes[id] ? Game.triggersOf(scenes[id]).find((t) => t.at !== 'manual') : undefined;
  if (tr) {
    applyTrigger(s, tr);
    return s;
  }
  const from = refs.get(`${kind}:${id}`)?.[0];
  if (from && depth < 3) {
    if ('action' in from) {
      const a = actions.find((x) => x.id === from.action);
      if (a && a.place !== '*') {
        setVal(s, 'place', a.place);
        if (a.room) s.room = a.room;
        s.t = firstOpen(s, a.place);
      }
      satisfy(s, a?.if);
      return s;
    }
    return initialFor(from.kind, from.id, depth + 1);
  }
  if (kind === 'encounter') {
    s.t = 21 * 60 + 40;
    s.room = 'living';
  }
  return s;
}

/** Every condition atom in a scene or encounter, plus the trigger of what starts it. */
function atomsOf(kind: Kind, id: string): string[] {
  const out = new Set<string>();
  const walk = (v: unknown, key = '') => {
    if (Array.isArray(v)) {
      if (key === 'if') v.forEach((a) => typeof a === 'string' && out.add(a));
      else v.forEach((x) => walk(x));
    } else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  walk(kind === 'scene' ? scenes[id] : encounters[id]);
  if (kind === 'encounter') {
    const from = refs.get(`encounter:${id}`)?.[0];
    if (from && !('action' in from) && from.kind === 'scene') walk(scenes[from.id]?.triggers ?? scenes[from.id]?.trigger);
  }
  return [...out];
}

interface KeyInfo {
  key: string;
  nums: boolean;
  values: Set<string>;
  atoms: string[];
}

const CORE = new Set(['day', 'weekday', 'workday', 'time', 'place', 'room', 'stage', 's3day', 'pattern', 'open']);

function keysOf(atoms: string[]): Map<string, KeyInfo> {
  const keys = new Map<string, KeyInfo>();
  const note = (a: string, whole: string) => {
    const t = a.trim().replace(/^!/, '');
    if (t.startsWith('any:')) return t.slice(4).split('|').forEach((p) => note(p, whole));
    const m = ATOM.exec(t);
    const key = m ? m[1] : t;
    const k = keys.get(key) ?? { key, nums: false, values: new Set<string>(), atoms: [] };
    if (m) {
      if (numeric(m[3]) !== null) k.nums = true;
      else k.values.add(m[3].trim());
    }
    if (!k.atoms.includes(whole)) k.atoms.push(whole);
    keys.set(key, k);
  };
  for (const a of atoms) note(a, a);
  return keys;
}

// ---------- review state ----------

interface RV {
  it: Item | null;
  base: State | null;
  g: ReviewGame | null;
  sheet: boolean;
  details: boolean;
  search: string;
  recStart: number;
  override: { resolve?: number; pull?: number };
  inputValue: string;
  feedback: string;
}

const rv: RV = { it: null, base: null, g: null, sheet: false, details: true, search: '', recStart: 0, override: {}, inputValue: '', feedback: '' };
let root: HTMLElement;
/** Set when moving on to the next scene with the same state, so the route keeps it. */
let carry: State | null = null;

const clone = (s: State): State => JSON.parse(JSON.stringify(s)) as State;

function open(kind: Kind, id: string): void {
  const it = flat.find((x) => x.kind === kind && x.id === id) ?? null;
  rv.it = it;
  rv.sheet = false;
  rv.override = {};
  rv.inputValue = '';
  rv.feedback = '';
  if (!it) {
    rv.g = null;
    render();
    return;
  }
  rv.base = carry ?? initialFor(kind, id);
  carry = null;
  restart();
}

function restart(nodeId?: string): void {
  const it = rv.it;
  if (!it || !rv.base) return;
  const g = new ReviewGame(clone(rv.base));
  g.onChange(render);
  rv.g = g;
  rv.recStart = g.s.record.length;
  g.s.notice = [];
  rv.inputValue = '';
  rv.feedback = '';
  if (it.kind === 'scene') {
    g.s.scene = undefined;
    g.beginScene(scenes[it.id], nodeId);
    if (g.s.scene) g.s.phase = 'scene';
  } else {
    g.s.queue = [];
    enc.start(g, it.id);
    const e = g.s.encounter;
    if (e && rv.override.resolve !== undefined) e.resolve = rv.override.resolve;
    if (e && rv.override.pull !== undefined) e.pull = rv.override.pull;
  }
  render();
}

/** Change a value in both the starting state and the live one. */
function setBoth(key: string, v: Val): void {
  if (rv.base) setVal(rv.base, key, v);
  if (rv.g) setVal(rv.g.s, key, v);
  // An encounter deals its hand and sets its numbers when it starts, so start it again
  // if nothing has been played yet.
  const e = rv.g?.s.encounter;
  if (rv.it?.kind === 'encounter' && e && !e.used.length && !e.outcome && e.round === 1) restart();
  else render();
}

// ---------- rendering ----------

const fill = (t: string) => (rv.g ? rv.g.fill(t) : t);
const paras = (list: string[]) => list.map((p) => `<p>${esc(p)}</p>`).join('');
const code = (cond?: string[]) => (cond ?? []).map((a) => `<code>${esc(a)}</code>`).join(', ');
const badge = (it: Item) => `<span class="rv-badge ${isLocked(it) ? 'locked' : 'draft'}">${esc(isLocked(it) ? L('locked') : L('draft'))}</span>`;
const hasTime = (text: string) => /\b\d{1,2}:\d{2}\s?(a\.m\.|p\.m\.)/.test(text);

function renderList(): string {
  const q = rv.search.trim().toLowerCase();
  const match = (it: Item) => !q || it.title.toLowerCase().includes(q) || it.id.includes(q);
  return `<div class="screen rv-list fade-in">
    <h1>${esc(L('title'))}</h1>
    <p class="muted">${esc(L('intro'))}</p>
    <label class="field"><span class="sr-only">${esc(L('search'))}</span>
      <input type="search" data-input="search" placeholder="${esc(L('search'))}" value="${esc(rv.search)}" autocomplete="off"></label>
    ${groups
      .map((g) => {
        const list = g.items.filter(match);
        if (!list.length) return '';
        return `<h2>${esc(g.title)}</h2><ul class="rv-items">${list
          .map(
            (it) => `<li><a class="rv-item" href="#/${it.kind}/${esc(it.id)}">
              <span class="rv-item-title">${esc(it.title)}</span>
              <span class="rv-item-meta">${badge(it)} <span class="muted">${esc(L(it.kind))} · ${esc(it.id)}</span></span></a></li>`,
          )
          .join('')}</ul>`;
      })
      .join('')}
  </div>`;
}

function placeText(s: State): string {
  const p = placeById[s.place];
  if (!p) return s.place;
  const r = s.place === 'home' ? p.rooms?.find((x) => x.id === s.room) : undefined;
  return r ? `${p.name} · ${r.name}` : p.name;
}

function topBar(it: Item, s: State): string {
  return `<header class="top">
    <a class="icon-btn" href="#/">${esc(L('list'))}</a>
    <div class="clock"><span class="when">${esc(dayName(s.day))} · ${esc(fmtTime(s.t))}</span>
      <span class="where">${esc(L(it.kind))} · ${esc(placeText(s))}</span></div>
    <button class="icon-btn" data-act="state">${esc(L('state'))}</button>
  </header>`;
}

function bottomBar(it: Item): string {
  const i = flat.indexOf(it);
  const prev = flat[i - 1];
  const next = flat[i + 1];
  return `<nav class="tabs">
    ${prev ? `<a class="rv-tab" href="#/${prev.kind}/${esc(prev.id)}">${esc(L('prev'))}</a>` : `<button disabled>${esc(L('prev'))}</button>`}
    <button data-act="restart">${esc(L('restart'))}</button>
    <button data-act="details" aria-pressed="${rv.details}">${esc(L('details'))}</button>
    ${next ? `<a class="rv-tab" href="#/${next.kind}/${esc(next.id)}">${esc(L('next'))}</a>` : `<button disabled>${esc(L('next'))}</button>`}
  </nav>`;
}

function headerBlock(it: Item): string {
  const trig = it.kind === 'scene' ? Game.triggersOf(scenes[it.id]) : [];
  const by = refs.get(`${it.kind}:${it.id}`) ?? [];
  const byText = by.map((r) => ('action' in r ? actions.find((a) => a.id === r.action)?.label ?? r.action : `${L(r.kind)} ${r.id}`));
  return `<div class="rv-head">
    <h2>${esc(it.title)}</h2>
    <div>${badge(it)} <span class="muted">${esc(it.group)} · <code>${esc(it.id)}</code></span></div>
    ${
      rv.details
        ? `<details class="rv-notes"><summary>${esc(L('notes'))} (${it.notes.length})</summary>
      ${it.notes.length ? `<ul>${it.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      ${trig.length ? `<p class="muted"><strong>${esc(L('runs'))}:</strong> ${trig.map((t) => `${esc(t.at)}${t.place ? ` ${esc(String(t.place))}` : ''}${t.room ? ` (${esc(t.room)})` : ''}${t.time ? ` ${esc(t.time)}` : ''}${t.if?.length ? ` · ${code(t.if)}` : ''}`).join('; ')}</p>` : ''}
      ${byText.length ? `<p class="muted"><strong>${esc(L('startedBy'))}:</strong> ${esc(byText.join('; '))}</p>` : ''}
    </details>`
        : ''
    }
  </div>`;
}

function recordBox(s: State): string {
  const recs = s.record.slice(rv.recStart);
  const notices = s.notice ?? [];
  return `<div class="rv-records">
    <h3>${esc(L('written'))}</h3>
    ${
      recs.length
        ? `<div class="notice">${recs.map((r) => `<p>${hasTime(r.text) ? '' : `<span class="muted">${esc(fmtTime(r.t))}</span> `}${esc(r.text)}</p>`).join('')}</div>`
        : `<p class="muted">${esc(L('noneWritten'))}</p>`
    }
    ${notices.length ? `<h3>${esc(L('notices'))}</h3><div class="notice">${paras(notices)}</div>` : ''}
  </div>`;
}

function choiceMeta(c: { if?: string[]; record?: string | string[]; next?: string | null }, shown: boolean): string {
  if (!rv.details) return '';
  const parts: string[] = [];
  if (c.if?.length) parts.push(`${esc(L('onlyIf'))} ${code(c.if)}${shown ? '' : ` · ${esc(L('notMet'))}`}`);
  const recs = c.record === undefined ? [] : Array.isArray(c.record) ? c.record : [c.record];
  for (const r of recs) parts.push(`${esc(L('recordPreview'))}: ${esc(fill(r))}`);
  parts.push(c.next ? `${esc(L('then'))}: <code>${esc(c.next)}</code>` : esc(L('endsScene')));
  return `<div class="rv-meta">${parts.join('<br>')}</div>`;
}

function renderNode(g: ReviewGame, sc: Scene, nodeId: string, node: Node): string {
  const s = g.s;
  const st = s.scene!;
  let html = '';
  const ids = Object.keys(sc.nodes);
  if (ids.length > 1) {
    html += `<label class="rv-jump"><span class="muted">${esc(L('jump'))}</span>
      <select data-change="jump">${ids.map((id) => `<option value="${esc(id)}"${id === nodeId ? ' selected' : ''}>${esc(id)}${id === sc.start ? ' ·' : ''}</option>`).join('')}</select></label>`;
  } else if (rv.details) html += `<p class="muted rv-step">${esc(L('kindStep'))}: <code>${esc(nodeId)}</code></p>`;
  if (node.speaker) html += `<div class="speaker">${esc(fill(node.speaker))}</div>`;
  const block = (list: string[]) => (node.message ? list.map((t) => `<div class="message"><p>${esc(fill(t))}</p></div>`).join('') : `<div class="narration">${paras(list.map(fill))}</div>`);
  if (node.text?.length) html += block(node.text);
  for (const t of node.textIf ?? []) {
    const on = check(s, t.if);
    if (on) html += `${rv.details ? `<div class="rv-cond">${esc(L('onlyWhen'))} ${code(t.if)}</div>` : ''}${block(t.text)}`;
    else if (rv.details) html += `<div class="rv-hidden"><div class="rv-cond">${esc(L('hiddenNow'))}: ${esc(L('onlyWhen'))} ${code(t.if)}</div>${block(t.text)}</div>`;
  }
  if (!node.text?.length && !(node.textIf ?? []).some((t) => check(s, t.if)) && !node.choices?.length && !node.input) html += `<p class="muted">${esc(L('noStep'))}</p>`;
  if (st.result) {
    html += `<div class="result fade-in">${paras(st.result)}</div>`;
    html += `<div class="choices"><button class="choice primary" data-act="continue">${esc(line('ui.continue'))}</button></div>`;
    return html + tagBox(node.tag);
  }
  if (node.input === 'standard' || node.input === 'purpose-own') {
    const starters = (node.starters ?? []).filter((x) => check(s, x.if));
    html += `<form data-form="input">
      <label class="field"><span class="sr-only">${esc(line('ui.yourLine'))}</span>
      <textarea name="line" maxlength="140" data-input="line" placeholder="${esc(line(node.input === 'standard' ? 'standard.placeholder' : 'purpose.placeholder'))}">${esc(rv.inputValue)}</textarea></label>
      ${starters.length ? `<p class="muted">${esc(line('standard.starters'))}</p><div class="seg">${starters.map((x) => `<button type="button" data-act="starter" data-arg="${esc(fill(x.text))}">${esc(fill(x.text))}</button>`).join('')}</div>` : ''}
      ${rv.feedback ? `<div class="result fade-in" role="status"><p>${esc(rv.feedback)}</p></div>` : ''}
      <div class="row"><button class="btn" type="submit">${esc(line(node.input === 'standard' ? 'standard.write' : 'purpose.write'))}</button></div>
    </form>`;
    return html + tagBox(node.tag);
  }
  if (node.input === 'review-week') html += renderReview(s);
  const all = (node.choices ?? []).map((c, i) => ({ c, i, shown: check(s, c.if) }));
  const list = all.filter((x) => x.shown || rv.details);
  if (list.length) {
    html += `<div class="choices">${list
      .map(
        ({ c, i, shown }) =>
          `<div class="rv-choice${shown ? '' : ' rv-off'}"><button class="choice${c.escape ? ' escape' : ''}" data-act="choose" data-arg="${i}">${esc(fill(c.label))}${c.note ? `<span class="note">${esc(fill(c.note))}</span>` : ''}</button>${choiceMeta(c, shown)}</div>`,
      )
      .join('')}</div>`;
  }
  if (!all.some((x) => x.shown)) {
    const nxt = (node.nextIf ?? []).find((n) => check(s, n.if))?.next ?? node.next ?? null;
    html += `<div class="choices"><button class="choice primary" data-act="continue">${esc(line('ui.continue'))}</button>${rv.details ? `<div class="rv-meta">${nxt ? `${esc(L('then'))}: <code>${esc(nxt)}</code>` : esc(L('endsScene'))}</div>` : ''}</div>`;
  }
  return html + tagBox(node.tag);
}

function renderEnd(s: State): string {
  const parts: string[] = [`<div class="outcome"><div class="label">${esc(L('sceneEnded'))}</div>`];
  const queued = s.queue.map((q) => q.replace(/^!/, '')).filter((id) => scenes[id]);
  for (const id of queued) parts.push(`<p>${esc(L('queued'))}: <strong>${esc(scenes[id].title)}</strong></p><div class="choices"><button class="choice" data-act="carry" data-arg="scene:${esc(id)}">${esc(L('continueHere'))}</button></div>`);
  const pe = s.flags._pendingEncounter;
  if (pe && encounters[String(pe)]) parts.push(`<p>${esc(L('pendingEncounter'))}: <strong>${esc(encounters[String(pe)].title)}</strong></p><div class="choices"><button class="choice" data-act="carry" data-arg="encounter:${esc(String(pe))}">${esc(L('continueHere'))}</button></div>`);
  if (s.today._bedPending || s.today._bedDone) parts.push(`<p class="muted">${esc(L('nightFalls'))}</p>`);
  if (s.flags._sliceEnded) parts.push(`<p class="muted">${esc(L('sliceEnds'))}</p>`);
  parts.push(`<div class="row"><button class="btn" data-act="restart">${esc(L('playAgain'))}</button><a class="btn secondary" href="#/">${esc(L('backToList'))}</a></div></div>`);
  return parts.join('');
}

function cardHtml(id: string, strong: boolean): string {
  const c = cards[id];
  if (!c) return '';
  return `<button class="card ${c.kind}" data-act="card" data-arg="${esc(c.id)}">
    <span class="kind">${esc(line(`card.kind.${c.kind}`))}</span>
    <span class="name">${esc(c.name)}</span>
    <span class="text">${esc(fill(c.text))}</span>
    ${strong ? `<span class="strong">${esc(line('enc.strongHere'))}</span>` : ''}
  </button>`;
}

function renderEncounter(g: ReviewGame, d: EncounterDef): string {
  const s = g.s;
  const e = s.encounter;
  if (!e) return renderEnd(s);
  const editable = !e.used.length && !e.outcome && e.round === 1;
  const meter = (k: 'resolve' | 'pull') =>
    `<div class="meter ${k}"><span class="name">${esc(line(`enc.${k}`))}</span>${editable ? `<span class="rv-adj"><button class="icon-btn" data-act="num" data-arg="${k}:-1" aria-label="${esc(L(k))} -1">−</button><span class="num">${e[k]}</span><button class="icon-btn" data-act="num" data-arg="${k}:1" aria-label="${esc(L(k))} +1">+</button></span>` : `<span class="num">${e[k]}</span>`}</div>`;
  let html = `<div class="meters">${meter('resolve')}${meter('pull')}</div>`;
  if (editable) html += `<p class="muted rv-small">${esc(L('startNumbersNote'))}${rv.override.resolve !== undefined || rv.override.pull !== undefined ? ` <button class="icon-btn" data-act="computed">${esc(L('useComputed'))}</button>` : ''}</p>`;
  if (e.mods.length) {
    html += `<details class="why"><summary>${esc(line('enc.why'))}</summary><ul>${e.mods
      .map((m) => {
        const p = [];
        if (m.r) p.push(`${line('enc.resolve')} ${m.r > 0 ? '+' : ''}${m.r}`);
        if (m.p) p.push(`${line('enc.pull')} ${m.p > 0 ? '+' : ''}${m.p}`);
        return `<li>${esc(m.text)} <strong>${esc(p.join(', '))}</strong></li>`;
      })
      .join('')}</ul></details>`;
  }
  html += `<div class="log">${e.log.map((x) => `<div class="${x.who} fade-in">${esc(x.text)}</div>`).join('')}</div>`;
  if (e.outcome) {
    const view = enc.outcomeView(g)!;
    const recs: string[] = [];
    if (e.outcome.kind === 'acted') {
      const f = enc.floorOptions(g)[e.outcome.floorIndex ?? 0];
      if (f?.record) recs.push(f.record);
    }
    if (view.record) recs.push(...(Array.isArray(view.record) ? view.record : [view.record]));
    html += `<div class="outcome fade-in"><div class="label">${esc(view.label)}</div>${paras(view.text.map(fill))}
      ${recs.length ? `<div class="rec"><span class="muted">${esc(line('enc.onRecord'))}</span>${paras(recs.map(fill))}</div>` : ''}</div>
      <div class="choices"><button class="choice primary" data-act="enc-finish">${esc(L('finish'))}</button></div>`;
    return html + tagBox(d.tag);
  }
  if (e.pickingFloor) {
    html += `<p><strong>${esc(line('enc.pickFloor'))}</strong></p><div class="choices">${enc
      .floorOptions(g)
      .map((f, i) => `<button class="choice" data-act="floor" data-arg="${i}">${esc(fill(f.label))}${f.text.length ? `<span class="note">${esc(fill(f.text[0]))}</span>` : ''}</button>`)
      .join('')}</div>`;
    return html;
  }
  html += `<p class="muted">${esc(line('enc.handHint'))}</p><div class="hand">${e.hand.map((id) => cardHtml(id, e.strong.includes(id))).join('')}</div>`;
  return html + tagBox(d.tag);
}

function control(key: string, info: KeyInfo | undefined, s: State): string {
  const v = getVal(s, key);
  const id = `rv-${key.replace(/[^a-z0-9]/gi, '-')}`;
  const atoms = info ? `<div class="rv-atoms">${info.atoms.map((a) => `<span class="${check(s, [a]) ? 'yes' : 'no'}"><code>${esc(a)}</code> ${esc(check(s, [a]) ? L('yes') : L('no'))}</span>`).join('')}</div>` : '';
  let input: string;
  if (key.startsWith('quest.')) {
    input = `<select id="${id}" data-key="${esc(key)}">${['none', 'active', 'closed'].map((o) => `<option${v === o ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
  } else if (/^(card|seen|seenToday|trait|line)\./.test(key) || (info && !info.nums && !info.values.size) || key === 'standard') {
    input = `<input type="checkbox" id="${id}" data-key="${esc(key)}"${off(v) ? '' : ' checked'}>`;
  } else if (info && info.nums) {
    input = `<input type="number" id="${id}" data-key="${esc(key)}" value="${esc(Number(v ?? 0))}">`;
  } else {
    const opts = [...(info?.values ?? [])];
    input = `<select id="${id}" data-key="${esc(key)}"><option value="">${esc(L('notSet'))}</option>${opts.map((o) => `<option${String(v) === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  }
  return `<div class="rv-row"><label for="${id}"><code>${esc(key)}</code></label>${input}${atoms}</div>`;
}

function renderStateSheet(it: Item, s: State): string {
  const keys = keysOf(atomsOf(it.kind, it.id));
  const coreAtoms = [...keys.values()].filter((k) => CORE.has(k.key)).flatMap((k) => k.atoms);
  const hh = String(Math.floor((s.t % 1440) / 60)).padStart(2, '0');
  const mm = String(s.t % 60).padStart(2, '0');
  const home = placeById.home;
  const opt = (v: string | number, label: string, cur: unknown) => `<option value="${esc(v)}"${String(cur) === String(v) ? ' selected' : ''}>${esc(label)}</option>`;
  let body = `<p class="muted">${esc(L('stateIntro'))}</p>
    <div class="row"><button class="btn secondary" data-act="state-trigger">${esc(L('stateFromTrigger'))}</button><button class="btn quiet" data-act="state-clear">${esc(L('stateClear'))}</button></div>
    <h3>${esc(L('character'))}</h3>
    <div class="rv-row"><label for="rv-name">${esc(L('name'))}</label><input id="rv-name" type="text" data-key="_name" value="${esc(s.character.name)}"></div>
    <div class="rv-row"><label for="rv-pr">${esc(L('pronouns'))}</label><select id="rv-pr" data-key="_pronouns">${(['he', 'she', 'they'] as const).map((p) => opt(p, p, s.character.pronouns)).join('')}</select></div>
    <h3>${esc(L('day'))} · ${esc(L('time'))} · ${esc(L('place'))}</h3>
    <div class="rv-row"><label for="rv-day">${esc(L('day'))}</label><input id="rv-day" type="number" min="1" data-key="day" value="${s.day}"> <span class="muted">${esc(dayName(s.day))}</span></div>
    <div class="rv-row"><label for="rv-time">${esc(L('time'))}</label><input id="rv-time" type="time" data-key="_time" value="${hh}:${mm}"> <span class="muted">${esc(period(s.t))}</span></div>
    <div class="rv-row"><label for="rv-place">${esc(L('place'))}</label><select id="rv-place" data-key="place">${places.map((p) => opt(p.id, p.name, s.place)).join('')}</select></div>
    ${s.place === 'home' ? `<div class="rv-row"><label for="rv-room">${esc(L('room'))}</label><select id="rv-room" data-key="room">${(home.rooms ?? []).map((r) => opt(r.id, r.name, s.room)).join('')}</select></div>` : ''}
    <div class="rv-row"><label for="rv-stage">${esc(L('stage'))}</label><select id="rv-stage" data-key="stage">${[1, 2, 3].map((n) => opt(n, line(`stage.${n}`), s.stage)).join('')}</select></div>
    ${keys.has('s3day') ? control('s3day', { key: 's3day', nums: true, values: new Set(), atoms: keys.get('s3day')!.atoms }, s) : ''}
    <div class="rv-row"><label for="rv-pattern">${esc(L('pattern'))}</label><select id="rv-pattern" data-key="pattern">${['none', 'phone', 'drink', 'comfort'].map((p) => opt(p, p, patternOf(s))).join('')}</select></div>
    ${coreAtoms.length ? `<div class="rv-atoms">${coreAtoms.map((a) => `<span class="${check(s, [a]) ? 'yes' : 'no'}"><code>${esc(a)}</code> ${esc(check(s, [a]) ? L('yes') : L('no'))}</span>`).join('')}</div>` : ''}`;
  const others = [...keys.values()].filter((k) => !CORE.has(k.key)).sort((a, b) => a.key.localeCompare(b.key));
  if (others.length) body += `<h3>${esc(L('otherFlags'))}</h3>${others.map((k) => control(k.key, k, s)).join('')}`;
  if (it.kind === 'encounter') {
    const earned = Object.values(cards).filter((c) => c.kind === 'action' && !['floor', 'waiting', 'text-dana'].includes(c.id));
    body += `<h3>${esc(L('cardsTitle'))}</h3><p class="muted">${esc(L('earnedNote'))}</p>
      ${earned.map((c) => `<div class="rv-row"><label for="rv-card-${c.id}">${esc(c.name)}</label><input type="checkbox" id="rv-card-${c.id}" data-key="card.${c.id}"${s.cards.includes(c.id) ? ' checked' : ''}></div>`).join('')}
      <div class="rv-row"><label for="rv-trust">${esc(L('trust'))}</label><input id="rv-trust" type="number" min="0" data-key="danaTrust" value="${Number(s.flags.danaTrust ?? 0)}"></div>`;
  }
  body += `<form data-form="setflag" class="rv-row"><label for="rv-any">${esc(L('addFlag'))}</label><input id="rv-any" name="kv" type="text" autocomplete="off"><button class="btn secondary" type="submit">${esc(L('add'))}</button></form>`;
  return `<div class="sheet-back" data-act="sheet-close-back"><div class="sheet fade-in" role="dialog" aria-modal="true" aria-label="${esc(L('stateTitle'))}">
    <div class="sheet-head"><h2>${esc(L('stateTitle'))}</h2><button class="icon-btn" data-act="sheet-close">${esc(L('close'))}</button></div>${body}</div></div>`;
}

function patternOf(s: State): string {
  const top = Math.max(s.pull.phone, s.pull.drink, s.pull.comfort);
  if (top < 2) return 'none';
  if (s.pull.drink === top) return 'drink';
  if (s.pull.phone === top) return 'phone';
  return 'comfort';
}

function renderItem(it: Item): string {
  const g = rv.g!;
  const s = g.s;
  let panel = headerBlock(it);
  let art = 'living';
  if (it.kind === 'scene') {
    const sc = scenes[it.id];
    const cur = g.currentScene();
    art = cur?.node?.art ?? sc.art ?? (s.place === 'home' ? s.room || 'living' : placeById[s.place]?.art ?? 'living');
    if (cur && cur.node && s.scene && !s.scene.error) panel += renderNode(g, sc, s.scene.node, cur.node);
    else if (s.scene?.error) panel += `<p class="error">${esc(s.scene.error)}</p>`;
    else if (s.encounter) {
      // A scene that starts its encounter straight away (the night scenes) hands over here.
      panel += renderEncounter(g, encounters[s.encounter.id]);
      art = s.encounter.setting;
    } else panel += renderEnd(s);
  } else {
    const d = encounters[it.id];
    art = s.encounter?.setting ?? d.setting ?? 'living';
    panel += renderEncounter(g, d);
  }
  panel += recordBox(s);
  return `${topBar(it, s)}
    <main class="stage"><div class="art-col">${artFor(art, s)}</div><section class="panel fade-in" aria-live="polite">${panel}</section></main>
    ${bottomBar(it)}${rv.sheet ? renderStateSheet(it, s) : ''}`;
}

let lastView = '';
function render(): void {
  let html: string;
  let view: string;
  if (!rv.it) {
    view = location.hash.length > 2 ? 'missing' : 'list';
    html = view === 'list' ? renderList() : `<div class="screen"><h1>${esc(L('missing'))}</h1><p><a href="#/">${esc(L('backToList'))}</a></p></div>`;
  } else if (!rv.g) {
    view = 'missing';
    html = `<div class="screen"><h1>${esc(L('missing'))}</h1><p><a href="#/">${esc(L('backToList'))}</a></p></div>`;
  } else {
    const s = rv.g.s;
    view = [rv.it.kind, rv.it.id, s.scene?.node ?? '', s.scene?.result ? 'r' : '', s.encounter?.outcome ? 'o' : '', s.encounter ? 'e' : ''].join('|');
    html = renderItem(rv.it);
  }
  const keep = view === lastView;
  const y = window.scrollY;
  const focusId = (document.activeElement as HTMLElement | null)?.id;
  root.innerHTML = html;
  root.classList.toggle('same-view', keep);
  if (keep) window.scrollTo(0, y);
  else window.scrollTo(0, 0);
  lastView = view;
  document.body.style.overflow = rv.sheet ? 'hidden' : '';
  if (focusId) document.getElementById(focusId)?.focus();
}

// ---------- events ----------

function route(): void {
  const m = /^#\/(scene|encounter)\/(.+)$/.exec(location.hash);
  if (m) open(m[1] as Kind, decodeURIComponent(m[2]));
  else {
    rv.it = null;
    rv.g = null;
    rv.sheet = false;
    render();
  }
}

function onClick(ev: MouseEvent): void {
  const target = ev.target as HTMLElement;
  const el = target.closest<HTMLElement>('[data-act]');
  if (!el) return;
  const act = el.dataset.act!;
  const arg = el.dataset.arg ?? '';
  if (act === 'sheet-close-back' && target !== el) return;
  const g = rv.g;
  switch (act) {
    case 'state':
      rv.sheet = true;
      return render();
    case 'sheet-close':
    case 'sheet-close-back':
      rv.sheet = false;
      return render();
    case 'details':
      rv.details = !rv.details;
      return render();
    case 'restart':
      return restart();
    case 'state-trigger':
      if (rv.it) rv.base = initialFor(rv.it.kind, rv.it.id);
      return restart();
    case 'state-clear':
      rv.base = freshState();
      return restart();
  }
  if (!g) return;
  switch (act) {
    case 'choose': {
      const cur = g.currentScene();
      const c = cur?.node.choices?.[Number(arg)];
      if (!c) return;
      // A hidden choice can still be followed: set the state so its condition holds.
      if (!check(g.s, c.if)) satisfy(g.s, c.if);
      rv.feedback = '';
      g.choose(Number(arg));
      return;
    }
    case 'continue':
      rv.feedback = '';
      if (g.s.scene?.error) {
        g.s.scene = undefined;
        return render();
      }
      g.continueScene();
      return;
    case 'starter':
      rv.inputValue = arg;
      rv.feedback = '';
      return render();
    case 'card':
      g.playCard(arg);
      return;
    case 'floor':
      g.pickFloor(Number(arg));
      return;
    case 'enc-finish':
      g.finishEncounter();
      return;
    case 'num': {
      const e = g.s.encounter;
      if (!e) return;
      const [k, d] = arg.split(':');
      const key = k as 'resolve' | 'pull';
      e[key] = Math.max(0, e[key] + Number(d));
      rv.override[key] = e[key];
      return render();
    }
    case 'computed':
      rv.override = {};
      return restart();
    case 'carry': {
      const [kind, id] = arg.split(':');
      const s = clone(g.s);
      s.queue = [];
      delete s.flags._pendingEncounter;
      s.scene = undefined;
      s.encounter = undefined;
      carry = s;
      location.hash = `#/${kind}/${id}`;
      return;
    }
  }
}

function onChange(ev: Event): void {
  const el = ev.target as HTMLInputElement | HTMLSelectElement;
  if (el.dataset.change === 'jump') {
    restart(el.value);
    return;
  }
  const key = el.dataset.key;
  if (!key) return;
  const isBox = el instanceof HTMLInputElement && el.type === 'checkbox';
  const raw = isBox ? (el as HTMLInputElement).checked : el.value;
  if (key === '_name' || key === '_pronouns') {
    for (const s of [rv.base, rv.g?.s]) {
      if (!s) continue;
      if (key === '_name') s.character.name = String(raw);
      else s.character.pronouns = raw as State['character']['pronouns'];
    }
    return render();
  }
  if (key === '_time') {
    const t = parseTime(String(raw));
    if (!Number.isNaN(t)) setBoth('time', t);
    return;
  }
  if (el instanceof HTMLInputElement && el.type === 'number') return setBoth(key, Number(raw));
  if (key === 'stage') return setBoth(key, Number(raw));
  setBoth(key, raw === '' ? undefined : raw);
}

function onInput(ev: Event): void {
  const el = ev.target as HTMLInputElement;
  if (el.dataset.input === 'search') {
    rv.search = el.value;
    render();
  }
  if (el.dataset.input === 'line') rv.inputValue = el.value;
}

function onSubmit(ev: SubmitEvent): void {
  const form = ev.target as HTMLFormElement;
  const kind = form.dataset.form;
  if (!kind) return;
  ev.preventDefault();
  const data = new FormData(form);
  if (kind === 'setflag') {
    const kv = String(data.get('kv') ?? '').trim();
    if (!kv) return;
    const neg = kv.startsWith('!');
    const t = neg ? kv.slice(1) : kv;
    const eq = t.indexOf('=');
    if (eq < 0) return setBoth(t, !neg);
    const raw = t.slice(eq + 1).trim();
    const n = numeric(raw);
    return setBoth(t.slice(0, eq).trim(), n !== null && raw !== 'true' && raw !== 'false' ? n : raw === 'true' ? true : raw === 'false' ? false : raw);
  }
  if (kind === 'input' && rv.g) {
    const value = String(data.get('line') ?? '').trim();
    const node = rv.g.currentScene()?.node;
    if (node?.input === 'standard') {
      const res = checkStandard(value);
      if (res !== 'ok') {
        rv.inputValue = value;
        rv.feedback = line(`standard.${res}`);
        return render();
      }
    } else if (!value) {
      rv.feedback = line('purpose.empty');
      return render();
    }
    rv.inputValue = '';
    rv.feedback = '';
    rv.g.submitInput(value);
  }
}

export function mountReview(el: HTMLElement): void {
  root = el;
  root.classList.add('rv');
  document.title = `${L('title')} · ${document.title}`;
  root.addEventListener('click', onClick);
  root.addEventListener('change', onChange);
  root.addEventListener('input', onInput);
  root.addEventListener('submit', onSubmit);
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && rv.sheet) {
      rv.sheet = false;
      render();
    }
  });
  window.addEventListener('hashchange', route);
  // For the automated check (npm run review-check): the order of the list.
  (window as unknown as { __review: { items: { kind: Kind; id: string }[] } }).__review = { items: flat.map((x) => ({ kind: x.kind, id: x.id })) };
  route();
}
