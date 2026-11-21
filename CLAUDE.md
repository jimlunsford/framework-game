# Framework Game

A browser game for Phoenix 2:33 LLC that teaches Jim Lunsford's frameworks through play: The PERIOD Code, How to Rebuild Yourself, The Discipline Loop and Pure Execution Mode. Teaching is the purpose. Nothing gets graded.

This repo holds the solo vertical slice: one starting life (functioning but drifting), one small town, the rebuild spine stages 1 to 3, side quests, encounters, and the Ownership and Purpose skill lines. No multiplayer and no backend yet.

## Where design truth lives

- `docs/decisions.md` is the single source of truth for design: every decision, the design rules, the roadmap. If code and that doc disagree, the doc wins.
- `docs/scene-book.md` holds the locked Monday opening and the outline for stages 2 and 3.
- `docs/books/` holds the source books. Teaching in scenes comes from these books, not from general self-help.

If the docs don't answer something, don't invent a constraint. Make the simplest choice, mark it in code or content with `// JIM:` (or a note in the content file's `notes`), and list it for Jim.

## Design rules

These come from `docs/decisions.md`. Every screen and every system follows them.

1. **No streaks.** The record counts returns, not unbroken runs. No number in the game can "break."
2. **No countdowns or pressure timers.** The play reminder is optional, off by default, and never shows time remaining.
3. **Escape is always available.** Escape cards are always in hand. Their relief is real and their costs arrive later. Each use gives that escape more pull next time.
4. **Honest outcomes, no defeat screen.** Every encounter ends in one of four outcomes: acted, adjusted (only for a real new fact), delayed, or escaped. Nothing is labeled a loss. Night falls either way. A miss opens the restart sequence as the way back.
5. **Growth only from proof.** No levels, no XP, nothing grows from hours played. Rebuild stage, skill lines and traits grow from what the character actually did.
6. **Your days wait; the town keeps living.** The character's time moves only when you play. Town news runs by day whether or not you were there. Missed things show up as news, never as a lost reward.
7. **Nothing is graded.** The record states facts with times. It never scores or judges. No points, ranks, percentages or grades.
8. **Rest is never penalized.** Consequences ask the book's question instead: restoring or hiding?
9. **New facts change the move.** A real new fact can change the plan. A resolved or made-up concern used to delay is a delay, and the game says so.
10. **Other people own their response.** Repair never guarantees forgiveness. Trust comes back on the other person's schedule.
11. **18+ only.** Birthdate plus an "I am 18 or older" checkbox on first launch. Only the fact that the check passed is saved. The birthdate is not.
12. **It is not treatment.** Crisis resources are one tap away (Help).

## The one rule for code

**Code never invents story.** Every word a player reads that belongs to the story lives in a content file under `src/content/`. Code holds rules: the clock, conditions, effects, encounter math, rendering. If a scene needs new words, add them to content. If it needs a new kind of behavior, add a rule to the engine and drive it from content.

Interface text (buttons, labels, help) lives in `src/content/lines.json`, not in code, so it can be edited in one place too.

## Build approach

- Plain TypeScript web app. No game engine, no UI framework.
- Vite is only the build tool (`base: './'` so the build runs from any folder).
- No backend. Saves go to `localStorage` on the player's device (`framework-game-save-v1`; the age check is `framework-game-age-ok`; settings such as the play reminder are `framework-game-settings`).
- The static build in `dist/` runs unchanged on itch.io.
- Phone-first layout. Two columns on screens 900px and wider.
- Art is flat vector SVG drawn in code (`src/art/`), with a limited palette. Mood comes from color and light by time of day.

## Commands

```
npm install
npm run dev            # local dev server
npm run build          # typecheck, then build to dist/
npm run preview        # serve dist/ to check the production build
npm run typecheck
npm run check-content  # validate content references, statuses, conditions and effects
npm run playtest       # build first; plays the whole slice in headless Chromium
```

`npm run playtest` serves `dist/` from a subfolder (like itch.io does), then plays two paths (a "good" path and a "messy" path with escapes, delays, a skipped shift and a restart) on a phone viewport (390x844) and a desktop viewport (1280x800). It fails if a run doesn't reach the end, if any screen shows streak, countdown, score or loss wording, if a page scrolls sideways, or if the save doesn't survive a reload. Screenshots go to `playtest-output/` (ignored by git). Options: `--path=good|messy`, `--viewport=phone|desktop`, `--record=1` to print the record.

### Publishing to itch.io

1. `npm run build`
2. Zip the contents of `dist/` (so `index.html` is at the top of the zip, not inside a folder).
3. On itch.io: kind of project "HTML", upload the zip, check "This file will be played in the browser". A mobile-friendly viewport works best.

## Layout

```
index.html            entry page
src/main.ts           mounts the app
src/styles.css        all styles
src/ui/app.ts         screens, sheets, rendering, input (data-act event delegation)
src/engine/           rules: game.ts (clock, triggers, effects, day end), encounter.ts,
                      conditions.ts, state.ts (save shape), content.ts (loads JSON),
                      time.ts, standard.ts (the standard-line check), types.ts
src/art/              SVG: places.ts (one image per place/room), portrait.ts, map.ts
src/content/          every word of story and interface text (see below)
scripts/              check-content.mjs, playtest.mjs
docs/                 decisions, Scene Book, source books
```

## Content files

All content is JSON (the examples below carry `//` comments for explanation only; real files can't). One file per scene in `src/content/scenes/`, one file per encounter in `src/content/encounters/`. The engine loads every `.json` in those folders, so adding a file adds a scene. The shapes are typed in `src/engine/types.ts`.

### Status

Every scene and encounter has a `status`:

- `"locked"`: approved Scene Book text. Don't change its words.
- `"draft, waiting on Jim"`: Claude's draft. Jim edits, then locks.

Open questions answered with a best guess are marked `Claude's guess` in the file's `notes`. `notes` are for Jim and never shown in game.

### Writing style for scenes

Second person, present tense, short sentences. Choices are short lines the UI shows with an arrow. Record lines are plain facts with times. Keep bracketed names like `[Marlene]` as they are until Jim names them. Use placeholders where the player's own words or the clock belong: `{name}`, `{time}`, `{day}`, `{standard}`, `{purpose}`, `{floor}`, `{ceiling}`, `{morningLine}`, the pronouns `{they}` / `{them}` / `{their}`, `{count.x}` and `{flag.x}`.

### Scenes

```json
{
  "id": "cans-by-the-sink",               // must match the file name
  "title": "The Cans by the Sink",
  "status": "draft, waiting on Jim",
  "notes": ["For Jim. Not shown in game."],
  "trigger": { "at": "enter", "place": "home", "room": "kitchen", "if": ["cans>0"], "priority": 5 },
  "art": "kitchen",                       // a place art id, or "bedroom@predawn" to force the light
  "tag": { "framework": "How to Rebuild Yourself", "item": "The floor version" },
  "start": "see",
  "nodes": {
    "see": {
      "text": ["Paragraphs."],
      "textIf": [{ "if": ["cans>2"], "text": ["Shown only when the condition holds."] }],
      "effects": ["set:x", { "quest": "cans", "title": "…", "kind": "side", "objective": "…" }],
      "record": "A fact with a {time}.",
      "choices": [
        { "label": "Do it", "if": ["!today.cansDone"], "result": ["What happens."], "record": "…", "effects": [], "next": "after" },
        { "label": "Check the phone", "note": "Escape: the phone", "escape": true, "next": null }
      ],
      "next": "after",                    // used when there are no choices
      "nextIf": [{ "if": ["seen.dana-text"], "next": "other" }],
      "input": "standard"                 // special nodes: standard, purpose-own, review-week
    }
  }
}
```

Triggers (`trigger` or a list in `triggers`, any one can start the scene):

- `wake`: when the day starts. `bedtime`: when night falls, before sleep.
- `enter`: when the player arrives at `place` (and `room`). The place must be open.
- `time`: when the clock reaches `time` ("21:40").
- `manual`: only started by an action or a `scene:` effect.
- `once` (default true) runs once per game; `daily: true` runs at most once a day. Higher `priority` wins.

### Conditions

A condition is a list of atoms, all of which must hold. See the header of `src/engine/conditions.ts`.

- `flag`, `!flag`, `key=value`, `key!=value`, `key>=3` (also `<=`, `>`, `<`). Times can be written `time>=21:40`.
- `any:a|b|c` is true if any one atom is.
- Keys: `day`, `weekday` (mon…sun), `time`, `place`, `room`, `stage`, `s3day` (day number within stage 3), `workday`, `open` (current place is open), `today.X` (resets each morning), `count.X` (counts that only go up), `pull.X` (phone, drink, comfort, top), `card.X`, `seen.X`, `seenToday.X`, `quest.X` (active, closed, none), `trait.X`, `line.ownership`, `line.purpose`, `purpose`, `pattern` (phone, drink, comfort or none). Anything else reads a flag.

### Effects

Strings of the form `verb:arg`, or objects:

| Effect | Does |
| :-- | :-- |
| `set:x`, `set:x=3`, `set:x=text` | set a flag (`today.x` resets each morning, `tomorrow.x` becomes `today.x` next morning) |
| `unset:x` | clear a flag |
| `add:count.x=1` | add to a number |
| `time:+40`, `time:=21:40` | move the clock forward |
| `card:id`, `uncard:id` | give or take an action card |
| `proof:ownership:text`, `proof:purpose:text` | add proof to a skill line |
| `line:ownership` | open a skill line |
| `go:place`, `go:place:room`, `room:id` | move the player |
| `scene:id` | queue a scene to run next |
| `encounter:id` | start an encounter |
| `restart:reason` | the next morning opens with the restart sequence |
| `bed` | night falls after this |
| `stage:2`, `stage:3:next` | set the rebuild stage (now or from tomorrow) |
| `record:text`, `notice:text` | write a record line, or show a short notice |
| `trait:Name` | a trait forms |
| `purpose:id:text` | set the player's purpose |
| `trust:+1` | Dana's trust (never shown as a number) |
| `end` | the slice ends after this |
| `{ "quest": "id", "title", "kind": "main/daily/side", "status": "active/closed", "objective" }` | open or update a quest |
| `{ "if": [...], "then": [...], "else": [...] }` | effects that apply only when a condition holds |

### Encounters

`src/content/encounters/*.json`. The old voice's lines, push back per card, the player's answers, the outcomes, and any mods (`{ "if", "resolve", "pull", "why", "card" }`) that change the starting numbers. The math lives in `src/engine/encounter.ts`. Fields are documented on `EncounterDef` in `types.ts`. Outcomes an encounter leaves out come from `src/content/outcomes.json`. Floor version options it leaves out come from `src/content/floors.json`.

### Other content files

- `places.json`: the 8 places, map position, hours, descriptions by time of day, rooms at home.
- `people.json`: who is where, when, and what they say.
- `actions.json`: what the player can do at each place (`"*"` means anywhere).
- `cards.json`: escape, action, delay and new-fact cards.
- `floors.json`, `outcomes.json`: shared floor options and encounter outcomes.
- `news.json`: the diner's news board (town news by day, news about you by condition).
- `creator.json`: character creator options and starting lives.
- `lines.json`: interface text.

After changing content, run `npm run check-content`, then `npm run build && npm run playtest` for anything that changes the flow.

## Conventions

- `// JIM:` marks a choice the docs didn't settle. Keep it until Jim decides.
- Don't add a number to the screen that could read as a score, a streak or a countdown. Counts of facts (days, returns) are fine; the playtest's wording scan will catch the rest.
- Don't put story text in TypeScript.
- Don't change the words of a `locked` scene.
