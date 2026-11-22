# The Kitchen Counter

**Status:** draft, waiting on Jim

- Scene: `kitchen-counter` · Stage 2: Build the Structure
- File: `src/content/scenes/kitchen-counter.json` · Version: `9b850bc55c`
- Runs on arriving at Home (kitchen), if `stage>=2`, `time>=15:00`. Once per game. Priority 8.
- Art: kitchen

**Framework:** How to Rebuild Yourself

**Teaches:** stage 2: Build the structure

**Notes for Jim**

- Outline, stage 2, main quest step: "Your environment. The cans by the sink. What's in the fridge. Taking the beer out of the house is an option, and it earns the Remove the access card. This is where The Disciplined Operator's idea first shows up, without being named." Claude's draft. The idea is never named here, on purpose.
- Runs the first time you walk into the kitchen after work in stage 2.

---

## look (first step)

Main quest step: The Kitchen Counter.

You stand in the kitchen and actually look at it, which you never do.

*Only when `cans>=3`:*

Four cans by the sink now.

*Only when `cans>0`, `cans<3`:*

The cans by the sink.

*Next: counter*

## counter

The fridge: half a case of beer, ketchup, eggs of uncertain age.

None of this decides anything. But all of it is either in the way or out of it. Tomorrow walks through this room before you do.

**Take the beer out of the house.**

*Only if `!beerGone`.*

→ You pour it down the sink, can by can. It takes longer than you'd think. The fridge looks emptier and somehow cleaner.

*Record: Took the beer out of the house.*

*Next: counter*

**Clear the counter. Cans out, dishes done.**

*Only if `!today.cansDone`.*

→ Twenty minutes. The counter is a counter again.

*Record: Cleared the counter at {time}.*

*Quest cans, when `quest.cans=active`: Done.*

*Next: counter*

**Put something real in the fridge.**

*Only if `!today.groceries`.*

→ You make a list on the back of an envelope. Eggs that aren't a question. Something green. It's on the counter for tomorrow.

*Next: counter*

**That's enough for now.**

*Only if `today.counterDid`.*

*Quest counter: Done. The kitchen is set up for tomorrow.*

*Ends the scene.*

**Leave it. It's just a kitchen.**

*Only if `!today.counterDid`.*

*Record: Left the kitchen as it was.*

*Quest counter: You looked, and left it as it was.*

*Ends the scene.*
