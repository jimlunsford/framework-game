// Checks the content files for broken references: missing nodes, scenes, encounters,
// cards, unknown effect verbs and malformed conditions. Run: npm run check-content
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

const scenes = {};
for (const f of readdirSync(join(root, 'scenes')).filter((x) => x.endsWith('.json'))) {
  const data = read(join('scenes', f));
  for (const sc of Array.isArray(data) ? data : [data]) {
    if (scenes[sc.id]) err(f, `duplicate scene id ${sc.id}`);
    scenes[sc.id] = { ...sc, file: `scenes/${f}` };
  }
}
const encounters = {};
for (const f of readdirSync(join(root, 'encounters')).filter((x) => x.endsWith('.json'))) {
  const e = read(join('encounters', f));
  if (encounters[e.id]) err(f, `duplicate encounter id ${e.id}`);
  encounters[e.id] = { ...e, file: `encounters/${f}` };
}
const cards = Object.fromEntries(read('cards.json').cards.map((c) => [c.id, c]));
const actions = read('actions.json').actions;
const places = read('places.json').places;
const people = read('people.json').people;
const floors = read('floors.json').floor;
const outcomes = read('outcomes.json');
const lines = read('lines.json');
const placeIds = new Set(places.map((p) => p.id));

const VERBS = new Set(['set', 'unset', 'add', 'time', 'card', 'uncard', 'proof', 'line', 'go', 'room', 'scene', 'encounter', 'restart', 'bed', 'stage', 'record', 'notice', 'trait', 'purpose', 'end', 'trust']);
const ATOM = /^([A-Za-z0-9_.\- ]+?)\s*(>=|<=|!=|=|>|<)\s*(.+)$/;

function checkCond(where, cond) {
  if (cond === undefined) return;
  if (!Array.isArray(cond)) return err(where, `condition must be a list: ${JSON.stringify(cond)}`);
  for (const a of cond) {
    if (typeof a !== 'string') err(where, `condition atom must be text: ${JSON.stringify(a)}`);
    let t = a.trim();
    if (t.startsWith('any:')) {
      for (const part of t.slice(4).split('|')) checkCond(where, [part]);
      continue;
    }
    if (t.startsWith('!')) t = t.slice(1);
    if (t.startsWith('any:')) {
      for (const part of t.slice(4).split('|')) checkCond(where, [part]);
      continue;
    }
    const m = ATOM.exec(t);
    const key = m ? m[1] : t;
    if (!/^[A-Za-z0-9_.\- ]+$/.test(key)) err(where, `odd condition key "${key}" in "${a}"`);
    if (key.startsWith('seen.') && !scenes[key.slice(5)]) err(where, `condition refers to unknown scene ${key}`);
    if (key.startsWith('card.') && !cards[key.slice(5)]) err(where, `condition refers to unknown card ${key}`);
  }
}

function checkEffects(where, effects) {
  for (const e of effects ?? []) {
    if (typeof e === 'object') {
      if ('then' in e) {
        checkCond(where, e.if);
        checkEffects(where, e.then);
        checkEffects(where, e.else);
      } else if (!e.quest) err(where, `object effect without quest: ${JSON.stringify(e)}`);
      continue;
    }
    const i = e.indexOf(':');
    const verb = i < 0 ? e : e.slice(0, i);
    const arg = i < 0 ? '' : e.slice(i + 1);
    if (!VERBS.has(verb)) err(where, `unknown effect "${e}"`);
    if (verb === 'scene' && !scenes[arg]) err(where, `scene:${arg} does not exist`);
    if (verb === 'encounter' && !encounters[arg]) err(where, `encounter:${arg} does not exist`);
    if ((verb === 'card' || verb === 'uncard') && !cards[arg]) err(where, `card:${arg} does not exist`);
    if (verb === 'go' && !placeIds.has(arg.split(':')[0])) err(where, `go:${arg} is not a place`);
    if (verb === 'add' && !arg.includes('=')) err(where, `add needs key=n: ${e}`);
    if (verb === 'proof' && !/^(ownership|purpose):/.test(arg)) err(where, `proof needs ownership: or purpose: ${e}`);
  }
}

let locked = 0;
let draft = 0;
for (const sc of Object.values(scenes)) {
  const w = sc.file;
  if (sc.status === 'locked') locked++;
  else if (sc.status === 'draft, waiting on Jim') draft++;
  else err(w, `status should be "locked" or "draft, waiting on Jim", got "${sc.status}"`);
  const trs = sc.triggers ?? (sc.trigger ? [sc.trigger] : []);
  if (!trs.length) err(w, 'no trigger');
  for (const t of trs) {
    checkCond(w, t.if);
    if (t.at === 'time' && !/^\d{1,2}:\d{2}$/.test(t.time ?? '')) err(w, 'time trigger needs a time');
  }
  if (!sc.nodes[sc.start]) err(w, `start node ${sc.start} missing`);
  for (const [id, n] of Object.entries(sc.nodes)) {
    const where = `${w} node ${id}`;
    checkEffects(where, n.effects);
    for (const t of n.textIf ?? []) checkCond(where, t.if);
    if (n.next && !sc.nodes[n.next]) err(where, `next ${n.next} missing`);
    for (const ni of n.nextIf ?? []) {
      checkCond(where, ni.if);
      if (ni.next && !sc.nodes[ni.next]) err(where, `nextIf ${ni.next} missing`);
    }
    for (const s of n.starters ?? []) checkCond(where, s.if);
    (n.choices ?? []).forEach((c, i) => {
      checkCond(`${where} choice ${i}`, c.if);
      checkEffects(`${where} choice ${i}`, c.effects);
      if (c.next && !sc.nodes[c.next]) err(`${where} choice ${i}`, `next ${c.next} missing`);
    });
  }
}

