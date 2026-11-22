# Morning Line

**Status:** draft, waiting on Jim

- Scene: `morning-line` · Stage 2: Build the Structure
- File: `src/content/scenes/morning-line.json` · Version: `281c1333c6`
- Runs when the day starts, if `stage>=2`, `!morningSet`, `!overbuilt`. Once per game. Priority 40.
- Art: kitchen@dawn

**Framework:** How to Rebuild Yourself

**Teaches:** stage 2: Build the structure

**Notes for Jim**

- Outline, stage 2, main quest step: "Pick your morning structure: where the alarm sits, where the phone sleeps, coffee or not. An overbuilt option is on the menu: 5 a.m. gym, cold shower, journaling, meal prep. It looks great on day one and collapses by day two. When it does, the restart sequence opens." Claude's draft.
- Choosing the phone in the kitchen earns the Phone in the kitchen card (outline: earned in Morning Line).
- Your choices apply from tomorrow morning.

---

## phone (first step)

Main quest step: Morning Line.

Tomorrow morning starts tonight. Three small decisions, made once, so you don't have to make them at 6:30 with the phone lit a foot from your head.

First: where does the phone sleep?

**In the kitchen. An old alarm clock goes by the bed.**

*Sets mPhone: Phone sleeps in the kitchen.*

*Next: alarm*

**On the nightstand, face down.**

*Sets mPhone: Phone face down on the nightstand.*

*Next: alarm*

## alarm

Where does the alarm sit?

**Across the room. You have to stand up to stop it.**

*Sets mAlarm: Alarm across the room.*

*Next: coffee*

**Where it's always been.**

*Next: coffee*

## coffee

Coffee or not?

**Coffee first, then out the door.**

*Sets mCoffee: Coffee, then out the door.*

*Next: size*

**No coffee. Straight out.**

*Sets mCoffee: Straight out the door.*

*Next: size*

## size

{flag.mPhone} {flag.mAlarm} {flag.mCoffee}

That's it. It fits in one breath.

Or. There's the other version, the one that looks great on paper: 5 a.m. gym, cold shower, journaling, meal prep. Do it right. All of it.

**Keep it that small.**

→ Small enough to do on a bad morning. That's the point.

*Record: Set a morning line.*

*Sets morningLabel: {flag.mPhone} {flag.mAlarm} {flag.mCoffee}*

*Quest morning-line: Set: {morningLine}*

*Ends the scene.*

**Do it right. 5 a.m. gym, cold shower, journaling, meal prep.**

→ It looks great. You can already see yourself doing it.

*Record: Set a morning line: 5 a.m. gym, cold shower, journaling, meal prep.*

*Sets morningLabel: 5 a.m. gym, cold shower, journaling, meal prep.*

*Quest morning-line: Set: the full program, starting tomorrow at 5:00 a.m.*

*Ends the scene.*
