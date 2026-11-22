// The Scene Book round trip: export every scene and encounter to Markdown, import it back
// with no edits, and expect zero changes. Then a few edits to prove import does what it says:
// a locked scene is refused, a draft's status can become locked, words land in the JSON, and
// the JSON keeps its layout. Works in a temporary folder; touches nothing in the repo.
// Run: npm run test-roundtrip  (part of npm test)
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { exportBook, importBook } from './scenebook/book.mjs';
import { SCENES_DIR, loadAll } from './scenebook/content.mjs';
import { mdName, parse, planItem, render } from './scenebook/format.mjs';
import { writeJson } from './scenebook/jsonedit.mjs';

let failed = 0;
const ok = (cond, msg) => {
  if (cond) console.log(`  ok  ${msg}`);
  else {
    failed++;
    console.log(`  FAIL ${msg}`);
  }
};

const tmp = mkdtempSync(join(tmpdir(), 'scene-book-'));
const dir = join(tmp, 'scenes');
try {
  console.log('Round trip: export, then import with no edits');
  exportBook({ dir, combined: join(tmp, 'combined.md'), quiet: true });
  const all = loadAll();
  const first = importBook({ dir, quiet: true });
  const changes = first.results.reduce((n, r) => n + (r.changes?.length ?? 0), 0);
  ok(first.refused.length === 0, `no file refused (${first.refused.map((r) => `${r.name}: ${r.errors[0]}`).join(' | ') || 'none'})`);
  ok(changes === 0, `zero changes across ${first.results.length} files (found ${changes})`);
  ok(first.results.length === all.items.length, `one Markdown file per scene and encounter (${first.results.length} of ${all.items.length})`);

  // Every content file can be rewritten with no edits and come out byte for byte the same.
  const same = all.items.every((it) => writeJson(it.text, it.json, it.json, []).text === it.text);
  ok(same, 'the JSON writer leaves unchanged files exactly as they are');

  // The rendered Markdown parses back to exactly the words it came from.
  let exact = 0;
  for (const it of all.items) {
    const plan = planItem(it, all);
    const p = parse(render(plan), plan);
    if (!p.errors.length && plan.tokens.every((t, k) => t.t !== 'slot' || isDeepStrictEqual(t.value ?? null, p.values.get(k) ?? null))) exact++;
  }
  ok(exact === all.items.length, `every slot reads back exactly (${exact} of ${all.items.length})`);

  console.log('Edits');
  const locked = all.items.find((it) => it.json.status === 'locked' && it.kind === 'scene');
  // A draft whose first step has narration and a choice with one record line.
  const draft = all.items.find((it) => {
    const n = it.kind === 'scene' && it.json.status !== 'locked' && it.json.nodes[it.json.start];
    return n && n.text?.length && (n.choices ?? []).some((c) => typeof c.record === 'string');
  });
  console.log(`  (editing ${draft.json.id} and ${locked.json.id})`);
  const lockedPath = join(dir, mdName(locked));
  const draftPath = join(dir, mdName(draft));
  const lockedMd = readFileSync(lockedPath, 'utf8');
  const draftMd = readFileSync(draftPath, 'utf8');

  // 1. A word change in a locked scene is refused, by name, and nothing is written.
  const para = locked.json.nodes[locked.json.start].text?.[0] ?? '';
  writeFileSync(lockedPath, lockedMd.replace(para, `${para} Edited.`));
  let r = importBook({ dir, quiet: true });
  const lockedRes = r.refused.find((x) => x.name === mdName(locked));
  ok(!!lockedRes && /is locked/.test(lockedRes.errors[0]) && lockedRes.errors[0].includes(locked.json.title), `a change to locked "${locked.json.id}" is refused and named`);
  ok(r.wrote.length === 0, 'nothing is written while a file is refused');
  writeFileSync(lockedPath, lockedMd);

  // 2. A draft's status line can become locked, and that's the only change.
  writeFileSync(draftPath, draftMd.replace('**Status:** draft, waiting on Jim', '**Status:** locked'));
  r = importBook({ dir, quiet: true });
  const st = r.changed.find((x) => x.name === mdName(draft));
  ok(r.refused.length === 0 && st && st.changes.length === 1 && st.newJson.status === 'locked', 'draft to locked is allowed and carries into the JSON');
  if (st) {
    const out = writeJson(draft.text, draft.json, st.newJson, st.paths);
    const diff = out.text.split('\n').filter((l, i) => l !== draft.text.split('\n')[i]);
    ok(!out.fallback && diff.length === 1 && diff[0].includes('"locked"'), 'the JSON diff is the one status line');
  }

  // 3. Words: change a paragraph, add a paragraph, edit a choice's record line.
  const node = draft.json.nodes[draft.json.start];
  const p0 = node.text[0];
  const choice = node.choices.find((c) => typeof c.record === 'string');
  let md = draftMd.replace(`\n${p0}\n`, `\n${p0} One more sentence.\n\nA new paragraph.\n`);
  md = md.replace(`*Record: ${choice.record}*`, `*Record: ${choice.record} Edited.*`);
  writeFileSync(draftPath, md);
  r = importBook({ dir, quiet: true });
  const w = r.changed.find((x) => x.name === mdName(draft));
  const nn = w?.newJson.nodes[draft.json.start];
  ok(
    !!w && nn.text[0] === `${p0} One more sentence.` && nn.text[1] === 'A new paragraph.' && nn.choices[node.choices.indexOf(choice)].record === `${choice.record} Edited.`,
    'edited and added paragraphs and an edited record line land in the JSON',
  );
  if (w) {
    const out = writeJson(draft.text, draft.json, w.newJson, w.paths);
    ok(!out.fallback && isDeepStrictEqual(JSON.parse(out.text), w.newJson), 'the JSON keeps its layout and parses to the edited scene');
  }

  // 4. A structure line can't be changed through import.
  writeFileSync(draftPath, draftMd.replace(/^\*(Next: [a-z-]+|Ends the scene\.)\*$/m, '*Next: somewhere-else*'));
  r = importBook({ dir, quiet: true });
  ok(r.refused.some((x) => x.name === mdName(draft) && /structure/.test(x.errors[0])), 'changing a structure line is refused with a reason');
  writeFileSync(draftPath, draftMd);

  // 5. Markdown exported from an older version of the JSON is refused.
  writeFileSync(draftPath, draftMd.replace(/Version: `[0-9a-f]+`/, 'Version: `0000000000`'));
  r = importBook({ dir, quiet: true });
  ok(r.refused.some((x) => x.name === mdName(draft) && /changed after/.test(x.errors[0])), 'Markdown from an older JSON version is refused');
  writeFileSync(draftPath, draftMd);

  // 6. Export won't overwrite a file with edits that aren't imported yet.
  writeFileSync(draftPath, draftMd.replace(p0, `${p0} Not imported yet.`));
  const ex = exportBook({ dir, combined: null, quiet: true });
  ok(ex.kept.includes(mdName(draft)) && readFileSync(draftPath, 'utf8').includes('Not imported yet.'), 'export leaves an edited, unimported file alone');
  writeFileSync(draftPath, draftMd);

  // The committed docs/scenes/ should match the content. A mismatch is a reminder, not a failure.
  console.log('docs/scenes/ in the repo');
  let stale = 0;
  let files = [];
  try {
    files = readdirSync(SCENES_DIR).filter((f) => f.endsWith('.md'));
  } catch {
    // not exported yet
  }
  for (const it of all.items) {
    const name = mdName(it);
    const fresh = readFileSync(join(dir, name), 'utf8');
    if (!files.includes(name) || readFileSync(join(SCENES_DIR, name), 'utf8') !== fresh) stale++;
  }
  console.log(stale ? `  note ${stale} file(s) differ from the content (edits waiting to import, or run npm run export-scenes)` : '  ok  docs/scenes/ matches the content');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failed) {
  console.log(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log('\nRound trip clean.');
