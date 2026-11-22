# Dana's car on [Main]

**Status:** draft, waiting on Jim

- Scene: `dana-car` · Monday side scenes
- File: `src/content/scenes/dana-car.json` · Version: `b01274abb8`
- Runs only when something starts it.
- Started by: encounter you-earned-it
- Art: gas@night

**Notes for Jim**

- Follows the Adjusted outcome of Monday's encounter. The Scene Book gives only the setup and the record; this scene is Claude's draft.
- If you've been drinking at the bar, you walk. It's six blocks.
- Helping Dana doesn't raise her trust. Design rule 8: trust returns on her schedule and can't be bought. It does put you on Marlene's board later.
- If her Saturday text is still unanswered, she brings it up in person.

---

## arrive (first step)

Dana is standing by pump four with the hood up and her phone at three percent.

"I didn't know who else was awake," she says. Then: "That's not true. I knew you were awake."

*Only when `today.barDrinks>=1`:*

You leave the truck where it is and walk. It's six blocks. The cold helps.

*Only when `!today.barDrinks>=1`:*

You drive over. [Main] is empty except for the canopy lights.

**Look at the battery.**

→ The terminal is crusted white. You knock it clean with the heel of a wrench from your truck, and it catches on the second try.

→ Dana laughs, mostly from relief.

*Next: after*

## after

"Thanks," she says. "Seriously."

*Only when `danaPending`:*

She looks at you over the hood. "You never answered me. About Saturday."

**"I bailed last time. That's on me. I'll be there."**

*Only if `danaPending`.*

→ "ok," she says, out loud, like a text. "Holding you to that."

*Record: Owned the miss to Dana's face. Promise made: Saturday with Dana.*

*Proof (ownership): Owned the miss with Dana, in person. Promise made: Saturday.*

*Quest saturday: Promise made: Saturday with Dana.*

*Next: home*

**"Work's been insane. I'll try."**

*Only if `danaPending`.*

→ She nods. She's heard it. "Sure."

*Record: Blamed work, in person.*

*Quest saturday: You said you'd try. Saturday is still open.*

*Next: home*

**"Get home safe."**

→ She does. She texts when she's in the driveway: "home."

*Next: home*

## home

It's late when you get back. The house is where you left it.

*Ends the scene.*
