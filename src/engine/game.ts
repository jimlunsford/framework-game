import { actions, cards, line, people, placeById, scenes } from './content';
import { check, placeOpen } from './conditions';
import { newState, save, type Character, type State } from './state';
import { fmtTime, inWindow, parseTime, weekday } from './time';
import type { Action, Effect, Node, Person, Place, PlaceId, QuestEffect, Scene, Trigger } from './types';
import * as enc from './encounter';

type Listener = () => void;

/**
 * The game loop. Holds the state, runs scenes, moves the clock and decides
 * what the player sees next. All words the player reads come from content files.
 */
export class Game {
  s: State;
  private listeners: Listener[] = [];
  private settling = false;

  constructor(s: State) {
    this.s = s;
  }

  static fresh(character: Character): Game {
    const g = new Game(newState(character));
    g.startDay(true);
    return g;
  }

  onChange(fn: Listener): void {
    this.listeners.push(fn);
  }

  emit(): void {
    save(this.s);
    for (const fn of this.listeners) fn();
  }

  // ---------- text ----------

  fill(text: string): string {
    const s = this.s;
    const pr = s.character.pronouns;
    const P = {
      he: { they: 'he', them: 'him', their: 'his' },
      she: { they: 'she', them: 'her', their: 'her' },
      they: { they: 'they', them: 'them', their: 'their' },
    }[pr];
    return text
      .replace(/\{name\}/g, s.character.name)
      .replace(/\{time\}/g, fmtTime(s.t))
      .replace(/\{standard\}/g, s.standard || '')
      .replace(/\{purpose\}/g, s.purpose || '')
      .replace(/\{floor\}/g, String(s.flags.floorLabel ?? ''))
      .replace(/\{ceiling\}/g, String(s.flags.ceilingLabel ?? ''))
      .replace(/\{morningLine\}/g, String(s.flags.morningLabel ?? ''))
      .replace(/\{they\}/g, P.they)
      .replace(/\{them\}/g, P.them)
      .replace(/\{their\}/g, P.their)
      .replace(/\{count\.([A-Za-z0-9_]+)\}/g, (_, k) => String(s.counts[k] ?? 0))
      .replace(/\{flag\.([A-Za-z0-9_]+)\}/g, (_, k) => String(s.flags[k] ?? ''))
      .replace(/\{day\}/g, String(s.day))
      // "at 9:52 p.m." at the end of a sentence keeps one period.
      .replace(/([ap]\.m\.)\./g, '$1');
  }

  // ---------- record, quests, growth ----------

  addRecord(text: string | string[] | undefined): void {
    if (!text) return;
    const list = Array.isArray(text) ? text : [text];
    for (const t of list) this.s.record.push({ day: this.s.day, t: this.s.t, text: this.fill(t) });
  }

  quest(e: QuestEffect): void {
    const s = this.s;
    let q = s.quests[e.quest];
    if (!q) {
      q = {
        id: e.quest,
        title: e.title ?? e.quest,
        kind: e.kind ?? 'side',
        status: 'active',
        objective: '',
        updatedDay: s.day,
      };
      s.quests[e.quest] = q;
      s.questOrder.push(e.quest);
    }
    if (e.title) q.title = e.title;
    if (e.kind) q.kind = e.kind;
    if (e.status) q.status = e.status;
    if (e.objective !== undefined) q.objective = this.fill(e.objective);
    if (e.tag) q.tag = e.tag;
    q.updatedDay = s.day;
  }

  proof(lineName: 'ownership' | 'purpose', text: string): void {
    const s = this.s;
    if (!s.lines[lineName]) {
      s.lines[lineName] = true;
      this.notice(line(`skill.${lineName}.opened`));
    }
    s.proof[lineName].push({ day: s.day, t: s.t, text: this.fill(text) });
  }

