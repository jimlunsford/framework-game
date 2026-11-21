# **Framework Game: Decisions and Design Notes**

Phoenix 2:33 LLC. Exploratory planning for a for-profit modern browser game that teaches Jim Lunsford's four core frameworks. No code yet. Started November 19, 2026\.

## **Purpose**

Build a game with the pull of Legend of the Green Dragon (a simple daily loop, a persistent character, other players around you), made for people today, with a modern interface and graphics. Playing it teaches the frameworks. Teaching the frameworks is the purpose. Money matters but comes second: the game should at least sustain itself, and replacing a salary would be welcome but is not required.  
The four frameworks: The PERIOD Code (values), How to Rebuild Yourself (process), The Discipline Loop (reinforcement) and Pure Execution Mode (action). Only Empowerment's lessons teach them. The game is where a player uses them, or chooses not to.

## **Decisions made**

| Topic | Decision | Date |
| :---- | :---- | :---- |
| Purpose | Teaching the frameworks first. Money second, enough to sustain the work at minimum. | Nov 19, 2026 |
| Player | All three: general gamers, Jim's readers, and people in recovery. Built so a stranger would play it for the game alone, with more depth for readers and the recovery community. | Nov 19, 2026 |
| Time | As much as needed. The limit is Jim's full-time job and the size of the build, not weekly hours. | Nov 19, 2026 |
| Budget | \$0 beyond existing hosting and AI tools. Runs on Jim's VPS, Claude-drawn SVG art, no paid ads. | Nov 19, 2026 |
| Multiplayer | Live multiplayer with accounts is fine, no limits. Moderation, an 18+ age check and abuse handling come with it. | Nov 19, 2026 |
| Platform | Browser-based and phone-first. Installable web app, no app stores. | Nov 19, 2026 |
| Role of the game | Only Empowerment teaches the frameworks through lessons. The game is where the player lives them, or does not, by their own choices. | Nov 19, 2026 |
| Framework visibility | Follow the Only Empowerment model: frameworks named openly, credited to Jim, pointing to the source books. Teaching happens through choices with honest consequences. Nothing is graded. | Nov 19, 2026 |
| Home and brand | The game lives on the Only Empowerment site under its own name. Only Empowerment and the game both sit under Phoenix 2:33 LLC. | Nov 19, 2026 |
| Only Empowerment's rules | Do not apply to the game. Accounts, stats, levels, progression and saved state are allowed. The money side is still held to the frameworks: the business does not profit from the escape-and-relief loop. | Nov 19, 2026 |
| Setting | Modern day, real life. | Nov 19, 2026 |
| Legend of the Green Dragon material | None of LoGD's code, text, creatures or names go into the paid game (CC BY-NC-SA). Phoenix 2:33 LLC owns the Resurrection art and may reuse it, but its dark-fantasy style does not fit a modern setting. | Nov 19, 2026 |
| The Disciplined Operator | Core frameworks first. Simple environment choices plant its idea early. The full Operation layer (terrain, gates, breaches, emotion as weather, the body) opens once the player has proof, around stage 8 of the rebuild spine. Mirrors jimlunsford.com, where it is advanced reading. | Nov 19, 2026 |
| Direction | The life sim is the core game: a persistent daily life in a modern, real-life shared town, with all four frameworks running underneath daily pressures. Rebuild seasons and a Pressure Points program edition come later. The game's real name is still open. | Nov 19, 2026 |
| How days pass | A mix. Each player's time moves only when they play, with no daily cap (dropped when the game became quest-driven). The shared town keeps living: other players' actions, town events and seasons continue. Missed events show up as history and news, never as lost rewards. | Nov 19, 2026 |
| Where it lives | Its own subdomain of onlyempowerment.com, with a Play link in Only Empowerment's navigation. The lessons stay account-free and local-first, the two apps deploy separately, and the game's license is chosen on its own terms. | Nov 19, 2026 |
| Starting life | The player picks a starting life from several: rock bottom, functioning but drifting, or rebuilding after a loss (a job, a marriage, health). Same rebuild spine for all, different weight. Matches How to Rebuild Yourself: not every rebuild starts with a collapse. | Nov 19, 2026 |
| Gameplay model | An open world of places, played in text and images, with questing in the style of The Elder Scrolls Online. A character creator (name, pronouns, look, starting life). The town is a map of locations the player moves between freely, in any order; each place has an illustrated image, text and the people there. A quest log tracks the main questline and side quests. Encounters happen in the place and moment that fit. No walking sprites and no game engine. (Corrected Nov 20, 2026: the earlier version said scene art in a scripted order, which Claude assumed without asking.) The rebuild spine is the main questline. Town zones carry their own storylines, townspeople give quests, daily responsibilities replace daily writs, crews replace guilds, and community projects replace dungeons. No daily play cap. | Nov 19, 2026 |
| Binge-play safeguard | No hard cap. Four guards instead: quest chapters end at in-game night with a clear place to stop; nothing grows from hours played, only from what the character did; the character needs sleep, and an all-nighter is an escape choice that costs the next day; an optional reminder the player sets, off by default. | Nov 19, 2026 |
| What replaces combat | A mix. Most of each quest is story and choices. Key pressure moments become turn-based encounters: the old voice makes its arguments, and the player answers with actions earned through play (support, removing access, the floor version of the work, asking what information they are waiting for). Proof, traits and routines form the player's deck. Escape cards are always in hand: cheap, they work now, and they cost later. Comparable: the argument battles in Griftlands. | Nov 20, 2026 |
| How encounters end | Honest outcomes, no defeat. Meters (the player's resolve against the old voice's pull) give encounters a real game feel, but every encounter ends in one of the outcomes the books name: acted, adjusted for real new facts, delayed, or escaped. Each carries its own consequences. Escape brings real relief now and real costs later, and the restart sequence opens as the way back. Nothing is labeled a loss; the record tells the truth. | Nov 20, 2026 |
| How characters grow | No levels. Three things grow, all from what the character actually did: (1) rebuild stage, the player's place in the main questline; (2) skill lines, one per PERIOD value, unlocked in order, each growing from proof, with corrections counting (returning after a miss builds Resilience); (3) traits such as "someone who shows up," which form from repeated proof and can fade if the basics are dropped (the carelessness test). New encounter cards come from all three, so the deck is the record. | Nov 20, 2026 |
| First playable version | Solo vertical slice: one starting life, one town zone, main questline stages 1 to 3, a handful of side quests, working encounters, Ownership and Purpose skill lines. No multiplayer. Then a five-phase roadmap to the full version, each phase gated (see Roadmap). | Nov 20, 2026 |
| Slice starting life | Functioning but drifting. The widest door: a general gamer sees themselves in it without needing a recovery story. Tests stage 1 cleanly, raising a standard nobody is forcing on you. Rock bottom and rebuilding after a loss arrive in Phase 2\. | Nov 20, 2026 |
| Slice town zone | A small town, about a dozen places (diner, gym, job site, church, bar, park, home). Everyone sees everyone, so private choices surface in public scenes on their own (design rule on Integrity). The smallest world to write, and one Jim knows firsthand. | Nov 20, 2026 |
| Slice escapes | All three, in hand from the start: the phone (costs sleep and attention, quiet and fast), drinking after work (costs the next day and relationships, heavier and quicker to escalate) and comfort habits (cost the body and the slow slide). No escape is assigned. The one the player keeps reaching for gains pull and becomes their pattern, and the old voice starts arguing in its terms. The game is 18+ only, so drinking fits. | Nov 20, 2026 |
| Age | 18+ only. Nobody under 18\. A birthdate field plus an "I am 18 or older" checkbox. In Phase 1 (no accounts) it runs on first launch; from Phase 3 it is part of sign-up. | Nov 20, 2026 |
| Scene writing | Claude drafts all scenes: main questline, side quests and town scenes, built from Jim's books and the decisions in this doc. Jim edits every scene with Claude, and nothing ships without his approval. | Nov 20, 2026 |
| Art style | Flat illustrated vector, in the spirit of Florence and Alto's Odyssey: clean shapes, a limited palette, simple characters. Drawn by Claude as SVG, sharp at any screen size and consistent across many scenes. Mood comes from color and light, such as warm diner mornings and blue phone glow at 2 a.m. | Nov 20, 2026 |
| Playtesters | A mix, with strangers counting most. The slice goes up free on itch.io for general gamers, and a link goes to a small group of Jim's readers. Strangers show whether it is fun; readers show whether the frameworks come through. Only the strangers decide the Phase 1 gate. | Nov 20, 2026 |
| Build approach | Same approach as Only Empowerment: a plain web app in TypeScript, no game engine. The game is mostly text, choices and SVG scenes. Phase 1 runs fully in the browser and saves on the player's device, and the same build runs on itch.io unchanged. In Phase 3, a small PHP and MariaDB backend on Jim's VPS adds accounts, matching the stack the server already runs. | Nov 20, 2026 |
| How we work | Four parts. (1) The command chat with Claude makes decisions, and this doc is the single source of truth for design. (2) Writing happens in the command chat: Claude drafts scenes into the Scene Book in Jim's Drive, Jim edits or comments, and a scene is locked when Jim approves it. (3) Code happens in Claude Code in the game's own repo. Each work prompt states the model and effort level above it. The repo carries a CLAUDE.md with the design rules and a copy of this doc, and approved scenes go in as content files, so code never invents story. (4) Work results come back to the command chat, which updates this doc and sets the next step. | Nov 20, 2026 |
| Slice build | Build the slice in Claude Code now: the locked opening plus stages 2 and 3 from the outline. Claude Code drafts the remaining scenes as content files with best guesses on the open questions. Jim edits after the build. | Nov 21, 2026 |

