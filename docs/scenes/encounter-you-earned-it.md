# You earned it

**Status:** locked

- Encounter: `you-earned-it` · Locked: the Monday opening
- File: `src/content/encounters/you-earned-it.json` · Version: `4131f35540`
- Setting: night: the couch at home, the bar if you are there, otherwise the truck
- After it: night falls.
- Started by: scene night-monday

**Framework:** The Discipline Loop

**Teaches:** waiting for readiness

**Notes for Jim**

- Scene Book, Opening: Monday, section 6. Approved by Jim, Nov 21, 2026. The opening line, the pushbacks, the answer, the third-round line and the outcome records for acting, delaying, scrolling and adjusting are the Scene Book's.
- Where it happens follows the Scene Book: the couch at home by default, the bar if you're still there, the truck in a parking lot if you're out. The three one-line setting notes are taken from that sentence.
- Claude's additions, waiting on Jim: the voice's reason when you play What am I waiting for? ("Because it's late. Because you're tired. Because."), its pushback on Phone in the kitchen, the records for the beer and order-in escapes (in outcomes.json), and the record line "Dana called at 9:45. Didn't go to her." when you leave her call unanswered.
- JIM: Dana's call always comes on the second round. The Scene Book says only "if a real new fact shows up"; it doesn't say how often. A player who ends the encounter in one move never gets the call.
- JIM: the round-two voice line is left quiet, so the third round's "Start Monday. Fresh week." lands as the Scene Book places it.

---

## Before it starts

*Only when `place=home`:*

9:40 p.m. On the couch at home.

*Only when `place=bar`:*

9:40 p.m. At the bar.

*Only when `!place=home`, `!place=bar`:*

9:40 p.m. In the truck in a parking lot.

## The old voice opens

Long day. You earned this. Start tomorrow.

## Later rounds

- Round 2: (quiet)
- Round 3: Start Monday. Fresh week.

## Push back

- Against Name it: It's not hiding. It's one night.
- Against The floor version: Ten minutes won't change anything.
- Against What am I waiting for?: Because it's late. Because you're tired. Because.
- Against Phone in the kitchen: What if somebody needs you?
- Your answer to The floor version: It won't change everything. It's ten minutes I didn't skip.

## A new fact

*Arrives on round 2, if `day=1`, at 9:45 p.m. Adds the card: Go to Dana.*

9:45 p.m. Your phone rings. Dana. Her car died at the gas station on [Main].

## Outcomes

### Acted

*Label: Acted*

You did the floor version.

Resolve carries into tomorrow.

*Also on the record, when `today.factOpen`: Dana called at 9:45. Didn't go to her.*

### Delayed

*Label: Delayed*

"Tomorrow," with no new reason.

*Record: Put it off to tomorrow. Nothing changed.*

*Also on the record, when `today.factOpen`: Dana called at 9:45. Didn't go to her.*

### Escaped: the phone

*Label: Escaped*

You played an escape card. The game tells the truth: it felt good.

Then the cost lands overnight and in the morning, and tomorrow opens with the restart sequence. It's a way back, not a punishment.

*Record: 11:40 p.m. Still scrolling.*

*Also on the record, when `today.factOpen`: Dana called at 9:45. Didn't go to her.*

### Escaped: drinking

*Label: Escaped*

You played an escape card. The game tells the truth: it felt good.

Then the cost lands overnight and in the morning, and tomorrow opens with the restart sequence. It's a way back, not a punishment.

*Also on the record, when `place=bar`: {time}. Still at [Tuck's].*

*Also on the record, when not `place=bar`: {time}. Two cans by the sink became four.*

*Also on the record, when `today.factOpen`: Dana called at 9:45. Didn't go to her.*

### Escaped: comfort

*Label: Escaped*

You played an escape card. The game tells the truth: it felt good.

Then the cost lands overnight and in the morning, and tomorrow opens with the restart sequence. It's a way back, not a punishment.

*Also on the record: {time}. Ordered in. Zoned out.*

*Also on the record, when `today.factOpen`: Dana called at 9:45. Didn't go to her.*

### Adjusted

*Label: Adjusted*

Going to her is a real change of plan, and it puts you on the map at night.

*Record: Changed the plan. Helped Dana. The facts changed.*
