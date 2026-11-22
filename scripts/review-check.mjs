// Checks review mode in the built game, on a phone and a desktop viewport:
//   - opens ?review=1, then every scene and encounter once, and follows a step in each
//     (a choice in a scene, a card in an encounter), with the state sheet opened once;
//   - fails on a page error, an error line on screen, a missing label, or a page that
//     scrolls sideways;
//   - checks the player's save is never written by review mode;
//   - checks a normal visit (no ?review=1) shows the usual first screen and never loads
//     review mode's code.
// Screenshots go to playtest-output/review/. Run: npm run build && npm run review-check
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
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
const out = join(here, '..', 'playtest-output', 'review');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const viewports = (args.viewport ?? 'both') === 'both' ? ['phone', 'desktop'] : [args.viewport];
const shots = args.shots !== '0';

if (!existsSync(join(dist, 'index.html'))) {
  console.error('No dist/ build. Run npm run build first.');
  process.exit(1);
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
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
const url = `http://localhost:${server.address().port}/game/`;

const AGE_TITLE = JSON.parse(readFileSync(join(here, '..', 'src', 'content', 'lines.json'), 'utf8'))['age.title'];
const problems = [];
const browser = await chromium.launch();
const ctxFor = (vp) =>
  browser.newContext(vp === 'phone' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

async function sideways(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}

async function screenProblems(page, where) {
  const text = await page.evaluate(() => document.body.innerText);
  if (/\[missing (line|label)/.test(text)) problems.push(`${where}: a label is missing`);
  if (await page.locator('.error').count()) problems.push(`${where}: an error shows: ${(await page.locator('.error').first().innerText()).slice(0, 120)}`);
  if (await sideways(page)) problems.push(`${where}: the page scrolls sideways`);
}

// 1. A normal visit shows nothing new.
for (const vp of viewports) {
  const ctx = await ctxFor(vp);
  const page = await ctx.newPage();
  const loaded = [];
  page.on('request', (r) => loaded.push(r.url()));
  page.on('pageerror', (e) => problems.push(`normal ${vp}: page error ${e.message}`));
  for (const q of ['', '?review=0', '#/scene/dana-text']) {
    await page.goto(url + q);
    await page.waitForSelector('#app h1');
    const h1 = await page.locator('#app h1').first().innerText();
    const rv = await page.evaluate(() => ({ cls: document.getElementById('app').classList.contains('rv'), hook: '__review' in window, items: document.querySelectorAll('.rv-item, .rv-badge').length }));
    if (rv.cls || rv.hook || rv.items) problems.push(`normal ${vp} ${q || '(no query)'}: review mode showed up`);
    if (h1.trim() !== AGE_TITLE) problems.push(`normal ${vp} ${q || '(no query)'}: the first screen is "${h1}", not the age check`);
  }
  if (loaded.some((u) => /\/review-[^/]*\.js/.test(u))) problems.push(`normal ${vp}: review mode's code was loaded`);
  if (shots) await page.screenshot({ path: join(out, `${vp}-normal.png`) });
  await ctx.close();
}

// 2. Review mode: the list, then every scene and encounter once.
let opened = 0;
for (const vp of viewports) {
  const ctx = await ctxFor(vp);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`review ${vp}: page error ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`review ${vp}: console error ${m.text()}`);
  });
  await page.goto(`${url}?review=1#/`);
  await page.waitForSelector('.rv-item');
  const items = await page.evaluate(() => window.__review.items);
  const listed = await page.locator('.rv-item').count();
  if (listed !== items.length) problems.push(`review ${vp}: the list shows ${listed} of ${items.length}`);
  await screenProblems(page, `review ${vp} list`);
  if (shots) await page.screenshot({ path: join(out, `${vp}-00-list.png`), fullPage: true });

  let n = 0;
  for (const it of items) {
    n++;
    const where = `review ${vp} ${it.kind} ${it.id}`;
    await page.goto(`${url}?review=1#/${it.kind}/${it.id}`);
    await page.waitForSelector('.panel .rv-head');
    const title = await page.locator('.rv-head h2').innerText();
    if (!title.trim()) problems.push(`${where}: no title`);
    await screenProblems(page, where);
    if (shots) {
      await page.waitForTimeout(400);
      await page.screenshot({ path: join(out, `${vp}-${String(n).padStart(2, '0')}-${it.kind}-${it.id}.png`) });
    }

    // Open the state sheet on a few, and change one value.
    if (n % 9 === 1) {
      await page.locator('[data-act=state]').click();
      await page.waitForSelector('.sheet');
      await screenProblems(page, `${where} state sheet`);
      if (shots && n === 1) {
        await page.waitForTimeout(400);
        await page.screenshot({ path: join(out, `${vp}-state-sheet.png`) });
      }
      const box = page.locator('.sheet input[type=checkbox]').first();
      if (await box.count()) await box.click();
      await page.locator('[data-act=sheet-close]').click();
      await screenProblems(page, `${where} after a state change`);
    }

    // Follow one step.
    if (it.kind === 'encounter' || (await page.locator('.hand').count())) {
      // Adjust the starting numbers once, then play the floor version until it ends.
      const plus = page.locator('[data-act=num][data-arg="resolve:1"]');
      if (await plus.count()) {
        await plus.click();
        await plus.click();
      }
      for (let i = 0; i < 12; i++) {
        if (await page.locator('[data-act=enc-finish]').count()) {
          await page.locator('[data-act=enc-finish]').click();
          break;
        }
        if (await page.locator('[data-act=floor]').count()) await page.locator('[data-act=floor]').first().click();
        else if (await page.locator('[data-act=card][data-arg=floor]').count()) await page.locator('[data-act=card][data-arg=floor]').click();
        else break;
      }
      if (!(await page.locator('.rv-records .notice').count())) problems.push(`${where}: no record lines after finishing`);
    } else if (await page.locator('form[data-form=input]').count()) {
      await page.fill('textarea[name=line]', "I'm on site by 7.");
      await page.locator('form[data-form=input] button[type=submit]').click();
    } else {
      const choose = page.locator('[data-act=choose]');
      if (await choose.count()) await choose.first().click();
      else if (await page.locator('[data-act=continue]').count()) await page.locator('[data-act=continue]').first().click();
    }
    await screenProblems(page, `${where} after one step`);
    opened++;
  }
  const saved = await page.evaluate(() => localStorage.getItem('framework-game-save-v1'));
  if (saved) problems.push(`review ${vp}: review mode wrote the player's save`);
  await ctx.close();
}

await browser.close();
server.close();
console.log(`Review mode: opened ${opened} scenes and encounters across ${viewports.join(' and ')}.`);
if (problems.length) {
  console.log(`Problems:\n${[...new Set(problems)].map((p) => `  - ${p}`).join('\n')}`);
  process.exit(1);
}
console.log('No problems. A normal visit shows nothing new. Screenshots in playtest-output/review/.');
