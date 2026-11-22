# A Real New Fact

**Status:** draft, waiting on Jim

- Scene: `real-new-fact` · Stage 3: Repeat the Action
- File: `src/content/scenes/real-new-fact.json` · Version: `ba8870e6a1`
- Runs only when something starts it.
- Started by: scene shift-default
- Art: jobsite@evening

**Framework:** Pure Execution Mode

**Teaches:** a changed plan and a miss are separate paths

**Notes for Jim**

- Outline, stage 3: "Ray asks you to stay late Thursday, and it collides with something you planned. The game asks which this is: a plan change or a miss. It knows whether the facts actually changed." Claude's draft.
- JIM: it runs on the first Thursday at least three days into stage 3. If that Thursday is too far out, it runs on the first workday five days in, so the slice stays near its length.
- Pure Execution Mode: a changed plan and a miss are separate paths. A real fact changes what it touches. Telling the people it touches is what makes it a plan change.

---

## ask (first step)

*Speaker: Ray*

3:00. Ray walks over with the clipboard, which he never does. "Pour got moved up. Can you stay till 6?"

He's asking you first. That's new too.

*Only when `weekday=thu`, `any:pantryRegular|pantryYes`:*

You told [Pastor Ruth] you'd be at the pantry at 5.

*Only when `any:!weekday=thu|!pantryRegular`, `!pantryYes`, `any:ceilingKind=gym|ceilingKind=deshawn`:*

You planned the gym at 5: {ceiling}.

*Only when `any:!weekday=thu|!pantryRegular`, `!pantryYes`, `!ceilingKind=gym`, `!ceilingKind=deshawn`:*

You planned {ceiling} tonight.

*Quest fact, title: A Real New Fact*

*Quest fact: Ray's asking you to stay till 6.*

**"Yes. Let me text [Pastor Ruth] first."**

*Only if `weekday=thu`, `any:pantryRegular|pantryYes`.*

→ You text her: "Ray needs me till 6. Can't make the pantry tonight. Next Thursday." She sends back a thumbs up and, somehow, a can of corn.

*Record: Stayed till 6 for Ray. Told [Pastor Ruth] at 3:05. Plan changed.*

*Next: which*

**"Yes. Let me move my plan first."**

*Only if `any:!weekday=thu|!pantryRegular`, `!pantryYes`.*

→ You put it in your phone, in writing: {ceiling}, Saturday morning. A real time, not "later."

*Record: Stayed till 6 for Ray. Moved the plan to Saturday, in writing.*

*Next: which*

**"Yes."**

→ Ray nods and walks off. The plan doesn't get mentioned. It just doesn't happen.

*Record: Stayed till 6 for Ray. Didn't move or mention the plan.*

*Next: which*

**"I can't today. I've got something at 5."**

→ Ray looks at you for a second. "Okay. Next time." He means it. He goes and asks [Cole].

*Record: Said no to overtime. Kept the plan.*

*Quest shift: Worked the shift. Said no to overtime.*

*Quest fact: A real fact. You kept your plan, and said so.*

*Ends the scene.*

## which

So which is this: a plan change, or a miss?

**A plan change.**

*Only if `today.toldPlan`.*

→ It is. The facts changed, and you said so before the hour came. That's what a plan change looks like.

*Record: Plan change: overtime. Said so before it mattered.*

*Proof (ownership): Called a real plan change a plan change, and said so in time.*

*Next: done*

**A miss.**

*Only if `today.toldPlan`.*

→ It isn't. The facts changed and you handled it. A changed plan and a miss are separate paths.

*Next: done*

**A plan change.**

*Only if `today.silentChange`.*

→ The overtime is real. But nobody knows the plan moved, and it doesn't exist anywhere but in your head. A change you don't tell anyone about is just a miss with a good excuse.

*Record: Called it a plan change. Didn't tell anyone.*

*Next: repair*

**A miss. I should have said something.**

*Only if `today.silentChange`.*

→ That's honest. It isn't too late to say so.

*Next: repair*

## done

6:00. The slab is poured. Ray says "Thanks" without looking up, which from Ray is a speech.

*Also on the record: Worked till 6.*

*Quest shift: Worked till 6. Overtime.*

*Quest fact: The facts changed. You know which one it was.*

*Ends the scene.*

## repair

The overtime is real. What you do with the plan is still yours.

**Fix it now.**

→ Ten seconds. It's done before Ray's back.

*Record: Moved the plan at {time}. Late, but said.*

*Next: done*

**Leave it.**

*Record: Didn't move the plan.*

*Next: done*