  notice(text: string | string[]): void {
    const list = Array.isArray(text) ? text : [text];
    this.s.notice = [...(this.s.notice ?? []), ...list.map((x) => this.fill(x))];
  }

  // ---------- effects ----------

  private setKey(key: string, value: number | string | boolean | undefined): void {
    const s = this.s;
    const dot = key.indexOf('.');
    if (dot > 0) {
      const scope = key.slice(0, dot);
      const name = key.slice(dot + 1);
      if (scope === 'today') {
        if (value === undefined) delete s.today[name];
        else s.today[name] = value;
        return;
      }
      if (scope === 'tomorrow') {
        // Held until the next morning, then moved into today.*
        if (value === undefined) delete s.flags[`_tmr_${name}`];
        else s.flags[`_tmr_${name}`] = value;
        return;
      }
      if (scope === 'count') {
        s.counts[name] = Number(value ?? 0);
        return;
      }
      if (scope === 'pull') {
        s.pull[name as 'phone'] = Math.max(0, Number(value ?? 0));
        return;
      }
    }
    if (value === undefined) delete s.flags[key];
    else s.flags[key] = value;
    // The day a structure piece was first set.
    // JIM: a morning line written today starts counting tomorrow, since today's morning already happened.
    // Rebuilding it later (in a restart) doesn't move that day.
    if ((key === 'morningSet' || key === 'floorSet') && value && s.flags[`${key}Day`] === undefined) s.flags[`${key}Day`] = s.day;
  }

  private getNum(key: string): number {
    const s = this.s;
    const dot = key.indexOf('.');
    if (dot > 0) {
      const scope = key.slice(0, dot);
      const name = key.slice(dot + 1);
      if (scope === 'today') return Number(s.today[name] ?? 0);
      if (scope === 'tomorrow') return Number(s.flags[`_tmr_${name}`] ?? 0);
      if (scope === 'count') return s.counts[name] ?? 0;
      if (scope === 'pull') return s.pull[name as 'phone'] ?? 0;
    }
    return Number(s.flags[key] ?? 0);
  }

  apply(effects?: Effect[]): void {
    if (!effects) return;
    for (const e of effects) this.applyOne(e);
  }

