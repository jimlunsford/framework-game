// The screens. Everything is rendered from state as plain HTML strings, and clicks are
// handled by one listener that reads data-act attributes. Words come from content files
// (lines.json for interface text); this file only arranges them.
import { cards, creator, line, lineList, news, people, placeById, places, scenes } from '../engine/content';
import { check } from '../engine/conditions';
import * as enc from '../engine/encounter';
import { Game } from '../engine/game';
import { checkStandard } from '../engine/standard';
import {
  ageOk,
  clearSave,
  load,
  readSettings,
  save,
  setAgeOk,
  writeSettings,
  type Character,
  type Look,
  type State,
} from '../engine/state';
import { dayName, fmtTime, period } from '../engine/time';
import type { CardDef, Node, PlaceId, Tag } from '../engine/types';
import { townMap } from '../art/map';
import { placeArt } from '../art/places';
import { HAIR_COLOR, SKIN, portrait } from '../art/portrait';

type Screen = 'age' | 'title' | 'creator' | 'closing' | 'game';
type Sheet = null | 'quests' | 'record' | 'you' | 'help' | 'news' | 'menu' | 'confirm-new' | 'confirm-erase' | 'reminder';

interface UI {
  screen: Screen;
  sheet: Sheet;
  ageError: string;
  draft: { name: string; pronouns: Character['pronouns']; look: Look; start: string };
  creatorError: string;
  standardFeedback: string;
  inputValue: string;
}

/** Placeholder link for every framework tag. */
// JIM: real Only Empowerment lesson URLs go here when they exist.
export const OE_URL = 'https://onlyempowerment.com';

const ui: UI = {
  screen: 'age',
  sheet: null,
  ageError: '',
  draft: { name: '', pronouns: 'they', look: { skin: 2, hair: 0, hairColor: 1, build: 1, clothes: 0 }, start: 'drifting' },
  creatorError: '',
  standardFeedback: '',
  inputValue: '',
};

let game: Game | null = null;
let root: HTMLElement;

// ---------- helpers ----------

export function esc(text: unknown): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const L = (key: string) => line(key);
const fill = (t: string) => (game ? game.fill(t) : t);
const paras = (list: string[]) => list.map((p) => `<p>${esc(p)}</p>`).join('');

export function tagBox(tag?: Tag): string {
  if (!tag) return '';
  return `<div class="tag"><span>${esc(tag.framework)}: ${esc(tag.item)}</span><br>
    <a href="${OE_URL}" target="_blank" rel="noopener">${esc(L('ui.learnLink'))}</a></div>`;
}

export function artFor(key: string, s: State | null): string {
  let k = key;
  let forced = '';
  const at = key.indexOf('@');
  if (at > 0) {
    k = key.slice(0, at);
    forced = key.slice(at + 1);
  }
  const svg = placeArt[k] ?? placeArt.living;
  const per = forced || (s ? period(s.t) : 'morning');
  const cans = s ? (Number(s.flags.cans ?? 0) > 0 ? '1' : '0') : '1';
  const weather = s && s.today.rain ? 'rain' : '';
  // Where the phone sleeps shows in the bedroom.
  const phone = s && s.place === 'home' && s.today.phoneInKitchen ? '0' : '1';
  return `<div class="art" data-period="${per}" data-cans="${cans}" data-weather="${weather}" data-phone="${phone}" aria-hidden="true">${svg}${rainLayer()}</div>`;
}

function rainLayer(): string {
  let lines = '';
  for (let i = 0; i < 40; i++) {
    const x = (i * 37) % 400;
    const y = (i * 53) % 225;
    lines += `<line x1="${x}" y1="${y}" x2="${x - 6}" y2="${y + 18}"/>`;
  }
  return `<svg class="rain" viewBox="0 0 400 225" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%" stroke="#dfe8f2" stroke-width="1.6" stroke-linecap="round" opacity="0.7">${lines}</svg>`;
}

function hasTime(text: string): boolean {
  return /\b\d{1,2}:\d{2}\s?(a\.m\.|p\.m\.)/.test(text);
}

// ---------- screens ----------

function renderAge(): string {
  return `<div class="screen fade-in">
    <h1>${esc(L('age.title'))}</h1>
    ${paras(lineList('age.text'))}
    <form data-form="age">
      <label class="field"><span>${esc(L('age.birthdate'))}</span>
        <input type="date" name="birthdate" required></label>
      <label class="check"><input type="checkbox" name="adult"> <span>${esc(L('age.confirm'))}</span></label>
      <button class="btn" type="submit">${esc(L('age.continue'))}</button>
      ${ui.ageError ? `<p class="error" role="alert">${esc(ui.ageError)}</p>` : ''}
    </form>
    <p class="muted">${esc(L('age.privacy'))}</p>
  </div>`;
}

function renderTitle(): string {
  const saved = load();
  return `<div class="screen fade-in">
    <div class="title-art">${artFor('diner@morning', null)}</div>
    <h1>${esc(creator.title)}</h1>
    ${paras(lineList('title.text'))}
    <div class="choices">
      ${saved ? `<button class="choice primary" data-act="continue-game">${esc(L('title.continue'))}<span class="note">${esc(dayName(saved.day))} · ${esc(fmtTime(saved.t))} · ${esc(saved.character.name)}</span></button>` : ''}
      <button class="choice${saved ? '' : ' primary'}" data-act="new-game">${esc(L('title.new'))}</button>
      <button class="choice" data-act="sheet" data-arg="help">${esc(L('title.help'))}</button>
    </div>
    <p class="muted" style="margin-top:24px">${esc(L('title.credit'))} <a href="${OE_URL}" target="_blank" rel="noopener">${esc(L('ui.learnLink'))}</a></p>
    <p class="muted">${esc(creator.status)}</p>
  </div>`;
}

