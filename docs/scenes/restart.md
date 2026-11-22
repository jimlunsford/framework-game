# The restart sequence

**Status:** draft, waiting on Jim

- Scene: `restart` · Scenes any day can bring
- File: `src/content/scenes/restart.json` · Version: `4d516cd79c`
- Runs when the day starts, if `pendingRestart`. At most once a day. Priority 60.
- Started by: scene overbuilt-collapse
- Art: kitchen@dawn

**Framework:** The Discipline Loop

**Teaches:** the restart sequence

**Notes for Jim**

- The Discipline Loop: after any miss, the restart sequence runs: tell the truth, find the break, take the next aligned action, rebuild the minimum, remove the opening, get support if needed. Hiding the miss skips the sequence and the miss grows.
- Runs the morning after a miss (an escape, a skipped shift, a day the structure didn't hold, a broken promise), or right away when an overbuilt plan collapses.
- Each completed restart counts as a return. Returns count, never streaks. Each one is Ownership proof.
- After two returns, the sequence has formed, so it collapses into one tap ("Run the restart"), like "Run my morning."
- Hiding it keeps the restart waiting for tomorrow and adds a little Pull to the next encounter. JIM: "the miss grows" is Claude's simplest reading.

---

## truth (first step)

The restart sequence. One: tell the truth.

*Only when `restartReason=escaped`:*

Last night you played an escape card. The record has the time.

*Only when `restartReason=shift`:*

Yesterday's shift happened without you.

*Only when `restartReason=morning`:*

Yesterday the morning didn't go the way you set it.

*Only when `restartReason=floor`:*

Yesterday the floor didn't happen. Not even ten minutes.

*Only when `restartReason=overbuilt`:*

The full program lasted one day. It was built for a person who doesn't exist yet.

*Only when `restartReason=saturday`:*

You didn't go Saturday.

*Only when `restartReason=miss`:*

Something you said you'd do didn't happen.

*Only when `missWeight>=1`:*

It's the same miss from before. You didn't look at it then either.

**Run the restart.**

(You know this one now: truth, break, next move, floor, opening, support.)

*Only if `count.returns>=2`.*

*Next: done*

**Say it plain.**

→ No story around it. Just what happened, and that it was yours.

*Record: Told the truth about the miss.*

*Next: break*

**Don't look at it.**

→ You skip it. The miss doesn't go anywhere. It gets a little bigger.

*Record: Didn't look at the miss.*

*Ends the scene.*

## done

That's the restart. It's a way back, not a punishment.

Returns so far: {count.returns}. The record counts returns, not streaks.

*Proof (ownership): Came back after a miss. Ran the restart.*

*Also on the record, when `today.restartFast`: Ran the restart sequence.*

*Also on the record, when `!today.restartFast`: Finished the restart sequence.*

*Ends the scene.*

## break

Two: find the break. Where did it come apart?

*Only when `restartReason=overbuilt`:*

The record points at it: you built too much.

*Only when `restartReason=escaped`, `today.tired`:*

The record points at the hour it happened, and what was in your hand.

*Only when `any:restartReason=floor|restartReason=morning`:*

The record points at a day with no small version in it.

**I was waiting to feel ready.**

*Record: The break: waiting to feel ready.*

*Next: move*

**I built too much to keep.**

*Record: The break: built too much.*

*Next: move*

**There was no small version, so I did nothing.**

*Record: The break: no daily minimum.*

*Next: move*

**I made a deal with the line.**

*Record: The break: negotiated with the standard.*

*Next: move*

**Everything felt like it was falling apart.**

*Record: The break: chaos.*

*Next: move*

## move

Three: the next aligned action. One move, the smallest real one, now.

**Text Dana back.**

*Only if `danaPending`.*

*Record: Next move: answered Dana.*

*Next: dana*

**Get to the job site by 7.**

*Only if `workday`, `!today.noShift`.*

*Record: Next move: on site by 7.*

*Next: floor*

**Put the phone in the kitchen. Now.**

*Record: Next move: phone in the kitchen.*

*Next: floor*

**Make the coffee. Drink it standing up.**

*Record: Next move: coffee, standing up.*

*Next: floor*

## dana

You open the text. It's still there.

*Next: floor*

## floor

Four: rebuild the minimum.

*Only when `floorSet`:*

Your floor is {floor}. On a day like this, the floor is what counts.

*Only when `!floorSet`:*

Pick something small enough to do on a bad day. Ten minutes of anything real.

*Only when `restartReason=overbuilt`:*

And the morning, rebuilt smaller.

**Rebuild the morning small: phone in the kitchen, coffee, out the door.**

*Only if `!morningSet`, `seen.morning-line`.*

*Record: Rebuilt the morning, smaller.*

*Sets morningLabel: Phone sleeps in the kitchen. Coffee, then out the door.*

*Quest morning-line: Set, smaller: {morningLine}*

*Next: opening*

**Today, the floor: {floor}.**

*Only if `floorSet`, `morningSet`.*

*Record: Today's floor: {floor}.*

*Next: opening*

**Ten minutes of something real today.**

*Only if `!floorSet`, `any:morningSet|!seen.morning-line`.*

*Record: Today's floor: ten minutes of something real.*

*Next: opening*

## opening

Five: remove the opening. What let it in?

**The phone sleeps in the kitchen tonight.**

*Record: Closing the opening: the phone sleeps in the kitchen tonight.*

*Next: support*

**Take the beer out of the house.**

*Only if `!beerGone`, `any:pull.drink>=1|cans>=2`.*

*Record: Closing the opening: took the beer out of the house.*

*Next: support*

**No stop at [Tuck's] tonight.**

*Only if `pull.drink>=1`.*

*Record: Closing the opening: no [Tuck's] tonight.*

*Next: support*

**Nothing to remove. I'll watch for it.**

*Next: support*

## support

Six: get support, if you need it. Support helps you do the work. It doesn't do it for you.

**Text Dana: "rough night. still on for saturday."**

*Only if `danaPromised`, `!danaStopped`, `!saturdayKept`.*

→ "ok. good." That's all. It's enough.

*Record: Told Dana it was a rough night.*

*Next: done*

**Tell Ray you'll be there by 7.**

*Only if `workday`, `!today.noShift`, `restartReason=shift`.*

→ "ok."

*Record: Told Ray I'll be there by 7.*

*Next: done*

**Not today. I've got this one.**

*Next: done*
