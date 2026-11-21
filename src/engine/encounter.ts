// Turn-based pressure encounters against the old voice.
//
// Rules (code) live here. Words (content) live in src/content/encounters/*.json
// and src/content/cards.json.
//
// Resolve is the player's. Pull is the old voice's. Both are plain numbers.
// Escape cards are always in hand. "Tomorrow." is always in hand.
// The floor version acts when Resolve is at least Pull. If Pull is higher,
// the voice pushes back, the player answers, Resolve rises, and the card stays.
// So acting is always reachable. Every encounter ends in one of four outcomes:
// acted, adjusted (only with a real new fact), delayed, or escaped.
// There is no defeat. Night falls either way.
import { cards, defaultOutcomes, encounters, floors, line } from './content';
import { check } from './conditions';
import type { Game } from './game';
import type { EncounterState, EscapeKind } from './state';
import type { EncounterDef } from './types';

const ESCAPES: { id: string; kind: EscapeKind }[] = [
  { id: 'scroll', kind: 'phone' },
  { id: 'beers', kind: 'drink' },
  { id: 'orderin', kind: 'comfort' },
];

const ROUND_MINUTES = 4;

export function def(g: Game): EncounterDef | null {
  const e = g.s.encounter;
  return e ? encounters[e.id] ?? null : null;
}

export function start(g: Game, id: string): void {
  const s = g.s;
  const d = encounters[id];
  if (!d) {
    console.warn('Missing encounter', id);
    return;
  }
  const mods: EncounterState['mods'] = [];
  const strong: string[] = [];
  // JIM: starting numbers are Claude's first tuning. Resolve 3 and Pull 5 (the voice
  // opens louder than you), then the day's facts move them. Easy to change here.
  let resolve = 3;
  let pull = 5;
  const add = (cond: boolean, r: number, p: number, why: string) => {
    if (!cond) return;
    resolve += r;
    pull += p;
    mods.push({ text: g.fill(why), r, p });
  };
  // Where it happens. The default night setting: the couch at home, the bar if you're
  // still there, otherwise the truck in a parking lot.
  const settingRule = d.setting ?? 'night';
  let setting: string;
  if (settingRule === 'night') {
    if (s.place === 'home') {
      s.room = 'living';
      setting = 'living';
    } else if (s.place === 'bar') setting = 'bar';
    else setting = 'truck';
  } else if (settingRule === 'here') {
    setting = s.place === 'home' ? s.room || 'living' : s.place;
  } else setting = settingRule;
  s.today.encounterSetting = setting;
  add(!!s.today.gotUp, 1, 0, line('enc.why.gotUp'));
  add(!!s.today.ownedMiss, 1, 0, line('enc.why.ownedMiss'));
  add(!!(s.today.floorDone || s.today.cansDone), 1, 0, line('enc.why.didFloor'));
  add(!!s.flags.resolveCarry, 1, 0, line('enc.why.carry'));
  add(!!s.today.phoneMorning, 0, 1, line('enc.why.phoneMorning'));
  add(Number(s.today.escapes ?? 0) > 0, 0, Number(s.today.escapes ?? 0), line('enc.why.escapesToday'));
  const top = Math.max(s.pull.phone, s.pull.drink, s.pull.comfort);
  add(top >= 2, 0, Math.ceil(top / 2), line('enc.why.pattern'));
  add(!!s.today.tired, 0, 1, line('enc.why.tired'));
  add(Number(s.flags.missWeight ?? 0) > 0, 0, 1, line('enc.why.hidden'));
  // The place changes the hand: the bar makes Couple beers stronger, the truck makes Scroll stronger.
  if (setting === 'bar') {
    add(true, 0, 2, line('enc.why.bar'));
    strong.push('beers');
  }
  if (setting === 'truck') {
    add(true, 0, 1, line('enc.why.truck'));
    strong.push('scroll');
  }
  add(Number(s.today.barTime ?? 0) >= 60, 0, 1, line('enc.why.barEvening'));
  for (const m of d.mods ?? []) {
    if (check(s, m.if)) {
      add(true, m.resolve ?? 0, m.pull ?? 0, m.why);
      if (m.card && !strong.includes(m.card)) strong.push(m.card);
    }
  }
  delete s.flags.resolveCarry;

  const hand: string[] = ESCAPES.map((x) => x.id);
  const atHome = s.place === 'home';
  const want = (id: string, ok: boolean) => {
    if (ok && !hand.includes(id)) hand.push(id);
  };
  want('name-it', s.cards.includes('name-it'));
  want('phone-kitchen', atHome && (s.cards.includes('phone-kitchen') || !!s.today.offerPhoneKitchen) && !s.today.phoneInKitchen);
  want('remove-access', atHome && s.cards.includes('remove-access') && !s.flags.beerGone);
  want('show-record', s.cards.includes('show-record'));
  want('text-dana', Number(s.flags.danaTrust ?? 0) >= 3 && !s.flags.danaStopped);
  want('plan-change', s.cards.includes('plan-change'));
  want('remember-why', s.cards.includes('remember-why'));
  want('waiting', true);
  for (const c of d.extraCards ?? []) want(c, true);
  // JIM: the floor version is always in hand, like the escapes, so acting is always reachable.
  // The other action cards are earned through play.
  want('floor', true);
  want('tomorrow', true);
  // Escape cards stay in hand unless the player has removed access to them.
  // JIM: taking the beer out of the house, or the phone in the kitchen, takes that one escape
  // out of the hand at home. Order in and zone out always stays, so an escape is always in hand.
  if (atHome && s.flags.beerGone) {
    const i = hand.indexOf('beers');
    if (i >= 0) hand.splice(i, 1);
  }
  if (atHome && s.today.phoneInKitchen) {
    const i = hand.indexOf('scroll');
    if (i >= 0) hand.splice(i, 1);
  }
  const filtered = hand.filter((c) => !(d.noCards ?? []).includes(c) && cards[c]);

  const st: EncounterState = {
    id,
    round: 1,
    resolve,
    pull,
    hand: filtered,
    used: [],
    log: [],
    muteNext: false,
    factArrived: false,
    startT: s.t,
    mods,
    strong,
    setting,
  };
  for (const t of d.intro ?? []) st.log.push({ who: 'note', text: g.fill(t) });
  for (const block of d.introIf ?? []) {
    if (check(s, block.if)) for (const t of block.text) st.log.push({ who: 'note', text: g.fill(t) });
  }
  const open = (d.openIf ?? []).find((o) => check(s, o.if))?.text ?? d.open;
  st.log.push({ who: 'voice', text: g.fill(open) });
  s.encounter = st;
  s.phase = 'encounter';
  s.today.encounterDone = true;
}

