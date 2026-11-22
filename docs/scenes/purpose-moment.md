# The Purpose moment

**Status:** draft, waiting on Jim

- Scene: `purpose-moment` · Stage 2: Build the Structure
- File: `src/content/scenes/purpose-moment.json` · Version: `1a53f0b169`
- Runs when night falls, before sleep, if `stage=2`, `count.structureDays>=3`. Once per game. Priority 10.
- Art: bedroom@night

**Framework:** The PERIOD Code

**Teaches:** Purpose

**Notes for Jim**

- Outline, end of stage 2: "What purpose must guide me now?" The choices come from what you did. This opens the Purpose skill line and earns Remember why.
- Claude's guess on the open question: four choices, each shown only if your record has something behind it (Dana answered or Saturday kept; walks, the gym or [Deshawn]'s ten minutes; on time at work; the pantry or Dana's car), plus your own words, always. If nothing on the record points anywhere yet, a plain fallback shows instead.
- A purpose is for this season. Phase 2 can let the player change it later.

---

## ask (first step)

One more question before you sleep. This one is bigger than a line.

"What purpose must guide me now?"

**Being someone Dana can count on.**

*Only if `any:saturdayKept|count.danaSameDay>=2|danaPromised`.*

*Purpose (dana): Being someone Dana can count on.*

*Next: chosen*

**Getting my body back.**

*Only if `any:count.gymDays>=1|count.walks>=2|floorKind=deshawn|floorKind=walk`.*

*Purpose (body): Getting my body back.*

*Next: chosen*

**Being worth trusting at work.**

*Only if `count.onTime>=2`.*

*Purpose (work): Being worth trusting at work.*

*Next: chosen*

**Being useful to people who need it.**

*Only if `any:pantryDone|helpedDana`.*

*Purpose (useful): Being useful to people who need it.*

*Next: chosen*

**Showing up for my own life.**

*Only if `!any:saturdayKept|count.danaSameDay>=2|danaPromised|count.gymDays>=1|count.walks>=2|floorKind=deshawn|floorKind=walk|count.onTime>=2|pantryDone|helpedDana`.*

*Purpose (life): Showing up for my own life.*

*Next: chosen*

**In my own words.**

*Next: own*

## chosen

**Framework:** The PERIOD Code

**Teaches:** Purpose

{purpose}

It's for this season. It shows you what a moment of relief would cost against it.

*Record: Chose a purpose: {purpose}*

*Proof (purpose): Chose a purpose: {purpose}*

*Ends the scene.*

## own

"What purpose must guide me now?" Say it your way.

*The player writes their purpose in their own words here.*

*Next: chosen*
