// The character portrait. Flat vector, cosmetic only. Nothing here changes how the game plays.
import type { Look } from '../engine/state';

export const SKIN = ['#f3d2b3', '#e6b58f', '#c98e64', '#a8704a', '#7d4f32', '#563522'];
export const HAIR_COLOR = ['#1f1a17', '#4a3021', '#7a4b2a', '#b07a3c', '#d9b56a', '#9a9a9a'];
const CLOTHES = [
  { base: '#2f6f73', trim: '#1f4e52' }, // work jacket
  { base: '#7a7f88', trim: '#5a5e66' }, // hoodie
  { base: '#b8463a', trim: '#7f2f27' }, // flannel
  { base: '#e0a73c', trim: '#a87a26' }, // tee
];

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function hairBack(style: number, c: string): string {
  switch (style) {
    case 2: // long
      return `<path d="M58 92 q-6 70 8 112 h68 q14 -42 8 -112 q-42 -36 -84 0z" fill="${c}"/>`;
    case 4: // tied back
      return `<circle cx="100" cy="46" r="16" fill="${c}"/>`;
    case 3: // curly
      return `<g fill="${c}">${[
        [62, 80], [70, 60], [86, 48], [104, 44], [122, 50], [136, 64], [140, 84], [60, 100], [140, 102],
      ]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15"/>`)
        .join('')}</g>`;
    default:
      return '';
  }
}

function hairFront(style: number, c: string): string {
  switch (style) {
    case 0: // short
      return `<path d="M64 92 q0 -40 36 -40 q36 0 36 40 q-10 -20 -36 -22 q-22 2 -36 22z" fill="${c}"/>`;
    case 1: // buzzed
      return `<path d="M66 88 q2 -32 34 -32 q32 0 34 32 q-14 -14 -34 -14 q-20 0 -34 14z" fill="${c}" opacity="0.85"/>`;
    case 2: // long
      return `<path d="M62 100 q-2 -48 38 -48 q40 0 38 48 q-6 -26 -26 -30 q-8 12 -30 14 q-12 2 -20 16z" fill="${c}"/>`;
    case 3: // curly
      return `<path d="M66 90 q4 -34 34 -34 q30 0 34 34 q-34 -14 -68 0z" fill="${c}"/>`;
    case 4: // tied back
      return `<path d="M64 94 q0 -42 36 -42 q36 0 36 42 q-6 -24 -36 -26 q-30 2 -36 26z" fill="${c}"/>`;
    default: // shaved
      return '';
  }
}

function body(build: number, clothes: number, skin: string): string {
  const w = [44, 54, 64][build] ?? 54; // half width at the shoulders
  const cl = CLOTHES[clothes] ?? CLOTHES[0];
  const L = 100 - w;
  const R = 100 + w;
  let detail = '';
  if (clothes === 0) {
    // work jacket: collar and zip
    detail = `<path d="M86 156 l14 18 l14 -18 l6 8 l-20 22 l-20 -22z" fill="${cl.trim}"/>
      <rect x="99" y="174" width="2" height="66" fill="${cl.trim}"/>
      <rect x="${L + 14}" y="196" width="22" height="14" rx="2" fill="${cl.trim}"/>`;
  } else if (clothes === 1) {
    // hoodie: hood and strings
    detail = `<path d="M72 160 q28 20 56 0 q-4 18 -28 22 q-24 -4 -28 -22z" fill="${cl.trim}"/>
      <rect x="92" y="176" width="2" height="22" fill="#f3e7d3"/><rect x="106" y="176" width="2" height="22" fill="#f3e7d3"/>
      <rect x="78" y="212" width="44" height="24" rx="4" fill="${cl.trim}"/>`;
  } else if (clothes === 2) {
    // flannel: checks and a collar
    detail = `<g opacity="0.45" fill="${cl.trim}">
      <rect x="${L}" y="186" width="${w * 2}" height="6"/><rect x="${L}" y="210" width="${w * 2}" height="6"/>
      <rect x="${L + 18}" y="160" width="6" height="80"/><rect x="${R - 24}" y="160" width="6" height="80"/>
      <rect x="97" y="170" width="6" height="70"/></g>
      <path d="M88 156 l12 14 l12 -14 l4 10 l-16 10 l-16 -10z" fill="${cl.trim}"/>`;
  } else {
    // tee: simple neckline
    detail = `<path d="M86 158 q14 14 28 0" fill="none" stroke="${cl.trim}" stroke-width="4"/>`;
  }
  return `<path d="M${L} 240 v-46 q0 -34 ${w - 12} -38 h24 q${w - 12} 4 ${w - 12} 38 v46z" fill="${cl.base}"/>
    <path d="M90 150 h20 v10 q-10 8 -20 0z" fill="${shade(skin, -18)}"/>
    ${detail}`;
}

/** A square portrait. The art stays the same at any size. */
export function portrait(look: Look, opts: { mood?: 'plain' | 'night' } = {}): string {
  const skin = SKIN[look.skin] ?? SKIN[0];
  const hair = HAIR_COLOR[look.hairColor] ?? HAIR_COLOR[0];
  const bg = opts.mood === 'night' ? '#26324d' : '#e8d6b9';
  const bg2 = opts.mood === 'night' ? '#3a4a6e' : '#f3e7d3';
  return `<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Your character">
  <rect width="200" height="240" fill="${bg}"/>
  <circle cx="100" cy="104" r="78" fill="${bg2}"/>
  ${hairBack(look.hair, hair)}
  <rect x="90" y="128" width="20" height="30" fill="${shade(skin, -10)}"/>
  ${body(look.build, look.clothes, skin)}
  <ellipse cx="64" cy="102" rx="7" ry="10" fill="${shade(skin, -8)}"/>
  <ellipse cx="136" cy="102" rx="7" ry="10" fill="${shade(skin, -8)}"/>
  <ellipse cx="100" cy="98" rx="36" ry="44" fill="${skin}"/>
  ${hairFront(look.hair, hair)}
  <rect x="80" y="90" width="14" height="3" rx="1.5" fill="${shade(hair, -10)}"/>
  <rect x="106" y="90" width="14" height="3" rx="1.5" fill="${shade(hair, -10)}"/>
  <ellipse cx="87" cy="101" rx="3.2" ry="3.6" fill="#2a2d34"/>
  <ellipse cx="113" cy="101" rx="3.2" ry="3.6" fill="#2a2d34"/>
  <path d="M100 104 q-3 10 0 12" fill="none" stroke="${shade(skin, -30)}" stroke-width="2" stroke-linecap="round"/>
  <path d="M90 124 q10 3 20 0" fill="none" stroke="${shade(skin, -45)}" stroke-width="2.4" stroke-linecap="round"/>
</svg>`;
}