function voiceTurn(g: Game, d: EncounterDef, e: EncounterState): void {
  e.round += 1;
  g.advance(ROUND_MINUTES);
  if (d.fact && !e.factArrived && e.round >= d.fact.round && check(g.s, d.fact.if)) {
    e.factArrived = true;
    if (d.fact.time) {
      // A fact can arrive at a set clock time ("At 9:45, Dana calls").
      const [h, m] = d.fact.time.split(':').map(Number);
      const at = h * 60 + m;
      if (at > g.s.t) g.s.t = at;
    }
    for (const t of d.fact.text) e.log.push({ who: 'note', text: g.fill(t) });
    if (!e.hand.includes(d.fact.card)) e.hand.unshift(d.fact.card);
    g.s.today.factOpen = true;
    return;
  }
  if (e.muteNext) {
    e.muteNext = false;
    e.log.push({ who: 'note', text: g.fill(line('enc.muted')) });
    return;
  }
  // A repeated objection brings the voice back with nothing new. Each time it talks, Pull +1.
  // An empty line means the voice stays quiet that round.
  const idx = Math.min(e.round - 2, d.rounds.length - 1);
  if (idx >= 0 && d.rounds.length && d.rounds[idx]) {
    e.log.push({ who: 'voice', text: g.fill(d.rounds[idx]) });
    e.pull += 1;
  }
}

function pushback(g: Game, d: EncounterDef, e: EncounterState, cardId: string): void {
  const p = d.pushback[cardId];
  if (p) e.log.push({ who: 'voice', text: g.fill(p) });
  const a = d.answers?.[cardId];
  if (a) e.log.push({ who: 'you', text: g.fill(a) });
}

export function floorOptions(g: Game) {
  const d = def(g);
  if (!d) return [];
  return [...(d.floorExtra ?? []), ...(d.floor ?? floors)].filter((f) => check(g.s, f.if));
}

