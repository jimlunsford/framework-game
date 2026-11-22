# Dana's text: Friday

**Status:** draft, waiting on Jim

- Scene: `dana-fri` · Stage 2: Build the Structure
- File: `src/content/scenes/dana-fri.json` · Version: `4e8f934d53`
- Runs when the clock reaches 12:30 p.m., if `weekday=fri`, `danaPromised`, `!danaStopped`, `!saturdayKept`, `!danaPending`. Once per game.
- Started by: scene restart; action "Answer Dana"

**Notes for Jim**

- Outline cast: "If you bail again, she says 'ok' and stops asking, and her trust comes back on her schedule, not yours." Claude's draft.

---

## msg (first step)

*Speaker: Dana*

*Shown as a text message.*

tomorrow. 9. you're still coming?

**"I'll be there."**

→ "ok."

*Record: Answered Dana. Still on for Saturday.*

*Proof (purpose), when `today.danaAsked`, when `purpose=dana`: Answered Dana the same day.*

*Ends the scene.*

**"Actually, I can't make it."**

→ "ok."

→ That's all. She doesn't ask why. She doesn't ask again.

*Record: Bailed on Saturday with Dana.*

*Quest saturday: You bailed. She said ok.*

*Ends the scene.*

**Later.**

*Only if `!danaPending`.*

*Quest saturday: Dana asked if you're still coming. Not answered yet.*

*Ends the scene.*

**Not yet.**

*Only if `danaPending`.*

*Ends the scene.*
