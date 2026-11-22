# Your shift

**Status:** draft, waiting on Jim

- Scene: `shift-default` · Scenes any day can bring
- File: `src/content/scenes/shift-default.json` · Version: `28d9fa7f4e`
- Runs on arriving at The job site, if `day>=2`, `workday`, `!today.shiftDone`, `!today.noShift`, `time<15:30`. At most once a day. Priority 10.
- Art: jobsite

**Notes for Jim**

- The daily responsibility after Monday. Claude's draft, built on Monday's locked lines.
- Ray cares about one thing: whether you show up. As the record builds, he trusts you with more (outline cast).
- In stage 3, on the right day, the shift hands off to A Real New Fact at 3:00.

---

## route (first step)

*Next, when `time<=7:00`: ontime*

*Next: late*

## ontime

*Only when `count.onTime<3`:*

Ray says "Morning" without looking up.

*Only when `count.onTime>=3`, `count.onTime<5`:*

Ray says "Morning" and, for a second, looks up.

*Only when `count.onTime>=5`:*

Ray hands you the day's plans before he hands them to anyone else.

*Record: On site at {time}.*

*Quest shift: On site at {time}. On time.*

*Proof (purpose), when `purpose=work`: On site on time.*

*Next: work*

## late

*Speaker: Ray*

*Only when `promiseOnTime`:*

Ray looks at his watch, then at you. He doesn't say anything. You told him it wouldn't be a pattern.

*Only when `!promiseOnTime`:*

"You're late." He doesn't look up.

*Record: On site at {time}. Late.*

*Quest shift: On site at {time}. Late.*

**"That's on me."**

→ Ray nods once. "Okay."

*Record: Owned being late.*

*Proof (ownership): Owned being late to Ray.*

*Next: work*

**"Traffic on [Route 46]."**

→ Ray writes something down.

*Record: Blamed traffic.*

*Next: work*

## work

Forms, rebar, a slab. You're good at the parts of this job nobody sees.

*Only when `weekday=tue`, `stage=2`:*

[Cole] works the saw next to you and talks the whole time: the forklift, his ex, a guy at [Tuck's] who swears he played minor league. It's a good story every time.

*Only when `weekday=thu`, `stage=2`:*

The crew talks about Thursday like it's Friday. [Cole] keeps looking over at you like he has a question saved.

*Only when `stage=3`, `count.onTime>=4`:*

Nobody says anything about you being on time anymore. It's just what you do. That's how a habit looks from outside.

*Quest shift, when `stage=3`, `s3day>=3`, `any:weekday=thu|s3day>=5`, `!seen.real-new-fact`: Ray's walking over with the clipboard.*

*Also on the record, when not `stage=3`, `s3day>=3`, `any:weekday=thu|s3day>=5`, `!seen.real-new-fact`: Worked the shift.*

*Quest shift, when not `stage=3`, `s3day>=3`, `any:weekday=thu|s3day>=5`, `!seen.real-new-fact`: Worked the shift.*

*Ends the scene.*
