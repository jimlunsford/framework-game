# The Daily Minimum

**Status:** draft, waiting on Jim

- Scene: `daily-minimum` · Stage 2: Build the Structure
- File: `src/content/scenes/daily-minimum.json` · Version: `4eb88437b9`
- Runs when the day starts, if `stage>=2`, `!floorSet`, `seen.morning-line`, `day>=3`. Once per game. Priority 38.
- Art: park@dawn

**Framework:** How to Rebuild Yourself

**Teaches:** the floor and the ceiling

**Notes for Jim**

- Outline, stage 2, main quest step: "Set a floor and a ceiling for one thing. Example: walk 10 minutes as the floor, 40 at the gym as the ceiling. On bad days the floor is what counts." Claude's draft.
- Runs the morning after Morning Line, unless [Deshawn] already gave you a floor.
- Setting it opens Three Days: once a morning line and a floor both exist, any day you keep the morning and do the floor or the ceiling counts as a day of structure.

---

## pick (first step)

Main quest step: The Daily Minimum.

Pick one thing. Give it a floor and a ceiling. The ceiling is what a good day looks like. The floor is what a bad day still gets. On bad days, the floor is what counts.

**Move. Floor: walk 10 minutes. Ceiling: 40 at the gym.**

*Record: Set a floor: walk 10 minutes. Ceiling: 40 minutes at the gym.*

*Sets floorLabel: walk 10 minutes*

*Sets ceilingLabel: 40 minutes at the gym*

*Next: set*

**The house. Floor: 10 minutes on the kitchen. Ceiling: reset the whole place.**

*Record: Set a floor: 10 minutes on the kitchen. Ceiling: reset the whole place.*

*Sets floorLabel: 10 minutes on the kitchen*

*Sets ceilingLabel: reset the whole place*

*Next: set*

## set

Floor: {floor}. Ceiling: {ceiling}.

Main quest step: Three Days. Run it. Any three days. They don't have to be in a row. The game counts returns, not streaks.

*Quest minimum: Floor: {floor}. Ceiling: {ceiling}.*

*Quest three-days, title: Three Days*

*Quest three-days: Run it. Any three days: keep the morning, and do the floor or the ceiling. They don't have to be in a row. 0 so far.*

*Ends the scene.*
