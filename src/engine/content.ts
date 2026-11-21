// Loads every content file at build time. Vite bundles them into the static build,
// so the game needs no server and runs the same on itch.io.
import type { Action, CardDef, EncounterDef, FloorOption, Lines, OutcomeDef, Person, Place, Scene } from './types';
import placesJson from '../content/places.json';
import peopleJson from '../content/people.json';
import actionsJson from '../content/actions.json';
import cardsJson from '../content/cards.json';
import linesJson from '../content/lines.json';
import newsJson from '../content/news.json';
import creatorJson from '../content/creator.json';
import floorsJson from '../content/floors.json';
import outcomesJson from '../content/outcomes.json';

const sceneModules = import.meta.glob('../content/scenes/*.json', { eager: true, import: 'default' });
const encounterModules = import.meta.glob('../content/encounters/*.json', { eager: true, import: 'default' });

export const scenes: Record<string, Scene> = {};
for (const [path, mod] of Object.entries(sceneModules)) {
  const list = (Array.isArray(mod) ? mod : [mod]) as Scene[];
  for (const sc of list) {
    if (scenes[sc.id]) throw new Error(`Duplicate scene id ${sc.id} in ${path}`);
    scenes[sc.id] = { ...sc, file: path.replace('../', 'src/') } as Scene & { file: string };
  }
}

export const encounters: Record<string, EncounterDef> = {};
for (const [path, mod] of Object.entries(encounterModules)) {
  const e = mod as EncounterDef;
  if (encounters[e.id]) throw new Error(`Duplicate encounter id ${e.id} in ${path}`);
  encounters[e.id] = e;
}

export const places = (placesJson as unknown as { places: Place[] }).places;
export const placeById = Object.fromEntries(places.map((p) => [p.id, p])) as Record<string, Place>;
export const people = (peopleJson as unknown as { people: Person[] }).people;
export const actions = (actionsJson as unknown as { actions: Action[] }).actions;
export const cards = Object.fromEntries((cardsJson as unknown as { cards: CardDef[] }).cards.map((c) => [c.id, c])) as Record<string, CardDef>;
export const lines = linesJson as unknown as Lines;
/** The floor version options every encounter offers unless it lists its own. */
export const floors = (floorsJson as unknown as { floor: FloorOption[] }).floor;
/** Default outcomes, used where an encounter doesn't write its own. */
export const defaultOutcomes = outcomesJson as unknown as {
  acted: OutcomeDef;
  delayed: OutcomeDef;
  escaped: Record<'phone' | 'drink' | 'comfort', OutcomeDef>;
  adjusted: OutcomeDef;
  mislabeled: OutcomeDef;
};
export const news = newsJson as unknown as {
  town: { day: number; text: string }[];
  you: { if: string[]; text: string }[];
};
export const creator = creatorJson as unknown as {
  status: string;
  title: string;
  intro: string[];
  closingLine: string;
  pronouns: { id: 'he' | 'she' | 'they'; label: string }[];
  starts: { id: string; label: string; text: string; available: boolean; later?: string }[];
  look: { skin: string[]; hair: string[]; hairColor: string[]; build: string[]; clothes: string[] };
};

/** Read a line from lines.json. Arrays come back joined with spaces unless asked for raw. */
export function line(key: string): string {
  const v = lines[key];
  if (v === undefined) return `[missing line: ${key}]`;
  return Array.isArray(v) ? v.join(' ') : v;
}

export function lineList(key: string): string[] {
  const v = lines[key];
  if (v === undefined) return [`[missing line: ${key}]`];
  return Array.isArray(v) ? v : [v];
}