  private applyOne(e: Effect): void {
    const s = this.s;
    if (typeof e !== 'string') {
      if ('then' in e) {
        this.apply(check(s, e.if) ? e.then : e.else);
        return;
      }
      this.quest(e);
      return;
    }
    const i = e.indexOf(':');
    const verb = i < 0 ? e : e.slice(0, i);
    const arg = i < 0 ? '' : e.slice(i + 1);
    switch (verb) {
      case 'set': {
        const eq = arg.indexOf('=');
        if (eq < 0) this.setKey(arg, true);
        else {
          const raw = arg.slice(eq + 1);
          const num = Number(raw);
          this.setKey(arg.slice(0, eq), raw !== '' && !Number.isNaN(num) ? num : this.fill(raw).replace(/\s+/g, ' ').trim());
        }
        break;
      }
      case 'unset':
        this.setKey(arg, undefined);
        break;
      case 'add': {
        const eq = arg.indexOf('=');
        const key = arg.slice(0, eq);
        this.setKey(key, this.getNum(key) + Number(arg.slice(eq + 1)));
        break;
      }
      case 'time': {
        if (arg.startsWith('=')) {
          const to = parseTime(arg.slice(1));
          if (to > s.t) this.advance(to - s.t);
        } else this.advance(Number(arg));
        break;
      }
      case 'card':
        if (!s.cards.includes(arg)) {
          s.cards.push(arg);
          const c = cards[arg];
          if (c) this.notice(line('card.earned').replace('{card}', c.name));
        }
        break;
      case 'uncard':
        s.cards = s.cards.filter((c) => c !== arg);
        break;
      case 'proof': {
        const j = arg.indexOf(':');
        this.proof(arg.slice(0, j) as 'ownership', arg.slice(j + 1));
        break;
      }
      case 'line':
        if (!s.lines[arg as 'ownership']) {
          s.lines[arg as 'ownership'] = true;
          this.notice(line(`skill.${arg}.opened`));
        }
        break;
      case 'go': {
        const [place, room] = arg.split(':');
        s.place = place as PlaceId;
        s.room = room ?? this.place(place as PlaceId)?.rooms?.[0]?.id ?? '';
        break;
      }
      case 'room':
        s.room = arg;
        break;
      case 'scene':
        // "!" marks a scene queued on purpose: it runs without re-checking its trigger.
        s.queue.push(`!${arg}`);
        break;
      case 'encounter':
        s.flags._pendingEncounter = arg;
        break;
      case 'restart':
        s.flags.pendingRestart = true;
        if (!s.flags.restartReason) s.flags.restartReason = arg || 'miss';
        break;
      case 'bed':
        s.today._bedPending = true;
        break;
      case 'stage': {
        const [n, when] = arg.split(':');
        s.stage = Number(n);
        s.stageStartDay = when === 'next' ? s.day + 1 : s.day;
        break;
      }
      case 'record':
        this.addRecord(arg);
        break;
      case 'notice':
        this.notice(arg);
        break;
      case 'trait':
        if (!s.traits.includes(arg)) {
          s.traits.push(arg);
          this.notice(line('trait.formed').replace('{trait}', arg));
        }
        break;
      case 'purpose': {
        const j = arg.indexOf(':');
        s.flags.purposeId = arg.slice(0, j);
        s.purpose = this.fill(arg.slice(j + 1));
        break;
      }
      case 'end':
        s.flags._sliceEnded = true;
        break;
      case 'trust': {
        const v = this.getNum('danaTrust') + Number(arg);
        this.setKey('danaTrust', Math.max(0, v));
        break;
      }
      default:
        console.warn('Unknown effect', e);
    }
  }

  // ---------- world ----------

  place(id: PlaceId): Place {
    return placeById[id];
  }

  isOpen(id: PlaceId, t = this.s.t): boolean {
    return placeOpen(this.s, id, t);
  }

  /** When a closed place opens next today, if it does. */
  opensAt(id: PlaceId): number | null {
    for (let t = this.s.t; t < 26 * 60; t += 10) if (this.isOpen(id, t)) return t;
    return null;
  }

  peopleAt(id: PlaceId): Person[] {
    const wd = weekday(this.s.day);
    return people.filter((p) =>
      p.schedule.some(
        (slot) =>
          slot.place === id &&
          (!slot.days || slot.days.includes(wd)) &&
          inWindow(this.s.t, slot.from, slot.to) &&
          check(this.s, slot.if),
      ),
    );
  }

  personLine(p: Person): string {
    const l = p.lines.find((x) => check(this.s, x.if));
    return l ? this.fill(l.text) : '';
  }

  travelMinutes(to: PlaceId): number {
    if (to === this.s.place) return 0;
    const a = this.place(this.s.place).pos;
    const b = this.place(to).pos;
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    // Design: travel between places costs 10 to 20 in-game minutes.
    return Math.max(10, Math.min(20, Math.round(10 + d / 7)));
  }

  /** Actions you can take here. A closed place offers only what works from outside it. */
  availableActions(): Action[] {
    const open = this.isOpen(this.s.place);
    return actions.filter(
      (a) =>
        (a.place === '*' || (a.place === this.s.place && (open || a.closedOk))) &&
        (!a.room || a.room === this.s.room || a.place === '*') &&
        check(this.s, a.if),
    );
  }

  // ---------- time ----------

  advance(minutes: number): void {
    if (minutes <= 0) return;
    this.s.t += minutes;
  }

  // ---------- flow ----------