function seg(field: string, options: { v: string | number; label: string; disabled?: boolean }[], current: string | number): string {
  return `<div class="seg" role="group">${options
    .map(
      (o) =>
        `<button type="button" data-act="draft" data-field="${field}" data-arg="${o.v}" aria-pressed="${String(o.v) === String(current)}"${o.disabled ? ' disabled' : ''}>${esc(o.label)}</button>`,
    )
    .join('')}</div>`;
}

function swatches(field: string, colors: string[], current: number, label: string): string {
  return `<div class="seg" role="group" aria-label="${esc(label)}">${colors
    .map(
      (c, i) =>
        `<button type="button" class="swatch" style="background:${c}" data-act="draft" data-field="${field}" data-arg="${i}" aria-pressed="${i === current}" aria-label="${esc(label)} ${i + 1}"></button>`,
    )
    .join('')}</div>`;
}

function renderCreator(): string {
  const d = ui.draft;
  const look = creator.look;
  return `<div class="screen fade-in" style="max-width:820px">
    <h1>${esc(L('creator.title'))}</h1>
    ${paras(creator.intro)}
    <div class="creator-grid">
      <div class="portrait">${portrait(d.look)}</div>
      <form data-form="creator">
        <label class="field"><span>${esc(L('creator.name'))}</span>
          <input type="text" name="name" maxlength="24" autocomplete="off" value="${esc(d.name)}" data-input="name"></label>
        <div class="field"><span><strong>${esc(L('creator.pronouns'))}</strong></span>
          ${seg('pronouns', creator.pronouns.map((p) => ({ v: p.id, label: p.label })), d.pronouns)}</div>
        <h3>${esc(L('creator.look'))}</h3>
        <p class="muted">${esc(L('creator.lookNote'))}</p>
        <div class="field"><span><strong>${esc(L('creator.skin'))}</strong></span>${swatches('skin', SKIN, d.look.skin, L('creator.skin'))}</div>
        <div class="field"><span><strong>${esc(L('creator.hair'))}</strong></span>${seg('hair', look.hair.map((h, i) => ({ v: i, label: h })), d.look.hair)}</div>
        <div class="field"><span><strong>${esc(L('creator.hairColor'))}</strong></span>${swatches('hairColor', HAIR_COLOR, d.look.hairColor, L('creator.hairColor'))}</div>
        <div class="field"><span><strong>${esc(L('creator.build'))}</strong></span>${seg('build', look.build.map((h, i) => ({ v: i, label: h })), d.look.build)}</div>
        <div class="field"><span><strong>${esc(L('creator.clothes'))}</strong></span>${seg('clothes', look.clothes.map((h, i) => ({ v: i, label: h })), d.look.clothes)}</div>
        <h3>${esc(L('creator.start'))}</h3>
        ${creator.starts
          .map(
            (st) =>
              `<button type="button" class="start-life" data-act="draft" data-field="start" data-arg="${st.id}" aria-pressed="${d.start === st.id}"${st.available ? '' : ' disabled'}>
                <strong>${esc(st.label)}</strong><br><span>${esc(st.text)}</span>
                ${st.available ? '' : `<span class="later">${esc(st.later ?? '')}</span>`}
              </button>`,
          )
          .join('')}
        <div class="row">
          <button class="btn" type="submit">${esc(L('creator.done'))}</button>
          <button class="btn quiet" type="button" data-act="to-title">${esc(L('ui.back'))}</button>
        </div>
        ${ui.creatorError ? `<p class="error" role="alert">${esc(ui.creatorError)}</p>` : ''}
      </form>
    </div>
  </div>`;
}

function renderClosing(): string {
  return `<div class="screen fade-in">
    <div class="closing">
      <div class="portrait">${portrait(ui.draft.look, { mood: 'night' })}</div>
      <div class="over">${esc(creator.closingLine)}</div>
    </div>
    <div class="row" style="justify-content:center">
      <button class="btn" data-act="begin">${esc(L('creator.begin'))}</button>
    </div>
  </div>`;
}

// ---------- the game ----------

function placeLabel(s: State): string {
  const p = placeById[s.place];
  if (s.place === 'home') {
    const r = p.rooms?.find((x) => x.id === s.room);
    return r ? `${p.name} · ${r.name}` : p.name;
  }
  return p.name;
}

function topBar(s: State): string {
  return `<header class="top">
    <div class="clock"><span class="when">${esc(dayName(s.day))} · ${esc(fmtTime(s.t))}</span>
    <span class="where">${esc(placeLabel(s))}</span></div>
    <button class="icon-btn" data-act="sheet" data-arg="help">${esc(L('ui.help'))}</button>
    <button class="icon-btn" data-act="sheet" data-arg="menu">${esc(L('ui.menu'))}</button>
  </header>`;
}

