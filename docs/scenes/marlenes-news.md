# Marlene's News

**Status:** draft, waiting on Jim

- Scene: `marlenes-news` · Stage 3: Repeat the Action
- File: `src/content/scenes/marlenes-news.json` · Version: `3879cc223e`
- Runs on arriving at The diner, if `stage=3`, `time<14:00`, `any:seenTucksLate|pantryDone|helpedDana|saturdayKept|count.shiftSkipped>=1|count.onTime>=5`. Once per game.
- Art: diner

**Framework:** The PERIOD Code

**Teaches:** Integrity: private choices show up in public

**Notes for Jim**

- Outline, stage 3, side quest: "The news board mentions you, for better or worse: seen at [Tuck's] at 11, or seen at the pantry Thursday. Private choices showing up in public is the Integrity rule at work." Claude's draft. The board items are in news.json.

---

## board (first step)

*Speaker: [Marlene]*

[Marlene] taps the board by the register with the coffee pot. "You made the news."

"Don't look at me. I just pin up what people tell me."

*Only when `seenTucksLate`:*

One card, in [Gus]'s handwriting, is about you at [Tuck's] at 11 on a weeknight.

*Only when `any:pantryDone|helpedDana|saturdayKept`:*

One card is a thank-you with your name on it. You didn't think anybody saw.

*Quest news, title: Marlene's News*

*Quest news: You made the board. Read it at the register.*

**Read the board.**

→ Small town. Everyone sees everyone. The board just writes it down.

*Ends the scene.*