  /** Start a new day (or the first day). */
  startDay(first = false): void {
    const s = this.s;
    if (!first) {
      s.day += 1;
      const wake = typeof s.flags.wakeNext === 'string' ? parseTime(s.flags.wakeNext as string) : 6 * 60 + 30;
      s.t = Number.isNaN(wake) ? 6 * 60 + 30 : wake;
      delete s.flags.wakeNext;
      s.today = {};
      s.seenToday = [];
      for (const k of Object.keys(s.flags)) {
        if (k.startsWith('_tmr_')) {
          s.today[k.slice(5)] = s.flags[k];
          delete s.flags[k];
        }
      }
    }
    s.place = 'home';
    s.room = 'bedroom';
    s.phase = 'play';
    s.notice = [];
    const wakeScenes = this.matching('wake').map((sc) => sc.id);
    s.queue.push(...wakeScenes);
    this.settle();
  }

  static triggersOf(sc: Scene): Trigger[] {
    return sc.triggers ?? (sc.trigger ? [sc.trigger] : []);
  }

  /** Scenes with a trigger of this kind that can run right now, highest priority first. */
  private matching(at: Trigger['at']): Scene[] {
    const found: { sc: Scene; tr: Trigger }[] = [];
    for (const sc of Object.values(scenes)) {
      const tr = Game.triggersOf(sc).find((t) => t.at === at && this.eligible(sc, t));
      if (tr) found.push({ sc, tr });
    }
    if (at === 'time') found.sort((a, b) => parseTime(a.tr.time ?? '0:00') - parseTime(b.tr.time ?? '0:00'));
    else found.sort((a, b) => (b.tr.priority ?? 0) - (a.tr.priority ?? 0));
    return found.map((f) => f.sc);
  }

  private eligible(sc: Scene, tr: Trigger): boolean {
    const s = this.s;
    const once = tr.once ?? !tr.daily;
    if (once && s.seen.includes(sc.id)) return false;
    if (tr.daily && s.seenToday.includes(sc.id)) return false;
    if (tr.place) {
      const ps = Array.isArray(tr.place) ? tr.place : [tr.place];
      if (!ps.includes(s.place)) return false;
    }
    if (tr.room && tr.room !== s.room) return false;
    // Arriving somewhere only starts its scenes when the place is open.
    if (tr.at === 'enter' && !placeOpen(s, s.place)) return false;
    if (tr.at === 'time' && tr.time && s.t < parseTime(tr.time)) return false;
    return check(s, tr.if);
  }

  /** Decide what happens next once nothing is waiting on the player. */
  settle(): void {
    if (this.settling) return;
    this.settling = true;
    try {
      this.settleInner();
    } finally {
      this.settling = false;
    }
    this.emit();
  }

  private settleInner(): void {
    const s = this.s;
    for (let guard = 0; guard < 50; guard++) {
      if (s.phase === 'ended' || s.phase === 'dayend') return;
      if (s.phase === 'encounter' && s.encounter) return;
      if (s.scene) {
        s.phase = 'scene';
        return;
      }
      if (s.flags._sliceEnded) {
        s.phase = 'ended';
        return;
      }
      if (s.flags._pendingEncounter) {
        const id = String(s.flags._pendingEncounter);
        delete s.flags._pendingEncounter;
        enc.start(this, id);
        return;
      }
      if (s.queue.length) {
        const entry = s.queue.shift()!;
        const forced = entry.startsWith('!');
        const id = forced ? entry.slice(1) : entry;
        const sc = scenes[id];
        if (!sc) {
          console.warn('Missing scene', id);
          continue;
        }
        if (!forced) {
          // Wake and bedtime scenes are queued together; an earlier one can change
          // whether a later one still applies, so check again.
          const trs = Game.triggersOf(sc).filter((t) => t.at === 'wake' || t.at === 'bedtime');
          if (trs.length && !trs.some((t) => check(s, t.if))) continue;
        }
        this.beginScene(sc);
        continue;
      }
      if (s.today._bedDone) {
        s.phase = 'dayend';
        return;
      }
      if (s.phase === 'map') return;
      // Clock triggers run first, so "call it a night" still meets the night's encounter.
      const timed = this.matching('time');
      if (timed.length) {
        this.beginScene(timed[0]);
        continue;
      }
      if (s.today._bedPending) {
        delete s.today._bedPending;
        this.bed();
        continue;
      }
      const here = this.matching('enter');
      if (here.length) {
        this.beginScene(here[0]);
        continue;
      }
      s.phase = 'play';
      return;
    }
  }

