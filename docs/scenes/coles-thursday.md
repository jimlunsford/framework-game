# Cole's Thursday

**Status:** draft, waiting on Jim

- Scene: `coles-thursday` · Stage 2: Build the Structure
- File: `src/content/scenes/coles-thursday.json` · Version: `9f0d6678b3`
- Runs on arriving at The job site, if `stage>=2`, `weekday=thu`, `today.shiftDone`. Once per game.
- Art: jobsite@evening

**Notes for Jim**

- Outline, stage 2, side quest: "Cole invites you to [Tuck's] after the shift. Going isn't wrong. The test is which card you play once you're there." Claude's draft.
- Claude's guess on the open question: Cole stays a coworker who drinks. He's funny, generous, and drifting the same way you are. He isn't the problem.
- Going starts the encounter at the bar, against the negotiating voice: "Just this once. You've been good."

---

## ask (first step)

*Speaker: [Cole]*

[Cole] catches you at the truck, hard hat under his arm. "[Tuck's]. You, me, a couple guys from the crew. First round's mine."

He means it. He always means it. That's the nice thing about [Cole].

*Quest cole, title: Cole's Thursday*

*Quest cole: [Cole] asked you to [Tuck's].*

**"I'm in."**

→ "There it is." He slaps the roof of your truck like it agreed too.

*Record: Went to [Tuck's] with [Cole].*

*Quest cole: At [Tuck's] with the crew.*

*Ends the scene.*

**"Can't tonight. Pantry."**

*Only if `any:pantryYes|quest.shelves=active`.*

→ "Look at you." He doesn't make fun of it. "Next week, then."

*Record: Told [Cole] no. Pantry night.*

*Quest cole: You said no. He said next week.*

*Ends the scene.*

**"Not tonight."**

→ "Suit yourself. Friday, then." He's already texting somebody else.

*Record: Told [Cole] no.*

*Quest cole: You said no. He said Friday.*

*Ends the scene.*
