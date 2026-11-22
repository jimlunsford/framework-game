# Opening: Monday. Dana's text (side quest: Saturday)

**Status:** locked

- Scene: `dana-text` · Locked: the Monday opening
- File: `src/content/scenes/dana-text.json` · Version: `5682e8b3af`
- Runs on arriving at Home (kitchen), if `day=1`. Once per game. Priority 10.
- Runs when the clock reaches 12:00 p.m., if `day=1`. Once per game.
- Started by: scene monday-morning; scene restart; action "Answer Dana"; action "Check the phone"
- Art: kitchen

**Notes for Jim**

- Scene Book, Opening: Monday, section 4. Approved by Jim, Nov 21, 2026. The words are the Scene Book's.
- It buzzes in the first time you check the phone or walk into the kitchen. JIM: if neither happens, it arrives at noon so the player still gets it. The Scene Book doesn't say what happens if you never do either.
- "Not yet." only shows when you come back to an unanswered text. It's Claude's two words, so you can close the text again without re-recording "Didn't answer Dana."
- The record keeps the time you answered: every record line carries its clock time.

---

## msg (first step)

*Speaker: Dana, your friend*

*Shown as a text message.*

Still on for Saturday? Be honest if you're not. You bailed last time.

*Quest saturday, title, when `!quest.saturday=active`: Saturday*

*Quest saturday, when `!quest.saturday=active`: Dana: "Still on for Saturday?" You can answer now, later or never.*

**"Work's been insane. I'll try."**

→ It works. A thumbs up. Nothing gets harder today. Nothing gets better either.

*Record: Blamed work.*

*Quest saturday: You said you'd try. Saturday is still open.*

*Ends the scene.*

**"I bailed. That's on me. I'll be there."**

→ "ok. holding you to that." A promise you can keep or break.

*Record: Owned the miss. Promise made: Saturday with Dana.*

*Proof (ownership): Owned the miss with Dana. Promise made: Saturday.*

*Quest saturday: Promise made: Saturday with Dana.*

*Ends the scene.*

**Leave it on read.**

*Only if `!danaPending`.*

→ It sits in the quest log. It's still there at lunch, and at five.

*Record: Didn't answer Dana.*

*Quest saturday: Dana asked about Saturday. Not answered.*

*Ends the scene.*

**Not yet.**

*Only if `danaPending`.*

*Ends the scene.*