  beginScene(sc: Scene, nodeId?: string): void {
    const s = this.s;
    if (!s.seen.includes(sc.id)) s.seen.push(sc.id);
    if (!s.seenToday.includes(sc.id)) s.seenToday.push(sc.id);
    const start = nodeId ?? sc.start;
    s.scene = { id: sc.id, node: start };
    s.phase = 'scene';
    this.enterNode(sc, start);
  }

  private enterNode(sc: Scene, nodeId: string, depth = 0): void {
    const node = sc.nodes[nodeId];
    if (!node) {
      this.s.scene = { id: sc.id, node: nodeId, error: `Missing node ${nodeId} in ${sc.id}` };
      return;
    }
    this.s.scene = { id: sc.id, node: nodeId };
    this.addRecord(node.record);
    this.apply(node.effects);
    // A node with nothing to read and nothing to choose only carries effects. Move on.
    const empty = this.nodeText(node).length === 0 && this.visibleChoices(node).length === 0 && !node.input;
    if (empty && depth < 20) {
      const next = this.nextOf(node);
      if (next) this.enterNode(sc, next, depth + 1);
      else this.s.scene = undefined;
    }
  }

  private nextOf(node: Node): string | null {
    const hit = (node.nextIf ?? []).find((n) => check(this.s, n.if));
    if (hit) return hit.next;
    return node.next ?? null;
  }

  currentScene(): { sc: Scene; node: Node } | null {
    const st = this.s.scene;
    if (!st) return null;
    const sc = scenes[st.id];
    if (!sc) return null;
    return { sc, node: sc.nodes[st.node] };
  }

  nodeText(node: Node): string[] {
    const out = [...(node.text ?? [])];
    for (const t of node.textIf ?? []) if (check(this.s, t.if)) out.push(...t.text);
    return out.map((x) => this.fill(x));
  }

  visibleChoices(node: Node) {
    return (node.choices ?? []).map((c, i) => ({ c, i })).filter(({ c }) => check(this.s, c.if));
  }

  choose(index: number): void {
    const cur = this.currentScene();
    if (!cur) return;
    const choice = cur.node.choices?.[index];
    if (!choice || !check(this.s, choice.if)) return;
    this.addRecord(choice.record);
    this.apply(choice.effects);
    const next = choice.next ?? null;
    if (choice.result && choice.result.length) {
      this.s.scene = { ...this.s.scene!, result: choice.result.map((x) => this.fill(x)), resultNext: next };
      this.emit();
      return;
    }
    this.goNode(cur.sc, next);
  }

  continueScene(): void {
    const cur = this.currentScene();
    if (!cur) return;
    const st = this.s.scene!;
    if (st.result) {
      this.goNode(cur.sc, st.resultNext ?? null);
      return;
    }
    this.goNode(cur.sc, this.nextOf(cur.node));
  }

  private goNode(sc: Scene, next: string | null): void {
    if (next) {
      this.enterNode(sc, next);
      if (this.s.scene) {
        this.emit();
        return;
      }
    }
    this.s.scene = undefined;
    this.settle();
  }

  /** Text input nodes (the first standard, a purpose in your own words). */
  submitInput(value: string): void {
    const cur = this.currentScene();
    if (!cur) return;
    const v = value.trim();
    if (cur.node.input === 'standard') {
      this.s.standard = v;
      this.s.flags.standardWrittenDay = this.s.day;
    } else if (cur.node.input === 'purpose-own') {
      this.s.purpose = v;
      this.s.flags.purposeId = 'own';
    }
    this.continueScene();
  }