## **Open questions**

> * **The game's name.** Parked until the slice's town and characters exist; working title is "the life sim." The name must fit Only Empowerment's naming: plain words that say what you do there (like Decision Room, Build a Standard, Do It Now). It must also work as the subdomain, not belong to an existing game, and not sound like a self-help app to a stranger.  
> * **Money mix.** Which of the fitting models to use, and in what order.

## **Design rules from the books**

These come from reading all four books in full.

> 1. **No streaks.** The record counts returns, not unbroken runs. The Resilience chapter answers "You ruined the streak" with "Then I start a new record now."  
> 2. **No countdowns or pressure timers.** Pure Execution Mode needs no special phrase, countdown or toughness test.  
> 3. **Your days wait; the town keeps living.** Your character's time moves only when you play, so absence is never punished. There is no daily cap. Binge play is guarded by natural stopping points, no rewards for hours played, a character who needs sleep, and an optional player-set reminder. The shared town moves on without you, but anything you missed shows up as history and news, never as a lost reward or a one-time event you can never get back.  
> 4. **Escape is always available.** Its relief is real and its costs arrive later. Each use gives escape more pull the next time.  
> 5. **Rest is never penalized.** Consequences ask the book's question instead: restoring or hiding?  
> 6. **Every task shows an honest status:** prepared, started, request sent, waiting on someone, partly done, done. A drafted message is not a sent one.  
> 7. **New facts change the move.** Scenes include real new information, such as an injury, a missing approval or another person's boundary. Pushing through it is wrong, and using a resolved concern to delay is also wrong. Telling the two apart is the hardest design problem.  
> 8. **Other people own their response.** Repair never guarantees forgiveness. Characters' trust returns on their own schedule and cannot be bought.  
> 9. **No rescue in multiplayer.** A player cannot do another player's work or remove their consequences. Help means tools, truth, boundaries and presence.  
> 10. **Self-trust cannot outrun the record.** Progress brings a carelessness test: dropping the basics because they feel like beginner work.  
> 11. **It is not treatment.** Recovery scenes carry the same note the books carry, and crisis resources are one tap away.

