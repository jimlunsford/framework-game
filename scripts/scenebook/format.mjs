// The Scene Book Markdown format for one scene or encounter.
//
// A "plan" is the list of lines a scene or encounter turns into, in order. Each line is
// one of three things:
//   fixed  a line that comes from the game's structure (headings, conditions, where a
//          choice leads). Import checks it is unchanged, because words can change in
//          Markdown but structure can't.
//   info   a line of context from other files (the group, who starts it). Import skips it.
//   slot   words: a title, a paragraph, a choice, a record line. Import reads these back
//          into the JSON at the slot's path.
// The same plan renders the Markdown (export) and reads it back (import), so the two can't
// drift apart. Blocks are separated by blank lines. A paragraph can wrap over several lines.
import { fmtClock, version } from './content.mjs';

// A narration line that starts like Markdown structure gets a backslash in front.
const RESERVED = /^([#*>+=_`\\→|-]|\d+[.)](\s|$))/;
const escPlain = (s) => (RESERVED.test(s) ? `\\${s}` : s);
const matchPlain = (t) => (t.startsWith('\\') ? t.slice(1) : RESERVED.test(t) ? undefined : t);

export const STATUSES = ['locked', 'draft, waiting on Jim'];

export const fmtCond = (c) => (c ?? []).map((a) => `\`${a}\``).join(', ');

class Plan {
  constructor(kind, id, file) {
    this.kind = kind;
    this.id = id;
    this.file = file;
    this.tokens = [];
  }
  fixed(text) {
    this.tokens.push({ t: 'fixed', text });
  }
  info(prefix, text) {
    this.tokens.push({ t: 'info', prefix, text: `${prefix}${text}` });
  }
  /** One line of words: prefix + value + suffix. */
  one(path, kind, value, prefix, suffix, label, extra = {}) {
    const plain = prefix === '' && suffix === '';
    this.tokens.push({
      t: 'slot',
      mode: 'one',
      kind,
      path,
      value,
      label,
      line: (v) => (plain ? escPlain(v) : `${prefix}${v}${suffix}`),
      match: plain ? matchPlain : (t) => cut(t, prefix, suffix),
      ...extra,
    });
  }
  /** Any number of lines of words with the same prefix (paragraphs, results, record lines). */
  many(path, kind, values, prefix, suffix, label, extra = {}) {
    const plain = prefix === '' && suffix === '';
    this.tokens.push({
      t: 'slot',
      mode: 'many',
      kind,
      path,
      value: values,
      label,
      line: (v) => (plain ? escPlain(v) : `${prefix}${v}${suffix}`),
      match: plain ? matchPlain : (t) => cut(t, prefix, suffix),
      ...extra,
    });
  }
}

function cut(t, prefix, suffix) {
  if (!t.startsWith(prefix) || !t.endsWith(suffix) || t.length < prefix.length + suffix.length) return undefined;
  return t.slice(prefix.length, t.length - suffix.length).trim();
}

const asLines = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);
const short = (s) => (s.length > 40 ? `${s.slice(0, 38)}…` : s);

// ---------- effects that carry words ----------

/** The words inside an effect string, if it has any. */
function effectWord(e) {
  let m;
  if (e.startsWith('record:')) return { pre: 'record:', label: 'Also on the record', value: e.slice(7) };
  if (e.startsWith('notice:')) return { pre: 'notice:', label: 'Notice', value: e.slice(7) };
  if (e.startsWith('trait:')) return { pre: 'trait:', label: 'Trait', value: e.slice(6) };
  if ((m = /^proof:([a-z]+):/.exec(e))) return { pre: m[0], label: `Proof (${m[1]})`, value: e.slice(m[0].length) };
  if ((m = /^purpose:([A-Za-z0-9_-]+):/.exec(e))) return { pre: m[0], label: `Purpose (${m[1]})`, value: e.slice(m[0].length) };
  // A flag holding words the player reads, like {floor} or the morning line.
  if ((m = /^set:([A-Za-z0-9_.]+)=/.exec(e))) {
    const v = e.slice(m[0].length);
    if (/\s/.test(v) && Number.isNaN(Number(v))) return { pre: m[0], label: `Sets ${m[1]}`, value: v };
  }
  return null;
}

function effectWords(plan, effects, base, where, cond = []) {
  (effects ?? []).forEach((e, i) => {
    const p = [...base, i];
    const when = cond.length ? `, ${cond.join(', ')}` : '';
    if (typeof e === 'string') {
      const w = effectWord(e);
      if (w) plan.one(p, 'effect', w.value, `*${w.label}${when}: `, '*', `${where} · ${w.label.toLowerCase()}`, { pre: w.pre });
      return;
    }
    if (e && 'then' in e) {
      effectWords(plan, e.then, [...p, 'then'], where, [...cond, `when ${fmtCond(e.if)}`]);
      if (e.else) effectWords(plan, e.else, [...p, 'else'], where, [...cond, `when not ${fmtCond(e.if)}`]);
      return;
    }
    if (e && e.quest) {
      if (e.title !== undefined) plan.one([...p, 'title'], 'str', e.title, `*Quest ${e.quest}, title${when}: `, '*', `${where} · quest ${e.quest} title`);
      if (e.objective !== undefined) plan.one([...p, 'objective'], 'str', e.objective, `*Quest ${e.quest}${when}: `, '*', `${where} · quest ${e.quest}`);
    }
  });
}

// ---------- shared pieces ----------

function header(plan, it, ctx, title, whatLabel) {
  const j = it.json;
  plan.one(['title'], 'str', j.title, '# ', '', 'title');
  plan.one(['status'], 'str', j.status, '**Status:** ', '', 'status');
  plan.info(`- ${whatLabel}: `, `\`${j.id}\` · ${it.group}`);
  plan.fixed(`- File: \`${it.file}\` · Version: \`${version(j)}\``);
  return title;
}

function tagLines(plan, base, tag, where) {
  if (!tag) return;
  plan.one([...base, 'tag', 'framework'], 'str', tag.framework, '**Framework:** ', '', `${where}framework`);
  plan.one([...base, 'tag', 'item'], 'str', tag.item, '**Teaches:** ', '', `${where}framework item`);
}

function notes(plan, j) {
  plan.fixed('**Notes for Jim**');
  plan.many(['notes'], 'lines', asLines(j.notes), '- ', '', 'notes');
  plan.fixed('---');
}

function startedBy(plan, key, ctx) {
  const by = ctx.refs[key];
  if (by && by.length) plan.info('- Started by: ', by.join('; '));
}

function describeTrigger(tr, ctx) {
  let s;
  switch (tr.at) {
    case 'wake':
      s = 'when the day starts';
      break;
    case 'bedtime':
      s = 'when night falls, before sleep';
      break;
    case 'enter': {
      const ps = [].concat(tr.place ?? []).map((p) => ctx.places[p]?.name ?? p);
      s = `on arriving at ${ps.length ? ps.join(' or ') : 'any place'}${tr.room ? ` (${tr.room})` : ''}`;
      break;
    }
    case 'time':
      s = tr.time ? `when the clock reaches ${fmtClock(tr.time)}` : 'as soon as its condition holds';
      break;
    case 'manual':
      s = 'only when something starts it';
      break;
    default:
      s = tr.at;
  }
  if (tr.if && tr.if.length) s += `, if ${fmtCond(tr.if)}`;
  const once = tr.once ?? !tr.daily;
  if (tr.at !== 'manual') s += tr.daily ? '. At most once a day' : once ? '. Once per game' : '. Every time';
  if (tr.priority) s += `. Priority ${tr.priority}`;
  return `- Runs ${s}.`;
}

function nodeOrder(sc) {
  const order = [];
  const seen = new Set();
  const queue = [sc.start];
  while (queue.length) {
    const id = queue.shift();
    if (!id || seen.has(id) || !sc.nodes[id]) continue;
    seen.add(id);
    order.push(id);
    const n = sc.nodes[id];
    for (const c of n.choices ?? []) queue.push(c.next);
    for (const x of n.nextIf ?? []) queue.push(x.next);
    queue.push(n.next);
  }
  for (const id of Object.keys(sc.nodes)) if (!seen.has(id)) order.push(id);
  return order;
}

const INPUT = {
  standard: '*The player writes their standard here.*',
  'purpose-own': '*The player writes their purpose in their own words here.*',
  'review-week': '*The game shows the week, from the record, here.*',
};

/** A choice in a scene, or a floor option in an encounter. Same reading shape. */
function choiceLines(plan, base, c, where, { labelKey = 'label', resultKey = 'result', withNext = true } = {}) {
  plan.one([...base, labelKey], 'str', c[labelKey], '**', '**', `${where} label`);
  if (withNext) plan.one([...base, 'note'], 'optstr', c.note, '(', ')', `${where} note`, { optional: true });
  if (c.if && c.if.length) plan.fixed(`*Only if ${fmtCond(c.if)}.*`);
  plan.many([...base, resultKey], 'lines', asLines(c[resultKey]), '→ ', '', `${where} result`, { keep: !withNext });
  plan.many([...base, 'record'], 'strOrLines', asLines(c.record), '*Record: ', '*', `${where} record`);
  effectWords(plan, c.effects, [...base, 'effects'], where);
  if (withNext) plan.fixed(c.next ? `*Next: ${c.next}*` : '*Ends the scene.*');
}

// ---------- scenes ----------

export function planScene(it, ctx) {
  const sc = it.json;
  const plan = new Plan('scene', sc.id, it.file);
  header(plan, it, ctx, sc.title, 'Scene');
  const triggers = sc.triggers ?? (sc.trigger ? [sc.trigger] : []);
  for (const tr of triggers) plan.fixed(describeTrigger(tr, ctx));
  startedBy(plan, `scene:${sc.id}`, ctx);
  if (sc.art) plan.fixed(`- Art: ${sc.art}`);
  tagLines(plan, [], sc.tag, '');
  notes(plan, sc);
  for (const id of nodeOrder(sc)) {
    const n = sc.nodes[id];
    const base = ['nodes', id];
    const where = `step "${id}"`;
    plan.fixed(id === sc.start ? `## ${id} (first step)` : `## ${id}`);
    if (n.art) plan.fixed(`*Art: ${n.art}*`);
    tagLines(plan, base, n.tag, `${where} · `);
    if (n.speaker !== undefined) plan.one([...base, 'speaker'], 'str', n.speaker, '*Speaker: ', '*', `${where} · speaker`);
    if (n.message) plan.fixed('*Shown as a text message.*');
    plan.many([...base, 'text'], 'lines', asLines(n.text), '', '', `${where} · text`);
    (n.textIf ?? []).forEach((t, i) => {
      plan.fixed(`*Only when ${fmtCond(t.if)}:*`);
      plan.many([...base, 'textIf', i, 'text'], 'lines', asLines(t.text), '', '', `${where} · text when ${fmtCond(t.if)}`, { keep: true });
    });
    plan.many([...base, 'record'], 'strOrLines', asLines(n.record), '*Record: ', '*', `${where} · record`);
    effectWords(plan, n.effects, [...base, 'effects'], where);
    if (n.input) plan.fixed(INPUT[n.input] ?? `*Input: ${n.input}*`);
    (n.starters ?? []).forEach((s, i) => {
      const when = s.if && s.if.length ? `, when ${fmtCond(s.if)}` : '';
      plan.one([...base, 'starters', i, 'text'], 'str', s.text, `- Starter${when}: `, '', `${where} · starter ${i + 1}`);
    });
    (n.choices ?? []).forEach((c, i) => choiceLines(plan, [...base, 'choices', i], c, `${where} · choice ${i + 1} (${short(c.label)})`));
    for (const x of n.nextIf ?? []) plan.fixed(`*Next, when ${fmtCond(x.if)}: ${x.next ?? 'the scene ends'}*`);
    if (n.next) plan.fixed(`*Next: ${n.next}*`);
    else if (!(n.choices ?? []).length) plan.fixed('*Ends the scene.*');
  }
  return plan;
}

// ---------- encounters ----------

const OUTCOMES = [
  [['acted'], 'Acted'],
  [['delayed'], 'Delayed'],
  [['escaped', 'phone'], 'Escaped: the phone'],
  [['escaped', 'drink'], 'Escaped: drinking'],
  [['escaped', 'comfort'], 'Escaped: comfort'],
  [['adjusted'], 'Adjusted'],
  [['mislabeled'], 'Called a plan change with no new fact'],
];

const SETTING = {
  night: 'night: the couch at home, the bar if you are there, otherwise the truck',
  here: 'wherever you are',
};

export function planEncounter(it, ctx) {
  const e = it.json;
  const plan = new Plan('encounter', e.id, it.file);
  const card = (id) => ctx.cards[id]?.name ?? id;
  header(plan, it, ctx, e.title, 'Encounter');
  plan.fixed(`- Setting: ${SETTING[e.setting ?? 'night'] ?? e.setting}`);
  plan.fixed((e.after ?? 'bed') === 'bed' ? '- After it: night falls.' : '- After it: back to the day.');
  if (e.floorCounts === false) plan.fixed("- Acting here doesn't count as the day's floor.");
  if (e.extraCards && e.extraCards.length) plan.fixed(`- Extra cards here: ${e.extraCards.map(card).join(', ')}`);
  if (e.noCards && e.noCards.length) plan.fixed(`- Cards left out here: ${e.noCards.map(card).join(', ')}`);
  startedBy(plan, `encounter:${e.id}`, ctx);
  if (e.art) plan.fixed(`- Art: ${e.art}`);
  tagLines(plan, [], e.tag, '');
  notes(plan, e);

  plan.fixed('## Before it starts');
  plan.many(['intro'], 'lines', asLines(e.intro), '', '', 'intro');
  (e.introIf ?? []).forEach((b, i) => {
    plan.fixed(`*Only when ${fmtCond(b.if)}:*`);
    plan.many(['introIf', i, 'text'], 'lines', asLines(b.text), '', '', `intro when ${fmtCond(b.if)}`, { keep: true });
  });

  plan.fixed('## The old voice opens');
  plan.one(['open'], 'str', e.open, '', '', 'opening line');
  (e.openIf ?? []).forEach((o, i) => {
    plan.fixed(`*Instead, when ${fmtCond(o.if)}:*`);
    plan.one(['openIf', i, 'text'], 'str', o.text, '', '', `opening line when ${fmtCond(o.if)}`);
  });

  plan.fixed('## Later rounds');
  plan.many(['rounds'], 'lines', asLines(e.rounds), '', '', 'later rounds', {
    keep: true,
    line: (v, i) => `- Round ${i + 2}: ${v === '' ? '(quiet)' : v}`,
    match: (t) => {
      const m = /^- Round \d+:\s*(.*)$/.exec(t);
      if (!m) return undefined;
      return m[1].trim() === '(quiet)' ? '' : m[1].trim();
    },
  });

  const pb = Object.keys(e.pushback ?? {});
  const an = Object.keys(e.answers ?? {});
  if (pb.length || an.length) {
    plan.fixed('## Push back');
    for (const k of pb) plan.one(['pushback', k], 'str', e.pushback[k], `- Against ${card(k)}: `, '', `push back against ${card(k)}`);
    for (const k of an) plan.one(['answers', k], 'str', e.answers[k], `- Your answer to ${card(k)}: `, '', `your answer to ${card(k)}`);
  }

  if (e.fact) {
    const f = e.fact;
    plan.fixed('## A new fact');
    const when = `Arrives on round ${f.round}${f.if && f.if.length ? `, if ${fmtCond(f.if)}` : ''}${f.time ? `, at ${fmtClock(f.time)}` : ''}`;
    plan.fixed(`*${when}${when.endsWith('.') ? '' : '.'} Adds the card: ${card(f.card)}.*`);
    plan.many(['fact', 'text'], 'lines', asLines(f.text), '', '', 'new fact', { keep: true });
  }

  if (e.mods && e.mods.length) {
    plan.fixed('## Starting numbers');
    e.mods.forEach((m, i) => {
      const parts = [`- When ${fmtCond(m.if)}`];
      if (m.resolve) parts.push(`Resolve ${m.resolve > 0 ? '+' : ''}${m.resolve}`);
      if (m.pull) parts.push(`Pull ${m.pull > 0 ? '+' : ''}${m.pull}`);
      if (m.card) parts.push(`${card(m.card)} is stronger`);
      plan.one(['mods', i, 'why'], 'str', m.why, `${parts.join(', ')}: `, '', `starting numbers ${i + 1}`);
    });
  }

  const present = OUTCOMES.filter(([p]) => p.reduce((o, k) => (o ? o[k] : undefined), e.outcomes));
  if (present.length) {
    plan.fixed('## Outcomes');
    for (const [p, name] of present) {
      const o = p.reduce((x, k) => x[k], e.outcomes);
      const base = ['outcomes', ...p];
      const where = `outcome ${name.toLowerCase()}`;
      plan.fixed(`### ${name}`);
      plan.one([...base, 'label'], 'str', o.label, '*Label: ', '*', `${where} · label`);
      plan.many([...base, 'text'], 'lines', asLines(o.text), '', '', `${where} · text`, { keep: true });
      plan.many([...base, 'record'], 'strOrLines', asLines(o.record), '*Record: ', '*', `${where} · record`);
      effectWords(plan, o.effects, [...base, 'effects'], where);
    }
  }

  if ((e.floorExtra && e.floorExtra.length) || (e.floor && e.floor.length)) {
    plan.fixed('## Floor version options');
    (e.floorExtra ?? []).forEach((f, i) => {
      plan.fixed(`### Offered first: option ${i + 1}`);
      choiceLines(plan, ['floorExtra', i], f, `floor option first ${i + 1}`, { resultKey: 'text', withNext: false });
    });
    (e.floor ?? []).forEach((f, i) => {
      plan.fixed(`### Option ${i + 1}`);
      choiceLines(plan, ['floor', i], f, `floor option ${i + 1}`, { resultKey: 'text', withNext: false });
    });
  }
  return plan;
}

export function planItem(it, ctx) {
  return it.kind === 'scene' ? planScene(it, ctx) : planEncounter(it, ctx);
}

/** The Markdown file name for a scene or encounter. Scenes and encounters can share an id. */
export function mdName(it) {
  return it.kind === 'scene' ? `${it.id}.md` : `encounter-${it.id}.md`;
}

// ---------- render and parse ----------

export function render(plan, { shift = 0 } = {}) {
  const out = [];
  for (const tok of plan.tokens) {
    if (tok.t !== 'slot') out.push(tok.text);
    else if (tok.mode === 'one') {
      if (tok.value !== undefined) out.push(tok.line(tok.value));
    } else tok.value.forEach((v, i) => out.push(tok.line(v, i)));
  }
  // List items sit together as one list; everything else is its own paragraph.
  let md = out.reduce((acc, l, i) => (i === 0 ? l : `${acc}${l.startsWith('- ') && out[i - 1].startsWith('- ') ? '\n' : '\n\n'}${l}`), '');
  md = `${md}\n`;
  if (shift) md = md.replace(/^#/gm, `${'#'.repeat(shift)}#`);
  return md;
}

/** Blocks are separated by blank lines. A line that starts like structure starts a new block. */
export function splitBlocks(md) {
  const blocks = [];
  let cur = null;
  md.replace(/\r\n?/g, '\n')
    .split('\n')
    .forEach((raw, i) => {
      const line = raw.trim();
      if (!line) {
        cur = null;
        return;
      }
      const starts = /^(#|- |\*|→|>|\(|---)/.test(line);
      if (cur && !starts && !cur.text.startsWith('#')) cur.text += ` ${line}`;
      else {
        cur = { text: line, line: i + 1 };
        blocks.push(cur);
      }
    });
  return blocks;
}

function describeExpected(tok) {
  if (tok.t === 'fixed') return `"${tok.text}"`;
  if (tok.t === 'info') return `a line starting "${tok.prefix}"`;
  const sample = tok.line('…', 0);
  return `a line like "${sample}"`;
}

/** Read edited Markdown back against a plan. Returns the words per slot, or errors. */
export function parse(md, plan) {
  const blocks = splitBlocks(md);
  const values = new Map();
  let i = 0;
  const fail = (tok) => {
    const b = blocks[i];
    const found = b ? `line ${b.line} has "${b.text.length > 90 ? `${b.text.slice(0, 88)}…` : b.text}"` : 'the file ended';
    const why =
      tok.t === 'fixed'
        ? ' Lines like this come from the game\'s structure (headings, conditions, where a choice leads), so import can\'t change them. Put it back as it was, or ask Claude to change the structure.'
        : '';
    return { errors: [`Expected ${describeExpected(tok)}, but ${found}.${why}`] };
  };
  for (let k = 0; k < plan.tokens.length; k++) {
    const tok = plan.tokens[k];
    const b = blocks[i];
    if (tok.t === 'fixed') {
      if (b && b.text === tok.text) {
        i++;
        continue;
      }
      return fail(tok);
    }
    if (tok.t === 'info') {
      if (b && b.text.startsWith(tok.prefix)) i++;
      continue;
    }
    if (tok.mode === 'one') {
      const v = b ? tok.match(b.text) : undefined;
      if (v !== undefined) {
        values.set(k, v);
        i++;
        continue;
      }
      if (tok.optional) {
        values.set(k, undefined);
        continue;
      }
      return fail(tok);
    }
    const list = [];
    while (i < blocks.length) {
      const v = tok.match(blocks[i].text);
      if (v === undefined) break;
      list.push(v);
      i++;
    }
    values.set(k, list);
  }
  if (i < blocks.length) {
    const b = blocks[i];
    return { errors: [`Line ${b.line} doesn't fit where it is: "${b.text.length > 90 ? `${b.text.slice(0, 88)}…` : b.text}". Words go on the lines export wrote; a new paragraph goes among the paragraphs, and a new record line next to the record lines.`] };
  }
  return { values, errors: [] };
}

// ---------- apply ----------

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export function getPath(o, path) {
  return path.reduce((x, k) => (x === undefined || x === null ? undefined : x[k]), o);
}

function setPath(o, path, v) {
  const parent = getPath(o, path.slice(0, -1));
  parent[path[path.length - 1]] = v;
}

function delPath(o, path) {
  const parent = getPath(o, path.slice(0, -1));
  if (parent) delete parent[path[path.length - 1]];
}

/**
 * Put the words from parsed Markdown into a copy of the JSON.
 * Returns the new JSON, the changes (for the report) and the paths that changed.
 */
export function applyValues(json, plan, values) {
  const out = structuredClone(json);
  const changes = [];
  const paths = [];
  plan.tokens.forEach((tok, k) => {
    if (tok.t !== 'slot') return;
    const nv = values.get(k);
    if (same(tok.value, nv)) return;
    changes.push({ label: tok.label, old: asLines(tok.value), new: asLines(nv) });
    paths.push(tok.path);
    switch (tok.kind) {
      case 'str':
        setPath(out, tok.path, nv);
        break;
      case 'optstr':
        if (nv === undefined || nv === '') delPath(out, tok.path);
        else setPath(out, tok.path, nv);
        break;
      case 'lines':
        if (nv.length || tok.keep) setPath(out, tok.path, nv);
        else delPath(out, tok.path);
        break;
      case 'strOrLines': {
        const cur = getPath(json, tok.path);
        if (!nv.length) delPath(out, tok.path);
        else if (nv.length === 1 && !Array.isArray(cur)) setPath(out, tok.path, nv[0]);
        else setPath(out, tok.path, nv);
        break;
      }
      case 'effect':
        setPath(out, tok.path, `${tok.pre}${nv}`);
        break;
      default:
        throw new Error(`unknown slot kind ${tok.kind}`);
    }
  });
  return { json: out, changes, paths };
}
