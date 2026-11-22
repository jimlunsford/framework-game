// Plays the built game start to finish through the real interface, the way a player
// would: clicking buttons and typing. It serves dist/ as a plain static site (the way
// itch.io serves it), runs on a phone-sized and a desktop viewport, takes screenshots,
// and checks that no screen shows a streak, a countdown, a score or a loss.
//
// Run: npm run build && npm run playtest
// Options: --path=good|messy|both (default both)  --viewport=phone|desktop|both
import { createServer } from 'node:http';
import { readFileSync, readdirSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('/opt/node-tools/node_modules/playwright'));
}

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');
const out = join(here, '..', 'playtest-output');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const paths = (args.path ?? 'both') === 'both' ? ['good', 'messy'] : [args.path];
const viewports = (args.viewport ?? 'both') === 'both' ? ['phone', 'desktop'] : [args.viewport];

if (!existsSync(join(dist, 'index.html'))) {
  console.error('No dist/ build. Run npm run build first.');
  process.exit(1);
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
// Serve dist under a subfolder, the way itch.io does, to prove relative paths work.
const server = createServer((req, res) => {
  let p = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (!p.startsWith('/game/')) {
    res.writeHead(404);
    return res.end();
  }
  p = p.slice('/game'.length);
  if (p.endsWith('/')) p += 'index.html';
  const file = join(dist, p);
  if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end('not found');
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const url = `http://localhost:${port}/game/`;

// Phrases that say what the game doesn't do. They may contain a forbidden word.
const ALLOWED = [/Nothing here is graded/g, /Nothing graded/g, /never shows a countdown/g, /points at/g, /keeping score/g, /not streaks/g, /never streaks/g];
// Words that would mean a screen is grading, counting down or calling something a loss.
const FORBIDDEN = [
  /\b\d+[- ]day streak\b/i,
  /\bstreak\s*[:#]?\s*\d/i,
  /\bstreak (broken|lost|reset)\b/i,
  /\bscore\b/i,
  /\b\d+\s*(points?|pts|xp)\b/i,
  /\byou lost\b/i,
  /\bgame over\b/i,
  /\bdefeat(ed)?\b/i,
  /\byou fail(ed)?\b/i,
  /\bcountdown\b/i,
  /\btime (left|remaining)\b/i,
  /\b\d+:\d{2} (left|remaining)\b/i,
  /\bgrade[ds]?\b/i,
  /\blevel up\b/i,
];

const PREFER = {
  good: [
    'Get up.',
    'Follow the morning line.',
    'Run my morning',
    '"I bailed. That\'s on me. I\'ll be there."',
    '"That\'s on me. It won\'t be a pattern."',
    '"That\'s on me."',
    'Say it plain.',
    'Run the restart.',
    'In the kitchen. An old alarm clock goes by the bed.',
    'Across the room.',
    'Coffee first, then out the door.',
    'Keep it that small.',
    'Move. Floor: walk 10 minutes. Ceiling: 40 at the gym.',
    '"What\'s the smallest version that still counts?"',
    'Take the beer out of the house.',
    'Clear the counter. Cans out, dishes done.',
    'That\'s enough for now.',
    '"I\'ll be there Thursday."',
    '"Can\'t tonight. Pantry."',
    'Finish the hour.',
    '"I\'ll be here."',
    '"Still good. 9."',
    '"I\'ll be there."',
    '"I said I would."',
    '"Yeah."',
    'Being someone Dana can count on.',
    '"Yes. Let me text [Pastor Ruth] first."',
    '"Yes. Let me move my plan first."',
    'A plan change.',
    '"It was good. Thanks for asking me."',
    '"Yes. Today\'s on me."',
    'Look at the battery.',
    '"Get home safe."',
    'Drink the coffee.',
    'Read the board.',
  ],
  messy: [
    'Check the phone. Just a minute.',
    'Go get the phone from the kitchen. Just a minute.',
    'Leave it on read.',
    '"Traffic on [Route 46]."',
    'Don\'t look at it.',
    'Say it plain.',
    'Run the restart.',
    'Do it right. 5 a.m. gym, cold shower, journaling, meal prep.',
    'Rebuild the morning small: phone in the kitchen, coffee, out the door.',
    'On the nightstand, face down.',
    'Where it\'s always been.',
    'No coffee. Straight out.',
    'The house. Floor: 10 minutes on the kitchen. Ceiling: reset the whole place.',
    '"Give me the full six days."',
    'Leave it. It\'s just a kitchen.',
    '"Not this week."',
    '"I\'m in."',
    '"Work\'s been insane. I\'ll try."',
    '"Still insane."',
    'In my own words.',
    '"Yes."',
    'A miss. I should have said something.',
    'Fix it now.',
    '"Something came up."',
    'Look at the battery.',
  ],
  messyLater: ['Say it plain.', 'Run the restart.', 'Follow the morning line.', 'Run my morning', '"Yes."', 'A miss. I should have said something.', 'Fix it now.', 'In my own words.'],
};

async function run(pathName, vpName) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(
    vpName === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
  );
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`console ${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`));
  const tag = `${pathName}-${vpName}`;
  let shots = 0;
  const shot = async (name) => {
    shots++;
    await page.waitForTimeout(320);
    await page.screenshot({ path: join(out, `${tag}-${String(shots).padStart(2, '0')}-${name}.png`), fullPage: false });
  };
  const seenTexts = new Set();
  // Lines that name these things only to say the game doesn't do them.
  const scan = async () => {
    let text = await page.evaluate(() => document.body.innerText);
    for (const re of ALLOWED) text = text.replace(re, '');
    for (const re of FORBIDDEN) {
      const m = re.exec(text);
      if (m) problems.push(`forbidden wording "${m[0]}" on screen`);
    }
    const w = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (w) problems.push('horizontal scroll on this screen');
    seenTexts.add(text.slice(0, 200));
  };
  const click = async (sel) => {
    await page.locator(sel).first().click();
    await page.waitForTimeout(15);
  };

  await page.goto(url);
  await shot('age-check');
  await scan();
  // Under 18 is refused.
  await page.fill('input[type=date]', '2012-05-05');
  await page.check('input[name=adult]');
  await click('button[type=submit]');
  const refused = await page.locator('.error').innerText();
  if (!/18/.test(refused)) problems.push('under-18 birthdate was not refused');
  await page.fill('input[type=date]', '1988-03-14');
  await page.check('input[name=adult]');
  await click('button[type=submit]');
  await shot('title');
  await click('text=New life');
  await page.fill('input[name=name]', pathName === 'good' ? 'Sam' : 'Riley');
  await click('[data-field=pronouns][data-arg=they]');
  await click('[data-field=skin][data-arg="3"]');
  await click('[data-field=hair][data-arg="3"]');
  await click('[data-field=hairColor][data-arg="0"]');
  await click('[data-field=clothes][data-arg="2"]');
  const disabled = await page.locator('.start-life[disabled]').count();
  if (disabled !== 2) problems.push(`expected 2 starting lives marked Coming later, saw ${disabled}`);
  await shot('creator');
  await click('form[data-form=creator] button[type=submit]');
  await shot('closing-line');
  const closing = await page.locator('.over').innerText();
  if (closing.trim() !== "Nothing's wrong. That's the problem.") problems.push(`closing line was "${closing}"`);
  await click('[data-act=begin]');

  // The messy path slips for the first days, then comes back the way a real player might.
  const preferFor = (day) => (pathName === 'messy' && day >= 5 ? [...PREFER.messyLater, ...PREFER.good] : PREFER[pathName]);
  const state = () => page.evaluate(() => {
    const g = window.__game();
    return g ? JSON.parse(JSON.stringify(g.s)) : null;
  });
  const shotsTaken = new Set();
  const once = async (key, name) => {
    if (shotsTaken.has(key)) return;
    shotsTaken.add(key);
    await shot(name);
  };

  let steps = 0;
  let lastKey = '';
  let stuck = 0;
  const dayLog = [];
  while (steps++ < 3000) {
    const s = await state();
    if (!s) {
      problems.push('game disappeared');
      break;
    }
    await scan();
    const key = `${s.phase}|${s.day}|${s.t}|${s.scene?.id}|${s.scene?.node}|${s.scene?.result ? 1 : 0}|${s.encounter?.round}|${s.encounter?.outcome?.kind}|${s.place}|${s.room}|${s.record.length}`;
    if (key === lastKey) {
      stuck++;
      if (stuck > 6) {
        problems.push(`stuck at ${key}`);
        await shot('stuck');
        break;
      }
    } else stuck = 0;
    lastKey = key;

    if (s.phase === 'ended') {
      await shot('the-end');
      break;
    }
    if (s.day > 20) {
      problems.push('slice did not end by day 20');
      break;
    }
    if (s.phase === 'dayend') {
      dayLog.push({ day: s.day, stage: s.stage, structureDays: s.counts.structureDays ?? 0, returns: s.counts.returns ?? 0 });
      await once(`dayend-${s.day}`, `day${s.day}-night-falls`);
      await click('[data-act=sleep]');
      continue;
    }
    if (s.phase === 'scene') {
      await once(`scene-${s.scene.id}`, `scene-${s.scene.id}`);
      if (await page.locator('form[data-form=input]').count()) {
        const isStandard = await page.locator('textarea[placeholder*="line"]').count();
        if (isStandard) {
          // Try a vague line first and confirm it's refused.
          await page.fill('textarea[name=line]', 'Do better.');
          await click('form[data-form=input] button[type=submit]');
          const fb = await page.locator('.result').innerText().catch(() => '');
          if (!/Better than what/.test(fb)) problems.push('"Do better." was not refused with the Scene Book line');
          await page.fill('textarea[name=line]', 'Never touch my phone again.');
          await click('form[data-form=input] button[type=submit]');
          const fb2 = await page.locator('.result').innerText().catch(() => '');
          if (!/7:05/.test(fb2)) problems.push('"Never touch my phone again." was not refused with the Scene Book line');
          await page.fill('textarea[name=line]', pathName === 'good' ? 'The phone sleeps in the kitchen.' : "I'm on site by 7.");
        } else {
          await page.fill('textarea[name=line]', 'Being somebody my own kid would be proud of.');
        }
        await click('form[data-form=input] button[type=submit]');
        continue;
      }
      const labels = await page.locator('[data-act=choose]').allInnerTexts();
      if (labels.length) {
        const clean = labels.map((l) => l.split('\n')[0].trim());
        let idx = -1;
        for (const p of preferFor(s.day)) {
          idx = clean.findIndex((l) => l === p || l.startsWith(p));
          if (idx >= 0) break;
        }
        if (idx < 0) idx = clean.findIndex((l, i) => !labels[i].includes('Escape'));
        if (idx < 0) idx = 0;
        await page.locator('[data-act=choose]').nth(idx).click();
        await page.waitForTimeout(15);
        continue;
      }
      await click('[data-act=continue]');
      continue;
    }
    if (s.phase === 'encounter') {
      const e = s.encounter;
      await once(`enc-${e.id}`, `encounter-${e.id}`);
      if (e.outcome) {
        await once(`enc-${e.id}-out`, `encounter-${e.id}-${e.outcome.kind}`);
        await click('[data-act=enc-finish]');
        continue;
      }
      if (e.pickingFloor) {
        await page.locator('[data-act=floor]').first().click();
        continue;
      }
      const hand = e.hand;
      let pick;
      if (pathName === 'good') {
        const order = ['go-to-dana', 'name-it', 'phone-kitchen', 'remove-access', 'show-record', 'text-dana', 'remember-why', 'waiting'];
        if (e.id === 'rain-day') order.unshift('plan-change');
        pick = order.find((c) => hand.includes(c) && !e.used.includes(c)) ?? 'floor';
      } else {
        // The messy path escapes on some nights, delays on one, calls a fake plan change once,
        // and acts on the rest, so every outcome gets played.
        const n = s.day;
        if (n === 1 || n === 3) pick = hand.includes('scroll') ? 'scroll' : 'beers';
        else if (e.id === 'just-this-once') pick = 'beers';
        else if (n === 5) pick = 'tomorrow';
        else if (e.id === 'plan-or-miss') pick = 'plan-change';
        else if (e.id === 'boring-middle') pick = hand.includes('show-record') && !e.used.includes('show-record') ? 'show-record' : 'floor';
        else pick = hand.includes('name-it') && !e.used.includes('name-it') ? 'name-it' : 'floor';
        if (!hand.includes(pick)) pick = 'floor';
      }
      await click(`[data-act=card][data-arg="${pick}"]`);
      continue;
    }
    if (s.phase === 'map') {
      await once('map', 'town-map');
      const dest = s._dest ?? null;
      if (dest) await click(`[data-act=travel][data-arg=${dest}]`);
      else await click('[data-act=map-close]');
      continue;
    }
    // play: decide a goal from the state, the way a player would.
    await once(`play-${s.place}-${s.room}`, `play-${s.place}${s.room ? '-' + s.room : ''}`);
    const t = s.t;
    const today = s.today;
    const flags = s.flags;
    const workday = [1, 2, 3, 4, 5].includes(((s.day - 1) % 7) + 1);
    const thu = ((s.day - 1) % 7) === 3;
    const actionIds = await page.locator('[data-act=action]').evaluateAll((els) => els.map((e) => e.dataset.arg));
    const act = async (id) => {
      await click(`[data-act=action][data-arg="${id}"]`);
    };
    const go = async (place) => {
      await click('[data-act=map-open]');
      await once('map', 'town-map');
      await click(`[data-act=travel][data-arg=${place}]`);
    };
    if (actionIds.some((a) => a.startsWith('answer-dana')) && pathName === 'good') {
      await act(actionIds.find((a) => a.startsWith('answer-dana')));
      continue;
    }
    if (s.place === 'home' && s.room === 'bedroom' && t < 9 * 60 && s.day === 1 && pathName === 'good' && !today.visitedKitchen) {
      await click('[data-act=room][data-arg=kitchen]');
      today.visitedKitchen = true;
      await page.evaluate(() => (window.__game().s.today.visitedKitchen = true));
      continue;
    }
    if (s.place === 'home' && s.room === 'kitchen' && actionIds.includes('coffee-home') && pathName === 'good' && t < 6 * 60 + 45) {
      await act('coffee-home');
      continue;
    }
    if (workday && !today.shiftDone && !today.noShift && t < 15 * 60) {
      if (pathName === 'messy' && s.day === 2) {
        // Skip Tuesday's shift on the messy path.
        if (s.place !== 'park') await go('park');
        else if (actionIds.includes('bench')) await act('bench');
        else await act('track');
        continue;
      }
      if (s.place !== 'jobsite') {
        await go('jobsite');
        continue;
      }
    }
    if (s.place === 'jobsite') {
      await go(thu && (flags.pantryYes || flags.pantryRegular) && t < 18 * 60 && !today.pantry ? 'church' : pathName === 'good' && s.stage >= 2 && !today.floorDone && flags.floorKind !== 'kitchen' ? 'gym' : 'home');
      continue;
    }
    if (s.place === 'church') {
      if (actionIds.includes('pantry')) await act('pantry');
      else await go('home');
      continue;
    }
    if (s.place === 'gym') {
      if (actionIds.includes('gym-ceiling') && pathName === 'good') await act('gym-ceiling');
      else if (actionIds.includes('gym-floor')) await act('gym-floor');
      else await go('home');
      continue;
    }
    if (s.place === 'diner') {
      if (actionIds.includes('diner-coffee')) await act('diner-coffee');
      else if (actionIds.includes('news-board')) {
        await act('news-board');
        await once('news', 'news-board');
        await click('[data-act=sheet-close]');
        await go('home');
      } else await go('home');
      continue;
    }
    if (s.place !== 'home') {
      if (s.place === 'park' && actionIds.includes('track')) {
        await act('track');
        continue;
      }
      await go('home');
      continue;
    }
    // At home.
    if (s.day === 1 && pathName === 'good' && t >= 15 * 60 && !today.dinerVisit) {
      await page.evaluate(() => (window.__game().s.today.dinerVisit = true));
      await go('diner');
      continue;
    }
    if (s.day === 1 && pathName === 'messy' && t >= 15 * 60 && t < 19 * 60 && !today.barVisit) {
      await page.evaluate(() => (window.__game().s.today.barVisit = true));
      await go('bar');
      continue;
    }
    if (s.room !== 'kitchen' && !today.kitchenAfter && t >= 15 * 60) {
      await page.evaluate(() => (window.__game().s.today.kitchenAfter = true));
      await click('[data-act=room][data-arg=kitchen]');
      continue;
    }
    if (actionIds.includes('floor-kitchen')) {
      await act('floor-kitchen');
      continue;
    }
    if (actionIds.includes('walk-block') && (flags.floorKind === 'walk' || !flags.floorSet) && !today.floorDone && pathName === 'good') {
      await act('walk-block');
      continue;
    }
    if (actionIds.includes('home-deshawn-floor')) {
      await act('home-deshawn-floor');
      continue;
    }
    if (actionIds.includes('cans') && pathName === 'good') {
      await act('cans');
      continue;
    }
    if (actionIds.includes('call-it-a-night')) {
      await act('call-it-a-night');
      continue;
    }
    if (s.day === 1 && s.stage === 1 && pathName === 'good' && t < 18 * 60) {
      // Monday evening: visit the church and the park before night.
      if (!today.churchVisit) {
        await page.evaluate(() => (window.__game().s.today.churchVisit = true));
        await go('church');
        continue;
      }
    }
    if (actionIds.includes('rest')) {
      await act('rest');
      continue;
    }
    if (s.room !== 'living') {
      await click('[data-act=room][data-arg=living]');
      continue;
    }
    problems.push(`no move found at ${key} actions=${actionIds.join(',')}`);
    break;
  }
  const s = await state();
  // Open each sheet once at the end and check it.
  for (const sheet of ['quests', 'record', 'you', 'help']) {
    await page.evaluate((n) => {
      const b = document.querySelector(`[data-act=sheet][data-arg=${n}]`);
      if (b) b.click();
    }, sheet);
    await page.waitForTimeout(30);
    await scan();
    await shot(`sheet-${sheet}`);
    await page.keyboard.press('Escape');
  }
  // Reload: the save must survive.
  await page.reload();
  await page.waitForTimeout(100);
  const cont = await page.locator('[data-act=continue-game]').count();
  if (!cont) problems.push('no Continue button after reload: save did not survive');
  await shot('reload-title');
  const saved = await page.evaluate(() => localStorage.getItem('framework-game-save-v1'));
  await browser.close();
  const result = {
    tag,
    ended: s?.phase === 'ended',
    days: s?.day,
    stage: s?.stage,
    counts: s?.counts,
    traits: s?.traits,
    cards: s?.cards,
    purpose: s?.purpose,
    standard: s?.standard,
    records: s?.record.length,
    seenScenes: s?.seen.length,
    dayLog,
    problems: [...new Set(problems)],
  };
  return { result, seen: s?.seen ?? [], record: s?.record ?? [], saved };
}

// Scenes the bots never reached (branches neither path takes) still get walked once:
// start each from a finished save, take the first choice every time, then the last.
// A scene must finish within 40 steps with no errors and no forbidden wording.
async function probe(ids, saved) {
  const problems = [];
  if (!ids.length || !saved) return problems;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`probe page error: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`probe console ${m.type()}: ${m.text()}`);
  });
  const load = async () => {
    await page.evaluate((save) => {
      localStorage.setItem('framework-game-age-ok', 'yes');
      localStorage.setItem('framework-game-save-v1', save);
    }, saved);
    await page.reload();
    await page.locator('[data-act=continue-game]').first().click();
  };
  await page.goto(url);
  for (const id of ids) {
    for (const pick of ['first', 'last']) {
      await load();
      await page.evaluate((sid) => {
        const g = window.__game();
        const s = g.s;
        delete s.flags._sliceEnded;
        s.encounter = undefined;
        s.scene = undefined;
        s.phase = 'play';
        g.beginScene(window.__scenes[sid]);
        g.settle();
        g.emit();
      }, id);
      let done = false;
      let shotEnc = false;
      for (let i = 0; i < 40; i++) {
        const st = await page.evaluate(() => {
          const s = window.__game().s;
          const e = s.encounter;
          return { phase: s.phase, id: s.scene?.id, error: s.scene?.error, enc: e ? { id: e.id, outcome: !!e.outcome, picking: !!e.pickingFloor, hand: e.hand } : null };
        });
        if (st.error) {
          problems.push(`${id}: ${st.error}`);
          break;
        }
        // A scene that opens an encounter: play it through (the floor version first, an escape second).
        if (st.phase === 'encounter' && st.enc) {
          if (!shotEnc && pick === 'first') {
            shotEnc = true;
            await page.waitForTimeout(320);
            await page.screenshot({ path: join(out, `probe-${id}-encounter-${st.enc.id}.png`) });
          }
          if (st.enc.outcome) await page.locator('[data-act=enc-finish]').first().click();
          else if (st.enc.picking) await page.locator('[data-act=floor]').first().click();
          else {
            const card = pick === 'last' && st.enc.hand.includes('scroll') ? 'scroll' : 'floor';
            await page.locator(`[data-act=card][data-arg="${card}"]`).first().click();
          }
          await page.waitForTimeout(15);
          continue;
        }
        if (st.phase !== 'scene' || st.id !== id) {
          done = true;
          break;
        }
        let text = await page.evaluate(() => document.body.innerText);
        for (const re of ALLOWED) text = text.replace(re, '');
        for (const re of FORBIDDEN) {
          const m = re.exec(text);
          if (m) problems.push(`${id}: forbidden wording "${m[0]}" on screen`);
        }
        if (i === 0 && pick === 'first') {
          await page.waitForTimeout(320);
          await page.screenshot({ path: join(out, `probe-${id}.png`) });
        }
        if (await page.locator('form[data-form=input]').count()) {
          await page.fill('textarea[name=line]', "I'm on site by 7.");
          await page.locator('form[data-form=input] button[type=submit]').first().click();
        } else {
          const n = await page.locator('[data-act=choose]').count();
          if (n) await page.locator('[data-act=choose]').nth(pick === 'first' ? 0 : n - 1).click();
          else await page.locator('[data-act=continue]').first().click();
        }
        await page.waitForTimeout(15);
      }
      if (!done && !problems.some((x) => x.startsWith(id))) problems.push(`${id}: didn't finish in 40 steps (${pick} choices)`);
    }
  }
  await browser.close();
  return [...new Set(problems)];
}