## **How each framework shows up in play**

### **The PERIOD Code: values unlocked in order**

The Code teaches its values in order: Ownership, Purpose, Resilience, Integrity, Discipline, Empowerment. Empowerment is corrupted when it comes too early, so it unlocks last.

> * **Ownership.** The gate. The player starts in the life their old standard produced. Blame gives relief and locks the paths that fix things. Asking for help as "fix me" and as "help me do the work" lead to different outcomes.  
> * **Purpose.** The player chooses a purpose for this season ("What purpose must guide me now?") and can change it later. Purpose shows what a moment of relief would cost against it. With no purpose chosen, drift events appear.  
> * **Resilience.** Setbacks are guaranteed. Every hard day offers a smaller version of the work (the floor), never all or nothing. The question is "What can I still do?" Some situations are harmful rather than hard, and the right move is to leave.  
> * **Integrity.** Hidden doors: the saved contact, the stash, the private exception. Each open door is a secret option that keeps tempting. The game separates privacy from secrecy. What the player does in private scenes shows up in public ones later.  
> * **Discipline.** Structure: routines, removing access, the floor and the ceiling. Pride-driven choices such as overtraining exist and carry costs.  
> * **Empowerment.** Unlocks last, once the record supports it. Rescue, control and enabling give quick relief and leave the other person weak. Tools, truth and boundaries help them stand. The player cannot choose for them.

