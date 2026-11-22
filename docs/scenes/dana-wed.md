# Dana's text: Wednesday

**Status:** draft, waiting on Jim

- Scene: `dana-wed` · Stage 2: Build the Structure
- File: `src/content/scenes/dana-wed.json` · Version: `780a458328`
- Runs when the clock reaches 12:30 p.m., if `weekday=wed`, `stage>=2`, `any:danaPromised|danaAnswered=work`, `!danaStopped`, `!danaPending`. Once per game.
- Started by: scene restart; action "Answer Dana"

**Notes for Jim**

- Outline cast: Dana won't chase you. If you left Monday's text on read, she doesn't text again. Claude's draft.
- If you blamed work on Monday, this is a second chance to make Saturday real. Claude's guess on Saturday's details: breakfast at 9 at the diner.

---

## msg (first step)

*Speaker: Dana*

*Shown as a text message.*

*Only when `danaPromised`:*

saturday still good? 9 at the diner. no pressure

ok some pressure

*Only when `!danaPromised`:*

how's insane work

**"Still good. 9."**

*Only if `danaPromised`.*

→ "9. don't make me eat alone."

*Record: Answered Dana.*

*Proof (purpose), when `today.danaAsked`, when `purpose=dana`: Answered Dana the same day.*

*Quest saturday: Promise made: Saturday with Dana. 9 a.m. at the diner.*

*Ends the scene.*

**"Better. Is Saturday still open?"**

*Only if `!danaPromised`.*

→ A long pause. Then: "9 at the diner. i'm not saving you a seat twice."

*Record: Answered Dana. Promise made: Saturday with Dana.*

*Quest saturday: Promise made: Saturday with Dana. 9 a.m. at the diner.*

*Ends the scene.*

**"Still insane."**

*Only if `!danaPromised`.*

→ "k"

*Record: Answered Dana.*

*Ends the scene.*

**Later.**

*Only if `!danaPending`.*

→ It stays at the top of your messages, then it doesn't.

*Quest saturday: Dana texted at 12:30. Not answered yet.*

*Ends the scene.*

**Not yet.**

*Only if `danaPending`.*

*Ends the scene.*
