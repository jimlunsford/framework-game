// Loads scenes, encounters and the shared files the Scene Book export needs.
// Used by export-scenes, import-scenes and the round-trip test.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CONTENT = join(ROOT, 'src', 'content');
export const SCENES_DIR = join(ROOT, 'docs', 'scenes');
export const COMBINED = join(ROOT, 'docs', 'scene-book-drafts.md');

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

/** A short fingerprint of a content file's data. It changes when the JSON's data changes. */
export function version(json) {
  return createHash('sha1').update(JSON.stringify(json)).digest('hex').slice(0, 10);
}

/**
 * Every scene and encounter, in review order, with the shared data the Markdown needs.
 * items: [{ kind, id, file (repo path), abs, json, text (raw file), group }]
 */
export function loadAll() {
  const items = new Map();
  for (const [kind, dir] of [
    ['scene', 'scenes'],
    ['encounter', 'encounters'],
  ]) {
    for (const f of readdirSync(join(CONTENT, dir)).filter((x) => x.endsWith('.json')).sort()) {
      const abs = join(CONTENT, dir, f);
      const text = readFileSync(abs, 'utf8');
      const json = JSON.parse(text);
      items.set(`${kind}:${json.id}`, { kind, id: json.id, file: `src/content/${dir}/${f}`, abs, text, json });
    }
  }
  const review = readJson(join(CONTENT, 'review.json'));
  const ordered = [];
  const groups = [];
  for (const g of review.groups) {
    const list = [];
    for (const key of g.items) {
      const it = items.get(key);
      if (!it || it.group) continue;
      it.group = g.title;
      list.push(it);
      ordered.push(it);
    }
    groups.push({ id: g.id, title: g.title, items: list });
  }
  const rest = [...items.values()].filter((x) => !x.group);
  if (rest.length) {
    for (const it of rest) {
      it.group = review.unsortedTitle;
      ordered.push(it);
    }
    groups.push({ id: 'unsorted', title: review.unsortedTitle, items: rest });
  }
  const cards = Object.fromEntries(readJson(join(CONTENT, 'cards.json')).cards.map((c) => [c.id, c]));
  const places = Object.fromEntries(readJson(join(CONTENT, 'places.json')).places.map((p) => [p.id, p]));
  const actions = readJson(join(CONTENT, 'actions.json')).actions;
  return { items: ordered, groups, cards, places, actions, refs: findRefs([...items.values()], actions) };
}

/** Who starts each scene or encounter on purpose: scene: and encounter: effects, and actions. */
function findRefs(items, actions) {
  const refs = {};
  const add = (key, by) => {
    refs[key] = refs[key] ?? [];
    if (!refs[key].includes(by)) refs[key].push(by);
  };
  const walk = (v, by) => {
    if (typeof v === 'string') {
      const m = /^(scene|encounter):([a-z0-9-]+)$/.exec(v);
      if (m) add(`${m[1]}:${m[2]}`, by);
      return;
    }
    if (Array.isArray(v)) v.forEach((x) => walk(x, by));
    else if (v && typeof v === 'object') Object.values(v).forEach((x) => walk(x, by));
  };
  for (const it of items) walk(it.json, `${it.kind} ${it.id}`);
  for (const a of actions) {
    if (a.scene) add(`scene:${a.scene}`, `action "${a.label}"`);
    walk(a.effects ?? [], `action "${a.label}"`);
  }
  return refs;
}

/** "21:40" -> "9:40 p.m." (the same clock text the game shows). */
export function fmtClock(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s).trim());
  if (!m) return String(s);
  const total = (Number(m[1]) * 60 + Number(m[2])) % 1440;
  const h24 = Math.floor(total / 60);
  let h = h24 % 12;
  if (h === 0) h = 12;
  return `${h}:${String(total % 60).padStart(2, '0')} ${h24 < 12 ? 'a.m.' : 'p.m.'}`;
}