const results = [];
const allSeen = new Set();
let lastSave = null;
for (const p of paths) {
  for (const v of viewports) {
    const { result, seen, record, saved } = await run(p, v);
    if (saved) lastSave = saved;
    seen.forEach((x) => allSeen.add(x));
    results.push(result);
    console.log(`\n== ${result.tag}: ${result.ended ? 'reached the end' : 'DID NOT reach the end'} on day ${result.days}, stage ${result.stage}`);
    console.log(`   standard: ${result.standard} | purpose: ${result.purpose} | traits: ${(result.traits ?? []).join(', ') || 'none'}`);
    console.log(`   counts: ${JSON.stringify(result.counts)}`);
    console.log(`   days: ${result.dayLog.map((d) => `d${d.day}:s${d.stage}/sd${d.structureDays}/r${d.returns}`).join(' ')}`);
    if (args.record) console.log(record.map((r) => `   d${r.day} ${r.text}`).join('\n'));
    if (result.problems.length) console.log('   problems:\n' + result.problems.map((x) => `     - ${x}`).join('\n'));
  }
}
const sceneIds = readdirSync(join(here, '..', 'src', 'content', 'scenes')).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
const unseen = sceneIds.filter((id) => !allSeen.has(id));
console.log(`\nScenes seen across runs: ${allSeen.size} of ${sceneIds.length}.${unseen.length ? ' Not reached: ' + unseen.join(', ') : ''}`);
const probeProblems = await probe(unseen, lastSave);
if (unseen.length) console.log(probeProblems.length ? 'Probe of unreached scenes:\n' + probeProblems.map((x) => `  - ${x}`).join('\n') : `Probed the ${unseen.length} unreached scenes (first and last choices): all finished cleanly.`);
console.log(`Screenshots in ${out}`);
server.close();
const bad = results.filter((r) => !r.ended || r.problems.length);
process.exit(bad.length || probeProblems.length ? 1 : 0);