### **How to Rebuild Yourself: the campaign spine**

> 1. **Raise the standard.** The player writes a first line that is specific, can be broken and can be returned to. "Do better" is not accepted. One line that stops the bleeding, not ten.  
> 2. **Build the structure.** Routines and environment. An overbuilt plan is available, and it collapses.  
> 3. **Repeat the action.** Ordinary days. The drama fades on purpose.  
> 4. **Produce the proof.** Kept promises, corrections and returns go on the record. Correction counts as proof.  
> 5. **Rebuild self-trust.** It grows with the record, never ahead of it.  
> 6. **Stabilize identity.** Traits form from proof, including proof from scenes nobody saw. Old labels keep speaking in the old voice and lose authority over time.  
> 7. **Reduce negotiation.** Debates get shorter. The player can close some doors for good. The carelessness test lives here.  
> 8. **Own the life.** Borrowed structure, such as a mentor or a program, fades out by design. A collapse when it leaves sends the player back to building structure.

### **The Discipline Loop: the pressure engine**

> * Every pressure runs the five parts: pressure creates the choice, action creates proof, proof rebuilds self-trust, self-trust stabilizes identity, stable identity reduces negotiation.  
> * The five break points become scene types: waiting for readiness, overbuilding the plan, having no daily minimum, negotiating with the standard, and chaos replacing escape.  
> * After any miss, the restart sequence runs: tell the truth, find the break, take the next aligned action, rebuild the minimum, remove the opening, get support if needed. Hiding the miss skips the sequence and the miss grows.

### **Pure Execution Mode: how the player acts**

> * **Identify the Next Move.** One concrete move that serves a standard. The move may be "find out." Vague moves such as "catch up at work" cannot be chosen.  
> * **Eliminate Negotiation.** Waiting is always an option. A repeated objection brings the old voice back with nothing new, and the delay costs something real. A genuine new fact opens a different, legitimate option.  
> * **Flip the Switch.** Starting is shown separately from finishing.  
> * **Stack the Wins.** Connected actions with honest status labels. Busy work is offered and looks productive.  
> * **Repeat Daily.** Tomorrow starts from where the player actually left things.  
> * **A changed plan and a miss are separate paths.** The game asks which one this was and knows whether the facts changed. An avoidance labeled as an adjustment shows up in Integrity.

## **Money**

### **Ruled out**

These run on the escape-and-relief loop: paid energy refills and timer skips, loot boxes and gacha, paid streak repair, pay-to-win power, limited-time offers and countdown sales, and ads (including rewarded video).

### **Fitting models**

> * **Supporter membership.** About \$5 a month. Cosmetics, extra character slots, the player's full choice history and export, early access to new seasons. No gameplay power.  
> * **Paid story chapters or seasons.** Bought once, owned forever.  
> * **Direct cosmetic shop.** Fixed prices, no randomness.  
> * **Program licenses.** Recovery programs, reentry programs, jail programming and schools, with a facilitator running group sessions. Likely the most reliable revenue. Any sale to Jim's own department or one it contracts with gets cleared with his employer first.  
> * **The books.** The game points players to them.

### **Honest math**

A \$5 supporter tier nets about \$4.50 after fees. Replacing a \$50,000 salary takes about 925 members, which at a typical 3 to 5 percent conversion means roughly 18,000 to 30,000 monthly active players. That is a multi-year build. Browser players expect games to be free. Covering costs is easy; side income is realistic in 12 to 24 months if the game is fun. No streaks and a world that waits mean weaker retention than typical games rely on, which is the price of staying true to the frameworks.

## **Directions considered**

