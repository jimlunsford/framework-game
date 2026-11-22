# The Week Back

**Status:** draft, waiting on Jim

- Scene: `week-back` · Stage 3: Repeat the Action
- File: `src/content/scenes/week-back.json` · Version: `e9b79ca0a1`
- Runs when night falls, before sleep, if `stage=3`, `seen.real-new-fact`. Once per game. Priority 20.
- Art: bedroom@night

**Framework:** How to Rebuild Yourself

**Teaches:** stage 3: Repeat the action

**Notes for Jim**

- Outline, stage 3: "End of the stage. The record shows the week as it happened, with returns counted and misses shown. Your first trait can form here, such as 'someone who shows up' from your shift record or 'someone who answers' from Dana's texts." The slice ends after this, on the outline's line.
- Claude's guess on the open question, the first traits and what forms them: Someone who shows up (on time for 4 shifts), Someone who answers (answered Dana the same day 3 times), Someone who comes back (finished the restart sequence twice). Traits come from proof only, never from hours played.
- Claude's guess on the open question, slice length: the slice ends here, on the night The Week Back runs. That needs stage 3, which needs three days of structure, then A Real New Fact. A player who keeps the morning and the floor from Tuesday on reaches it on day 11 (Monday plus 10). Misses add days; nothing is cut off.

---

## review (first step)

The Week Back.

The record shows the stretch as it happened. Returns counted. Misses shown. Nothing graded.

*Quest ordinary: A week where nothing special happened, on the record.*

*The game shows the week, from the record, here.*

*Next: traits*

## traits

Traits form from proof. Not from hours played, and not from how it felt.

*Only when `trait.Someone who shows up`:*

From your shift record: someone who shows up.

*Only when `trait.Someone who answers`:*

From Dana's texts: someone who answers.

*Only when `trait.Someone who comes back`:*

From the restarts: someone who comes back.

*Only when `!trait.Someone who shows up`, `!trait.Someone who answers`, `!trait.Someone who comes back`:*

No trait formed this stretch. The record is still there, and it keeps counting.

*Trait, when `count.onTime>=4`: Someone who shows up*

*Proof (ownership), when `count.onTime>=4`: Trait formed from the shift record: someone who shows up.*

*Trait, when `count.danaSameDay>=3`: Someone who answers*

*Proof (ownership), when `count.danaSameDay>=3`: Trait formed from Dana's texts: someone who answers.*

*Trait, when `count.returns>=2`: Someone who comes back*

*Proof (ownership), when `count.returns>=2`: Trait formed from the restarts: someone who comes back.*

*Next: end*

## end

That's the first stretch. The rest of town is coming.

*Ends the scene.*