  doAction(id: string): void {
    const a = actions.find((x) => x.id === id);
    if (!a || !check(this.s, a.if)) return;
    this.s.notice = [];
    if (a.scene) {
      const sc = scenes[a.scene];
      this.apply(a.effects);
      if (sc) this.beginScene(sc, a.node);
      this.settle();
      return;
    }
    if (a.minutes) this.advance(a.minutes);
    this.addRecord(a.record);
    this.apply(a.effects);
    if (a.result) this.notice(a.result);
    this.settle();
  }

  openMap(): void {
    if (this.s.phase !== 'play') return;
    this.s.phase = 'map';
    this.s.notice = [];
    this.emit();
  }

  closeMap(): void {
    if (this.s.phase !== 'map') return;
    this.s.phase = 'play';
    this.settle();
  }

  travel(to: PlaceId): void {
    const s = this.s;
    if (s.phase !== 'map' && s.phase !== 'play') return;
    const mins = this.travelMinutes(to);
    s.notice = [];
    this.advance(mins);
    if (to !== s.place) {
      s.today[`visited_${to}`] = true;
      s.today.lastTravel = mins;
    }
    s.place = to;
    s.room = this.place(to).rooms?.[0]?.id ?? '';
    if (to === 'home') s.room = 'living';
    s.phase = 'play';
    this.settle();
  }

  goRoom(room: string): void {
    if (this.s.phase !== 'play') return;
    this.s.room = room;
    this.s.notice = [];
    this.settle();
  }

  /** Night falls. The day is evaluated by rule, then bedtime scenes run. */
  bed(): void {
    const s = this.s;
    if (s.today._bedDone) return;
    s.today._bedDone = true;
    s.today.bedAt = s.t;
    this.evaluateDay();
    const bedScenes = this.matching('bedtime').map((sc) => sc.id);
    s.queue.push(...bedScenes);
  }

  /** Rules that run at the end of every day. They state facts. They never score. */
  private evaluateDay(): void {
    const s = this.s;
    // Structure exists once a morning line and a daily minimum are both set.
    const ready = !!s.flags.morningSet && !!s.flags.floorSet && Number(s.flags.morningSetDay ?? 0) < s.day;
    if (ready && s.stage >= 2) {
      const morning = !!s.today.morningKept;
      const floor = !!(s.today.floorDone || s.today.ceilingDone);
      if (morning && floor) {
        s.counts.structureDays = (s.counts.structureDays ?? 0) + 1;
        this.addRecord(line('record.structureDay'));
        if (s.stage === 2 && s.quests['three-days']) {
          this.quest({ quest: 'three-days', objective: line('quest.threeDays.progress').replace('{n}', String(s.counts.structureDays)) });
        }
      } else {
        if (!morning) this.addRecord(line('record.morningMissed'));
        if (!floor) this.addRecord(line('record.floorMissed'));
        if (!s.flags.pendingRestart) {
          s.flags.pendingRestart = true;
          s.flags.restartReason = floor ? 'morning' : 'floor';
        }
      }
    }
    if (s.today.morningKept) s.counts.morningsKept = (s.counts.morningsKept ?? 0) + 1;
    if (s.today.floorDone || s.today.ceilingDone) s.counts.floorsDone = (s.counts.floorsDone ?? 0) + 1;
  }

  sleep(): void {
    if (this.s.phase !== 'dayend') return;
    this.startDay(false);
  }

  // ---------- encounter passthrough ----------

  playCard(id: string): void {
    enc.play(this, id);
  }

  pickFloor(i: number): void {
    enc.pickFloor(this, i);
  }

  finishEncounter(): void {
    enc.finish(this);
  }
}