> * **The life sim (chosen core).** A persistent life in a shared town, played through quests and missions in the style of The Elder Scrolls Online. All four frameworks run underneath daily pressures. Medium build, playable alpha in about 4 to 6 months. Main risks: the volume of scene writing (now drafted by Claude and edited by Jim), and the game turns preachy if escape is never fun.  
> * **Rebuild.** Seasons of about 8 to 10 weeks that start at a low point and climb the eight stages, with legacy carried between seasons. Works as a seasonal mode inside the life sim later. Timed moments removed.  
> * **Standard City.** A Torn-style modern async MMO with reputation, crews and contracts. Largest build, about 9 to 15 months. Economy exploits, moderation load and a long head start for Torn.  
> * **Pressure Points.** A group scenario game for programs, run by a facilitator. Smallest build, about 2 to 3 months, growing from Only Empowerment's practice engine. Slow institutional sales. Recommended as a later program edition of the life sim. Scenes must be original, not the books' examples.

## **The Disciplined Operator: the advanced layer**

The Disciplined Operator is Jim's advanced book, built on the four core frameworks. jimlunsford.com lists it as advanced reading, and Only Empowerment does not teach it. The game follows the same order: the four core frameworks first, The Disciplined Operator as an advanced layer.

Early game: simple environment choices plant the book's main idea without naming it. Where the phone sleeps, what is in the kitchen and who gets an answer visibly shape the next day's pressure. This sits inside stage 2 of the rebuild spine, Build the structure.

After the player has proof, around stage 8 (Own the life), the Operation layer opens: the player's life as terrain to design, gates and access, breaches that show which opening let the old pattern in, emotion shown as weather with the player giving the second command, and the body as part of the operation. The layer brings the book's sharper voice and links to the book as advanced reading.

Guardrails: players never choose "operator" as a class or a look, and any label comes from the record. Locking down every gate is not the winning strategy, because an over-tight perimeter costs isolation and damaged relationships (control is not command). Player-facing text stays neutral for every audience while keeping the hard edge. Training used as an escape is a trap the game shows.

## Roadmap

Each phase ends with a gate. The next phase starts only when the gate is met. Sizes are rough and assume one writer with a full-time job. Phases can stretch. Gates don't move.

**Phase 1\. Solo vertical slice (2 to 3 months).** One starting life (functioning but drifting) and one town zone (a small town). Main questline stages 1 to 3 (raise the standard, build the structure, repeat the action). A handful of side quests, working encounters with honest outcomes, the Ownership and Purpose skill lines and first traits. Works in the browser and on a phone. An 18+ check on first launch: birthdate plus an 18-or-older confirmation. It moves into sign-up when accounts arrive in Phase 3\. No accounts, no multiplayer. Playtest: free on itch.io for general gamers, plus a small group of Jim's readers. Gate, judged by the strangers only: outside players finish it without help, come back on their own, and nobody reads an honest outcome as a loss screen.

**Phase 2\. The full rebuild arc, still solo (3 to 4 months).** Main questline stages 4 to 8 (produce the proof through own the life). The remaining four skill lines, unlocked in PERIOD order. A second zone and the other two starting lives. Gate: a player can reach stage 8, and the later stages play as well as the first three.

**Phase 3\. Accounts and the shared town (2 to 3 months).** Accounts, server saves, the 18+ check at sign-up (birthdate plus an 18-or-older checkbox), the shared town feed (public records and town news, no messaging), reporting and basic moderation tools. The first money goes live here. Which model is still an open question. Gate: the feed makes the town feel lived in, moderation load is manageable, and the first players pay.

**Phase 4\. Full multiplayer (3 to 4 months).** Crews, shared quests, encounters between players, and messaging with moderation. Gate: crews form and hold without Jim running them.

**Phase 5\. The Disciplined Operator layer and chapters (ongoing).** The advanced layer opens after the main arc. New zones and questlines ship as paid or free chapters. Gate: none. This is the live game.

**Total to the full version:** roughly 12 to 16 months.

## **Market references**

