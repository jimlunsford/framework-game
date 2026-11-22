import type { PlaceId } from './types';

export interface Look {
  skin: number;
  hair: number;
  hairColor: number;
  build: number;
  clothes: number;
}

export interface Character {
  name: string;
  pronouns: 'he' | 'she' | 'they';
  look: Look;
  start: 'drifting';
}

export interface RecordEntry {
  day: number;
  t: number;
  text: string;
}

export interface QuestState {
  id: string;
  title: string;
  kind: 'main' | 'daily' | 'side';
  status: 'active' | 'closed';
  objective: string;
  tag?: string;
  updatedDay: number;
}

export interface ProofEntry {
  day: number;
  t: number;
  text: string;
}

export type EscapeKind = 'phone' | 'drink' | 'comfort';

export interface EncounterState {
  id: string;
  round: number;
  resolve: number;
  pull: number;
  hand: string[];
  used: string[];
  log: { who: 'voice' | 'you' | 'note'; text: string }[];
  muteNext: boolean;
  factArrived: boolean;
  startT: number;
  outcome?: { kind: 'acted' | 'delayed' | 'escaped' | 'adjusted' | 'mislabeled'; escape?: EscapeKind; floorIndex?: number };
  /** Why the numbers started where they did. */
  mods: { text: string; r: number; p: number }[];
  /** Escape cards this place makes stronger. */
  strong: string[];
  /** Art for where it happens. */
  setting: string;
  /** When the floor version needs a choice of what to do. */
  pickingFloor?: boolean;
}

export interface SceneState {
  id: string;
  node: string;
  result?: string[];
  resultNext?: string | null;
  error?: string;
}

export type Phase = 'scene' | 'play' | 'map' | 'encounter' | 'dayend' | 'ended';

export interface State {
  v: 1;
  character: Character;
  day: number;
  /** Minutes since midnight of the current day. Can pass 24:00 late at night. */
  t: number;
  place: PlaceId;
  room: string;
  flags: Record<string, number | boolean | string>;
  today: Record<string, number | boolean | string>;
  record: RecordEntry[];
  quests: Record<string, QuestState>;
  questOrder: string[];
  cards: string[];
  pull: Record<EscapeKind, number>;
  proof: { ownership: ProofEntry[]; purpose: ProofEntry[] };
  lines: { ownership: boolean; purpose: boolean };
  traits: string[];
  stage: number;
  stageStartDay: number;
  counts: Record<string, number>;
  standard: string;
  purpose: string;
  seen: string[];
  seenToday: string[];
  phase: Phase;
  /** Where to go back to after the map. */
  scene?: SceneState;
  encounter?: EncounterState;
  queue: string[];
  /** Short message shown in the play view after an action. */
  notice?: string[];
  settings: { reminder: number };
  playedMs: number;
  reminded: boolean;
}

export const SAVE_KEY = 'framework-game-save-v1';
export const AGE_KEY = 'framework-game-age-ok';
export const SETTINGS_KEY = 'framework-game-settings';

export function newState(character: Character): State {
  return {
    v: 1,
    character,
    day: 1,
    t: 6 * 60 + 30,
    place: 'home',
    room: 'bedroom',
    flags: { danaTrust: 1 },
    today: {},
    record: [],
    quests: {},
    questOrder: [],
    cards: [],
    pull: { phone: 0, drink: 0, comfort: 0 },
    proof: { ownership: [], purpose: [] },
    lines: { ownership: false, purpose: false },
    traits: [],
    stage: 1,
    stageStartDay: 1,
    counts: {},
    standard: '',
    purpose: '',
    seen: [],
    seenToday: [],
    phase: 'play',
    queue: [],
    settings: { reminder: readSettings().reminder },
    playedMs: 0,
    reminded: false,
  };
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked (private windows, some embeds). The game still runs.
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function save(state: State): void {
  safeSet(SAVE_KEY, JSON.stringify(state));
}

export function load(): State | null {
  const raw = safeGet(SAVE_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as State;
    if (s && s.v === 1) return s;
  } catch {
    // fall through
  }
  return null;
}

export function clearSave(): void {
  safeRemove(SAVE_KEY);
}

// JIM: the 18+ check stores only "yes, checked" on the device. The birthdate itself
// is not saved. That was the simplest private choice; the docs don't say either way.
export function ageOk(): boolean {
  return safeGet(AGE_KEY) === 'yes';
}

export function setAgeOk(): void {
  safeSet(AGE_KEY, 'yes');
}

export function readSettings(): { reminder: number } {
  const raw = safeGet(SETTINGS_KEY);
  if (raw) {
    try {
      const s = JSON.parse(raw);
      if (typeof s.reminder === 'number') return { reminder: s.reminder };
    } catch {
      // ignore
    }
  }
  // Design rule: the play reminder is off by default.
  return { reminder: 0 };
}

export function writeSettings(s: { reminder: number }): void {
  safeSet(SETTINGS_KEY, JSON.stringify(s));
}
