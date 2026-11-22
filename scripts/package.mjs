// Builds the game and zips dist/ for itch.io, with index.html at the top of the zip.
// Upload it as an HTML project and tick "This file will be played in the browser".
//
//   npm run package              review mode included (opens only with ?review=1)
//   npm run package -- --public  review mode left out of the build entirely
//
// The zip goes to release/ (ignored by git). No zip tool needed: Node writes it.
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const pub = process.argv.includes('--public');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

console.log(`Building${pub ? ' (public: no review mode)' : ''}...`);
execSync('npm run build', { cwd: root, stdio: 'inherit', env: { ...process.env, ...(pub ? { VITE_NO_REVIEW: '1' } : {}) } });

const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir).sort()) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(dist);
// index.html first, at the top level of the zip.
const index = join(dist, 'index.html');
if (!files.includes(index)) throw new Error('dist/index.html is missing');
files.sort((a, b) => (a === index ? -1 : b === index ? 1 : a.localeCompare(b)));

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const now = new Date();
const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
const locals = [];
const centrals = [];
let offset = 0;
for (const file of files) {
  const name = Buffer.from(relative(dist, file).split('\\').join('/'));
  const data = readFileSync(file);
  const packed = deflateRawSync(data, { level: 9 });
  const crc = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6); // UTF-8 names
  local.writeUInt16LE(8, 8); // deflate
  local.writeUInt16LE(dosTime, 10);
  local.writeUInt16LE(dosDate, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(packed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28);
  locals.push(local, name, packed);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(dosTime, 12);
  central.writeUInt16LE(dosDate, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(packed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(offset, 42);
  centrals.push(central, name);
  offset += local.length + name.length + packed.length;
}
const centralSize = centrals.reduce((n, b) => n + b.length, 0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralSize, 12);
end.writeUInt32LE(offset, 16);

const outDir = join(root, 'release');
mkdirSync(outDir, { recursive: true });
const out = join(outDir, `framework-game-${pkg.version}${pub ? '-public' : ''}-itch.zip`);
writeFileSync(out, Buffer.concat([...locals, ...centrals, end]));
console.log(`\nZipped ${files.length} files to ${relative(root, out)} (${Math.round(statSync(out).size / 1024)} KB), index.html at the top.`);
console.log(pub ? 'Review mode is not in this build.' : 'Review mode is in this build, reachable only with ?review=1. For the public page, use npm run package -- --public.');
console.log('itch.io: Kind of project "HTML", upload the zip, tick "This file will be played in the browser".');