> * [Torn donator status](https://wiki.torn.com/wiki/Donator): a browser crime MMO running since the early 2000s, funded by a \$5 donator pack that buys a month of status.  
> * [BitLife estimates](https://appgoblin.info/apps/1374403536/keywords): the leading real-life choice game, estimated around 358,000 monthly active users and \$50,000+ monthly revenue, roughly half from ads.  
> * [Idle Pixel Fantasy](https://wnhub.io/news/other/item-48947): a free solo game where 4,400 of 27,300 players bought \$1 to \$2 support cosmetics, \$4,800 gross in five days.

## **Change log**

> * **Nov 19, 2026\.** Document created. Captured the first round of decisions, the design rules from all four books, the framework mapping, money models and the four directions.  
> * **Nov 19, 2026\.** Decided that The Disciplined Operator becomes an advanced layer: core frameworks first, simple environment choices early, the full Operation layer once the player has proof.  
> * **Nov 19, 2026\.** Decided the direction: the life sim is the core game. Rebuild seasons and a Pressure Points program edition come later, inside or alongside it.  
> * **Nov 19, 2026\.** Decided how days pass: a mix. The player's days advance only when they play, and the shared town keeps living. Updated design rule 3 to match.  
> * **Nov 19, 2026\.** Decided the game lives on its own subdomain of onlyempowerment.com, with a Play link in Only Empowerment's navigation.  
> * **Nov 19, 2026\.** Decided the player picks a starting life: rock bottom, functioning but drifting, or rebuilding after a loss.  
> * **Nov 19, 2026\.** Decided the gameplay model: quests and missions in the style of The Elder Scrolls Online, in 2D. Dropped the one-day-per-real-day cap. Updated the How days pass row, design rule 3 and the life sim direction to match.  
> * **Nov 19, 2026\.** Decided the binge-play safeguard: natural stopping points, no rewards for hours played, a character who needs sleep, and an optional player-set reminder. Updated design rule 3\.  
> * **Nov 20, 2026\.** Decided what replaces combat: a mix. Quests are mostly story and choices, and key pressure moments become turn-based encounters against the old voice.  
> * **Nov 20, 2026\.** Decided how encounters end: honest outcomes, no defeat. Acted, adjusted for real new facts, delayed or escaped, each with its own consequences.  
> * **Nov 20, 2026\.** Decided how characters grow: no levels. Rebuild stage, PERIOD skill lines and traits all grow from proof, and encounter cards come from them.  
> * **Nov 20, 2026\.** Decided the first playable version: a solo vertical slice. Added a five-phase roadmap to the full version, each phase ending with a gate.  
> * **Nov 20, 2026\.** Decided the slice's starting life: functioning but drifting. Updated Roadmap phase 1 to match.  
> * **Nov 20, 2026\.** Decided the slice's town zone: a small town. Updated Roadmap phase 1 to match.  
> * **Nov 20, 2026\.** Decided the slice's escapes: all three are in hand from the start, and the player's habits decide which one takes hold. Added a simple age gate to Roadmap phase 1\.  
> * **Nov 20, 2026\.** Decided the age policy (18+ only, birthdate plus an 18-or-older confirmation) and scene writing (Claude drafts everything, Jim edits with Claude). Updated the Slice escapes row and Roadmap phases 1 and 3\.  
> * **Nov 20, 2026\.** Decided the art style: flat illustrated vector.  
> * **Nov 20, 2026\.** Parked the game's name and recorded what it must do (see Open questions).  
> * **Nov 20, 2026\.** Decided the playtest group: free on itch.io for strangers plus a small group of Jim's readers; only strangers decide the Phase 1 gate. Updated Roadmap phase 1\.  
> * **Nov 20, 2026\.** Decided the build approach: a plain TypeScript web app like Only Empowerment, no game engine; PHP and MariaDB backend added in Phase 3\.  
> * **Nov 20, 2026\.** Decided how we work: a command chat for decisions, a Scene Book in Drive for writing, Claude Code in the game repo for code. Created the Scene Book with the opening scene, draft 1\.  
> * **Nov 20, 2026\.** Corrected the gameplay model to an open world of places in text and images, with a character creator and Elder Scrolls Online-style questing. Reworked the opening scene in the Scene Book to match (draft 2).  
> * **Nov 21, 2026\.** Jim reviewed the opening scene: Dana is a friend, the crew job, places and old-voice lines stay as written, travel between places costs in-game time, and Resolve and Pull show as numbers. Scene Book updated to draft 3\.  
> * **Nov 21, 2026\.** Jim clarified "build it out": the build happens in Claude Code, not the command chat. Claude Code builds the slice from the locked opening and the stage 2 and 3 outline, and drafts the remaining scenes as content files. Jim edits after it runs. The four outline questions go in with Claude's best guesses, marked for Jim.