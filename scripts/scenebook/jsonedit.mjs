// Writes changed words back into a content JSON file while keeping the file's own layout.
// Only the values that changed are rewritten, so a one-word edit is a one-line git diff.
// If anything about the edit looks off, it falls back to rewriting the file in the
// standard two-space layout, and says so.
import { isDeepStrictEqual } from 'node:util';
import { getPath } from './format.mjs';

/** Parse JSON text, keeping where every value starts and ends. */
export function parseSpans(text) {
  let i = 0;
  const ws = () => {
    while (i < text.length && /\s/.test(text[i])) i++;
  };
  const expect = (c) => {
    if (text[i] !== c) throw new Error(`expected ${c} at ${i}`);
    i++;
  };
  const str = () => {
    const s = i;
    expect('"');
    while (text[i] !== '"') {
      if (text[i] === '\\') i++;
      i++;
      if (i >= text.length) throw new Error('unterminated string');
    }
    i++;
    return JSON.parse(text.slice(s, i));
  };
  const value = () => {
    ws();
    const start = i;
    const c = text[i];
    if (c === '{') {
      i++;
      const members = [];
      ws();
      if (text[i] === '}') {
        i++;
        return { type: 'object', start, end: i, members };
      }
      for (;;) {
        ws();
        const keyStart = i;
        const key = str();
        ws();
        expect(':');
        const node = value();
        members.push({ key, keyStart, node });
        ws();
        if (text[i] === ',') {
          i++;
          continue;
        }
        expect('}');
        return { type: 'object', start, end: i, members };
      }
    }
    if (c === '[') {
      i++;
      const items = [];
      ws();
      if (text[i] === ']') {
        i++;
        return { type: 'array', start, end: i, items };
      }
      for (;;) {
        items.push(value());
        ws();
        if (text[i] === ',') {
          i++;
          continue;
        }
        expect(']');
        return { type: 'array', start, end: i, items };
      }
    }
    if (c === '"') {
      str();
      return { type: 'string', start, end: i };
    }
    const m = /^(-?\d+(\.\d+)?([eE][+-]?\d+)?|true|false|null)/.exec(text.slice(i, i + 40));
    if (!m) throw new Error(`unexpected ${c} at ${i}`);
    i += m[0].length;
    return { type: 'lit', start, end: i };
  };
  return value();
}

function nodeAt(root, path) {
  let n = root;
  for (const k of path) {
    if (!n) return null;
    if (n.type === 'object') n = n.members.find((m) => m.key === k)?.node ?? null;
    else if (n.type === 'array') n = n.items[k] ?? null;
    else return null;
  }
  return n;
}

function compact(v) {
  if (Array.isArray(v)) return v.length ? `[${v.map(compact).join(', ')}]` : '[]';
  if (v && typeof v === 'object') {
    const e = Object.entries(v);
    return e.length ? `{ ${e.map(([k, x]) => `${JSON.stringify(k)}: ${compact(x)}`).join(', ')} }` : '{}';
  }
  return JSON.stringify(v);
}

function serialize(v, text, node) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  const multiline = text.slice(node.start, node.end).includes('\n');
  if (!multiline) return compact(v);
  const lineStart = text.lastIndexOf('\n', node.start - 1) + 1;
  const indent = /^[ \t]*/.exec(text.slice(lineStart))[0];
  return JSON.stringify(v, null, 2)
    .split('\n')
    .map((l, i) => (i ? indent + l : l))
    .join('\n');
}

/**
 * Rewrite only what changed. `paths` are the slot paths whose words changed.
 * Returns { text, fallback } where fallback is true if the whole file was rewritten.
 */
export function writeJson(text, oldJson, newJson, paths) {
  let root;
  try {
    root = parseSpans(text);
  } catch {
    return { text: `${JSON.stringify(newJson, null, 2)}\n`, fallback: true };
  }
  // Where to rewrite: the value itself if it's there before and after, otherwise the object
  // that holds it (a field added or removed). Arrays of the same length change item by item.
  const targets = [];
  for (const p of paths) {
    const before = getPath(oldJson, p);
    const after = getPath(newJson, p);
    if (before !== undefined && after !== undefined) {
      if (Array.isArray(before) && Array.isArray(after) && before.length === after.length) {
        after.forEach((x, i) => {
          if (!isDeepStrictEqual(x, before[i])) targets.push([...p, i]);
        });
      } else targets.push(p);
    } else targets.push(p.slice(0, -1));
  }
  const keyOf = (p) => JSON.stringify(p);
  const set = new Map(targets.map((p) => [keyOf(p), p]));
  const isUnder = (p, q) => q.length < p.length && q.every((k, i) => p[i] === k);
  const final = [...set.values()].filter((p) => ![...set.values()].some((q) => isUnder(p, q)));
  const edits = [];
  for (const p of final) {
    const node = nodeAt(root, p);
    if (!node) return { text: `${JSON.stringify(newJson, null, 2)}\n`, fallback: true };
    edits.push({ start: node.start, end: node.end, rep: serialize(getPath(newJson, p), text, node) });
  }
  edits.sort((a, b) => b.start - a.start);
  let out = text;
  for (const e of edits) out = out.slice(0, e.start) + e.rep + out.slice(e.end);
  try {
    if (isDeepStrictEqual(JSON.parse(out), newJson)) return { text: out, fallback: false };
  } catch {
    // fall through
  }
  return { text: `${JSON.stringify(newJson, null, 2)}\n`, fallback: true };
}
