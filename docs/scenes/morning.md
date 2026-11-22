# Morning

**Status:** draft, waiting on Jim

- Scene: `morning` · Scenes any day can bring
- File: `src/content/scenes/morning.json` · Version: `6ffd67a56e`
- Runs when the day starts, if `day>=2`, `!today.morningHandled`. At most once a day. Priority 50.
- Art: bedroom@predawn

**Notes for Jim**

- Every morning after Monday. Claude's draft, built on Monday's three choices.
- Once you have a morning line, following it is how a morning is kept. After three kept mornings the routine has formed and collapses into one tap: "Run my morning." (Outline, stage 3.)
- Escape is still always on the menu.

---

## wake (first step)

*Only when `today.tired`:*

The alarm sounds farther away than it is. Last night is still in your head.

*Only when `!morningSet`:*

6:30. The alarm. The phone, lit, a foot from your head.

*Only when `morningSet`, `count.morningsKept<3`:*

6:30. The alarm. Your morning line: {morningLine}

*Only when `morningSet`, `count.morningsKept>=3`:*

6:30. You know how this goes now. You don't have to decide it.

*Quest shift, when `workday`: 7:00 to 3:30 at the job site.*

*Quest shift, when not `workday`: Weekend. No shift today.*

*Notice, when `today.tired`: You slept badly. Tonight's encounter starts with more Pull.*

**Run my morning**

({morningLine})

*Only if `morningSet`, `count.morningsKept>=3`.*

*Record: Kept the morning.*

*Proof (purpose), when `purpose=work`, `workday`: Kept the morning on a workday.*

*Ends the scene.*

**Follow the morning line.**

({morningLine})

*Only if `morningSet`, `count.morningsKept<3`.*

→ You do it the way you set it up. It's smaller than it sounds and it takes less than you'd think.

*Record: Kept the morning.*

*Ends the scene.*

**Get up.**

*Only if `!morningSet`.*

→ Cold floor. You have time for coffee.

*Record: Got up on the alarm.*

*Ends the scene.*

**Check the phone. Just a minute.**

(Escape: the phone)

*Only if `any:!morningPhone=kitchen|!morningSet`.*

→ It isn't a minute. It's forty. Then it's 7:10.

*Record: 40 minutes on the phone before getting up.*

*Notice: The phone gains pull.*

*Ends the scene.*

**Go get the phone from the kitchen. Just a minute.**

(Escape: the phone)

*Only if `morningSet`, `morningPhone=kitchen`.*

→ You walk past the coffee maker to get it. It isn't a minute. It's forty. Then it's 7:10.

*Record: 40 minutes on the phone before getting up.*

*Notice: The phone gains pull.*

*Ends the scene.*

**Snooze.**

→ Nine more minutes. Then nine more. Less morning, no more rest.

*Record: Snoozed twice.*

*Ends the scene.*