function bottomTabs(s: State): string {
  const canMap = s.phase === 'play';
  const onMap = s.phase === 'map';
  return `<nav class="tabs">
    ${
      onMap
        ? `<button data-act="map-close">${esc(L('ui.stay'))}</button>`
        : `<button class="go" data-act="map-open"${canMap ? '' : ' disabled'}>${esc(L('ui.map'))}</button>`
    }
    <button data-act="sheet" data-arg="quests">${esc(L('ui.quests'))}</button>
    <button data-act="sheet" data-arg="record">${esc(L('ui.record'))}</button>
    <button data-act="sheet" data-arg="you">${esc(L('ui.you'))}</button>
  </nav>`;
}

function sceneArtKey(s: State): string {
  if (s.phase === 'encounter' && s.encounter) return s.encounter.setting;
  if (s.phase === 'scene' && game) {
    const cur = game.currentScene();
    if (cur?.node?.art) return cur.node.art;
    if (cur?.sc.art) return cur.sc.art;
  }
  if (s.place === 'home') return s.room || 'living';
  return placeById[s.place].art;
}

function renderSceneNode(s: State): string {
  const g = game!;
  const cur = g.currentScene();
  const st = s.scene!;
  if (!cur || !cur.node || st.error) {
    return `<p class="error">${esc(st.error ?? `Missing scene ${st.id}`)}</p>
      <div class="choices"><button class="choice" data-act="continue">${esc(L('ui.continue'))}</button></div>`;
  }
  const node: Node = cur.node;
  const text = g.nodeText(node);
  let html = '';
  if (node.speaker) html += `<div class="speaker">${esc(fill(node.speaker))}</div>`;
  if (node.message) html += text.map((t) => `<div class="message"><p>${esc(t)}</p></div>`).join('');
  else html += `<div class="narration">${paras(text)}</div>`;
  if (st.result) {
    html += `<div class="result fade-in">${paras(st.result)}</div>`;
    html += `<div class="choices"><button class="choice primary" data-act="continue">${esc(L('ui.continue'))}</button></div>`;
    return html + tagBox(node.tag);
  }
  if (node.input === 'standard' || node.input === 'purpose-own') {
    const starters = (node.starters ?? []).filter((x) => check(s, x.if));
    html += `<form data-form="input">
      <label class="field"><span class="sr-only">${esc(L('ui.yourLine'))}</span>
      <textarea name="line" maxlength="140" data-input="line" placeholder="${esc(L(node.input === 'standard' ? 'standard.placeholder' : 'purpose.placeholder'))}">${esc(ui.inputValue)}</textarea></label>
      ${starters.length ? `<p class="muted">${esc(L('standard.starters'))}</p><div class="seg">${starters.map((x) => `<button type="button" data-act="starter" data-arg="${esc(fill(x.text))}">${esc(fill(x.text))}</button>`).join('')}</div>` : ''}
      ${ui.standardFeedback ? `<div class="result fade-in" role="status"><p>${esc(ui.standardFeedback)}</p></div>` : ''}
      <div class="row"><button class="btn" type="submit">${esc(L(node.input === 'standard' ? 'standard.write' : 'purpose.write'))}</button></div>
    </form>`;
    return html + tagBox(node.tag);
  }
  if (node.input === 'review-week') html += renderReview(s);
  const choices = g.visibleChoices(node);
  if (choices.length) {
    html += `<div class="choices">${choices
      .map(
        ({ c, i }) =>
          `<button class="choice${c.escape ? ' escape' : ''}" data-act="choose" data-arg="${i}">${esc(fill(c.label))}${c.note ? `<span class="note">${esc(fill(c.note))}</span>` : ''}</button>`,
      )
      .join('')}</div>`;
  } else {
    html += `<div class="choices"><button class="choice primary" data-act="continue">${esc(L('ui.continue'))}</button></div>`;
  }
  return html + tagBox(node.tag);
}

