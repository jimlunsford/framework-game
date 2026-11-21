// Shared types for the engine and the content files.
// Content files (src/content/**) are plain JSON that match these shapes.
// Code reads content. Code never writes story.

export type PlaceId = 'home' | 'jobsite' | 'diner' | 'gym' | 'bar' | 'church' | 'park' | 'gas';
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type Period = 'dawn' | 'morning' | 'day' | 'evening' | 'dusk' | 'night';

/** A condition is a list of atoms that must all be true. See engine/conditions.ts. */
export type Cond = string[];

/** An effect is a short string ("set:x", "time:+40") or an object for quest updates. */
export type Effect = string | QuestEffect | CondEffect;
/** Effects that apply only when the condition holds at that moment. */
export interface CondEffect {
  if: Cond;
  then: Effect[];
  else?: Effect[];
}
export interface QuestEffect {
  quest: string;
  title?: string;
  kind?: 'main' | 'daily' | 'side';
  status?: 'active' | 'closed';
  objective?: string;
  tag?: string;
}

export interface Tag {
  framework: string;
  item: string;
}

export interface Choice {
  label: string;
  if?: Cond;
  /** Shown under the label in smaller text, e.g. "(Escape: the phone)". */
  note?: string;
  result?: string[];
  record?: string | string[];
  effects?: Effect[];
  /** Node to go to. Omit or null to end the scene. */
  next?: string | null;
  /** Marks this as an escape choice so the UI can show it plainly. */
  escape?: boolean;
}

export interface Node {
  text?: string[];
  /** Text shown only when the condition holds. */
  textIf?: { if: Cond; text: string[] }[];
  effects?: Effect[];
  record?: string | string[];
  choices?: Choice[];
  next?: string | null;
  /** Go to a different next node when a condition holds. First match wins. */
  nextIf?: { if: Cond; next: string | null }[];
  /** Special interactive nodes handled by the UI. */
  input?: 'standard' | 'purpose-own' | 'review-week';
  /** Starter lines offered under a text input, by condition. */
  starters?: { if?: Cond; text: string }[];
  /** Optional art override for this node. */
  art?: string;
  tag?: Tag;
  /** Speaker label shown above the text (a text message, a person). */
  speaker?: string;
  /** Show the text styled as a phone message. */
  message?: boolean;
}

export type TriggerAt = 'wake' | 'enter' | 'time' | 'bedtime' | 'manual';

export interface Trigger {
  at: TriggerAt;
  place?: PlaceId | PlaceId[];
  room?: string;
  /** For at: 'time'. 24h clock, "21:40". Fires when the clock reaches or passes it. */
  time?: string;
  if?: Cond;
  /** Default true: a scene with once:true runs one time per game. daily: once per day. */
  once?: boolean;
  daily?: boolean;
  priority?: number;
}

export interface Scene {
  id: string;
  title: string;
  /** "locked" for approved Scene Book text, or "draft, waiting on Jim". */
  status: string;
  /** Notes for Jim: open questions, Claude's guesses. Not shown in game. */
  notes?: string[];
  /** One trigger, or several in "triggers". The scene runs when any one matches. */
  trigger?: Trigger;
  triggers?: Trigger[];
  art?: string;
  tag?: Tag;
  start: string;
  nodes: Record<string, Node>;
}

export interface Hours {
  days?: Weekday[];
  open: string;
  close: string;
}

export interface Room {
  id: string;
  name: string;
  art: string;
}

export interface Place {
  id: PlaceId;
  name: string;
  short: string;
  art: string;
  /** Position on the town map, 0..100 in both axes. */
  pos: [number, number];
  /** Empty means always open. */
  hours: Hours[];
  hoursText: string;
  rooms?: Room[];
  desc: Partial<Record<Period, string>> & { default: string };
  /** Text for a room at home, by room id. */
  roomDesc?: Record<string, Partial<Record<Period, string>> & { default: string }>;
  closedText: string;
}

export interface PersonSlot {
  place: PlaceId;
  days?: Weekday[];
  from: string;
  to: string;
  if?: Cond;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  schedule: PersonSlot[];
  lines: { if?: Cond; text: string }[];
}

export interface Action {
  id: string;
  /** A place id, or "*" for anywhere (the phone in your pocket). */
  place: PlaceId | '*';
  room?: string;
  label: string;
  note?: string;
  if?: Cond;
  minutes?: number;
  result?: string[];
  record?: string | string[];
  effects?: Effect[];
  scene?: string;
  /** Start the scene at this node instead of its start node. */
  node?: string;
  /** Open a panel instead of a scene. */
  panel?: 'news';
  escape?: boolean;
  group?: string;
  /** Shown even when the place is closed (you're standing outside). */
  closedOk?: boolean;
}

export type CardKind = 'escape' | 'action' | 'delay' | 'fact';

export interface CardDef {
  id: string;
  name: string;
  kind: CardKind;
  text: string;
  /** Where the card came from. Shown on the "You" screen. */
  source?: string;
  tag?: Tag;
  /** Lines the card's player says, keyed by situation. */
  says?: string;
  escape?: 'phone' | 'drink' | 'comfort';
}

export interface EncounterDef {
  id: string;
  title: string;
  status: string;
  notes?: string[];
  art?: string;
  /**
   * Where it happens. "night" (default): the couch at home, the bar if you're there,
   * otherwise the truck. "here": wherever you are. Or an art id.
   */
  setting?: string;
  tag?: Tag;
  intro?: string[];
  introIf?: { if: Cond; text: string[] }[];
  open: string;
  /** The voice's opening line changes with the player's pattern. First match wins. */
  openIf?: { if: Cond; text: string }[];
  /** Old voice lines for later rounds, in order. The last one repeats. */
  rounds: string[];
  /** Old voice push back when a card is played. */
  pushback: Record<string, string>;
  /** The player's answer when the voice pushes back on a card. */
  answers?: Record<string, string>;
  /** Cards offered only in this encounter. */
  extraCards?: string[];
  /** Cards removed in this encounter. */
  noCards?: string[];
  /** A real new fact that can arrive mid-encounter. */
  fact?: {
    if: Cond;
    round: number;
    text: string[];
    card: string;
    time?: string;
  };
  /** Outcomes for this encounter. Anything left out uses src/content/outcomes.json. */
  outcomes?: {
    acted?: OutcomeDef;
    delayed?: OutcomeDef;
    escaped?: Partial<Record<'phone' | 'drink' | 'comfort', OutcomeDef>>;
    adjusted?: OutcomeDef;
    mislabeled?: OutcomeDef;
  };
  /** Floor version options. Left out: the shared list in src/content/floors.json. */
  floor?: FloorOption[];
  /** Floor options offered first, before the regular list. */
  floorExtra?: FloorOption[];
  /** Default true. False when acting here is not the player's daily floor (a promise kept, say). */
  floorCounts?: boolean;
  /** "bed" (default): night falls after. "continue": back to the day. */
  after?: 'bed' | 'continue';
  /** Extra starting pull or resolve, by condition. "card" marks an escape card as stronger here. */
  mods?: { if: Cond; resolve?: number; pull?: number; why: string; card?: string }[];
}

export interface FloorOption {
  if?: Cond;
  label: string;
  text: string[];
  record: string;
  effects?: Effect[];
}

export interface OutcomeDef {
  label: string;
  text: string[];
  record?: string | string[];
  effects?: Effect[];
}

export interface Lines {
  [key: string]: string | string[];
}