export function play(g: Game, cardId: string): void {
  const s = g.s;
  const e = s.encounter;
  const d = def(g);
  if (!e || !d || e.outcome) return;
  if (!e.hand.includes(cardId)) return;
  const card = cards[cardId];
  if (!card) return;
  e.log.push({ who: 'you', text: g.fill(card.says ?? card.name) });

  // Ending cards.
  if (card.kind === 'escape' && card.escape) {
    e.outcome = { kind: 'escaped', escape: card.escape };
    g.emit();
    return;
  }
  if (card.kind === 'delay') {
    e.outcome = { kind: 'delayed' };
    g.emit();
    return;
  }
  if (card.kind === 'fact') {
    e.outcome = { kind: 'adjusted' };
    g.emit();
    return;
  }
  if (cardId === 'plan-change') {
    // A changed plan and a miss are separate paths. The game knows whether the facts changed.
    e.outcome = { kind: s.today.factOpen ? 'adjusted' : 'mislabeled' };
    g.emit();
    return;
  }
  if (cardId === 'floor') {
    // The voice always pushes back on the floor version, and you answer.
    pushback(g, d, e, 'floor');
    if (e.resolve >= e.pull) {
      const opts = floorOptions(g);
      if (opts.length > 1) {
        e.pickingFloor = true;
        g.emit();
        return;
      }
      e.outcome = { kind: 'acted', floorIndex: 0 };
      g.emit();
      return;
    }
    // The voice is louder right now. Answering it still counts: Resolve +2, and the card stays.
    e.resolve += 2;
    e.log.push({ who: 'note', text: g.fill(line('enc.floorNotYet')) });
    voiceTurn(g, d, e);
    g.emit();
    return;
  }

  // Building cards: used once per encounter.
  const ownership = s.proof.ownership.length;
  const purpose = s.proof.purpose.length;
  switch (cardId) {
    case 'name-it':
      e.pull = Math.max(0, e.pull - (ownership >= 3 ? 3 : 2));
      e.muteNext = true;
      pushback(g, d, e, 'name-it');
      break;
    case 'phone-kitchen':
      e.hand = e.hand.filter((c) => c !== 'scroll');
      e.pull = Math.max(0, e.pull - 1);
      s.today.phoneInKitchen = true;
      g.addRecord(line('record.phoneKitchen'));
      pushback(g, d, e, 'phone-kitchen');
      break;
    case 'remove-access':
      e.hand = e.hand.filter((c) => c !== 'beers');
      e.pull = Math.max(0, e.pull - 1);
      pushback(g, d, e, 'remove-access');
      break;
    case 'waiting':
      pushback(g, d, e, 'waiting');
      if (s.today.factOpen) {
        e.log.push({ who: 'note', text: g.fill(line('enc.waiting.fact')) });
      } else {
        e.resolve += 2;
        e.log.push({ who: 'note', text: g.fill(line('enc.waiting.none')) });
      }
      break;
    case 'show-record': {
      const n = Math.min(3, s.counts.structureDays ?? 0);
      e.pull = Math.max(0, e.pull - Math.max(1, n));
      const lastProof = [...s.record].reverse().find((r) => r.text === g.fill(line('record.structureDay')) || /^Floor:/.test(r.text));
      e.log.push({
        who: 'note',
        text: g.fill(line('enc.showRecord').replace('{n}', String(s.counts.structureDays ?? 0))),
      });
      if (lastProof) e.log.push({ who: 'note', text: lastProof.text });
      pushback(g, d, e, 'show-record');
      break;
    }
    case 'text-dana':
      e.resolve += 2;
      pushback(g, d, e, 'text-dana');
      break;
    case 'remember-why':
      e.resolve += 1 + Math.floor(purpose / 2);
      if (s.purpose) e.log.push({ who: 'note', text: g.fill(line('enc.rememberWhy')) });
      pushback(g, d, e, 'remember-why');
      break;
    default:
      // Extra cards from content: small, honest effects.
      e.resolve += 1;
      e.pull = Math.max(0, e.pull - 1);
      pushback(g, d, e, cardId);
  }
  e.hand = e.hand.filter((c) => c !== cardId);
  e.used.push(cardId);
  voiceTurn(g, d, e);
  g.emit();
}

export function pickFloor(g: Game, i: number): void {
  const e = g.s.encounter;
  if (!e || !e.pickingFloor) return;
  e.pickingFloor = false;
  e.outcome = { kind: 'acted', floorIndex: i };
  g.emit();
}

export function outcomeView(g: Game) {
  const e = g.s.encounter;
  const d = def(g);
  if (!e || !d || !e.outcome) return null;
  const o = e.outcome;
  const mine = d.outcomes ?? {};
  if (o.kind === 'escaped') return mine.escaped?.[o.escape!] ?? defaultOutcomes.escaped[o.escape!];
  if (o.kind === 'adjusted') return mine.adjusted ?? defaultOutcomes.adjusted;
  if (o.kind === 'mislabeled') return mine.mislabeled ?? defaultOutcomes.mislabeled;
  if (o.kind === 'delayed') return mine.delayed ?? defaultOutcomes.delayed;
  return mine.acted ?? defaultOutcomes.acted;
}

/** Apply the outcome. The record states what happened. Then night falls, or the day goes on. */
export function finish(g: Game): void {
  const s = g.s;
  const e = s.encounter;
  const d = def(g);
  if (!e || !d || !e.outcome) return;
  const o = e.outcome;
  const view = outcomeView(g)!;
  if (o.kind === 'acted') {
    const f = floorOptions(g)[o.floorIndex ?? 0];
    g.advance(10);
    if (f) {
      g.addRecord(f.record);
      g.apply(f.effects);
    }
    if (d.floorCounts !== false) s.today.floorDone = true;
  }
  g.apply(view.effects);
  g.addRecord(view.record);
  if (o.kind === 'escaped' && o.escape) {
    s.pull[o.escape] += 1;
    s.today.escapes = Number(s.today.escapes ?? 0) + 1;
    s.counts[`escape_${o.escape}`] = (s.counts[`escape_${o.escape}`] ?? 0) + 1;
  }
  s.counts[`outcome_${o.kind}`] = (s.counts[`outcome_${o.kind}`] ?? 0) + 1;
  s.today.lastOutcome = o.kind;
  const after = d.after ?? 'bed';
  s.encounter = undefined;
  s.phase = 'play';
  if (after === 'bed') g.bed();
  g.settle();
}