export function renderReview(s: State): string {
  const c = s.counts;
  const rows: string[] = [];
  const stat = (key: string, n: number) => rows.push(`<li>${esc(L(key).replace('{n}', String(n)))}</li>`);
  stat('review.days', s.day);
  stat('review.structureDays', c.structureDays ?? 0);
  stat('review.returns', c.returns ?? 0);
  stat('review.onTime', c.onTime ?? 0);
  stat('review.late', c.late ?? 0);
  stat('review.skipped', c.shiftSkipped ?? 0);
  stat('review.dana', c.danaSameDay ?? 0);
  stat('review.floors', c.floorsDone ?? 0);
  stat('review.escapes', (c.escape_phone ?? 0) + (c.escape_drink ?? 0) + (c.escape_comfort ?? 0) + (c.escapeAction ?? 0));
  const misses = s.record.filter((r) => /(^|\. )(Didn't|Blamed|Put it off|Snoozed|Slept through|Called (it|skipping))|\bLate\.$|didn't (hold|happen)/.test(r.text));
  return `<div class="notice"><ul style="margin:0;padding-left:18px">${rows.join('')}</ul></div>
    ${misses.length ? `<h3>${esc(L('review.missesShown'))}</h3><div class="notice">${misses.map((m) => `<p>${esc(dayName(m.day))}: ${esc(m.text)}</p>`).join('')}</div>` : ''}`;
}

function renderPlay(s: State): string {
  const g = game!;
  const p = placeById[s.place];
  const open = g.isOpen(s.place);
  const per = period(s.t);
  let html = `<h2>${esc(p.name)}</h2>`;
  if (s.notice && s.notice.length) html += `<div class="notice fade-in" role="status">${paras(s.notice)}</div>`;
  if (p.rooms && p.rooms.length) {
    html += `<div class="rooms" role="group">${p.rooms
      .map((r) => `<button class="room-tab" data-act="room" data-arg="${r.id}" aria-pressed="${r.id === s.room}">${esc(r.name)}</button>`)
      .join('')}</div>`;
  }
  if (!open) {
    const at = g.opensAt(s.place);
    html += `<div class="closed"><p style="margin:0">${esc(fill(p.closedText))}</p>${at !== null ? `<p class="muted" style="margin:4px 0 0">${esc(L('ui.opensAt').replace('{time}', fmtTime(at)))}</p>` : ''}</div>`;
  } else {
    const rd = s.place === 'home' ? p.roomDesc?.[s.room] : undefined;
    const desc = rd ? rd[per] ?? rd.default : p.desc[per] ?? p.desc.default;
    html += `<p class="desc">${esc(fill(desc))}</p>`;
    const here = g.peopleAt(s.place);
    if (here.length) {
      html += `<ul class="people">${here
        .map((person) => {
          const l = g.personLine(person);
          return `<li><span class="who">${esc(person.name)}</span> <span class="role">${esc(person.role)}</span>${l ? `<br>${esc(l)}` : ''}</li>`;
        })
        .join('')}</ul>`;
    }
  }
  const acts = g.availableActions();
  if (acts.length) {
    html += `<div class="choices">${acts
      .map(
        (a) =>
          `<button class="choice${a.escape ? ' escape' : ''}" data-act="action" data-arg="${a.id}">${esc(fill(a.label))}${a.note ? `<span class="note">${esc(fill(a.note))}</span>` : ''}</button>`,
      )
      .join('')}</div>`;
  }
  html += `<p class="muted" style="margin-top:16px">${esc(L('ui.mapHint'))}</p>`;
  return html;
}

function renderMap(s: State): string {
  const g = game!;
  const pins = places.map((p) => ({
    id: p.id,
    label: p.name,
    pos: p.pos,
    open: g.isOpen(p.id),
    here: p.id === s.place,
    minutes: g.travelMinutes(p.id),
    people: g.isOpen(p.id) ? g.peopleAt(p.id).length : 0,
  }));
  return `<h2>${esc(L('map.title'))}</h2>
    <p class="muted">${esc(L('map.text'))}</p>
    ${townMap(pins)}
    <ul class="place-list">${places
      .map((p) => {
        const open = g.isOpen(p.id);
        const here = p.id === s.place;
        let status: string;
        if (here) status = L('map.here');
        else if (open) status = L('map.open').replace('{n}', String(g.travelMinutes(p.id)));
        else {
          const at = g.opensAt(p.id);
          status = at !== null ? L('map.closedUntil').replace('{time}', fmtTime(at)) : L('map.closed');
        }
        return `<li><button data-act="travel" data-arg="${p.id}"${here ? ' disabled' : ''}>
          <span><strong>${esc(p.name)}</strong><br><span class="muted">${esc(p.hoursText)}</span></span>
          <span class="status${open ? '' : ' is-closed'}">${esc(status)}</span></button></li>`;
      })
      .join('')}</ul>`;
}

function cardHtml(c: CardDef, playable: boolean, strong: boolean): string {
  const kind = L(`card.kind.${c.kind}`);
  return `<button class="card ${c.kind}${playable ? '' : ' static'}" ${playable ? `data-act="card" data-arg="${c.id}"` : 'disabled'}>
    <span class="kind">${esc(kind)}</span>
    <span class="name">${esc(c.name)}</span>
    <span class="text">${esc(fill(c.text))}</span>
    ${strong ? `<span class="strong">${esc(L('enc.strongHere'))}</span>` : ''}
  </button>`;
}

function renderEncounter(s: State): string {
  const g = game!;
  const e = s.encounter!;
  const d = enc.def(g);
  if (!d) return `<p class="error">Missing encounter ${esc(e.id)}</p>`;
  let html = `<h2>${esc(d.title)}</h2>
    <div class="meters">
      <div class="meter resolve"><span class="name">${esc(L('enc.resolve'))}</span><span class="num" aria-live="polite">${e.resolve}</span></div>
      <div class="meter pull"><span class="name">${esc(L('enc.pull'))}</span><span class="num" aria-live="polite">${e.pull}</span></div>
    </div>`;
  if (e.mods.length) {
    html += `<details class="why"><summary>${esc(L('enc.why'))}</summary><ul>${e.mods
      .map((m) => {
        const parts = [];
        if (m.r) parts.push(`${L('enc.resolve')} ${m.r > 0 ? '+' : ''}${m.r}`);
        if (m.p) parts.push(`${L('enc.pull')} ${m.p > 0 ? '+' : ''}${m.p}`);
        return `<li>${esc(m.text)} <strong>${esc(parts.join(', '))}</strong></li>`;
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
    const after = d.after ?? 'bed';
    html += `<div class="outcome fade-in">
      <div class="label">${esc(view.label)}</div>
      ${paras(view.text.map(fill))}
      ${recs.length ? `<div class="rec"><span class="muted">${esc(L('enc.onRecord'))}</span>${paras(recs.map((r) => fill(r.replace('{time}', fmtTime(s.t + (e.outcome!.kind === 'acted' ? 10 : 0))))))}</div>` : ''}
    </div>
    <div class="choices"><button class="choice primary" data-act="enc-finish">${esc(L(after === 'bed' ? 'enc.nightFalls' : 'ui.continue'))}</button></div>`;
    return html + tagBox(d.tag);
  }
  if (e.pickingFloor) {
    html += `<p><strong>${esc(L('enc.pickFloor'))}</strong></p><div class="choices">${enc
      .floorOptions(g)
      .map((f, i) => `<button class="choice" data-act="floor" data-arg="${i}">${esc(fill(f.label))}${f.text.length ? `<span class="note">${esc(fill(f.text[0]))}</span>` : ''}</button>`)
      .join('')}</div>`;
    return html;
  }
  html += `<p class="muted">${esc(L('enc.handHint'))}</p><div class="hand">${e.hand
    .map((id) => cards[id])
    .filter(Boolean)
    .map((c) => cardHtml(c, true, e.strong.includes(c.id)))
    .join('')}</div>`;
  return html + tagBox(d.tag);
}

function renderDayEnd(s: State): string {
  const today = s.record.filter((r) => r.day === s.day);
  return `<h2>${esc(L('dayend.title'))}</h2>
    ${paras(lineList('dayend.text'))}
    ${today.length ? `<h3>${esc(L('dayend.today').replace('{day}', dayName(s.day)))}</h3><div class="notice">${today.map((r) => `<p>${hasTime(r.text) ? '' : `<span class="muted">${esc(fmtTime(r.t))}</span> `}${esc(r.text)}</p>`).join('')}</div>` : ''}
    <div class="choices">
      <button class="choice primary" data-act="sleep">${esc(L('dayend.sleep'))}</button>
      <button class="choice" data-act="stop">${esc(L('dayend.stop'))}</button>
    </div>`;
}

function renderEnded(s: State): string {
  return `<h2>${esc(L('end.title'))}</h2>
    ${paras(lineList('end.text'))}
    ${renderReview(s)}
    ${s.traits.length ? `<h3>${esc(L('you.traits'))}</h3><div class="notice">${paras(s.traits)}</div>` : ''}
    <div class="choices">
      <button class="choice" data-act="sheet" data-arg="record">${esc(L('end.readRecord'))}</button>
      <button class="choice" data-act="sheet" data-arg="you">${esc(L('end.you'))}</button>
      <button class="choice" data-act="to-title">${esc(L('end.title_screen'))}</button>
    </div>`;
}

function renderGame(): string {
  const s = game!.s;
  let panel = '';
  switch (s.phase) {
    case 'scene':
      panel = s.scene ? renderSceneNode(s) : renderPlay(s);
      break;
    case 'map':
      panel = renderMap(s);
      break;
    case 'encounter':
      panel = s.encounter ? renderEncounter(s) : renderPlay(s);
      break;
    case 'dayend':
      panel = renderDayEnd(s);
      break;
    case 'ended':
      panel = renderEnded(s);
      break;
    default:
      panel = renderPlay(s);
  }
  return `${topBar(s)}
  <main class="stage">
    <div class="art-col">${artFor(sceneArtKey(s), s)}</div>
    <section class="panel fade-in" aria-live="polite">${panel}</section>
  </main>
  ${bottomTabs(s)}`;
}

// ---------- sheets ----------

function sheetWrap(title: string, body: string): string {
  return `<div class="sheet-back" data-act="sheet-close-back">
    <div class="sheet fade-in" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" data-act="sheet-close">${esc(L('ui.close'))}</button></div>
      ${body}
    </div>
  </div>`;
}

function renderQuests(s: State): string {
  const order = ['main', 'daily', 'side'] as const;
  const qs = s.questOrder.map((id) => s.quests[id]).filter(Boolean);
  if (!qs.length) return sheetWrap(L('ui.quests'), `<p class="muted">${esc(L('quests.none'))}</p>`);
  let body = '';
  for (const kind of order) {
    const list = qs.filter((q) => q.kind === kind).sort((a, b) => (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1));
    if (!list.length) continue;
    body += `<h3>${esc(L(`quests.kind.${kind}`))}</h3>`;
    body += list
      .map(
        (q) => `<div class="quest${q.status === 'closed' ? ' closed-q' : ''}">
        <div class="kind">${esc(q.status === 'closed' ? L('quests.closed') : L('quests.active'))}${q.tag ? ` · ${esc(q.tag)}` : ''}</div>
        <div class="title">${esc(q.title)}</div>
        <div>${esc(q.objective)}</div></div>`,
      )
      .join('');
  }
  return sheetWrap(L('ui.quests'), body);
}

function renderRecord(s: State): string {
  if (!s.record.length) return sheetWrap(L('ui.record'), `<p class="muted">${esc(L('record.empty'))}</p>`);
  const days = [...new Set(s.record.map((r) => r.day))].sort((a, b) => b - a);
  const body =
    `<p class="muted">${esc(L('record.note'))}</p>` +
    days
      .map((d) => {
        const rows = s.record
          .filter((r) => r.day === d)
          .map((r) => `<div class="record-line"><span class="t">${hasTime(r.text) ? '' : esc(fmtTime(r.t))}</span><span>${esc(r.text)}</span></div>`)
          .join('');
        return `<div class="record-day"><h4>${esc(L('record.day').replace('{n}', String(d)).replace('{name}', dayName(d)))}</h4>${rows}</div>`;
      })
      .join('');
  return sheetWrap(L('ui.record'), body);
}

function renderYou(s: State): string {
  const c = s.character;
  const skills = ['ownership', 'purpose', 'resilience', 'integrity', 'discipline', 'empowerment'];
  const skillHtml = skills
    .map((k) => {
      const open = k === 'ownership' || k === 'purpose' ? s.lines[k as 'ownership'] : false;
      const proof = k === 'ownership' || k === 'purpose' ? s.proof[k as 'ownership'] : [];
      const inSlice = k === 'ownership' || k === 'purpose';
      return `<div class="skill${open ? '' : ' locked'}">
        <strong>${esc(L(`skill.${k}.name`))}</strong>
        <div class="muted">${esc(open ? L('skill.proofCount').replace('{n}', String(proof.length)) : inSlice ? L('skill.notYet') : L('skill.later'))}</div>
        ${open && proof.length ? `<ul>${proof.map((p) => `<li>${esc(dayName(p.day))}: ${esc(p.text)}</li>`).join('')}</ul>` : ''}
      </div>`;
    })
    .join('');
  const earned = s.cards.map((id) => cards[id]).filter(Boolean);
  const always = ['scroll', 'beers', 'orderin', 'floor', 'waiting', 'tomorrow'].map((id) => cards[id]).filter(Boolean);
  const body = `<div style="display:flex;gap:14px;align-items:center;margin-bottom:8px">
      <div class="portrait" style="max-width:110px">${portrait(c.look)}</div>
      <div><strong style="font-size:20px">${esc(c.name)}</strong><br><span class="muted">${esc(creator.pronouns.find((p) => p.id === c.pronouns)?.label ?? '')}</span><br>
      <span>${esc(L(`stage.${s.stage}`))}</span></div>
    </div>
    <h3>${esc(L('you.standard'))}</h3><p>${s.standard ? esc(s.standard) : `<span class="muted">${esc(L('you.noStandard'))}</span>`}</p>
    <h3>${esc(L('you.purpose'))}</h3><p>${s.purpose ? esc(s.purpose) : `<span class="muted">${esc(L('you.noPurpose'))}</span>`}</p>
    <h3>${esc(L('you.returns'))}</h3><p>${esc(L('you.returnsText').replace('{n}', String(s.counts.returns ?? 0)))}</p>
    <h3>${esc(L('you.skills'))}</h3>${skillHtml}
    <h3>${esc(L('you.traits'))}</h3>${s.traits.length ? paras(s.traits) : `<p class="muted">${esc(L('you.noTraits'))}</p>`}
    <h3>${esc(L('you.cards'))}</h3><p class="muted">${esc(L('you.cardsNote'))}</p>
    <div class="card-list">${[...always, ...earned.filter((x) => !always.includes(x))].map((x) => cardHtml(x, false, false)).join('')}</div>`;
  return sheetWrap(L('ui.you'), body);
}

function renderHelp(): string {
  const st = readSettings();
  // JIM: the play reminder offers off, 30, 60 or 90 minutes. The docs say only "optional, off by default".
  const opts = [0, 30, 60, 90];
  const body = `${lineList('help.crisis')
    .map((t, i) => (i === 0 ? `<div class="help-card"><strong>${esc(t)}</strong>` : `<p style="margin:6px 0 0">${esc(t)}</p>`))
    .join('')}</div>
    <div class="help-card" style="border-color:var(--line)">${paras(lineList('help.notTreatment'))}</div>
    <h3>${esc(L('help.howTitle'))}</h3>${paras(lineList('help.how'))}
    <h3>${esc(L('help.reminderTitle'))}</h3>
    <p class="muted">${esc(L('help.reminderText'))}</p>
    ${seg('reminder', opts.map((n) => ({ v: n, label: n === 0 ? L('help.reminderOff') : L('help.reminderMin').replace('{n}', String(n)) })), st.reminder).replace(/data-act="draft"/g, 'data-act="reminder"')}
    <h3>${esc(L('help.framesTitle'))}</h3>${paras(lineList('help.frames'))}
    <p><a href="${OE_URL}" target="_blank" rel="noopener">${esc(L('ui.learnLink'))}</a></p>
    <h3>${esc(L('help.saveTitle'))}</h3><p class="muted">${esc(L('help.saveText'))}</p>
    <button class="btn secondary" data-act="sheet" data-arg="confirm-erase">${esc(L('help.erase'))}</button>`;
  return sheetWrap(L('ui.help'), body);
}

function renderNews(s: State): string {
  const town = news.town.filter((n) => n.day <= s.day).slice(-4).reverse();
  const you = news.you.filter((n) => check(s, n.if));
  const body = `${you.length ? `<h3>${esc(L('news.about'))}</h3><div class="notice">${paras(you.map((n) => fill(n.text)))}</div>` : ''}
    <h3>${esc(L('news.town'))}</h3><div class="notice">${town.length ? paras(town.map((n) => fill(n.text))) : esc(L('news.none'))}</div>`;
  return sheetWrap(L('news.title'), body);
}

function renderMenu(): string {
  const body = `<p class="muted">${esc(L('menu.saved'))}</p>
    <div class="choices">
      <button class="choice" data-act="to-title">${esc(L('menu.title'))}</button>
      <button class="choice" data-act="sheet" data-arg="help">${esc(L('ui.help'))}</button>
    </div>`;
  return sheetWrap(L('ui.menu'), body);
}

function renderConfirm(kind: 'new' | 'erase'): string {
  const body = `${paras(lineList(kind === 'new' ? 'confirm.new' : 'confirm.erase'))}
    <div class="row">
      <button class="btn" data-act="${kind === 'new' ? 'confirm-new' : 'confirm-erase'}">${esc(L(kind === 'new' ? 'confirm.newYes' : 'confirm.eraseYes'))}</button>
      <button class="btn secondary" data-act="sheet-close">${esc(L('ui.cancel'))}</button>
    </div>`;
  return sheetWrap(L(kind === 'new' ? 'confirm.newTitle' : 'confirm.eraseTitle'), body);
}

function renderReminder(): string {
  const body = `${paras(lineList('reminder.text'))}<div class="row"><button class="btn" data-act="sheet-close">${esc(L('ui.close'))}</button></div>`;
  return sheetWrap(L('reminder.title'), body);
}

function renderSheet(): string {
  const s = game?.s;
  switch (ui.sheet) {
    case 'quests':
      return s ? renderQuests(s) : '';
    case 'record':
      return s ? renderRecord(s) : '';
    case 'you':
      return s ? renderYou(s) : '';
    case 'news':
      return s ? renderNews(s) : '';
    case 'help':
      return renderHelp();
    case 'menu':
      return renderMenu();
    case 'confirm-new':
      return renderConfirm('new');
    case 'confirm-erase':
      return renderConfirm('erase');
    case 'reminder':
      return renderReminder();
    default:
      return '';
  }
}

// ---------- render and events ----------

export function render(): void {
  let html = '';
  switch (ui.screen) {
    case 'age':
      html = renderAge();
      break;
    case 'title':
      html = renderTitle();
      break;
    case 'creator':
      html = renderCreator();
      break;
    case 'closing':
      html = renderClosing();
      break;
    case 'game':
      html = game ? renderGame() : renderTitle();
      break;
  }
  const scrollY = window.scrollY;
  const keepScroll = root.dataset.view === viewKey();
  root.innerHTML = html + renderSheet();
  root.dataset.view = viewKey();
  // Fade in only when the view changes, not on every small update.
  root.classList.toggle('same-view', keepScroll);
  if (keepScroll) window.scrollTo(0, scrollY);
  else window.scrollTo(0, 0);
  document.body.style.overflow = ui.sheet ? 'hidden' : '';
}

/** Changes of view scroll to the top; small updates (a card played) keep the scroll. */
function viewKey(): string {
  if (ui.screen !== 'game' || !game) return ui.screen;
  const s = game.s;
  return [s.phase, s.scene?.id ?? '', s.scene?.node ?? '', s.scene?.result ? 'r' : '', s.encounter?.id ?? '', s.encounter?.outcome ? 'o' : '', s.place, s.room, s.day].join('|');
}

function startGame(g: Game): void {
  game = g;
  ui.screen = 'game';
  ui.sheet = null;
  ui.inputValue = '';
  ui.standardFeedback = '';
  g.onChange(() => render());
  render();
}

function onClick(ev: MouseEvent): void {
  const target = ev.target as HTMLElement;
  const el = target.closest<HTMLElement>('[data-act]');
  if (!el) return;
  const act = el.dataset.act!;
  const arg = el.dataset.arg ?? '';
  if (act === 'sheet-close-back' && target !== el) return;
  const g = game;
  switch (act) {
    case 'continue-game': {
      const s = load();
      if (s) startGame(new Game(s));
      return;
    }
    case 'new-game':
      if (load()) {
        ui.sheet = 'confirm-new';
        render();
      } else {
        ui.screen = 'creator';
        render();
      }
      return;
    case 'confirm-new':
      ui.sheet = null;
      ui.screen = 'creator';
      render();
      return;
    case 'confirm-erase':
      clearSave();
      game = null;
      ui.sheet = null;
      ui.screen = 'title';
      render();
      return;
    case 'to-title':
      if (g) save(g.s);
      game = null;
      ui.sheet = null;
      ui.screen = 'title';
      render();
      return;
    case 'draft': {
      const f = el.dataset.field!;
      if (f === 'pronouns') ui.draft.pronouns = arg as Character['pronouns'];
      else if (f === 'start') ui.draft.start = arg;
      else (ui.draft.look as unknown as Record<string, number>)[f] = Number(arg);
      render();
      return;
    }
    case 'begin': {
      const ch: Character = { name: ui.draft.name.trim(), pronouns: ui.draft.pronouns, look: { ...ui.draft.look }, start: 'drifting' };
      startGame(Game.fresh(ch));
      return;
    }
    case 'sheet':
      ui.sheet = arg as Sheet;
      render();
      return;
    case 'sheet-close':
    case 'sheet-close-back':
      ui.sheet = null;
      render();
      return;
    case 'reminder': {
      const n = Number(arg);
      writeSettings({ reminder: n });
      if (g) {
        g.s.settings.reminder = n;
        g.s.playedMs = 0;
        g.s.reminded = false;
        save(g.s);
      }
      render();
      return;
    }
  }
  if (!g) return;
  switch (act) {
    case 'choose':
      ui.standardFeedback = '';
      g.choose(Number(arg));
      return;
    case 'continue':
      ui.standardFeedback = '';
      if (g.s.scene?.error) {
        g.s.scene = undefined;
        g.settle();
        return;
      }
      g.continueScene();
      return;
    case 'starter':
      ui.inputValue = arg;
      ui.standardFeedback = '';
      render();
      return;
    case 'action': {
      const a = arg;
      const def = (g.availableActions().find((x) => x.id === a));
      if (def?.panel === 'news') {
        g.doAction(a);
        ui.sheet = 'news';
        render();
        return;
      }
      g.doAction(a);
      return;
    }
    case 'room':
      g.goRoom(arg);
      return;
    case 'map-open':
      g.openMap();
      return;
    case 'map-close':
      g.closeMap();
      return;
    case 'travel':
      g.travel(arg as PlaceId);
      return;
    case 'card':
      g.playCard(arg);
      return;
    case 'floor':
      g.pickFloor(Number(arg));
      return;
    case 'enc-finish':
      g.finishEncounter();
      return;
    case 'sleep':
      g.sleep();
      return;
    case 'stop':
      save(g.s);
      game = null;
      ui.screen = 'title';
      render();
      return;
  }
}

function onSubmit(ev: SubmitEvent): void {
  const form = ev.target as HTMLFormElement;
  const kind = form.dataset.form;
  if (!kind) return;
  ev.preventDefault();
  const data = new FormData(form);
  if (kind === 'age') {
    const bd = String(data.get('birthdate') ?? '');
    const adult = data.get('adult') === 'on';
    if (!bd) {
      ui.ageError = L('age.needDate');
      render();
      return;
    }
    const born = new Date(`${bd}T00:00:00`);
    const now = new Date();
    let age = now.getFullYear() - born.getFullYear();
    const m = now.getMonth() - born.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age--;
    if (Number.isNaN(age) || age < 18) {
      ui.ageError = L('age.under');
      render();
      return;
    }
    if (!adult) {
      ui.ageError = L('age.needCheck');
      render();
      return;
    }
    setAgeOk();
    ui.ageError = '';
    ui.screen = 'title';
    render();
    return;
  }
  if (kind === 'creator') {
    const name = String(data.get('name') ?? '').trim();
    ui.draft.name = name;
    if (!name) {
      ui.creatorError = L('creator.needName');
      render();
      return;
    }
    ui.creatorError = '';
    ui.screen = 'closing';
    render();
    return;
  }
  if (kind === 'input' && game) {
    const value = String(data.get('line') ?? '').trim();
    const node = game.currentScene()?.node;
    if (node?.input === 'standard') {
      const res = checkStandard(value);
      if (res !== 'ok') {
        ui.inputValue = value;
        ui.standardFeedback = L(`standard.${res}`);
        render();
        return;
      }
    } else if (!value) {
      ui.standardFeedback = L('purpose.empty');
      render();
      return;
    }
    ui.inputValue = '';
    ui.standardFeedback = '';
    game.submitInput(value);
  }
}

function onInput(ev: Event): void {
  const el = ev.target as HTMLInputElement;
  const key = el.dataset.input;
  if (key === 'name') ui.draft.name = el.value;
  if (key === 'line') ui.inputValue = el.value;
}

function onKey(ev: KeyboardEvent): void {
  if (ev.key === 'Escape' && ui.sheet) {
    ui.sheet = null;
    render();
    return;
  }
  const el = ev.target as HTMLElement;
  if ((ev.key === 'Enter' || ev.key === ' ') && el.classList.contains('pin')) {
    ev.preventDefault();
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
}

/** Map pins are SVG groups; clicks on them travel. */
function onMapClick(ev: MouseEvent): void {
  const pin = (ev.target as Element).closest?.('.pin') as SVGGElement | null;
  if (!pin || !game) return;
  const id = pin.getAttribute('data-place');
  if (id && id !== game.s.place) game.travel(id as PlaceId);
}

// The optional play reminder. Off by default. It never shows a countdown.
function tickReminder(): void {
  if (!game || ui.screen !== 'game' || document.visibilityState !== 'visible') return;
  const s = game.s;
  s.playedMs += 15000;
  const mins = s.settings.reminder;
  if (mins > 0 && !s.reminded && s.playedMs >= mins * 60000 && !ui.sheet) {
    s.reminded = true;
    s.playedMs = 0;
    ui.sheet = 'reminder';
    render();
    s.reminded = false;
  }
  save(s);
}

export function mount(el: HTMLElement): void {
  root = el;
  ui.screen = ageOk() ? 'title' : 'age';
  root.addEventListener('click', (ev) => {
    onMapClick(ev);
    onClick(ev);
  });
  root.addEventListener('submit', onSubmit);
  root.addEventListener('input', onInput);
  root.addEventListener('keydown', onKey);
  setInterval(tickReminder, 15000);
  render();
  // For automated playtests: read-only access to the running game.
  (window as unknown as { __game: () => Game | null; __scenes: typeof scenes; __people: typeof people }).__game = () => game;
  (window as unknown as { __scenes: typeof scenes }).__scenes = scenes;
}
