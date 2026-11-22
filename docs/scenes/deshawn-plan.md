# Deshawn's Plan

**Status:** draft, waiting on Jim

- Scene: `deshawn-plan` · Stage 2: Build the Structure
- File: `src/content/scenes/deshawn-plan.json` · Version: `2a5df64d40`
- Runs on arriving at The gym, if `stage>=2`, `any:time<9:00|time>=16:00`. Once per game.
- Art: gym

**Framework:** The Discipline Loop

**Teaches:** break point: overbuilding the plan

**Notes for Jim**

- Outline, stage 2, side quest: "He offers the six-day program. Taking it is the overbuilding trap. Asking for the floor version earns his respect and a real routine." Claude's draft.
- Asking for the smallest version sets your Daily Minimum if you don't have one yet.

---

## desk (first step)

*Speaker: [Deshawn]*

[Deshawn] looks up from the front desk. Former athlete; it's still in how he stands.

"You're the one who comes in once a month and leaves in twenty minutes." He slides a sheet across the counter. Six days a week. Ninety minutes a day. A meal plan with grams on it.

"Or," he says, "you tell me what you'll actually do."

*Quest deshawn, title: Deshawn's Plan*

*Quest deshawn: [Deshawn] has a program for you.*

**"Give me the full six days."**

→ He shrugs like he's seen this movie. "5 a.m. tomorrow, then."

*Record: Took [Deshawn]'s six-day program.*

*Sets morningLabel: 5 a.m. gym, the six-day program.*

*Quest deshawn: The six-day program. Starts tomorrow, 5 a.m.*

*Ends the scene.*

**"What's the smallest version that still counts?"**

→ He looks at you for a second longer than he did before.

→ "Ten minutes. Three moves. Every day you can, and on the days you can't, the same ten minutes." He tears the sheet in half and writes three lines on the back. "Most people ask for the big one. The big one is how I lose them."

*Record: Asked [Deshawn] for the smallest version.*

*Quest deshawn: Ten minutes, three moves. He respects that you asked.*

*Sets floorLabel, when `!floorSet`: [Deshawn]'s ten minutes*

*Sets ceilingLabel, when `!floorSet`: his full session, 40 minutes*

*Quest minimum, when `!floorSet`: Floor: [Deshawn]'s ten minutes. Ceiling: his full session.*

*Quest three-days, title, when `!floorSet`: Three Days*

*Quest three-days, when `!floorSet`: Run it. Any three days: keep the morning, and do the floor or the ceiling. They don't have to be in a row. 0 so far.*

*Ends the scene.*

**"Just looking."**

→ "Door's open till nine."

*Quest deshawn: The offer stands. Door's open till nine.*

*Ends the scene.*