const OUTKEYS = ['acted', 'delayed', 'adjusted', 'mislabeled'];
function checkOutcome(where, o) {
  if (!o) return;
  if (!o.label || !Array.isArray(o.text)) err(where, 'outcome needs label and text');
  checkEffects(where, o.effects);
}
for (const e of Object.values(encounters)) {
  const w = e.file;
  if (e.status !== 'locked' && e.status !== 'draft, waiting on Jim') err(w, `bad status "${e.status}"`);
  if (!e.open) err(w, 'no opening line');
  for (const o of e.openIf ?? []) checkCond(w, o.if);
  for (const o of e.introIf ?? []) checkCond(w, o.if);
  for (const k of [...Object.keys(e.pushback ?? {}), ...Object.keys(e.answers ?? {})]) if (!cards[k]) err(w, `pushback for unknown card ${k}`);
  for (const c of [...(e.extraCards ?? []), ...(e.noCards ?? [])]) if (!cards[c]) err(w, `unknown card ${c}`);
  if (e.fact) {
    checkCond(w, e.fact.if);
    if (!cards[e.fact.card]) err(w, `fact card ${e.fact.card} missing`);
  }
  for (const m of e.mods ?? []) checkCond(w, m.if);
  for (const f of [...(e.floor ?? []), ...(e.floorExtra ?? [])]) {
    checkCond(w, f.if);
    checkEffects(w, f.effects);
  }
  if (e.floor && e.floor.length === 0 && !(e.floorExtra ?? []).some((f) => !f.if)) err(w, 'no floor option is always available');
  for (const k of OUTKEYS) checkOutcome(`${w} outcome ${k}`, e.outcomes?.[k]);
  for (const k of ['phone', 'drink', 'comfort']) checkOutcome(`${w} escaped ${k}`, e.outcomes?.escaped?.[k]);
}
for (const k of OUTKEYS) checkOutcome(`outcomes.json ${k}`, outcomes[k]);
for (const k of ['phone', 'drink', 'comfort']) checkOutcome(`outcomes.json escaped ${k}`, outcomes.escaped[k]);
for (const f of floors) {
  checkCond('floors.json', f.if);
  checkEffects('floors.json', f.effects);
}
if (!floors.some((f) => (f.if ?? []).every((a) => a.startsWith('!floorSet')))) err('floors.json', 'needs an option for players with no floor set');

for (const a of actions) {
  const w = `actions.json ${a.id}`;
  if (a.place !== '*' && !placeIds.has(a.place)) err(w, `unknown place ${a.place}`);
  checkCond(w, a.if);
  checkEffects(w, a.effects);
  if (a.scene && !scenes[a.scene]) err(w, `scene ${a.scene} missing`);
  if (a.scene && a.node && !scenes[a.scene]?.nodes[a.node]) err(w, `node ${a.node} missing in ${a.scene}`);
}
for (const p of people) for (const s of p.schedule) if (!placeIds.has(s.place)) err(`people.json ${p.id}`, `unknown place ${s.place}`);
for (const c of Object.values(cards)) if (!lines[`card.kind.${c.kind}`]) err('cards.json', `no line for card kind ${c.kind}`);

// Review order (review.json): every listed item exists and is listed once. Anything left out
// still shows in review mode, under "Not sorted yet", so that's a warning, not an error.
const review = read('review.json');
const listed = new Set();
for (const g of review.groups) {
  for (const key of g.items) {
    const [kind, id] = key.split(':');
    if (!(kind === 'scene' ? scenes[id] : kind === 'encounter' ? encounters[id] : null)) err('review.json', `${g.id} lists ${key}, which doesn't exist`);
    if (listed.has(key)) err('review.json', `${key} is listed twice`);
    listed.add(key);
  }
}
const unsorted = [...Object.keys(scenes).map((id) => `scene:${id}`), ...Object.keys(encounters).map((id) => `encounter:${id}`)].filter((k) => !listed.has(k));
if (unsorted.length) console.log(`Note: not in a review group yet (add them to src/content/review.json): ${unsorted.join(', ')}`);

console.log(`Scenes: ${Object.keys(scenes).length} (${locked} locked, ${draft} draft). Encounters: ${Object.keys(encounters).length}. Actions: ${actions.length}. Cards: ${Object.keys(cards).length}.`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log('Content OK.');
