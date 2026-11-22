# Opening: Monday. The first standard

**Status:** locked

- Scene: `first-standard` · Locked: the Monday opening
- File: `src/content/scenes/first-standard.json` · Version: `c9fcac0657`
- Runs when night falls, before sleep, if `!standard`. Once per game. Priority 10.
- Art: bedroom@night

**Framework:** How to Rebuild Yourself

**Teaches:** stage 1: Raise the standard

**Notes for Jim**

- Scene Book, Opening: Monday, section 7. Approved by Jim, Nov 21, 2026. The words are the Scene Book's.
- The two refusals ("Do better." and "Never touch my phone again.") are the Scene Book's. The check that decides when to show them is Claude's guess, in src/engine/standard.ts (JIM).
- Starters show when today gave a reason for them: the phone line if the phone was part of the day, the Dana line always (she texted today), the on-site line if you were late or missed the shift.
- "Wrote a line" record is Claude's, so the standard shows on the record.

---

## ask (first step)

Before you sleep, one question. Not from anyone else. From you.

"What's one line you won't cross anymore?"

*The player writes their standard here.*

- Starter, when `any:today.phoneMorning|today.phoneInKitchen|today.lastOutcome=escaped|pull.phone>=1`: The phone sleeps in the kitchen.
- Starter: I answer Dana the same day.
- Starter, when `any:today.late|!today.shiftDone`: I'm on site by 7.

*Next: written*

## written

**Framework:** How to Rebuild Yourself

**Teaches:** stage 1: Raise the standard

Written. You can break this. That's what makes it real.

*Record: Wrote a line: "{standard}"*

*Quest main: Written: "{standard}"*

*Next: close*

## close

That's Monday. The town keeps going. Pick it up when you're ready.

*Ends the scene.*
